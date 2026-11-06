import type { RefObject } from 'react'

import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { hint, textBtn } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPhone } from '../../utils/format'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = {
  digits: string
  code: string
  error: string | null
  /** Shown while in test/dev mode or server returns direct devCode */
  devCode: string | null
  telegramUrl?: string | null
  verifying: boolean
  resendIn: number
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (code: string) => void
  onResend: () => void
}

/**
 * 2026 Liquid Glass CodeStep with Telegram Bot Integration:
 * 4 separate glass digit cells with auto-step, quick Telegram link, clipboard paste,
 * smooth shake on error, and accessible single-field keyboard entry.
 */
export function CodeStep({
  digits,
  code,
  error,
  devCode,
  telegramUrl,
  verifying,
  resendIn,
  inputRef,
  onChange,
  onResend,
}: Props) {
  const chars = code.split('')

  const handleOpenTelegram = () => {
    if (telegramUrl) {
      window.open(telegramUrl, '_blank')
    }
  }

  return (
    <div className={stepBox}>
      <h1 className={stepTitle}>Код подтверждения</h1>
      <p className={stepLead}>Отправили в Telegram на номер {formatPhone(digits)}</p>

      {/* Button to quickly open Telegram bot if link is provided */}
      {telegramUrl && (
        <Button
          type="button"
          onClick={handleOpenTelegram}
          className={cx('w-full my-1.5 flex items-center justify-center gap-2.5 bg-telegram/15 hover:bg-telegram/25 border-telegram/30 text-ink shadow-sm active:scale-98 transition-all'
          )} variant="secondary" size="md"
        >
          <svg className="size-4.5 text-telegram" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          <span className="font-bold text-compact">Получить код в Telegram</span>
        </Button>
      )}

      {/* 4 Separate Glass Digit Cells */}
      <div className={cx('relative my-2 flex justify-center gap-3', error && 'animate-[shake_0.4s_var(--ease-soft)]')}>
        <label className="sr-only" htmlFor="sms-code">
          Код из SMS
        </label>
        {/* Transparent accessible input overlaid over the 4 cells */}
        <TextField
          id="sms-code"
          aria-label="Код из SMS"
          ref={inputRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={code}
          aria-invalid={!!error}
          aria-busy={verifying}
          readOnly={verifying}
          aria-describedby="code-hint"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
        />

        {[0, 1, 2, 3].map((idx) => {
          const char = chars[idx] || ''
          const isCurrent = code.length === idx
          return (
            <div
              key={idx}
              className={cx(
                'size-14 sm:size-16 rounded-card grid place-items-center font-display text-heading font-bold text-ink  transition-all duration-200 pointer-events-none select-none',
                error
                  ? 'border-(length:--stroke-width-strong) border-danger bg-danger/5 text-danger'
                  : isCurrent
                    ? 'border-(length:--stroke-width-strong) border-accent bg-surface/95 shadow-lift ring-(length:--focus-halo-width) ring-accent/10 scale-105'
                    : char
                      ? 'border-(length:--stroke-width) border-line-strong bg-surface/90 shadow-sm'
                      : 'border-(length:--stroke-width) border-line bg-surface/60',
              )}
            >
              {char ? (
                <span className="animate-[pop_0.2s_var(--spring)]">{char}</span>
              ) : isCurrent ? (
                <span className="size-2 rounded-pill bg-accent animate-pulse" />
              ) : null}
            </div>
          )
        })}
      </div>

      <p id="code-hint" className={cx(hint(error ? 'error' : 'plain'), 'text-center')}>
        {error ?? (verifying ? 'Проверяем код…' : devCode ? `код для входа: ${devCode}` : 'Код придёт в течение минуты')}
      </p>

      <Button className={cx(textBtn(), 'self-center mt-2')} disabled={resendIn > 0} onClick={onResend}>
        {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
      </Button>
    </div>
  )
}
