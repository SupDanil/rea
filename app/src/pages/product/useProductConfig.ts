import { useMemo, useState } from 'react'
import { groupById, itemById, type Ingredient, type MenuItem, type Nutrition } from '../../data/menu'

/** Chosen add-on ids per ingredient group */
export type Selection = Record<string, string[]>

const addNutrition = (a: Nutrition, b: Nutrition): Nutrition => ({
  kcal: a.kcal + b.kcal,
  fat: a.fat + b.fat,
  carbs: a.carbs + b.carbs,
  protein: a.protein + b.protein,
})

const firstAvailable = (item: MenuItem) => Math.max(0, item.variants.findIndex((v) => !v.stopped))

/** Size, add-ons and the open add-on group for one product, plus the totals they add up to. */
export function useProductConfig(item: MenuItem) {
  const [variantIdx, setVariantIdx] = useState(() => firstAvailable(item))
  const [selection, setSelection] = useState<Selection>({})
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [shownItem, setShownItem] = useState(item)

  // Switching hot ↔ iced swaps the item in place: keep the size and every
  // add-on the twin also offers, instead of starting the card over.
  if (shownItem !== item) {
    const size = shownItem.variants[variantIdx]?.size
    const sameSize = item.variants.findIndex((v) => v.size === size && !v.stopped)
    setVariantIdx(sameSize >= 0 ? sameSize : firstAvailable(item))
    setSelection((prev) => {
      const kept: Selection = {}
      for (const groupId of item.groupIds) {
        const group = groupById.get(groupId)
        const ids = (prev[groupId] ?? []).filter((id) => group?.ingredients.some((i) => i.id === id && !i.stopped))
        if (ids.length) kept[groupId] = ids
      }
      return kept
    })
    setOpenGroupId((prev) => (prev && item.groupIds.includes(prev) ? prev : null))
    setShownItem(item)
  }

  const variant = item.variants[variantIdx] ?? item.variants[0]
  const groups = useMemo(() => item.groupIds.map((id) => groupById.get(id)!).filter(Boolean), [item])
  const related = item.related && itemById.get(item.related.itemId)

  const chosen: Ingredient[] = useMemo(
    () => groups.flatMap((g) => (selection[g.id] ?? []).map((id) => g.ingredients.find((i) => i.id === id)!)),
    [groups, selection],
  )
  const price = variant.price + chosen.reduce((sum, i) => sum + i.price, 0)
  const nutrition = chosen.reduce((acc, i) => addNutrition(acc, i.nutrition), variant.nutrition)
  const soldOut = item.variants.every((v) => v.stopped)

  /** Returns whether the ingredient ended up selected. */
  const toggle = (groupId: string, max: number, ingredientId: string) => {
    const current = selection[groupId] ?? []
    const removing = current.includes(ingredientId)
    setSelection((prev) => {
      const now = prev[groupId] ?? []
      if (now.includes(ingredientId)) return { ...prev, [groupId]: now.filter((id) => id !== ingredientId) }
      if (max === 1) return { ...prev, [groupId]: [ingredientId] }
      // Over the limit: drop the oldest pick so the tap always does something.
      const next = [...now, ingredientId]
      return { ...prev, [groupId]: next.length > max ? next.slice(next.length - max) : next }
    })
    return !removing
  }

  return {
    variant,
    variantIdx,
    setVariantIdx,
    selection,
    toggle,
    openGroupId,
    setOpenGroupId,
    groups,
    related,
    chosen,
    price,
    nutrition,
    soldOut,
  }
}
