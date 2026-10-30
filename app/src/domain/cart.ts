import type { Catalog, Ingredient, MenuItem, Variant } from './catalog'

export type CartLine = {
  /** Same item + size + add-ons collapse into one line */
  key: string
  itemId: string
  variantId: string
  ingredientIds: string[]
  qty: number
}

export const lineKey = (itemId: string, variantId: string, ingredientIds: string[]): string =>
  [itemId, variantId, ...[...ingredientIds].sort()].join('|')

export type ResolvedLine = CartLine & {
  item: MenuItem
  variant: Variant
  ingredients: Ingredient[]
  unitPrice: number
}

/** Resolves a single cart line against the catalog. Drops line if item or variant is missing. */
export function resolveLine(line: CartLine, catalog: Catalog): ResolvedLine | null {
  const item = catalog.itemById.get(line.itemId)
  const variant = item?.variants.find((v) => v.id === line.variantId)
  if (!item || !variant) return null
  const ingredients = line.ingredientIds
    .map((id) => {
      for (const group of catalog.ingredientGroups) {
        const found = group.ingredients.find((ing) => ing.id === id)
        if (found) return found
      }
      return null
    })
    .filter((i): i is Ingredient => !!i)

  const unitPrice = variant.price + ingredients.reduce((sum, i) => sum + i.price, 0)
  return { ...line, item, variant, ingredients, unitPrice }
}

export function resolveLines(lines: CartLine[], catalog: Catalog): ResolvedLine[] {
  return lines.map((l) => resolveLine(l, catalog)).filter((l): l is ResolvedLine => !!l)
}

export function subtotalOf(lines: CartLine[], catalog: Catalog): number {
  return resolveLines(lines, catalog).reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
}

export const countOf = (lines: CartLine[]): number => lines.reduce((sum, l) => sum + l.qty, 0)

export const promoCodes: Record<string, { percent: number; label: string }> = {
  SHIT10: { percent: 10, label: '−10% на заказ' },
  ЗАЯЦ: { percent: 15, label: '−15% от зайца' },
  RABBIT: { percent: 15, label: '−15% от зайца' },
  ОСЕНЬ: { percent: 15, label: '−15% на заказ' },
  ЗЕРНО10: { percent: 10, label: '−10% на заказ' },
  ZERNO10: { percent: 10, label: '−10% на заказ' },
}

export const normalizePromo = (code: string): string => code.trim().toUpperCase()
