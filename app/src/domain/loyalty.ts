import type { Catalog } from './catalog'
import { isDrink } from './catalog'
import { resolveLines, type CartLine } from './cart'
import type { Order } from './orders'
import type { UserProfile } from './profile'

/** Levels mirror Drinkit's `{ level, discountPercent }`; ours are earned by completed orders. */
export const levels = [
  { level: 1, name: 'Зерно', minOrders: 0, percent: 0 },
  { level: 2, name: 'Росток', minOrders: 3, percent: 3 },
  { level: 3, name: 'Обжарка', minOrders: 8, percent: 5 },
  { level: 4, name: 'Эспрессо', minOrders: 15, percent: 7 },
] as const

export type Level = (typeof levels)[number]

/** Stamp card standing in for Drinkit's prize boxes: every Nth qualifying order earns a gift drink. */
export const STAMPS_PER_GIFT = 6
export const STAMP_MIN_TOTAL = 300
export const GIFT_DRINK_LIMIT = 350

export type Loyalty = {
  completed: number
  level: Level
  next?: Level
  stamps: number
  giftsAvailable: number
  giftsEarned: number
}

/** Everything is derived from the order list, so a cancelled order simply stops counting. */
export function loyaltyOf(orders: Order[], profile: UserProfile | null): Loyalty {
  const mine = profile ? orders.filter((o) => o.phone === profile.phone && !o.cancelledAt) : []
  const completed = mine.length
  const qualifying = mine.filter((o) => o.total + (o.rewardDiscount ?? 0) >= STAMP_MIN_TOTAL).length
  // One welcome gift for signing up, like Drinkit's first bonus.
  const giftsEarned = profile ? 1 + Math.floor(qualifying / STAMPS_PER_GIFT) : 0
  const giftsUsed = mine.filter((o) => o.rewardDiscount).length
  const levelIdx = levels.reduce((idx, l, i) => (completed >= l.minOrders ? i : idx), 0)
  return {
    completed,
    level: levels[levelIdx],
    next: levels[levelIdx + 1],
    stamps: qualifying % STAMPS_PER_GIFT,
    giftsEarned,
    giftsAvailable: Math.max(0, giftsEarned - giftsUsed),
  }
}

/** The gift covers the priciest drink in the cart, up to the limit. */
export function giftValue(lines: CartLine[], catalog: Catalog): number {
  const drinks = resolveLines(lines, catalog).filter((l) => isDrink(l.item))
  if (drinks.length === 0) return 0
  const maxUnitPrice = Math.max(...drinks.map((d) => d.unitPrice))
  return Math.min(GIFT_DRINK_LIMIT, maxUnitPrice)
}
