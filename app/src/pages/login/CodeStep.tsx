import { useForm } from '@tanstack/react-form'
import type { RefObject } from 'react'

import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { hint, textBtn } from '../../components/ui'
import { CODE_LENGTH, codeSchema } from '../../forms/schemas'
import { cx } from '../../utils/cx'
import { formatPhone } from '../../utils/format'
import { stepBox, stepLead, stepTitle } from './steps'

type Props = {
  digits: string
  /** The server's verdict on the last submitted code. */
  error: string | null
  /** Shown while in test/dev mode or server returns direct devCode */
  devCode: string | null
  verifying: boolean
  resendIn: number
  inputRef: RefObject<HTMLInputElement | null>
  /** The guest edited the code: the previous verdict no longer applies. */
  onEdit: () => void
  /** All digits are in — verify them. */
  onComplete: (code: string) => void
  onResend: () => void
}

/**
 * 2026 Liquid Glass CodeStep:
 * 4 separate glass digit cells with auto-step, clipboard paste,
 * smooth shake on error, and accessible single-field keyboard entry.
 */
export function CodeStep({
  digits,
  error,
  devCode,
  verifying,
  resendIn,
  inputRef,
  onEdit,
  onComplete,
  onResend,
}: Props) {
  const form = useForm({
    defaultValues: { code: '' },
    validators: { onSubmit: codeSchema },
    onSubmit: ({ value }) => onComplete(value.code),
  })

  return (
    <form.Field name="code">
      {(field) => {
        const code = field.state.value
        const chars = code.split('')
        return (
    <div className={stepBox}>
      <h1 className={stepTitle}>Код подтверждения</h1>
      <p className={stepLead}>Введите проверочный код для {formatPhone(digits)}</p>

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
          maxLength={CODE_LENGTH}
          value={code}
          aria-invalid={!!error}
          aria-busy={verifying}
          readOnly={verifying}
          aria-describedby="code-hint"
          onBlur={field.handleBlur}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
            field.handleChange(next)
            onEdit()
            // The last digit submits the step: there is no separate «confirm» button.
            if (next.length === CODE_LENGTH) void form.handleSubmit()
          }}
          className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
        />

        {[0, 1, 2, 3].map((idx) => {
          const char = chars[idx] || ''
          const isCurrent = code.length === idx
          return (
            <div
              key={idx}
              className={cx(
                'size-14 sm:size-16 rounded-card grid place-items-center font-display text-heading font-bold text-ink transition-all duration-200 pointer-events-none select-none',
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
      }}
    </form.Field>
  )
}
