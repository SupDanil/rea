export const formatPrice = (rub: number) => `${rub.toLocaleString('ru-RU')} ₽`

/** Up to one decimal, never negative: nutrition values after removing add-ons. */
export const formatAmount = (v: number) => Math.max(0, v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })

export const clockTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
export const dateTime = (ts: number) =>
  new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Russian plural: plural(3, 'заказ', 'заказа', 'заказов') → 'заказа'. */
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

/** "+7 999 123-45-67" from any digits the user typed. */
export function formatPhone(digits: string) {
  const d = phoneDigits(digits)
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)]
  let out = '+7'
  if (parts[0]) out += ` ${parts[0]}`
  if (parts[1]) out += ` ${parts[1]}`
  if (parts[2]) out += `-${parts[2]}`
  if (parts[3]) out += `-${parts[3]}`
  return out
}
export const phoneDigits = (value: string) => value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
