import { useCallback } from 'react'
import { isDrink } from '../data/menu'
import { usePersistent } from '../hooks/usePersistent'
import { resolveLines, type CartLine } from './cart'
import type { Order } from './orders'

export type Profile = {
  phone: string
  name: string
  email: string
  notifications: boolean
  joinedAt: number
}

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
export function loyaltyOf(orders: Order[], profile: Profile | null): Loyalty {
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
export function giftValue(lines: CartLine[]) {
  const drinks = resolveLines(lines).filter((l) => isDrink(l.item))
  if (!drinks.length) return 0
  return Math.min(GIFT_DRINK_LIMIT, Math.max(...drinks.map((l) => l.unitPrice)))
}

export function useProfile() {
  const [profile, setProfile] = usePersistent<Profile | null>('zerno-profile', null)
  const signIn = useCallback(
    (phone: string, name: string) =>
      setProfile((prev) => (prev?.phone === phone ? prev : { phone, name, email: '', notifications: true, joinedAt: Date.now() })),
    [setProfile],
  )
  const update = useCallback((patch: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...patch } : prev)), [setProfile])
  const signOut = useCallback(() => setProfile(null), [setProfile])
  return { profile, signIn, update, signOut }
}
