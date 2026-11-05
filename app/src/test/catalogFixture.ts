import { createCatalog, type CatalogData, type Nutrition, type Shop } from '../domain'

const n = (kcal: number, fat = 0, carbs = 0, protein = 0): Nutrition => ({ kcal, fat, carbs, protein })

/**
 * Small catalog in the exact shape GET /api/v1/catalog returns, for unit tests only.
 * The app itself always loads the menu from the API.
 */
export const catalogData: CatalogData = {
  categories: [
    { id: 'coffee', name: 'Кофе', heroItemId: 'cappuccino' },
    { id: 'milk-coffee', name: 'С молоком', parentId: 'coffee' },
    { id: 'black-coffee', name: 'Чёрный', parentId: 'coffee' },
    { id: 'food', name: 'Еда', heroItemId: 'croissant' },
    { id: 'bakery', name: 'Выпечка', parentId: 'food' },
  ],
  ingredientGroups: [
    {
      id: 'syrups',
      name: 'Сиропы',
      max: 20,
      counter: true,
      unit: 'порц',
      ingredients: [
        { id: 'vanilla', name: 'Ваниль', price: 50, color: '#f3e3b5', nutrition: n(20, 0, 5, 0) },
        { id: 'caramel', name: 'Карамель', price: 50, color: '#c98a3b', nutrition: n(22, 0, 5, 0), stopped: true },
      ],
    },
    {
      id: 'milk',
      name: 'Молоко',
      max: 1,
      ingredients: [{ id: 'oat', name: 'Овсяное', price: 70, color: '#e8dcc4', nutrition: n(40, 1, 6, 1) }],
    },
  ],
  items: [
    {
      id: 'cappuccino',
      name: 'Капучино',
      description: 'Эспрессо и густая молочная пена',
      composition: 'Эспрессо, молоко',
      categoryId: 'milk-coffee',
      temperatureMode: 'both',
      art: { kind: 'cup', fill: '#c8a27a', top: '#f4e9dc', bg: '#efe3d3' },
      variants: [
        { id: 'm', size: 'M', volume: '300 мл', price: 210, nutrition: n(120, 6, 9, 6) },
        { id: 'l', size: 'L', volume: '400 мл', price: 260, nutrition: n(160, 8, 12, 8) },
      ],
      groupIds: ['syrups', 'milk'],
    },
    {
      id: 'latte',
      name: 'Латте',
      description: 'Мягкий кофе с молоком',
      composition: 'Эспрессо, молоко',
      categoryId: 'milk-coffee',
      temperatureMode: 'both',
      art: { kind: 'cup', fill: '#d8b894', bg: '#f1e6d8' },
      variants: [
        { id: 'm', size: 'M', volume: '300 мл', price: 230, nutrition: n(150, 7, 11, 7) },
        { id: 'l', size: 'L', volume: '400 мл', price: 280, nutrition: n(200, 9, 15, 9) },
      ],
      groupIds: ['syrups', 'milk'],
    },
    {
      id: 'espresso',
      name: 'Эспрессо',
      description: 'Двойная порция',
      composition: 'Кофе',
      categoryId: 'black-coffee',
      art: { kind: 'mug', fill: '#3b2618', bg: '#ece0d2' },
      variants: [{ id: 's', size: 'S', volume: '60 мл', price: 160, nutrition: n(5) }],
      groupIds: [],
    },
    {
      id: 'croissant',
      name: 'Круассан',
      description: 'Сливочный круассан',
      composition: 'Мука, масло',
      categoryId: 'bakery',
      art: { kind: 'croissant', fill: '#d9a35b', bg: '#f4e8d4' },
      variants: [{ id: 'one', size: 'ONE', price: 160, nutrition: n(260, 14, 28, 5) }],
      groupIds: [],
    },
    {
      id: 'cookie',
      name: 'Печенье',
      description: 'Овсяное печенье',
      composition: 'Овсянка, масло',
      categoryId: 'bakery',
      art: { kind: 'cookie', fill: '#c48a4a', bg: '#f3e6d3' },
      variants: [{ id: 'one', size: 'ONE', price: 90, nutrition: n(180, 8, 24, 3), stopped: true }],
      groupIds: [],
    },
  ],
}

export const testCatalog = createCatalog(catalogData)

/** Shop in the shape GET /api/v1/shops returns; open every day 00:00–23:59 so tests don't depend on the clock. */
export const testShop: Shop = {
  id: 'spb-nevsky',
  name: 'shit кофе на Невском',
  address: 'Невский проспект, 12',
  phone: '+7 (999) 000-12-34',
  isAccepting: true,
  basePrepMinutes: 5,
  hours: Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, opens: '00:00', closes: '23:59' })),
}
