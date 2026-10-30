import { useCallback } from 'react'
import { staticCatalog } from '../queries/useCatalog'
import {
  lineKey,
  resolveLine as domainResolveLine,
  resolveLines as domainResolveLines,
  subtotalOf as domainSubtotalOf,
  countOf,
  promoCodes,
  normalizePromo,
  type CartLine,
  type ResolvedLine,
} from '../domain/cart'
import { usePersistent } from '../hooks/usePersistent'

export type { CartLine, ResolvedLine }
export { lineKey, countOf, promoCodes, normalizePromo }

export const resolveLine = (line: CartLine) => domainResolveLine(line, staticCatalog)
export const resolveLines = (lines: CartLine[]) => domainResolveLines(lines, staticCatalog)
export const subtotalOf = (lines: CartLine[]) => domainSubtotalOf(lines, staticCatalog)

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
