import { useCallback } from 'react'
import { ingredientGroups, itemById, type Ingredient, type MenuItem, type Variant } from '../data/menu'
import { usePersistent } from '../hooks/usePersistent'

export type CartLine = {
  /** Same item + size + add-ons collapse into one line */
  key: string
  itemId: string
  variantId: string
  ingredientIds: string[]
  qty: number
}

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
  SHIT10: { percent: 10, label: '−10% на заказ' },
  ЗАЯЦ: { percent: 15, label: '−15% от зайца' },
  RABBIT: { percent: 15, label: '−15% от зайца' },
  ОСЕНЬ: { percent: 15, label: '−15% на заказ' },
  ЗЕРНО10: { percent: 10, label: '−10% на заказ' },
  ZERNO10: { percent: 10, label: '−10% на заказ' },
}
export const normalizePromo = (code: string) => code.trim().toUpperCase()

export function useCart() {
  const [lines, setLines] = usePersistent<CartLine[]>('zerno-cart', [])

  const add = useCallback(
    (itemId: string, variantId: string, ingredientIds: string[], qty = 1) => {
      const key = lineKey(itemId, variantId, ingredientIds)
      setLines((prev) =>
        prev.some((l) => l.key === key)
          ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
          : [...prev, { key, itemId, variantId, ingredientIds, qty }],
      )
    },
    [setLines],
  )
  const setQty = useCallback(
    (key: string, qty: number) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l)))),
    [setLines],
  )
  const restore = useCallback(
    (line: CartLine, index: number) =>
      setLines((prev) => (prev.some((l) => l.key === line.key) ? prev : [...prev.slice(0, index), line, ...prev.slice(index)])),
    [setLines],
  )
  const clear = useCallback(() => setLines([]), [setLines])

  return { lines, add, setQty, restore, clear }
}

export type Cart = ReturnType<typeof useCart>
