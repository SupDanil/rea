import type { RefObject } from 'react'
import { hint, textBtn } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPhone } from '../../utils/format'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = {
  digits: string
  code: string
  error: string | null
  /** Shown while no SMS provider is connected and the server hands the code back */
  devCode: string | null
  verifying: boolean
  resendIn: number
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (code: string) => void
  onResend: () => void
}

/**
 * 2026 Liquid Glass CodeStep:
 * 4 separate glass digit cells with auto-step, clipboard paste, smooth shake on error,
 * and accessible single-field keyboard entry.
 */
export function CodeStep({ digits, code, error, devCode, verifying, resendIn, inputRef, onChange, onResend }: Props) {
  const chars = code.split('')

  return (
    <div className={stepBox}>
      <h1 className={stepTitle}>Код из SMS</h1>
      <p className={stepLead}>Отправили на {formatPhone(digits)}</p>

      {/* 4 Separate Glass Digit Cells */}
      <div className={cx('relative my-2 flex justify-center gap-3', error && 'animate-[shake_0.4s_var(--ease-soft)]')}>
        <label className="sr-only" htmlFor="sms-code">
          Код из SMS
        </label>
        {/* Transparent accessible input overlaid over the 4 cells */}
        <input
          id="sms-code"
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
                'size-14 sm:size-16 rounded-[20px] grid place-items-center font-display text-[26px] font-bold text-ink backdrop-blur-xl transition-all duration-200 pointer-events-none select-none',
                error
                  ? 'border-2 border-danger bg-danger/5 text-danger'
                  : isCurrent
                    ? 'border-2 border-accent bg-surface/95 shadow-lift ring-4 ring-accent/10 scale-105'
                    : char
                      ? 'border border-line-strong bg-surface/90 shadow-sm'
                      : 'border border-line bg-surface/60',
              )}
            >
              {char ? (
                <span className="animate-[pop_0.2s_var(--spring)]">{char}</span>
              ) : isCurrent ? (
                <span className="size-2 rounded-full bg-accent animate-pulse" />
              ) : null}
            </div>
          )
        })}
      </div>

      <p id="code-hint" className={cx(hint(error ? 'error' : 'plain'), 'text-center')}>
        {error ?? (verifying ? 'Проверяем код…' : devCode ? `SMS-шлюз не подключён — код для входа: ${devCode}` : 'Код придёт в течение минуты')}
      </p>

      <button className={cx(textBtn(), 'self-center mt-2')} disabled={resendIn > 0} onClick={onResend}>
        {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
      </button>
    </div>
  )
}
