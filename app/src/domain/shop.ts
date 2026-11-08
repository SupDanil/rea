/** Opening hours for one weekday, 1 = Monday … 7 = Sunday (as GET /api/v1/shops returns them). */
export type ShopHours = {
  weekday: number
  opens: string
  closes: string
  isClosed?: boolean
}

export type Shop = {
  id: string
  name: string
  address: string
  phone: string
  timezone?: string
  isAccepting: boolean
  pauseReason?: string
  pauseUntil?: string
  basePrepMinutes: number
  hours: ShopHours[]
}

const isoWeekday = (date: Date) => date.getDay() || 7
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function getShopTimeParts(shop: Shop, date: Date) {
  if (shop.timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: shop.timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
      const parts = formatter.formatToParts(date)
      const weekdayMap: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
      }
      const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon'
      const weekday = weekdayMap[weekdayStr] ?? isoWeekday(date)
      const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
      const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
      return { weekday, minutes: hour * 60 + minute }
    } catch {
      // Fallback below
    }
  }
  return {
    weekday: isoWeekday(date),
    minutes: date.getHours() * 60 + date.getMinutes(),
  }
}

export const hoursOn = (shop: Shop, date: Date): ShopHours | undefined => {
  const { weekday } = getShopTimeParts(shop, date)
  if (Array.isArray(shop.hours)) {
    return shop.hours.find((h) => h.weekday === weekday)
  }
  if (shop.hours && typeof shop.hours === 'object') {
    const raw = shop.hours as any
    const opens = raw.opens || raw.opensAt || '08:00'
    const closes = raw.closes || raw.closesAt || '22:00'
    const isClosed = Boolean(raw.isClosed)
    return { weekday, opens, closes, isClosed }
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
  if (!today || today.isClosed) {
    return { kind: 'closed', text: 'закрыто' }
  }
  const { minutes: current } = getShopTimeParts(shop, date)
  const opensMin = minutesOf(today.opens)
  const closesMin = minutesOf(today.closes)
  if (opensMin === closesMin && opensMin === 0) {
    return { kind: 'closed', text: 'закрыто' }
  }
  if (current >= opensMin && current < closesMin) {
    return { kind: 'open', text: `до ${today.closes}` }
  }
  return { kind: 'closed', text: current < opensMin ? `откроемся в ${today.opens}` : 'закрыто' }
}

/** "приготовим за 5–7 минут" from the shop's base prep time. */
export const prepRange = (shop: Shop): string => `${shop.basePrepMinutes}–${shop.basePrepMinutes + 2}`
