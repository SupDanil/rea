import { useEffect, useState } from 'react'
import { ingredientGroups, itemById, type Ingredient, type MenuItem, type Variant } from './data/menu'

export type CartLine = {
  /** Same item + size + add-ons collapse into one line */
  key: string
  itemId: string
  variantId: string
  ingredientIds: string[]
  qty: number
}

export type Pickup = { kind: 'asap' } | { kind: 'in'; minutes: number }
export type PaymentMethod = 'card' | 'cash'

export type Order = {
  id: string
  number: number
  createdAt: number
  readyAt: number
  lines: CartLine[]
  subtotal: number
  discount: number
  total: number
  name: string
  pickup: Pickup
  payment: PaymentMethod
  cancelledAt?: number
  rating?: 'good' | 'bad'
  /** Set when placed while signed in: counts towards level and stamps */
  phone?: string
  levelDiscount?: number
  promoDiscount?: number
  /** A gift drink was redeemed on this order */
  rewardDiscount?: number
}

/** Status ladder mirrors Drinkit's active order: accepted → making → ready (+ cancelled). */
export type OrderStatus = 'paying' | 'accepted' | 'making' | 'ready' | 'cancelled'

const ingredientById = new Map<string, Ingredient>(ingredientGroups.flatMap((g) => g.ingredients.map((i) => [i.id, i])))

export const lineKey = (itemId: string, variantId: string, ingredientIds: string[]) =>
  [itemId, variantId, ...[...ingredientIds].sort()].join('|')

export type ResolvedLine = CartLine & { item: MenuItem; variant: Variant; ingredients: Ingredient[]; unitPrice: number }

/** Drops lines whose menu data disappeared (e.g. stale storage after a menu change). */
export const resolveLine = (line: CartLine): ResolvedLine | null => {
  const item = itemById.get(line.itemId)
  const variant = item?.variants.find((v) => v.id === line.variantId)
  if (!item || !variant) return null
  const ingredients = line.ingredientIds.map((id) => ingredientById.get(id)).filter((i): i is Ingredient => !!i)
  const unitPrice = variant.price + ingredients.reduce((s, i) => s + i.price, 0)
  return { ...line, item, variant, ingredients, unitPrice }
}

export const resolveLines = (lines: CartLine[]) => lines.map(resolveLine).filter((l): l is ResolvedLine => !!l)
export const subtotalOf = (lines: CartLine[]) => resolveLines(lines).reduce((s, l) => s + l.unitPrice * l.qty, 0)
export const countOf = (lines: CartLine[]) => lines.reduce((s, l) => s + l.qty, 0)

/** Demo promo codes; real ones would be validated by the backend. */
export const promoCodes: Record<string, { percent: number; label: string }> = {
  ЗЕРНО10: { percent: 10, label: '−10% на заказ' },
  ZERNO10: { percent: 10, label: '−10% на заказ' },
  ОСЕНЬ: { percent: 15, label: '−15% на заказ' },
}
export const normalizePromo = (code: string) => code.trim().toUpperCase()

// Demo timings: an ASAP order is ready in under a minute so the whole flow can be watched.
const ACCEPT_AFTER = 2_000
const MAKE_AFTER = 6_000
const ASAP_READY_AFTER = 45_000
const SCHEDULED_MAKE_LEAD = 3 * 60_000

export const readyTimeFor = (pickup: Pickup, now: number) =>
  pickup.kind === 'asap' ? now + ASAP_READY_AFTER : now + pickup.minutes * 60_000

export function statusOf(order: Order, now: number): OrderStatus {
  if (order.cancelledAt) return 'cancelled'
  const age = now - order.createdAt
  if (now >= order.readyAt) return 'ready'
  if (age < ACCEPT_AFTER) return 'paying'
  const makeFrom = order.pickup.kind === 'asap' ? order.createdAt + MAKE_AFTER : order.readyAt - SCHEDULED_MAKE_LEAD
  return now >= makeFrom ? 'making' : 'accepted'
}

/** 0..1 progress through the making stage, used for the sub-step captions. */
export function makingProgress(order: Order, now: number) {
  const makeFrom = order.pickup.kind === 'asap' ? order.createdAt + MAKE_AFTER : order.readyAt - SCHEDULED_MAKE_LEAD
  return Math.min(1, Math.max(0, (now - makeFrom) / (order.readyAt - makeFrom)))
}

export const canCancel = (order: Order, now: number) => {
  const s = statusOf(order, now)
  return s === 'paying' || s === 'accepted'
}

/** An order stays "active" on the menu until a while after it is ready. */
export const isActive = (order: Order, now: number) =>
  !order.cancelledAt && now < order.readyAt + 15 * 60_000 && !order.rating

// ---------- persistence ----------

export function usePersistent<T>(key: string, initial: T) {
  // Stable copy: callers pass fresh literals like [] on every render.
  const [fallback] = useState(initial)
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      const next = JSON.stringify(value)
      if (localStorage.getItem(key) !== next) localStorage.setItem(key, next)
    } catch {
      // Storage full or blocked: state still works for this session.
    }
  }, [key, value])
  // Another tab changed the same key: adopt it instead of overwriting it later.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        setValue(e.newValue ? (JSON.parse(e.newValue) as T) : fallback)
      } catch {
        // Ignore malformed values written by something else.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, fallback])
  return [value, setValue] as const
}

export function useCart() {
  const [lines, setLines] = usePersistent<CartLine[]>('zerno-cart', [])

  const add = (itemId: string, variantId: string, ingredientIds: string[], qty = 1) => {
    const key = lineKey(itemId, variantId, ingredientIds)
    setLines((prev) =>
      prev.some((l) => l.key === key)
        ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
        : [...prev, { key, itemId, variantId, ingredientIds, qty }],
    )
  }
  const setQty = (key: string, qty: number) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))))
  const restore = (line: CartLine, index: number) =>
    setLines((prev) => (prev.some((l) => l.key === line.key) ? prev : [...prev.slice(0, index), line, ...prev.slice(index)]))
  const clear = () => setLines([])

  return { lines, add, setQty, restore, clear }
}

export function useOrders() {
  const [orders, setOrders] = usePersistent<Order[]>('zerno-orders', [])
  const create = (order: Omit<Order, 'id' | 'number'>) => {
    const created: Order = {
      ...order,
      id: Math.random().toString(36).slice(2, 10),
      number: 10 + Math.floor(Math.random() * 90),
    }
    setOrders((prev) => [created, ...prev].slice(0, 20))
    return created
  }
  const update = (id: string, patch: Partial<Order>) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  return { orders, create, update }
}

/** Re-renders every `ms` so time-based order status stays live. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

export const pickupLabel = (pickup: Pickup) => (pickup.kind === 'asap' ? 'как можно скорее' : `через ${pickup.minutes} мин`)
export const clockTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
