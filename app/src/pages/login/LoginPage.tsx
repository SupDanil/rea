import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import { api, ApiError } from '../../api'
import { Sheet, SheetBody } from '../../components/Sheet'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import type { Profile } from '../../state/loyalty'
import { readSavedName } from '../../utils/storage'
import { getTelegramInitData, getTelegramUser, isTelegramWebApp } from '../../utils/telegram'
import { CodeStep } from './CodeStep'
import { NameStep } from './NameStep'
import { PhoneStep } from './PhoneStep'
import { RESEND_AFTER } from './steps'

type Step = 'phone' | 'code' | 'name'

/** Phone → SMS code (checked by the server) → name (skipped when we already know it). */
export function LoginPage() {
  const { profile, signIn, updateProfile, showToast } = useApp()
  const { back } = useAppNavigate()
  const { pathname } = useLocation()
  const knownName = (profile?.name ?? readSavedName()).trim()

  const [step, setStep] = useState<Step>('phone')
  // Flow state, not input state: each step keeps its own form (TanStack Form + zod).
  // `digits` is the number the last code was sent to.
  const [digits, setDigits] = useState('')
  const [codeAttempt, setCodeAttempt] = useState(0)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [tgAutoLogin] = useState(() => isTelegramWebApp() && Boolean(getTelegramInitData()))
  const [sending, setSending] = useState(tgAutoLogin)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState<Profile | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Each next step takes the keyboard straight away; the first one leaves it to the Modal,
  // which waits until the sheet has finished rising.
  const focusedStep = useRef(step)
  useEffect(() => {
    if (focusedStep.current === step) return
    focusedStep.current = step
    inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendIn])

  const done = (signedIn: Profile, finalName: string, returning: boolean) => {
    signIn(signedIn)
    showToast({ text: returning ? `С возвращением, ${finalName}!` : `${finalName}, напиток в подарок уже ждёт 🎁` })
    // On #/profile the same route turns into the profile itself once signed in.
    if (pathname === '/login') back()
  }

  // Inside Telegram a guest whose account is already linked is signed in without any form.
  const onAutoLogin = useEffectEvent(done)
  useEffect(() => {
    if (!tgAutoLogin) return
    api
      .telegramWebAppAuth(getTelegramInitData())
      .then((res) => {
        if (res.profile) onAutoLogin(res.profile, res.profile.name, !res.isNew)
      })
      .catch(() => {})
      .finally(() => setSending(false))
  }, [tgAutoLogin])

  const sendCode = async (toDigits: string) => {
    const phone = `+7${toDigits}`
    setDigits(toDigits)
    setSending(true)
    if (isTelegramWebApp()) {
      try {
        const initData = getTelegramInitData()
        const tgUser = getTelegramUser()
        const tgName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || knownName
        const tgPhone = toDigits.length === 10 ? phone : undefined
        const res = await api.telegramWebAppAuth(initData, tgPhone, tgName || undefined)
        if (res.profile) {
          done(res.profile, res.profile.name, !res.isNew)
          return
        }
      } catch (err: any) {
        showToast({ text: err.message || 'Ошибка входа через Telegram' })
      } finally {
        setSending(false)
      }
      return
    }

    try {
      const res = await api.sendSmsCode(phone)
      setDevCode(res.devCode ?? null)
      // A fresh code starts the code step from an empty form.
      setCodeAttempt((n) => n + 1)
      setCodeError(null)
      setResendIn(RESEND_AFTER)
      setStep('code')
    } catch {
      showToast({ text: 'Не удалось отправить код — попробуйте ещё раз' })
    } finally {
      setSending(false)
    }
  }

  const checkCode = async (value: string) => {
    if (verifying) return
    setVerifying(true)
    try {
      // The local name only seeds a brand-new customer; a returning guest keeps their CRM name.
      const res = await api.verifySmsCode(`+7${digits}`, value, knownName || undefined)
      const serverName = res.profile.name && res.profile.name !== 'Гость' ? res.profile.name : ''
      if (serverName) done(res.profile, serverName, !res.isNew)
      else {
        setVerified(res.profile)
        setStep('name')
      }
    } catch (err) {
      setCodeError(err instanceof ApiError ? err.message : 'Нет связи — попробуйте ещё раз')
    } finally {
      setVerifying(false)
    }
  }

  const finishWithName = async (finalName: string) => {
    if (!verified || !finalName) return
    signIn(verified)
    try {
      const updated = await updateProfile({ name: finalName })
      done(updated, finalName, false)
    } catch {
      done(verified, finalName, false)
    }
  }

  const stepBack = () => (step === 'phone' ? back() : setStep(step === 'name' ? 'code' : 'phone'))

  return (
    <Sheet label="Вход" onBack={stepBack} backLabel={step === 'phone' ? 'Закрыть' : 'Назад'}>
      <SheetBody className="flex flex-col">
        {step === 'phone' && <PhoneStep defaultDigits={digits} sending={sending} inputRef={inputRef} onSubmit={(value) => void sendCode(value)} />}
        {step === 'code' && (
          <CodeStep
            key={codeAttempt}
            digits={digits}
            error={codeError}
            devCode={devCode}
            verifying={verifying}
            resendIn={resendIn}
            inputRef={inputRef}
            onEdit={() => setCodeError(null)}
            onComplete={(value) => void checkCode(value)}
            onResend={() => void sendCode(digits)}
          />
        )}
        {step === 'name' && <NameStep defaultName={knownName} inputRef={inputRef} onSubmit={(value) => void finishWithName(value)} />}
      </SheetBody>
    </Sheet>
  )
}
