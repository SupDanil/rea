import { describe, expect, it } from 'vitest'

import { hoursOn, isPaused, prepRange, type Shop,shopStatus } from './shop'

const shop: Shop = {
  id: 's',
  name: 'shit кофе',
  address: 'Невский, 12',
  phone: '',
  isAccepting: true,
  basePrepMinutes: 5,
  hours: [
    { weekday: 6, opens: '09:00', closes: '23:00' }, // Saturday
    { weekday: 7, opens: '10:00', closes: '20:00' }, // Sunday
  ],
}

// 2026-10-31 is a Saturday, 2026-11-01 a Sunday (local time).
const at = (iso: string) => new Date(iso).getTime()

describe('domain/shop', () => {
  it('finds today’s hours with ISO weekdays (Sunday = 7)', () => {
    expect(hoursOn(shop, new Date('2026-10-31T12:00:00'))?.closes).toBe('23:00')
    expect(hoursOn(shop, new Date('2026-11-01T12:00:00'))?.closes).toBe('20:00')
    expect(hoursOn(shop, new Date('2026-11-02T12:00:00'))).toBeUndefined()
  })

  it('reports open until closing time', () => {
    expect(shopStatus(shop, at('2026-10-31T12:00:00'))).toEqual({ kind: 'open', text: 'до 23:00' })
  })

  it('reports when it opens before opening time, and closed after', () => {
    expect(shopStatus(shop, at('2026-11-01T08:30:00'))).toEqual({ kind: 'closed', text: 'откроемся в 10:00' })
    expect(shopStatus(shop, at('2026-11-01T21:00:00'))).toEqual({ kind: 'closed', text: 'закрыто' })
    expect(shopStatus(shop, at('2026-11-02T12:00:00'))).toEqual({ kind: 'closed', text: 'закрыто' })
  })

  it('marks day as closed if isClosed flag is set', () => {
    const shopWithDayOff: Shop = {
      ...shop,
      hours: [{ weekday: 6, opens: '09:00', closes: '23:00', isClosed: true }],
    }
    expect(shopStatus(shopWithDayOff, at('2026-10-31T12:00:00'))).toEqual({ kind: 'closed', text: 'закрыто' })
  })

  it('evaluates status accurately in a specific timezone', () => {
    const mskShop: Shop = {
      ...shop,
      timezone: 'Europe/Moscow',
      hours: [{ weekday: 7, opens: '09:00', closes: '21:00' }], // Sunday 09:00-21:00 MSK
    }
    // 2026-11-08 05:00 UTC = 08:00 MSK (before opening)
    expect(shopStatus(mskShop, Date.parse('2026-11-08T05:00:00Z'))).toEqual({ kind: 'closed', text: 'откроемся в 09:00' })
    // 2026-11-08 12:00 UTC = 15:00 MSK (open)
    expect(shopStatus(mskShop, Date.parse('2026-11-08T12:00:00Z'))).toEqual({ kind: 'open', text: 'до 21:00' })
    // 2026-11-08 19:00 UTC = 22:00 MSK (closed)
    expect(shopStatus(mskShop, Date.parse('2026-11-08T19:00:00Z'))).toEqual({ kind: 'closed', text: 'закрыто' })
  })

  it('a pause wins over opening hours until it expires', () => {
    const paused = { ...shop, isAccepting: false, pauseUntil: '2026-10-31T13:00:00' }
    expect(isPaused(paused, at('2026-10-31T12:00:00'))).toBe(true)
    expect(shopStatus(paused, at('2026-10-31T12:00:00')).kind).toBe('paused')
    expect(isPaused(paused, at('2026-10-31T14:00:00'))).toBe(false)
    expect(isPaused({ ...shop, isAccepting: false }, at('2026-10-31T14:00:00'))).toBe(true)
  })

  it('prep range comes from the shop’s base prep time', () => {
    expect(prepRange(shop)).toBe('5–7')
    expect(prepRange({ ...shop, basePrepMinutes: 9 })).toBe('9–11')
  })
})
