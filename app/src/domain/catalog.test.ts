import { describe, expect,it } from 'vitest'

import {
  addonLabel,
  type CatalogData,
  countAddons,
  createCatalog,
  hasAddons,
  type Ingredient,
  isDrink,
  isSoldOut,
  type MenuItem,
  minPrice,
} from './catalog'

describe('Domain: catalog', () => {
  const dummyNutrition = { kcal: 100, fat: 3, carbs: 10, protein: 4 }

  const dummyDrink: MenuItem = {
    id: 'cappuccino',
    name: 'Капучино',
    description: 'Кофе с молоком',
    composition: 'Эспрессо, молоко',
    categoryId: 'classic',
    art: { kind: 'cup', fill: '#d4a373', bg: '#faedcd' },
    variants: [
      { id: 's', size: 'S', volume: '200 мл', price: 200, nutrition: dummyNutrition, stopped: false },
      { id: 'm', size: 'M', volume: '300 мл', price: 250, nutrition: dummyNutrition, stopped: false },
      { id: 'l', size: 'L', volume: '400 мл', price: 300, nutrition: dummyNutrition, stopped: false },
    ],
    groupIds: ['syrup'],
  }

  const dummyFood: MenuItem = {
    id: 'croissant',
    name: 'Круассан',
    description: 'Свежая выпечка',
    composition: 'Тесто, масло',
    categoryId: 'bakery',
    art: { kind: 'croissant', fill: '#f4a261', bg: '#faedcd' },
    variants: [
      { id: 'one', size: 'ONE', price: 180, nutrition: dummyNutrition, stopped: true },
    ],
    groupIds: [],
  }

  it('minPrice finds the lowest variant price', () => {
    expect(minPrice(dummyDrink)).toBe(200)
    expect(minPrice(dummyFood)).toBe(180)
  })

  it('isSoldOut checks if all variants are stopped', () => {
    expect(isSoldOut(dummyDrink)).toBe(false)
    expect(isSoldOut(dummyFood)).toBe(true)
  })

  it('isDrink distinguishes drinks from single-size food', () => {
    expect(isDrink(dummyDrink)).toBe(true)
    expect(isDrink(dummyFood)).toBe(false)
  })

  it('hasAddons detects when an item has configurable modifier groups', () => {
    expect(hasAddons(dummyDrink)).toBe(true)
    expect(hasAddons(dummyFood)).toBe(false)
  })

  it('countAddons groups multiple portions of the same ingredient', () => {
    const vanilla: Ingredient = { id: 'vanilla', name: 'Ваниль', price: 40, nutrition: dummyNutrition, color: '#fff' }
    const caramel: Ingredient = { id: 'caramel', name: 'Карамель', price: 40, nutrition: dummyNutrition, color: '#c68b59' }

    const input = [vanilla, caramel, vanilla, vanilla]
    const result = countAddons(input)

    expect(result).toEqual([
      { ingredient: vanilla, qty: 3 },
      { ingredient: caramel, qty: 1 },
    ])
  })

  it('addonLabel formats single vs multiple quantities', () => {
    const vanilla: Ingredient = { id: 'vanilla', name: 'Ваниль', price: 40, nutrition: dummyNutrition, color: '#fff' }
    expect(addonLabel({ ingredient: vanilla, qty: 1 })).toBe('Ваниль')
    expect(addonLabel({ ingredient: vanilla, qty: 2 })).toBe('Ваниль ×2')
  })

  it('createCatalog indexes categories and items correctly', () => {
    const data: CatalogData = {
      categories: [
        { id: 'drinks', name: 'Напитки' },
        { id: 'classic', name: 'Классика', parentId: 'drinks' },
        { id: 'food', name: 'Еда' },
        { id: 'bakery', name: 'Выпечка', parentId: 'food' },
      ],
      items: [dummyDrink, dummyFood],
      ingredientGroups: [
        {
          id: 'syrup',
          name: 'Сиропы',
          max: 2,
          ingredients: [
            { id: 'vanilla', name: 'Ваниль', price: 40, nutrition: dummyNutrition, color: '#fff' },
          ],
        },
      ],
    }

    const catalog = createCatalog(data)

    // Top categories (without parentId)
    expect(catalog.topCategories.map((c) => c.id)).toEqual(['drinks', 'food'])

    // Subcategories of a top category
    expect(catalog.subcategoriesOf('drinks').map((c) => c.id)).toEqual(['classic'])
    expect(catalog.subcategoriesOf('non-existent')).toEqual([])

    // Items of a category
    expect(catalog.itemsOf('classic')).toEqual([dummyDrink])
    expect(catalog.itemsOf('bakery')).toEqual([dummyFood])
    expect(catalog.itemsOf('empty')).toEqual([])

    // Maps
    expect(catalog.itemById.get('cappuccino')).toBe(dummyDrink)
    expect(catalog.groupById.get('syrup')?.name).toBe('Сиропы')
  })

  it('createCatalog indexes promotions, mainPromo and category bindings', () => {
    const data: CatalogData = {
      categories: [{ id: 'classic', name: 'Классика' }],
      items: [dummyDrink],
      ingredientGroups: [],
      promos: [
        {
          id: 'p-season',
          title: 'Осень',
          placement: 'category',
          categoryId: 'classic',
          targetType: 'product',
          targetProductId: 'cappuccino',
          sort: 2,
          isActive: true,
        },
        {
          id: 'p-main',
          title: 'Главное промо',
          placement: 'main',
          targetType: 'article',
          content: 'Текст акции',
          sort: 1,
          isActive: true,
        },
        {
          id: 'p-disabled',
          title: 'Выключенная акция',
          placement: 'main',
          targetType: 'article',
          sort: 0,
          isActive: false,
        },
      ],
    }

    const catalog = createCatalog(data)
    expect(catalog.promos.length).toBe(2)
    expect(catalog.promos.map((p) => p.id)).toEqual(['p-main', 'p-season'])
    expect(catalog.mainPromo?.id).toBe('p-main')
    expect(catalog.promoByCategory.get('classic')?.id).toBe('p-season')
    expect(catalog.promoById.get('p-season')?.title).toBe('Осень')
    expect(catalog.promoById.get('p-disabled')).toBeUndefined()
  })
})
