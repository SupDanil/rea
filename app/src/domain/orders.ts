import type { CartLine } from './cart'

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

// Demo timings: an ASAP order is ready in under a minute so the whole flow can be watched.
export const ACCEPT_AFTER = 2_000
export const MAKE_AFTER = 6_000
export const ASAP_READY_AFTER = 45_000
export const SCHEDULED_MAKE_LEAD = 3 * 60_000

export const readyTimeFor = (pickup: Pickup, now: number): number =>
  pickup.kind === 'asap' ? now + ASAP_READY_AFTER : now + pickup.minutes * 60_000

export const makingStartsAt = (order: Order): number =>
  order.pickup.kind === 'asap' ? order.createdAt + MAKE_AFTER : order.readyAt - SCHEDULED_MAKE_LEAD

export function statusOf(order: Order, now: number): OrderStatus {
  if (order.cancelledAt) return 'cancelled'
  if (now >= order.readyAt) return 'ready'
  if (now - order.createdAt < ACCEPT_AFTER) return 'paying'
  return now >= makingStartsAt(order) ? 'making' : 'accepted'
}

/** 0..1 progress through the making stage, used for the sub-step captions. */
export function makingProgress(order: Order, now: number): number {
  const from = makingStartsAt(order)
  if (order.readyAt <= from) return 1
  return Math.min(1, Math.max(0, (now - from) / (order.readyAt - from)))
}

export const canCancel = (order: Order, now: number): boolean => {
  const s = statusOf(order, now)
  return s === 'paying' || s === 'accepted'
}

/** An order stays "active" on the menu until a while after it is ready. */
export const isActive = (order: Order, now: number): boolean =>
  !order.cancelledAt && now < order.readyAt + 15 * 60_000 && !order.rating
