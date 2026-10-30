// Shape mirrors the category → item → variant → ingredient-group model
// described in docs/drinkit-analysis.md. All content here is our own.

export type Nutrition = { kcal: number; fat: number; carbs: number; protein: number }

export type ArtKind = 'cup' | 'mug' | 'iced' | 'tea' | 'croissant' | 'sandwich' | 'cake' | 'cookie'

export type Art = {
  kind: ArtKind
  /** Main liquid / food color */
  fill: string
  /** Foam, cream or secondary layer */
  top?: string
  /** Card / screen background tint */
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
  /** Cap for this one add-on in counter groups (defaults to the group's max) */
  maxQty?: number
}

/**
 * Mirrors Drinkit's IngredientGroup: `counter` is `changedQuantityWithCounter`
 * (spoons/pumps with +/−) and `max` is `totalQuantityMax` for the whole group.
 */
export type IngredientGroup = {
  id: string
  name: string
  /** Choice groups: 1 → single choice, >1 → up to N different. Counter groups: total portions. */
  max: number
  counter?: boolean
  /** What one portion is called in a counter group, e.g. "порц." or "ложка" */
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

export type Category = { id: string; name: string; parentId?: string; heroItemId?: string }

const n = (kcal: number, fat: number, carbs: number, protein: number): Nutrition => ({ kcal, fat, carbs, protein })

export const ingredientGroups: IngredientGroup[] = [
  {
    id: 'syrups',
    name: 'Сиропы',
    max: 20,
    counter: true,
    unit: 'порц.',
    ingredients: [
      { id: 'vanilla', name: 'Ваниль', price: 50, nutrition: n(40, 0, 10, 0), color: '#f3dfb0' },
      { id: 'caramel', name: 'Солёная карамель', price: 50, nutrition: n(45, 0.5, 11, 0), color: '#c98a3c' },
      { id: 'hazelnut', name: 'Лесной орех', price: 50, nutrition: n(42, 0, 10, 0), color: '#9a6a3f' },
      { id: 'pumpkin', name: 'Тыквенный пряный', price: 60, nutrition: n(48, 0, 12, 0), color: '#e08a32' },
      { id: 'lavender', name: 'Лаванда', price: 60, nutrition: n(38, 0, 9, 0), color: '#b7a3e0' },
      { id: 'maple', name: 'Клён', price: 60, nutrition: n(44, 0, 11, 0), color: '#b0702a', stopped: true },
    ],
  },
  {
    id: 'milk',
    name: 'Молоко',
    max: 1,
    ingredients: [
      { id: 'oat', name: 'Овсяное', price: 70, nutrition: n(-10, -1.5, 3, -2), color: '#efe2c4' },
      { id: 'almond', name: 'Миндальное', price: 70, nutrition: n(-30, -1, -4, -3), color: '#f1e6d6' },
      { id: 'coconut', name: 'Кокосовое', price: 70, nutrition: n(-15, 1, -3, -3), color: '#fbf6ee' },
      { id: 'lactosefree', name: 'Безлактозное', price: 40, nutrition: n(0, 0, -1, 0), color: '#f7f3ea' },
    ],
  },
  {
    id: 'toppings',
    name: 'Посыпки',
    max: 1,
    ingredients: [
      { id: 'cinnamon', name: 'Корица', price: 0, nutrition: n(3, 0, 1, 0), color: '#a5643a' },
      { id: 'cocoa', name: 'Какао', price: 30, nutrition: n(10, 0.5, 1, 0.8), color: '#6b3d26' },
      { id: 'coconut-flakes', name: 'Кокосовая стружка', price: 40, nutrition: n(30, 3, 1, 0.3), color: '#f4efe6' },
      { id: 'pistachio', name: 'Фисташка', price: 60, nutrition: n(35, 3, 1.5, 1.2), color: '#a9c27a' },
      { id: 'marshmallow', name: 'Маршмеллоу', price: 40, nutrition: n(32, 0, 8, 0.2), color: '#f6d2dc' },
    ],
  },
  {
    id: 'extra',
    name: 'Покрепче',
    max: 5,
    counter: true,
    unit: 'шт.',
    ingredients: [
      { id: 'shot', name: 'Доп. шот эспрессо', price: 60, nutrition: n(2, 0, 0, 0.1), color: '#4a2a1a', maxQty: 3 },
      { id: 'decaf', name: 'Без кофеина', price: 0, nutrition: n(0, 0, 0, 0), color: '#8d6a55', maxQty: 1 },
      { id: 'cream', name: 'Взбитые сливки', price: 60, nutrition: n(70, 7, 2, 0.5), color: '#fffaf2', maxQty: 2 },
    ],
  },
  {
    id: 'protein',
    name: 'Протеин',
    max: 5,
    counter: true,
    unit: 'ложки',
    ingredients: [
      { id: 'whey', name: 'Сывороточный протеин', price: 90, nutrition: n(115, 1.5, 3, 23), color: '#f2e9dc' },
      { id: 'collagen', name: 'Коллаген', price: 70, nutrition: n(36, 0, 0, 9), color: '#f7f1ea' },
      { id: 'plant-protein', name: 'Гороховый протеин', price: 80, nutrition: n(110, 2, 2, 21), color: '#d9cf9a' },
    ],
  },
]

export const categories: Category[] = [
  { id: 'season', name: 'Осень', heroItemId: 'pumpkin-raf' },
  { id: 'season-hot', name: 'Согревающее', parentId: 'season' },
  { id: 'coffee', name: 'Кофе', heroItemId: 'flat-white' },
  { id: 'milk-coffee', name: 'С молоком', parentId: 'coffee' },
  { id: 'black-coffee', name: 'Чёрный', parentId: 'coffee' },
  { id: 'iced-coffee', name: 'Холодный', parentId: 'coffee' },
  { id: 'nocoffee', name: 'Не кофе', heroItemId: 'matcha' },
  { id: 'tea', name: 'Чай и матча', parentId: 'nocoffee' },
  { id: 'cocoa', name: 'Какао', parentId: 'nocoffee' },
  { id: 'food', name: 'Еда', heroItemId: 'croissant' },
  { id: 'bakery', name: 'Выпечка', parentId: 'food' },
  { id: 'sandwiches', name: 'Сэндвичи', parentId: 'food' },
  { id: 'desserts', name: 'Десерты', parentId: 'food' },
]

const milkSizes = (m: number, l: number, base: Nutrition): Variant[] => [
  { id: 'm', size: 'M', volume: '300 мл', price: m, nutrition: base },
  {
    id: 'l',
    size: 'L',
    volume: '400 мл',
    price: l,
    nutrition: n(Math.round(base.kcal * 1.33), +(base.fat * 1.33).toFixed(1), +(base.carbs * 1.33).toFixed(1), +(base.protein * 1.33).toFixed(1)),
  },
]

const one = (price: number, nutrition: Nutrition): Variant[] => [{ id: 'one', size: 'ONE', price, nutrition }]

const milkGroups = ['milk', 'syrups', 'toppings', 'extra', 'protein']

export const menuItems: MenuItem[] = [
  {
    id: 'pumpkin-raf',
    name: 'Тыквенный раф',
    description: 'Сливочный раф с пряной тыквой, корицей и мускатным орехом',
    composition: 'Эспрессо, сливки 10%, тыквенный сироп, корица, мускатный орех',
    allergens: 'Молоко',
    categoryId: 'season-hot',
    art: { kind: 'cup', fill: '#e2a066', top: '#fbe8d2', bg: '#f6d9bd' },
    variants: milkSizes(290, 340, n(240, 13, 24, 5)),
    groupIds: ['milk', 'toppings', 'extra'],
    related: { itemId: 'iced-pumpkin', label: 'Холодный' },
    badge: 'Новинка',
  },
  {
    id: 'iced-pumpkin',
    name: 'Айс тыквенный латте',
    description: 'Холодный латте с тыквенным сиропом и льдом',
    composition: 'Эспрессо, молоко 3,2%, тыквенный сироп, лёд',
    allergens: 'Молоко',
    categoryId: 'season-hot',
    art: { kind: 'iced', fill: '#d9965a', top: '#f6e2cb', bg: '#f3d6b8' },
    variants: milkSizes(290, 340, n(180, 6, 26, 6)),
    groupIds: ['milk', 'syrups', 'extra'],
    related: { itemId: 'pumpkin-raf', label: 'Горячий' },
  },
  {
    id: 'apple-cider',
    name: 'Пряный яблочный сидр',
    description: 'Горячий яблочный напиток с гвоздикой и апельсином',
    composition: 'Яблочный сок, апельсин, гвоздика, корица, бадьян',
    categoryId: 'season-hot',
    art: { kind: 'tea', fill: '#d98a3d', bg: '#f5dcb8' },
    variants: milkSizes(240, 290, n(130, 0, 32, 0.5)),
    groupIds: ['syrups'],
  },
  {
    id: 'latte',
    name: 'Латте',
    description: 'Двойной эспрессо и много нежного молока',
    composition: 'Эспрессо, молоко 3,2%',
    allergens: 'Молоко',
    categoryId: 'milk-coffee',
    art: { kind: 'cup', fill: '#d9b58c', top: '#f8eddc', bg: '#ecdcc8' },
    variants: milkSizes(230, 280, n(156, 8.1, 11.9, 7.7)),
    groupIds: milkGroups,
    related: { itemId: 'iced-latte', label: 'Холодный' },
  },
  {
    id: 'cappuccino',
    name: 'Капучино',
    description: 'Эспрессо с плотной молочной пеной',
    composition: 'Эспрессо, молоко 3,2%',
    allergens: 'Молоко',
    categoryId: 'milk-coffee',
    art: { kind: 'mug', fill: '#c69a6d', top: '#f7ecdd', bg: '#ead8c3' },
    variants: milkSizes(210, 260, n(120, 6.2, 9.4, 6)),
    groupIds: milkGroups,
  },
  {
    id: 'flat-white',
    name: 'Флэт уайт',
    description: 'Больше кофе, меньше молока — для тех, кто любит покрепче',
    composition: 'Двойной ристретто, молоко 3,2%',
    allergens: 'Молоко',
    categoryId: 'milk-coffee',
    art: { kind: 'mug', fill: '#a87850', top: '#f3e3cf', bg: '#e5d0b8' },
    variants: milkSizes(240, 290, n(110, 5.8, 8.5, 5.6)),
    groupIds: milkGroups,
  },
  {
    id: 'mocha',
    name: 'Мокко',
    description: 'Латте с бельгийским шоколадом',
    composition: 'Эспрессо, молоко 3,2%, тёмный шоколад',
    allergens: 'Молоко, может содержать орехи',
    categoryId: 'milk-coffee',
    art: { kind: 'cup', fill: '#8a5a3c', top: '#efdcc8', bg: '#e0c6ae' },
    variants: milkSizes(270, 320, n(260, 12, 30, 8)),
    groupIds: milkGroups,
  },
  {
    id: 'raf',
    name: 'Раф ванильный',
    description: 'Взбитые сливки, эспрессо и ваниль',
    composition: 'Эспрессо, сливки 10%, ванильный сахар',
    allergens: 'Молоко',
    categoryId: 'milk-coffee',
    art: { kind: 'cup', fill: '#e7cfa8', top: '#fff6e8', bg: '#f1e4cf' },
    variants: milkSizes(260, 310, n(230, 14, 20, 4.5)),
    groupIds: ['syrups', 'toppings', 'extra'],
  },
  {
    id: 'espresso',
    name: 'Эспрессо',
    description: 'Концентрированный вкус зерна дня',
    composition: 'Арабика 100%',
    categoryId: 'black-coffee',
    art: { kind: 'mug', fill: '#3d2216', top: '#b07a4f', bg: '#dcc8b6' },
    variants: [{ id: 's', size: 'S', volume: '40 мл', price: 150, nutrition: n(2, 0, 0, 0.1) }],
    groupIds: ['extra'],
  },
  {
    id: 'americano',
    name: 'Американо',
    description: 'Эспрессо, разбавленный горячей водой',
    composition: 'Эспрессо, вода',
    categoryId: 'black-coffee',
    art: { kind: 'cup', fill: '#4a2b1b', top: '#7b4d31', bg: '#ddcab8' },
    variants: milkSizes(170, 210, n(5, 0, 0.5, 0.3)),
    groupIds: ['syrups', 'extra'],
  },
  {
    id: 'filter',
    name: 'Фильтр-кофе',
    description: 'Колумбия, ноты красного яблока и карамели',
    composition: 'Арабика, вода',
    categoryId: 'black-coffee',
    art: { kind: 'tea', fill: '#6b3a22', bg: '#e3cdb9' },
    variants: milkSizes(190, 230, n(4, 0, 0.4, 0.3)),
    groupIds: ['syrups'],
  },
  {
    id: 'iced-latte',
    name: 'Айс латте',
    description: 'Эспрессо, холодное молоко и много льда',
    composition: 'Эспрессо, молоко 3,2%, лёд',
    allergens: 'Молоко',
    categoryId: 'iced-coffee',
    art: { kind: 'iced', fill: '#cfa57a', top: '#f6e9d8', bg: '#e6d6c4' },
    variants: milkSizes(240, 290, n(130, 6.5, 10, 6.3)),
    groupIds: milkGroups,
    related: { itemId: 'latte', label: 'Горячий' },
  },
  {
    id: 'espresso-tonic',
    name: 'Эспрессо-тоник',
    description: 'Тоник, лёд и эспрессо с цедрой апельсина',
    composition: 'Эспрессо, тоник, лёд, апельсин',
    categoryId: 'iced-coffee',
    art: { kind: 'iced', fill: '#8c5532', top: '#e9c9a0', bg: '#e8d5c0' },
    variants: milkSizes(260, 310, n(70, 0, 17, 0.2)),
    groupIds: ['syrups'],
  },
  {
    id: 'cold-brew',
    name: 'Колд брю',
    description: 'Кофе, который настаивался 18 часов',
    composition: 'Арабика, вода, лёд',
    categoryId: 'iced-coffee',
    art: { kind: 'iced', fill: '#3f2416', top: '#6d432b', bg: '#d9c6b5' },
    variants: [
      { id: 'm', size: 'M', volume: '300 мл', price: 230, nutrition: n(5, 0, 0.5, 0.3), stopped: true },
      { id: 'l', size: 'L', volume: '400 мл', price: 270, nutrition: n(7, 0, 0.7, 0.4), stopped: true },
    ],
    groupIds: ['syrups'],
  },
  {
    id: 'matcha',
    name: 'Матча латте',
    description: 'Японский чай матча, взбитый с молоком',
    composition: 'Матча, молоко 3,2%',
    allergens: 'Молоко',
    categoryId: 'tea',
    art: { kind: 'cup', fill: '#9cbf6a', top: '#eef4dc', bg: '#dfe9c9' },
    variants: milkSizes(270, 320, n(150, 7, 14, 7)),
    groupIds: ['milk', 'syrups', 'toppings', 'protein'],
  },
  {
    id: 'sea-buckthorn',
    name: 'Облепиховый чай',
    description: 'Облепиха, мёд, имбирь и апельсин',
    composition: 'Облепиха, мёд, имбирь, апельсин, чёрный чай',
    allergens: 'Мёд',
    categoryId: 'tea',
    art: { kind: 'tea', fill: '#f0a12a', bg: '#f8e1b8' },
    variants: milkSizes(220, 260, n(110, 0.5, 26, 0.6)),
    groupIds: ['syrups'],
  },
  {
    id: 'earl-grey',
    name: 'Эрл грей',
    description: 'Чёрный чай с бергамотом',
    composition: 'Чёрный чай, бергамот',
    categoryId: 'tea',
    art: { kind: 'tea', fill: '#8a4a22', bg: '#ead2bd' },
    variants: milkSizes(160, 190, n(2, 0, 0.3, 0)),
    groupIds: ['milk', 'syrups'],
  },
  {
    id: 'cocoa',
    name: 'Какао',
    description: 'Густое какао на молоке',
    composition: 'Какао-порошок, молоко 3,2%, сахар',
    allergens: 'Молоко',
    categoryId: 'cocoa',
    art: { kind: 'mug', fill: '#7a4a32', top: '#d9b79b', bg: '#e3cbb8' },
    variants: milkSizes(220, 270, n(210, 8, 28, 7)),
    groupIds: ['milk', 'syrups', 'toppings', 'protein'],
  },
  {
    id: 'hot-chocolate',
    name: 'Горячий шоколад',
    description: 'Растопленный тёмный шоколад и сливки',
    composition: 'Тёмный шоколад 70%, сливки, молоко',
    allergens: 'Молоко, может содержать орехи',
    categoryId: 'cocoa',
    art: { kind: 'mug', fill: '#4e2a1b', top: '#7a4a32', bg: '#dcc3b0' },
    variants: [{ id: 'm', size: 'M', volume: '250 мл', price: 290, nutrition: n(340, 20, 32, 7) }],
    groupIds: ['toppings'],
  },
  {
    id: 'croissant',
    name: 'Круассан',
    description: 'Слоёный, на сливочном масле 82%',
    composition: 'Мука, сливочное масло, молоко, сахар, яйцо, дрожжи',
    allergens: 'Глютен, молоко, яйцо',
    categoryId: 'bakery',
    art: { kind: 'croissant', fill: '#e2a457', bg: '#f4e1c2' },
    variants: one(160, n(290, 17, 30, 5.5)),
    groupIds: [],
  },
  {
    id: 'almond-croissant',
    name: 'Миндальный круассан',
    description: 'С франжипаном и лепестками миндаля',
    composition: 'Круассан, миндальный крем, миндаль, сахарная пудра',
    allergens: 'Глютен, молоко, яйцо, орехи',
    categoryId: 'bakery',
    art: { kind: 'croissant', fill: '#d79a4f', top: '#f5ead8', bg: '#f1dcc0' },
    variants: one(220, n(410, 25, 38, 9)),
    groupIds: [],
  },
  {
    id: 'cookie',
    name: 'Печенье с шоколадом',
    description: 'Хрустящее снаружи, мягкое внутри',
    composition: 'Мука, масло, тёмный шоколад, сахар, яйцо',
    allergens: 'Глютен, молоко, яйцо',
    categoryId: 'bakery',
    art: { kind: 'cookie', fill: '#c98b4e', top: '#3d2216', bg: '#efdcc4' },
    variants: one(130, n(220, 11, 28, 3)),
    groupIds: [],
  },
  {
    id: 'club-sandwich',
    name: 'Сэндвич с индейкой',
    description: 'Индейка су-вид, томаты, салат, соус песто',
    composition: 'Хлеб, индейка, томат, салат, песто, сыр',
    allergens: 'Глютен, молоко, орехи',
    categoryId: 'sandwiches',
    art: { kind: 'sandwich', fill: '#e8c48a', top: '#7fae5a', bg: '#ecdfc5' },
    variants: one(390, n(420, 18, 38, 26)),
    groupIds: [],
  },
  {
    id: 'salmon-bagel',
    name: 'Бейгл с лососем',
    description: 'Слабосолёный лосось, крем-чиз и каперсы',
    composition: 'Бейгл, лосось, сливочный сыр, каперсы, укроп',
    allergens: 'Глютен, молоко, рыба',
    categoryId: 'sandwiches',
    art: { kind: 'sandwich', fill: '#d9a96a', top: '#f0907a', bg: '#f1dccb' },
    variants: one(450, n(380, 15, 40, 21)),
    groupIds: [],
  },
  {
    id: 'cheesecake',
    name: 'Чизкейк',
    description: 'Классический нью-йорк на песочной основе',
    composition: 'Сливочный сыр, сливки, яйцо, сахар, печенье, масло',
    allergens: 'Глютен, молоко, яйцо',
    categoryId: 'desserts',
    art: { kind: 'cake', fill: '#f4e2bd', top: '#c99456', bg: '#f2e6d0' },
    variants: one(320, n(390, 26, 32, 7)),
    groupIds: [],
  },
  {
    id: 'carrot-cake',
    name: 'Морковный торт',
    description: 'С грецким орехом и сливочным кремом',
    composition: 'Морковь, мука, грецкий орех, сливочный сыр, специи',
    allergens: 'Глютен, молоко, яйцо, орехи',
    categoryId: 'desserts',
    art: { kind: 'cake', fill: '#d8894a', top: '#fbf3e6', bg: '#f3dfc6' },
    variants: one(340, n(430, 24, 46, 6)),
    groupIds: [],
  },
]

export const itemById = new Map(menuItems.map((i) => [i.id, i]))
export const groupById = new Map(ingredientGroups.map((g) => [g.id, g]))

export const topCategories = categories.filter((c) => !c.parentId)
export const subcategoriesOf = (id: string) => categories.filter((c) => c.parentId === id)
export const itemsOf = (subId: string) => menuItems.filter((i) => i.categoryId === subId)

export const minPrice = (item: MenuItem) => Math.min(...item.variants.map((v) => v.price))
export const isSoldOut = (item: MenuItem) => item.variants.every((v) => v.stopped)
export const isDrink = (item: MenuItem) => item.variants[0].size !== 'ONE'

/** Collapses repeated add-ons (counter groups store one id per portion) into { ingredient, qty }. */
export function countAddons(ingredients: Ingredient[]) {
  const counted: { ingredient: Ingredient; qty: number }[] = []
  for (const ingredient of ingredients) {
    const found = counted.find((c) => c.ingredient.id === ingredient.id)
    if (found) found.qty++
    else counted.push({ ingredient, qty: 1 })
  }
  return counted
}

export const addonLabel = ({ ingredient, qty }: { ingredient: Ingredient; qty: number }) =>
  qty > 1 ? `${ingredient.name} ×${qty}` : ingredient.name
