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
  imageUrl?: string
  hotImageUrl?: string
  coldImageUrl?: string
  temperatureMode?: 'both' | 'hot' | 'cold'
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

export type Promotion = {
  id: string
  title: string
  subtitle?: string
  badge?: string
  placement: 'main' | 'category'
  categoryId?: string
  targetType: 'product' | 'article'
  targetProductId?: string
  content?: string
  imageUrl?: string
  bgColor?: string
  productIds?: string[]
  sort: number
  isActive?: boolean
}

export type CatalogData = {
  items: MenuItem[]
  categories: Category[]
  ingredientGroups: IngredientGroup[]
  promos?: Promotion[]
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
  promos: Promotion[]
  mainPromos: Promotion[]
  mainPromo?: Promotion
  promoByCategory: Map<string, Promotion>
  promoById: Map<string, Promotion>
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

  const rawPromos = data.promos ?? []
  const activePromos = rawPromos.filter((p) => p.isActive !== false).sort((a, b) => a.sort - b.sort)
  const promoById = new Map(activePromos.map((p) => [p.id, p]))
  const mainPromos = activePromos.filter((p) => p.placement === 'main')
  const mainPromo = mainPromos[0]

  const promoByCategory = new Map<string, Promotion>()
  for (const promo of activePromos) {
    if (promo.placement === 'category' && promo.categoryId && !promoByCategory.has(promo.categoryId)) {
      promoByCategory.set(promo.categoryId, promo)
    }
  }

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
    promos: activePromos,
    mainPromos,
    mainPromo,
    promoByCategory,
    promoById,
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

export type Temperature = 'hot' | 'cold'

/** What a drink is served as until someone picks otherwise. */
export const defaultTemperature = (item: MenuItem): Temperature => (item.temperatureMode === 'cold' ? 'cold' : 'hot')

/** The photo of `item` at a temperature, or whichever photo it has. */
export const itemImage = (item: MenuItem, temperature: Temperature = defaultTemperature(item)) =>
  temperature === 'cold'
    ? item.coldImageUrl || item.imageUrl || item.hotImageUrl
    : item.hotImageUrl || item.imageUrl || item.coldImageUrl
