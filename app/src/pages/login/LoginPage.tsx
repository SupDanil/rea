import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { Sheet, SheetBody } from '../../components/Sheet'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import { formatPhone } from '../../utils/format'
import { readSavedName } from '../../utils/storage'
import { CodeStep } from './CodeStep'
import { NameStep } from './NameStep'
import { PhoneStep } from './PhoneStep'
import { DEMO_CODE, RESEND_AFTER } from './steps'

type Step = 'phone' | 'code' | 'name'

/** Phone → SMS code → name (skipped when we already know it). */
export function LoginPage() {
  const { profile, signIn, showToast } = useApp()
  const { back } = useAppNavigate()
  const { pathname } = useLocation()
  const knownName = (profile?.name ?? readSavedName()).trim()

  const [step, setStep] = useState<Step>('phone')
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [name, setName] = useState(knownName)
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

  const sendCode = async () => {
    setSending(true)
    await new Promise((r) => window.setTimeout(r, 700))
    setSending(false)
    setCode('')
    setCodeError(false)
    setResendIn(RESEND_AFTER)
    setStep('code')
  }

  const finish = (finalName: string) => {
    const phone = formatPhone(digits)
    const returning = profile?.phone === phone
    signIn(phone, finalName)
    showToast({ text: returning ? `С возвращением, ${finalName}!` : `${finalName}, напиток в подарок уже ждёт 🎁` })
    // On #/profile the same route turns into the profile itself once signed in.
    if (pathname === '/login') back()
  }

  const checkCode = (value: string) => {
    setCode(value)
    if (value.length < DEMO_CODE.length) return setCodeError(false)
    if (value !== DEMO_CODE) return setCodeError(true)
    if (knownName) finish(knownName)
    else setStep('name')
  }

  const stepBack = () => (step === 'phone' ? back() : setStep(step === 'name' ? 'code' : 'phone'))

  return (
    <Sheet label="Вход" onBack={stepBack} backLabel={step === 'phone' ? 'Закрыть' : 'Назад'}>
      <SheetBody className="flex">
        {step === 'phone' && <PhoneStep digits={digits} sending={sending} inputRef={inputRef} onChange={setDigits} onSubmit={() => void sendCode()} />}
        {step === 'code' && (
          <CodeStep digits={digits} code={code} error={codeError} resendIn={resendIn} inputRef={inputRef} onChange={checkCode} onResend={() => void sendCode()} />
        )}
        {step === 'name' && <NameStep name={name} inputRef={inputRef} onChange={setName} onSubmit={() => finish(name.trim())} />}
      </SheetBody>
    </Sheet>
  )
}
