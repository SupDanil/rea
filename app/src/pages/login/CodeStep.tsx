import type { RefObject } from 'react'
import { field, hint, textBtn } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPhone } from '../../utils/format'
import { DEMO_CODE, stepBox, stepLead, stepTitle } from './steps'

type Props = {
  digits: string
  code: string
  error: boolean
  resendIn: number
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (code: string) => void
  onResend: () => void
}

export function CodeStep({ digits, code, error, resendIn, inputRef, onChange, onResend }: Props) {
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
        className={field(error, 'code')}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        value={code}
        aria-invalid={error}
        aria-describedby="code-hint"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      />
      <p id="code-hint" className={cx(hint(error ? 'error' : 'plain'), 'text-center')}>
        {error ? 'Неверный код — проверьте ещё раз' : `Демо-режим: SMS не отправляется, код ${DEMO_CODE}`}
      </p>
      <button className={cx(textBtn(), 'self-center')} disabled={resendIn > 0} onClick={onResend}>
        {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
      </button>
    </div>
  )
}
