import type { RefObject } from 'react'
import { btn, field, hint } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPhone, phoneDigits } from '../../utils/format'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = {
  digits: string
  sending: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (digits: string) => void
  onSubmit: () => void
}

/**
 * 2026 Liquid Glass PhoneStep:
 * Clean, focused single-question phone entry with warm gift card lead.
 */
export function PhoneStep({ digits, sending, inputRef, onChange, onSubmit }: Props) {
  return (
    <form
      className={stepBox}
      onSubmit={(e) => {
        e.preventDefault()
        if (digits.length === 10 && !sending) onSubmit()
      }}
    >
      <div className="relative mx-auto size-20 rounded-full bg-accent/15 border border-accent/25 grid place-items-center mb-1">
        <span className="text-[36px] leading-none" aria-hidden="true">
          🎁
        </span>
      </div>

      <h1 className={stepTitle}>Вход по номеру</h1>
      <p className={stepLead}>Напиток в подарок за регистрацию, скидка уровня и штампы за каждый заказ.</p>

      <label className="sr-only" htmlFor="phone">
        Телефон
      </label>
      <input
        id="phone"
        ref={inputRef}
        className={cx(field(false, 'xl'), 'tracking-wider')}
        inputMode="tel"
        autoComplete="tel"
        value={formatPhone(digits)}
        onChange={(e) => onChange(phoneDigits(e.target.value))}
      />

      <button className={cx(btn('primary', 'lg'), 'mt-1')} type="submit" disabled={digits.length !== 10 || sending} aria-busy={sending}>
        {sending ? 'Отправляем…' : 'Получить код'}
      </button>

      <p className={cx(hint(), 'text-center')}>Продолжая, вы соглашаетесь с условиями программы лояльности</p>
    </form>
  )
}
