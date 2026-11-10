import { z } from 'zod'

import { normalizePromo } from '../domain/cart'
import type { PaymentMethod, Pickup } from '../domain/orders'
import { isEmail } from '../utils/format'

/**
 * Every form of the app is a TanStack Form validated by one of these zod
 * schemas (see INSTRUCTIONS.md, «Формы»). Keep rules here, not in components.
 */

export const NAME_MAX = 20
export const PHONE_DIGITS = 10
export const CODE_LENGTH = 4

/** The name a barista calls out. */
export const guestName = z
  .string()
  .trim()
  .min(1, 'Напишите имя — так бариста позовёт вас')
  .max(NAME_MAX, `Не длиннее ${NAME_MAX} символов`)

/** National part of a Russian mobile number: exactly ten digits, no +7. */
export const phoneDigitsField = z.string().regex(/^\d{10}$/, 'Введите 10 цифр номера')

export const smsCode = z.string().regex(/^\d{4}$/, 'Введите 4 цифры кода')

/** E-mail that may be left empty. */
export const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || isEmail(v), 'Проверьте e-mail')

/** Sign-in by phone; inside Telegram the phone is optional. */
export const loginPhoneSchema = (phoneOptional: boolean) =>
  z.object({
    digits: phoneOptional ? z.union([z.literal(''), phoneDigitsField]) : phoneDigitsField,
    agreed: z.literal(true, { error: 'Примите оферту и политику персональных данных' }),
    marketingAgreed: z.boolean(),
  })

export type LoginPhoneValues = { digits: string; agreed: boolean; marketingAgreed: boolean }

export const codeSchema = z.object({ code: smsCode })
export const nameSchema = z.object({ name: guestName })
export const phoneSchema = z.object({ digits: phoneDigitsField })

export const promoSchema = z.object({
  code: z
    .string()
    .refine((v) => normalizePromo(v).length > 0, 'Введите промокод'),
})

export const profileSchema = z.object({ name: guestName, email: optionalEmail })

export const checkoutSchema = z.object({
  name: guestName,
  pickup: z.custom<Pickup>((v) => typeof v === 'object' && v !== null && 'kind' in v),
  payment: z.custom<PaymentMethod>((v) => typeof v === 'string' && v.length > 0),
  useGift: z.boolean(),
})

export type CheckoutValues = z.input<typeof checkoutSchema>

/** First validation message of a field; zod issues arrive as `{ message }` objects. */
export function fieldError(errors: readonly unknown[]): string | null {
  for (const err of errors) {
    if (!err) continue
    if (typeof err === 'string') return err
    if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') return err.message
  }
  return null
}
