import { type RefObject,useState } from 'react'

import { Button } from '../../components/Button'
import { LegalModal } from '../../components/LegalModal'
import { Checkbox,TextField } from '../../components/TextField'
import { hint } from '../../components/ui'
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
 * 2026 Liquid Glass PhoneStep with 152-FZ Legal Agreements and Telegram Auth:
 * Clean, focused single-question phone entry with warm gift card lead and legal compliance.
 */
export function PhoneStep({ digits, sending, inputRef, onChange, onSubmit }: Props) {
  const [agreed, setAgreed] = useState(true)
  const [marketingAgreed, setMarketingAgreed] = useState(false)
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)

  return (
    <>
      <form
        className={stepBox}
        onSubmit={(e) => {
          e.preventDefault()
          if (digits.length === 10 && agreed && !sending) onSubmit()
        }}
      >
        <div className="relative mx-auto size-16 sm:size-20 rounded-pill bg-accent/15 border-(length:--stroke-width) border-accent/25 grid place-items-center mb-0.5">
          <span className="text-display sm:text-display leading-none" aria-hidden="true">
            🎁
          </span>
        </div>

        <h1 className={stepTitle}>Вход по номеру</h1>
        <p className={stepLead}>Напиток в подарок за регистрацию, скидка уровня и штампы за каждый заказ.</p>

        <label className="sr-only" htmlFor="phone">
          Телефон
        </label>
        <div className="w-full">
          <TextField
            id="phone"
            ref={inputRef}
            data-autofocus
             error={false} fieldSize="xl"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 (___) ___-__-__"
            value={formatPhone(digits)}
            onChange={(e) => onChange(phoneDigits(e.target.value))}
          />
        </div>

        {/* Legal Agreements (152-FZ & Offer) */}
        <div className="space-y-2 mt-2 text-left w-full text-caption text-ink/75">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <Checkbox

              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded accent-accent text-accent focus:ring-accent/20 cursor-pointer"
            />
            <span className="leading-tight">
              Согласен с{' '}
              <Button
                type="button"
                onClick={() => setModalType('terms')}
                className="text-accent underline font-semibold hover:opacity-80 inline"
              >
                Офертой
              </Button>{' '}
              и{' '}
              <Button
                type="button"
                onClick={() => setModalType('privacy')}
                className="text-accent underline font-semibold hover:opacity-80 inline"
              >
                Политикой персданных
              </Button>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <Checkbox

              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded accent-accent text-accent focus:ring-accent/20 cursor-pointer"
            />
            <span className="leading-tight text-muted">
              Получать персональные акции, подарки и секретные промокоды
            </span>
          </label>
        </div>

        <Button
          className={cx('mt-3 w-full')} variant="primary" size="lg" fullWidth
          type="submit"
          aria-label="Получить код"
          disabled={digits.length !== 10 || !agreed || sending}
          aria-busy={sending}
        >
          {sending ? (
            'Отправляем…'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Получить код в Telegram</span>
            </span>
          )}
        </Button>

        <p className={cx(hint(), 'text-center text-micro text-muted mt-1')}>
          Бесплатная доставка проверочного кода через официального Telegram-бота
        </p>
      </form>

      <LegalModal type={modalType} onClose={() => setModalType(null)} />
    </>
  )
}
