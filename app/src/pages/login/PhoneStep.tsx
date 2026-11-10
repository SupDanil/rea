import { useForm } from '@tanstack/react-form'
import { type RefObject,useState } from 'react'

import { Button } from '../../components/Button'
import { LegalModal } from '../../components/LegalModal'
import { Checkbox,TextField } from '../../components/TextField'
import { hint } from '../../components/ui'
import { loginPhoneSchema, type LoginPhoneValues } from '../../forms/schemas'
import { cx } from '../../utils/cx'
import { phoneDigits, phoneInputValue } from '../../utils/format'
import { getTelegramUser, isTelegramWebApp } from '../../utils/telegram'
import { stepBox, stepTitle } from './steps'

type Props = {
  /** Number typed earlier in this flow (the guest came back from the code step). */
  defaultDigits: string
  sending: boolean
  inputRef: RefObject<HTMLInputElement | null>
  /** Receives the ten digits; an empty string inside Telegram when the phone was skipped. */
  onSubmit: (digits: string) => void
}

/**
 * 2026 Liquid Glass PhoneStep with 152-FZ Legal Agreements and Telegram Auth:
 * Clean, focused single-question phone entry with warm gift card lead and legal compliance.
 */
export function PhoneStep({ defaultDigits, sending, inputRef, onSubmit }: Props) {
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const isTg = isTelegramWebApp()
  const tgUser = getTelegramUser()

  const displayName = tgUser?.first_name
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : tgUser?.username
      ? `@${tgUser.username}`
      : 'Telegram'

  const schema = loginPhoneSchema(isTg)
  const defaultValues: LoginPhoneValues = { digits: defaultDigits, agreed: true, marketingAgreed: false }
  const form = useForm({
    defaultValues,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value.digits),
  })

  const phoneField = (
    <form.Field name="digits">
      {(field) => (
        <TextField
          id="phone"
          ref={inputRef}
          data-autofocus
          error={field.state.meta.errors.length > 0}
          fieldSize="xl"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          value={phoneInputValue(field.state.value)}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(phoneDigits(e.target.value))}
        />
      )}
    </form.Field>
  )

  return (
    <>
      <form
        className={stepBox}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!sending) void form.handleSubmit()
        }}
      >
        <h1 className={stepTitle}>{isTg ? 'Вход через Telegram' : 'Вход по номеру'}</h1>

        {isTg ? (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
              <span className="text-2xl">✈️</span>
              <div className="text-left min-w-0">
                <div className="text-sm font-bold truncate text-ink">{displayName}</div>
                <div className="text-xs text-accent font-mono">
                  {tgUser?.username ? `@${tgUser.username}` : `ID: ${tgUser?.id}`}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted text-left">
              Быстрый вход в 1 клик. Все бонусы и история заказов будут привязаны к вашему Telegram.
            </p>

            {showPhoneInput ? (
              <div className="w-full pt-1">
                <label className="block text-left text-xs text-muted mb-1 font-medium" htmlFor="phone">
                  Номер телефона (необязательно)
                </label>
                {phoneField}
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPhoneInput(true)}
                className="text-xs text-accent underline hover:opacity-80 block text-left pt-1 !p-0 !min-h-0"
              >
                + Указать номер телефона (необязательно)
              </Button>
            )}
          </div>
        ) : (
          <>
            <label className="sr-only" htmlFor="phone">
              Телефон
            </label>
            <div className="w-full">
              {phoneField}
            </div>
          </>
        )}

        {/* Legal Agreements (152-FZ & Offer) */}
        <div className="space-y-2 mt-2 text-left w-full text-caption text-ink/75">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <form.Field name="agreed">
              {(field) => (
                <Checkbox
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded accent-accent text-accent focus:ring-accent/20 cursor-pointer"
                />
              )}
            </form.Field>
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
            <form.Field name="marketingAgreed">
              {(field) => (
                <Checkbox
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded accent-accent text-accent focus:ring-accent/20 cursor-pointer"
                />
              )}
            </form.Field>
            <span className="leading-tight text-muted">
              Получать персональные акции, подарки и секретные промокоды
            </span>
          </label>
        </div>

        <form.Subscribe selector={(state) => schema.safeParse(state.values).success}>
          {(isValid) => (
            <Button
              className={cx('mt-3 w-full')}
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              aria-label={isTg ? `Войти как ${displayName}` : 'Получить код'}
              disabled={!isValid || sending}
              aria-busy={sending}
            >
              {sending ? 'Входим…' : isTg ? `Войти как ${displayName}` : 'Получить код'}
            </Button>
          )}
        </form.Subscribe>

        {!isTg && (
          <p className={cx(hint(), 'text-center text-micro text-muted mt-1')}>
            Для входа используйте проверочный код 1234
          </p>
        )}
      </form>

      <LegalModal type={modalType} onClose={() => setModalType(null)} />
    </>
  )
}
