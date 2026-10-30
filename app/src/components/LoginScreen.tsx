import { useEffect, useRef, useState } from 'react'
import { formatPhone, phoneDigits } from '../loyalty'

type Props = {
  initialName: string
  onDone: (phone: string, name: string) => void
  onClose: () => void
}

// No SMS provider in the demo: the code is fixed and shown on screen.
const DEMO_CODE = '1234'
const RESEND_AFTER = 30

type Step = 'phone' | 'code' | 'name'

export function LoginScreen({ initialName, onDone, onClose }: Props) {
  const [step, setStep] = useState<Step>('phone')
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [name, setName] = useState(initialName)
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendIn])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sendCode = async () => {
    setSending(true)
    await new Promise((r) => window.setTimeout(r, 700))
    setSending(false)
    setCode('')
    setCodeError(false)
    setResendIn(RESEND_AFTER)
    setStep('code')
  }

  const checkCode = (value: string) => {
    setCode(value)
    if (value.length < DEMO_CODE.length) return setCodeError(false)
    if (value !== DEMO_CODE) return setCodeError(true)
    if (initialName.trim()) onDone(formatPhone(digits), initialName.trim())
    else setStep('name')
  }

  return (
    <div className="sheet login" role="dialog" aria-modal="true" aria-label="Вход">
      <header className="sheet-head">
        <button
          className="icon-btn icon-btn-left"
          onClick={() => (step === 'phone' ? onClose() : setStep(step === 'name' ? 'code' : 'phone'))}
          aria-label={step === 'phone' ? 'Закрыть' : 'Назад'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <div className="sheet-body login-body">
        {step === 'phone' && (
          <form
            className="login-step"
            onSubmit={(e) => {
              e.preventDefault()
              if (digits.length === 10 && !sending) void sendCode()
            }}
          >
            <div className="login-gift" aria-hidden="true">🎁</div>
            <h1>Вход по номеру</h1>
            <p className="login-lead">Напиток в подарок за регистрацию, скидка уровня и штампы за каждый заказ.</p>
            <label className="sr-only" htmlFor="phone">
              Телефон
            </label>
            <input
              id="phone"
              ref={inputRef}
              className="field field-xl"
              inputMode="tel"
              autoComplete="tel"
              value={formatPhone(digits)}
              onChange={(e) => setDigits(phoneDigits(e.target.value))}
            />
            <button className="primary-btn wide" type="submit" disabled={digits.length !== 10 || sending} aria-busy={sending}>
              {sending ? 'Отправляем…' : 'Получить код'}
            </button>
            <p className="hint center">Продолжая, вы соглашаетесь с условиями программы лояльности</p>
          </form>
        )}

        {step === 'code' && (
          <div className="login-step">
            <h1>Код из SMS</h1>
            <p className="login-lead">Отправили на {formatPhone(digits)}</p>
            <label className="sr-only" htmlFor="sms-code">
              Код из SMS
            </label>
            <input
              id="sms-code"
              ref={inputRef}
              className={`field field-xl field-code${codeError ? ' has-error' : ''}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={code}
              aria-invalid={codeError}
              aria-describedby="code-hint"
              onChange={(e) => checkCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <p id="code-hint" className={`hint center${codeError ? ' is-error' : ''}`}>
              {codeError ? 'Неверный код — проверьте ещё раз' : `Демо-режим: SMS не отправляется, код ${DEMO_CODE}`}
            </p>
            <button className="text-btn center-btn" disabled={resendIn > 0} onClick={() => void sendCode()}>
              {resendIn > 0 ? `Отправить снова через ${resendIn} с` : 'Отправить код ещё раз'}
            </button>
          </div>
        )}

        {step === 'name' && (
          <form
            className="login-step"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) onDone(formatPhone(digits), name.trim())
            }}
          >
            <h1>Как вас зовут?</h1>
            <p className="login-lead">Бариста назовёт это имя, когда заказ будет готов</p>
            <label className="sr-only" htmlFor="profile-name">
              Имя
            </label>
            <input
              id="profile-name"
              ref={inputRef}
              className="field field-xl"
              autoComplete="given-name"
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="primary-btn wide" type="submit" disabled={!name.trim()}>
              Готово
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
