/** Opening hours for one weekday, 1 = Monday … 7 = Sunday (as GET /api/v1/shops returns them). */
export type ShopHours = { weekday: number; opens: string; closes: string }

export type Shop = {
  id: string
  name: string
  address: string
  phone: string
  isAccepting: boolean
  pauseReason?: string
  pauseUntil?: string
  basePrepMinutes: number
  hours: ShopHours[]
}

const isoWeekday = (date: Date) => date.getDay() || 7
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

export const hoursOn = (shop: Shop, date: Date): ShopHours | undefined => {
  if (Array.isArray(shop.hours)) {
    return shop.hours.find((h) => h.weekday === isoWeekday(date))
  }
  if (shop.hours && typeof shop.hours === 'object') {
    const raw = shop.hours as any
    const opens = raw.opens || raw.opensAt || '08:00'
    const closes = raw.closes || raw.closesAt || '22:00'
    return { weekday: isoWeekday(date), opens, closes }
  }
  return undefined
}

/** The admin's pause switch, unless its end time has already passed. */
export function isPaused(shop: Shop, now: number): boolean {
  if (shop.isAccepting) return false
  const until = shop.pauseUntil ? Date.parse(shop.pauseUntil) : NaN
  return Number.isNaN(until) || until > now
}

export type ShopStatus = { kind: 'open' | 'closed' | 'paused'; text: string }

/** One-line status for the header: "до 22:00", "закрыто", or the pause. */
export function shopStatus(shop: Shop, now: number): ShopStatus {
  if (isPaused(shop, now)) return { kind: 'paused', text: 'заказы на паузе' }
  const date = new Date(now)
  const today = hoursOn(shop, date)
  const current = date.getHours() * 60 + date.getMinutes()
  if (today && current >= minutesOf(today.opens) && current < minutesOf(today.closes)) {
    return { kind: 'open', text: `до ${today.closes}` }
  }
  return { kind: 'closed', text: today && current < minutesOf(today.opens) ? `откроемся в ${today.opens}` : 'закрыто' }
}

/** "приготовим за 5–7 минут" from the shop's base prep time. */
export const prepRange = (shop: Shop): string => `${shop.basePrepMinutes}–${shop.basePrepMinutes + 2}`
