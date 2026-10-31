import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatAmount,
  clockTime,
  dateTime,
  plural,
  formatPhone,
  phoneDigits,
  isEmail,
} from './format'

describe('Utils: format', () => {
  it('formatPrice formats rubles with symbol', () => {
    expect(formatPrice(250)).toMatch(/250\s*₽/)
    expect(formatPrice(1200)).toMatch(/1.*200\s*₽/)
  })

  it('formatAmount formats positive numbers with up to 1 fraction digit and clamps negative', () => {
    expect(formatAmount(12.34)).toBe('12,3')
    expect(formatAmount(-5)).toBe('0')
  })

  it('clockTime returns hours and minutes in ru-RU format', () => {
    // 2026-10-31 14:35:00 UTC
    const ts = new Date('2026-10-31T14:35:00Z').getTime()
    const str = clockTime(ts)
    expect(str).toMatch(/\d{2}:\d{2}/)
  })

  it('dateTime formats day, month and time', () => {
    const ts = new Date('2026-10-31T14:35:00Z').getTime()
    const str = dateTime(ts)
    expect(str.length).toBeGreaterThan(5)
  })

  it('plural selects proper Russian declension', () => {
    expect(plural(1, 'заказ', 'заказа', 'заказов')).toBe('заказ')
    expect(plural(2, 'заказ', 'заказа', 'заказов')).toBe('заказа')
    expect(plural(4, 'заказ', 'заказа', 'заказов')).toBe('заказа')
    expect(plural(5, 'заказ', 'заказа', 'заказов')).toBe('заказов')
    expect(plural(11, 'заказ', 'заказа', 'заказов')).toBe('заказов')
    expect(plural(21, 'заказ', 'заказа', 'заказов')).toBe('заказ')
  })

  it('formatPhone formats digits with mask', () => {
    expect(formatPhone('9991234567')).toBe('+7 999 123-45-67')
    expect(formatPhone('89991234567')).toBe('+7 999 123-45-67')
    expect(formatPhone('+7 999 123-45-67')).toBe('+7 999 123-45-67')
  })

  it('phoneDigits strips non-digits and leading 7/8', () => {
    expect(phoneDigits('+7 (999) 123-45-67')).toBe('9991234567')
    expect(phoneDigits('8 (999) 123-45-67')).toBe('9991234567')
  })

  it('isEmail validates email addresses', () => {
    expect(isEmail('user@mail.ru')).toBe(true)
    expect(isEmail('hello@domain.com')).toBe(true)
    expect(isEmail('not-an-email')).toBe(false)
    expect(isEmail('user@')).toBe(false)
  })
})
