export type Nutrition = { kcal: number; fat: number; carbs: number; protein: number }

export type ArtKind = 'cup' | 'mug' | 'iced' | 'tea' | 'croissant' | 'sandwich' | 'cake' | 'cookie' | 'toy'

export type Art = {
  kind: ArtKind
  fill: string
  top?: string
  bg: string
}

export type Variant = {
  id: string
  size: 'S' | 'M' | 'L' | 'ONE'
  volume?: string
  price: number
  nutrition: Nutrition
  stopped?: boolean
}

export type Ingredient = {
  id: string
  name: string
  price: number
  nutrition: Nutrition
  color: string
  stopped?: boolean
  maxQty?: number
}

export type IngredientGroup = {
  id: string
  name: string
  max: number
  counter?: boolean
  unit?: string
  ingredients: Ingredient[]
}

export type MenuItem = {
  id: string
  name: string
  description: string
  composition: string
  allergens?: string
  categoryId: string
  art: Art
  variants: Variant[]
  groupIds: string[]
  related?: { itemId: string; label: string }
  badge?: string
}

export type Category = {
  id: string
  name: string
  parentId?: string
  heroItemId?: string
}

export type CatalogData = {
  items: MenuItem[]
  categories: Category[]
  ingredientGroups: IngredientGroup[]
}

export const minPrice = (item: MenuItem): number => Math.min(...item.variants.map((v) => v.price))
export const isSoldOut = (item: MenuItem): boolean => item.variants.every((v) => v.stopped)
export const isDrink = (item: MenuItem): boolean => item.variants[0]?.size !== 'ONE'

/** Collapses repeated add-ons (counter groups store one id per portion) into { ingredient, qty }. */
export function countAddons(ingredients: Ingredient[]): { ingredient: Ingredient; qty: number }[] {
  const counted: { ingredient: Ingredient; qty: number }[] = []
  for (const ingredient of ingredients) {
    const found = counted.find((c) => c.ingredient.id === ingredient.id)
    if (found) found.qty++
    else counted.push({ ingredient, qty: 1 })
  }
  return counted
}

export const addonLabel = ({ ingredient, qty }: { ingredient: Ingredient; qty: number }): string =>
  qty > 1 ? `${ingredient.name} ×${qty}` : ingredient.name

export type Catalog = {
  items: MenuItem[]
  categories: Category[]
  ingredientGroups: IngredientGroup[]
  itemById: Map<string, MenuItem>
  groupById: Map<string, IngredientGroup>
  topCategories: Category[]
  subcategoriesOf: (parentId: string) => Category[]
  itemsOf: (categoryId: string) => MenuItem[]
  minPrice: (item: MenuItem) => number
  isSoldOut: (item: MenuItem) => boolean
  isDrink: (item: MenuItem) => boolean
  countAddons: (ingredients: Ingredient[]) => { ingredient: Ingredient; qty: number }[]
  addonLabel: (info: { ingredient: Ingredient; qty: number }) => string
}

export function createCatalog(data: CatalogData): Catalog {
  const itemById = new Map(data.items.map((i) => [i.id, i]))
  const groupById = new Map(data.ingredientGroups.map((g) => [g.id, g]))
  const topCategories = data.categories.filter((c) => !c.parentId)

  const itemsBySub = new Map<string, MenuItem[]>()
  for (const item of data.items) {
    const list = itemsBySub.get(item.categoryId)
    if (list) list.push(item)
    else itemsBySub.set(item.categoryId, [item])
  }

  const subsByParent = new Map<string, Category[]>()
  for (const cat of data.categories) {
    if (cat.parentId) {
      const list = subsByParent.get(cat.parentId)
      if (list) list.push(cat)
      else subsByParent.set(cat.parentId, [cat])
    }
  }

  return {
    items: data.items,
    categories: data.categories,
    ingredientGroups: data.ingredientGroups,
    itemById,
    groupById,
    topCategories,
    subcategoriesOf: (parentId: string) => subsByParent.get(parentId) ?? [],
    itemsOf: (categoryId: string) => itemsBySub.get(categoryId) ?? [],
    minPrice,
    isSoldOut,
    isDrink,
    countAddons,
    addonLabel,
  }
}
