import { useEffect, useRef, useState } from 'react'
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

const CODE_LENGTH = 4

/** Phone → SMS code (checked by the server) → name (skipped when we already know it). */
export function LoginPage() {
  const { profile, signIn, updateProfile, showToast } = useApp()
  const { back } = useAppNavigate()
  const { pathname } = useLocation()
  const knownName = (profile?.name ?? readSavedName()).trim()

  const [step, setStep] = useState<Step>('phone')
  const [digits, setDigits] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [name, setName] = useState(knownName)
  const [resendIn, setResendIn] = useState(0)
  const [sending, setSending] = useState(false)
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

  const phone = `+7${digits}`

  // If in Telegram Mini App, attempt auto-login for already linked users
  useEffect(() => {
    if (isTelegramWebApp()) {
      const initData = getTelegramInitData()
      if (initData) {
        setSending(true)
        api
          .telegramWebAppAuth(initData)
          .then((res) => {
            if (res.profile) {
              done(res.profile, res.profile.name, !res.isNew)
            }
          })
          .catch(() => {})
          .finally(() => setSending(false))
      }
    }
  }, [])

  const sendCode = async () => {
    setSending(true)
    if (isTelegramWebApp()) {
      try {
        const initData = getTelegramInitData()
        const tgUser = getTelegramUser()
        const tgName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || knownName
        const tgPhone = digits.length === 10 ? phone : undefined
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
      setCode('')
      setCodeError(null)
      setResendIn(RESEND_AFTER)
      setStep('code')
    } catch {
      showToast({ text: 'Не удалось отправить код — попробуйте ещё раз' })
    } finally {
      setSending(false)
    }
  }

  const done = (signedIn: Profile, finalName: string, returning: boolean) => {
    signIn(signedIn)
    showToast({ text: returning ? `С возвращением, ${finalName}!` : `${finalName}, напиток в подарок уже ждёт 🎁` })
    // On #/profile the same route turns into the profile itself once signed in.
    if (pathname === '/login') back()
  }

  const checkCode = async (value: string) => {
    setCode(value)
    setCodeError(null)
    if (value.length < CODE_LENGTH || verifying) return
    setVerifying(true)
    try {
      // The local name only seeds a brand-new customer; a returning guest keeps their CRM name.
      const res = await api.verifySmsCode(phone, value, knownName || undefined)
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
        {step === 'phone' && <PhoneStep digits={digits} sending={sending} inputRef={inputRef} onChange={setDigits} onSubmit={() => void sendCode()} />}
        {step === 'code' && (
          <CodeStep
            digits={digits}
            code={code}
            error={codeError}
            devCode={devCode}
            verifying={verifying}
            resendIn={resendIn}
            inputRef={inputRef}
            onChange={(value) => void checkCode(value)}
            onResend={() => void sendCode()}
          />
        )}
        {step === 'name' && <NameStep name={name} inputRef={inputRef} onChange={setName} onSubmit={() => void finishWithName(name.trim())} />}
      </SheetBody>
    </Sheet>
  )
}
