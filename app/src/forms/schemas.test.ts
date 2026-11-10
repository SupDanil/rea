import { describe, expect, it } from 'vitest'

import {
  checkoutSchema,
  codeSchema,
  fieldError,
  guestName,
  loginPhoneSchema,
  nameSchema,
  optionalEmail,
  phoneSchema,
  profileSchema,
  promoSchema,
} from './schemas'

describe('form schemas', () => {
  it('guest name is trimmed, required and at most 20 characters', () => {
    expect(guestName.parse('  Аня  ')).toBe('Аня')
    expect(guestName.safeParse('   ').success).toBe(false)
    expect(guestName.safeParse('я'.repeat(21)).success).toBe(false)
    expect(nameSchema.safeParse({ name: '' }).error?.issues[0].message).toBe('Напишите имя — так бариста позовёт вас')
  })

  it('phone is exactly ten digits', () => {
    expect(phoneSchema.safeParse({ digits: '9991234567' }).success).toBe(true)
    expect(phoneSchema.safeParse({ digits: '999123456' }).success).toBe(false)
    expect(phoneSchema.safeParse({ digits: '999123456a' }).success).toBe(false)
  })

  it('sms code is four digits', () => {
    expect(codeSchema.safeParse({ code: '1234' }).success).toBe(true)
    expect(codeSchema.safeParse({ code: '123' }).success).toBe(false)
  })

  it('e-mail may be empty but not malformed', () => {
    expect(optionalEmail.parse('')).toBe('')
    expect(optionalEmail.parse(' a@b.ru ')).toBe('a@b.ru')
    expect(optionalEmail.safeParse('a@b').success).toBe(false)
    expect(profileSchema.safeParse({ name: 'Аня', email: 'нет' }).success).toBe(false)
  })

  it('login by phone needs the number and the agreement', () => {
    const schema = loginPhoneSchema(false)
    expect(schema.safeParse({ digits: '9991234567', agreed: true, marketingAgreed: false }).success).toBe(true)
    expect(schema.safeParse({ digits: '', agreed: true, marketingAgreed: false }).success).toBe(false)
    expect(schema.safeParse({ digits: '9991234567', agreed: false, marketingAgreed: true }).success).toBe(false)
  })

  it('inside Telegram the phone is optional but must be complete when typed', () => {
    const schema = loginPhoneSchema(true)
    expect(schema.safeParse({ digits: '', agreed: true, marketingAgreed: false }).success).toBe(true)
    expect(schema.safeParse({ digits: '99912', agreed: true, marketingAgreed: false }).success).toBe(false)
    expect(schema.safeParse({ digits: '', agreed: false, marketingAgreed: false }).success).toBe(false)
  })

  it('promo code must contain something besides spaces', () => {
    expect(promoSchema.safeParse({ code: 'зерно10' }).success).toBe(true)
    expect(promoSchema.safeParse({ code: '   ' }).success).toBe(false)
  })

  it('checkout needs a name; pickup and payment are passed through', () => {
    const ok = checkoutSchema.parse({ name: ' Аня ', pickup: { kind: 'in', minutes: 15 }, payment: 'cash', useGift: false })
    expect(ok).toEqual({ name: 'Аня', pickup: { kind: 'in', minutes: 15 }, payment: 'cash', useGift: false })
    expect(checkoutSchema.safeParse({ name: '', pickup: { kind: 'asap' }, payment: 'card', useGift: true }).success).toBe(false)
  })

  it('fieldError reads the first message from zod issues or plain strings', () => {
    expect(fieldError([])).toBeNull()
    expect(fieldError([undefined, { message: 'Проверьте e-mail' }])).toBe('Проверьте e-mail')
    expect(fieldError(['строка'])).toBe('строка')
  })
})
