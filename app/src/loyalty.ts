import { usePersistent, resolveLines, type CartLine, type Order } from './store'

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
  const drinks = resolveLines(lines).filter((l) => l.item.variants[0].size !== 'ONE')
  if (!drinks.length) return 0
  return Math.min(GIFT_DRINK_LIMIT, Math.max(...drinks.map((l) => l.unitPrice)))
}

export function useProfile() {
  const [profile, setProfile] = usePersistent<Profile | null>('zerno-profile', null)
  const signIn = (phone: string, name: string) =>
    setProfile((prev) => (prev?.phone === phone ? prev : { phone, name, email: '', notifications: true, joinedAt: Date.now() }))
  const update = (patch: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...patch } : prev))
  const signOut = () => setProfile(null)
  return { profile, signIn, update, signOut }
}

/** "+7 999 123-45-67" from any digits the user typed. */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)]
  let out = '+7'
  if (parts[0]) out += ` ${parts[0]}`
  if (parts[1]) out += ` ${parts[1]}`
  if (parts[2]) out += `-${parts[2]}`
  if (parts[3]) out += `-${parts[3]}`
  return out
}
export const phoneDigits = (value: string) => value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)
