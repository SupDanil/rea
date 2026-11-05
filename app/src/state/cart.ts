import { useCallback } from 'react'

import { type CartLine, countOf, lineKey, normalizePromo, type ResolvedLine,resolveLine, resolveLines, subtotalOf } from '../domain/cart'
import { usePersistent } from '../hooks/usePersistent'

export type { CartLine, ResolvedLine }
export { countOf, lineKey, normalizePromo, resolveLine, resolveLines, subtotalOf }

export function useCart() {
  const [lines, setLines] = usePersistent<CartLine[]>('zerno-cart', [])

  const add = useCallback(
    (itemId: string, variantId: string, ingredientIds: string[], qty = 1, temperature?: 'hot' | 'cold') => {
      const key = lineKey(itemId, variantId, ingredientIds, temperature)
      setLines((prev) =>
        prev.some((l) => l.key === key)
          ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
          : [...prev, { key, itemId, variantId, ingredientIds, qty, temperature }],
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
