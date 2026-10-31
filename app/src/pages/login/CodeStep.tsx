import type { RefObject } from 'react'
import { field, hint, textBtn } from '../../components/ui'
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

export function CodeStep({ digits, code, error, devCode, verifying, resendIn, inputRef, onChange, onResend }: Props) {
  return (
    <div className={stepBox}>
      <h1 className={stepTitle}>Код из SMS</h1>
      <p className={stepLead}>Отправили на {formatPhone(digits)}</p>
      <label className="sr-only" htmlFor="sms-code">
        Код из SMS
      </label>
      <input
        id="sms-code"
        ref={inputRef}
        className={field(!!error, 'code')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        value={code}
        aria-invalid={!!error}
        aria-busy={verifying}
        readOnly={verifying}
        aria-describedby="code-hint"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      />
      <p id="code-hint" className={cx(hint(error ? 'error' : 'plain'), 'text-center')}>
        {error ?? (verifying ? 'Проверяем код…' : devCode ? `SMS-шлюз не подключён — код для входа: ${devCode}` : 'Код придёт в течение минуты')}
      </p>
      <button className={cx(textBtn(), 'self-center')} disabled={resendIn > 0} onClick={onResend}>
        {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
      </button>
    </div>
  )
}
