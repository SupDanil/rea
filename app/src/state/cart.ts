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
  const updateLine = useCallback(
    (oldKey: string, itemId: string, variantId: string, ingredientIds: string[], qty = 1, temperature?: 'hot' | 'cold') => {
      const newKey = lineKey(itemId, variantId, ingredientIds, temperature)
      setLines((prev) => {
        const oldIndex = prev.findIndex((l) => l.key === oldKey)
        const newLine: CartLine = { key: newKey, itemId, variantId, ingredientIds, qty, temperature }

        if (oldKey === newKey) {
          return prev.map((l) => (l.key === oldKey ? { ...newLine, qty } : l))
        }

        const existingIndex = prev.findIndex((l) => l.key === newKey && l.key !== oldKey)
        if (existingIndex >= 0) {
          return prev
            .filter((l) => l.key !== oldKey)
            .map((l) => (l.key === newKey ? { ...l, qty: l.qty + qty } : l))
        }

        if (oldIndex >= 0) {
          const next = [...prev]
          next[oldIndex] = newLine
          return next
        }

        return [...prev, newLine]
      })
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

  return { lines, add, updateLine, setQty, restore, clear }
}

export type Cart = ReturnType<typeof useCart>
