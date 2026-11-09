import { useEffect, useState } from 'react'

import { api } from '../../api'
import { Button } from '../../components/Button'
import { CheckIcon, EditIcon, LockIcon } from '../../components/icons'
import { InstallGuideSheet } from '../../components/InstallGuideSheet'
import { Presence } from '../../components/Presence'
import { Surface } from '../../components/Surface'
import { SwitchRow } from '../../components/SwitchRow'
import { TextField } from '../../components/TextField'
import { block, blockTitle } from '../../components/ui'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useApp } from '../../state/AppContext'
import type { Profile } from '../../state/loyalty'
import type { Theme } from '../../state/theme'
import { cx } from '../../utils/cx'
import { formatPhone, isEmail, phoneDigits } from '../../utils/format'
import {
  getTelegramInitData,
  isTelegramWebApp,
  requestTelegramContact,
  requestTelegramWriteAccess,
} from '../../utils/telegram'

const setting = 'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left'
const settingLabel = 'block text-control font-semibold text-ink leading-tight'
const editablePill =
  'group/pill flex items-center gap-1.5 rounded-control px-2.5 py-1 bg-surface-2/60 border border-line/60 hover:border-line hover:bg-surface-2 focus-within:border-accent focus-within:bg-surface focus-within:ring-1 focus-within:ring-accent transition-all'

type Props = { profile: Profile; theme: Theme; onToggleTheme: () => void; onUpdate: (patch: Partial<Profile>) => void }

/** Name and e-mail save on blur; switches apply at once. */
export function ProfileSettings({ profile, theme, onToggleTheme, onUpdate }: Props) {
  const { signIn, showToast } = useApp()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [emailError, setEmailError] = useState(false)
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [isSharingContact, setIsSharingContact] = useState(false)
  const { isStandalone, isMobile, promptInstall } = usePwaInstall()
  const { isSupported, permission, subscribe, unsubscribe, syncIfGranted } = usePushNotifications()
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const isTg = isTelegramWebApp() || Boolean(profile.telegramId)
  const cleanPhone = profile.phone && !profile.phone.startsWith('tg_') ? profile.phone : ''

  useEffect(() => {
    setName(profile.name)
    setEmail(profile.email)
  }, [profile.name, profile.email])

  const isNotificationsActive = Boolean(
    isTg
      ? profile.notifications
      : isSupported
        ? (permission === 'granted' && profile.notifications)
        : profile.notifications
  )

  useEffect(() => {
    if (isNotificationsActive && !isTg && cleanPhone) {
      void syncIfGranted(cleanPhone)
    }
  }, [isNotificationsActive, isTg, cleanPhone, syncIfGranted])

  const handleToggleNotifications = async () => {
    setPermissionNotice(null)

    if (isTg) {
      const nextState = !profile.notifications
      onUpdate({ notifications: nextState })
      if (nextState && isTelegramWebApp()) {
        void requestTelegramWriteAccess()
      }
      return
    }

    if (isNotificationsActive) {
      if (isSupported) {
        await unsubscribe()
      }
      onUpdate({ notifications: false })
      return
    }

    if (!isSupported) {
      if (isMobile && !isStandalone) {
        setShowInstallGuide(true)
      } else {
        setPermissionNotice('Push-уведомления не поддерживаются на этом устройстве')
        onUpdate({ notifications: true })
      }
      return
    }

    if (permission === 'denied') {
      setPermissionNotice('Разрешите уведомления в настройках браузера')
      return
    }

    const ok = await subscribe(profile.phone)
    if (ok) {
      onUpdate({ notifications: true })
    } else {
      onUpdate({ notifications: false })
    }
  }

  let notificationDescription = 'О готовности заказа'
  if (isTg) {
    notificationDescription = profile.notifications
      ? 'В боте @shit_coffee_bot'
      : 'Уведомления в Telegram отключены'
  } else if (!isSupported) {
    notificationDescription = isMobile && !isStandalone
      ? 'Добавьте на экран «Домой», чтобы включить пуши'
      : 'Не поддерживается на этом устройстве'
  } else if (permission === 'denied') {
    notificationDescription = 'Разрешите уведомления в настройках браузера'
  } else if (isNotificationsActive) {
    notificationDescription = 'Уведомления включены'
  }

  const handleInstallClick = async () => {
    const outcome = await promptInstall()
    if (outcome === 'guide') {
      setShowInstallGuide(true)
    }
  }

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== profile.name) onUpdate({ name: trimmed })
    else setName(profile.name)
  }

  const saveEmail = () => {
    const trimmed = email.trim()
    if (trimmed && !isEmail(trimmed)) return setEmailError(true)
    setEmailError(false)
    if (trimmed !== profile.email) onUpdate({ email: trimmed })
  }

  const handleShareTelegramContact = async () => {
    setIsSharingContact(true)
    try {
      const shared = await requestTelegramContact()
      if (!shared) {
        setIsSharingContact(false)
        return
      }

      const initData = getTelegramInitData()
      let updatedProfile: Profile | null = null

      // Poll api.telegramWebAppAuth up to 8 times (every 400ms) for account merge via webhook
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((r) => setTimeout(r, 400))
        try {
          const res = await api.telegramWebAppAuth(initData)
          if (res.profile?.phone) {
            updatedProfile = res.profile
            break
          }
        } catch (err) {
          console.warn('Poll error:', err)
        }
      }

      if (updatedProfile) {
        signIn(updatedProfile)
        setName(updatedProfile.name)
        showToast({ text: 'Номер успешно привязан!' })
      } else {
        const p = await api.getProfile().catch(() => null)
        if (p?.phone) {
          signIn(p)
          setName(p.name)
          showToast({ text: 'Номер успешно привязан!' })
        } else {
          showToast({ text: 'Контакт отправлен боту' })
        }
      }
    } catch (err) {
      console.error('Failed to share telegram contact:', err)
      showToast({ text: 'Не удалось привязать номер' })
    } finally {
      setIsSharingContact(false)
    }
  }

  const handleSavePhone = async () => {
    const digits = phoneDigits(phoneInput)
    if (digits.length === 10) {
      const fullPhone = `+7${digits}`
      if (isTelegramWebApp()) {
        const initData = getTelegramInitData()
        try {
          const res = await api.telegramWebAppAuth(initData, fullPhone)
          if (res.profile) {
            signIn(res.profile)
            setName(res.profile.name)
            setIsEditingPhone(false)
            showToast({ text: 'Номер успешно сохранён!' })
            return
          }
        } catch {}
      }
      onUpdate({ phone: fullPhone })
      setIsEditingPhone(false)
    }
  }

  return (
    <>
      <section className={block}>
        <h2 className={blockTitle}>Настройки</h2>
        <Surface className="divide-y-(length:--stroke-width) divide-line overflow-hidden">
          <label htmlFor="profile-name-input" className={cx(setting, 'cursor-pointer hover:bg-surface-2/30 transition-colors')}>
            <span className={settingLabel}>Имя</span>
            <div className="flex items-center justify-end shrink min-w-0 max-w-xs flex-1">
              <div className={editablePill}>
                <TextField
                  id="profile-name-input"
                  fieldSize="inline"
                  value={name}
                  maxLength={20}
                  placeholder="Укажите имя"
                  className="w-full min-w-20 sm:min-w-32 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                />
                <EditIcon className="size-3.5 text-muted/60 shrink-0 pointer-events-none group-hover/pill:text-ink group-focus-within/pill:text-accent transition-colors" />
              </div>
            </div>
          </label>

          {/* Telegram Account Row */}
          {(isTg || profile.telegramUsername || profile.telegramId) && (
            <div className={setting}>
              <div>
                <span className={settingLabel}>Telegram</span>
                <span className="text-caption text-muted block">Привязан к боту</span>
              </div>
              <span className="text-control text-accent font-medium flex items-center gap-1.5">
                <span>✈️</span>
                <span>
                  {profile.telegramUsername
                    ? `@${profile.telegramUsername}`
                    : profile.telegramId
                      ? `ID: ${profile.telegramId}`
                      : 'Подключен'}
                </span>
              </span>
            </div>
          )}

          {/* Phone Number Row */}
          {isEditingPhone ? (
            <div className={setting}>
              <div>
                <span className={settingLabel}>Телефон</span>
                <span className="text-caption text-muted block">Введите 10 цифр</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center rounded-control px-2.5 py-1 bg-surface-2 border border-accent ring-1 ring-accent">
                  <TextField
                    fieldSize="inline"
                    inputMode="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={formatPhone(phoneDigits(phoneInput))}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-36 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                    autoFocus
                  />
                </div>
                <Button size="sm" variant="primary" onClick={handleSavePhone} disabled={phoneDigits(phoneInput).length !== 10}>
                  Сохранить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingPhone(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className={setting}>
              <div>
                <span className={settingLabel}>Телефон</span>
                <span className="text-caption text-muted block">
                  {cleanPhone ? 'Номер аккаунта' : 'Для связи и заказов'}
                </span>
              </div>
              {cleanPhone ? (
                <div className="flex items-center gap-1.5 text-control text-muted font-sans" title="Номер привязан к аккаунту">
                  <span>{formatPhone(cleanPhone.replace(/^\+7/, ''))}</span>
                  <LockIcon className="size-3.5 text-muted/60 shrink-0" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-control text-muted">не указан</span>
                  {isTelegramWebApp() ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isSharingContact}
                        onClick={() => void handleShareTelegramContact()}
                        className="text-caption"
                      >
                        {isSharingContact ? 'Привязываем...' : 'Поделиться'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingPhone(true)}
                        className="text-caption text-accent hover:opacity-80"
                      >
                        Ввести
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsEditingPhone(true)}
                      className="text-caption"
                    >
                      Указать
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="w-full">
            <label htmlFor="profile-email-input" className={cx(setting, 'cursor-pointer hover:bg-surface-2/30 transition-colors')}>
              <div className="min-w-0 pr-2">
                <span className={settingLabel}>E-mail</span>
                <span className="text-caption text-muted block truncate">Для электронных чеков</span>
              </div>
              <div className="flex items-center justify-end shrink min-w-0 max-w-xs flex-1">
                <div
                  className={cx(
                    editablePill,
                    emailError && 'border-danger focus-within:border-danger focus-within:ring-danger',
                  )}
                >
                  <TextField
                    id="profile-email-input"
                    fieldSize="inline"
                    error={emailError}
                    type="email"
                    inputMode="email"
                    placeholder="не указан"
                    value={email}
                    aria-invalid={emailError}
                    className="w-full min-w-28 sm:min-w-44 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError(false)
                    }}
                    onBlur={saveEmail}
                  />
                  <EditIcon className="size-3.5 text-muted/60 shrink-0 pointer-events-none group-hover/pill:text-ink group-focus-within/pill:text-accent transition-colors" />
                </div>
              </div>
            </label>
            {emailError && (
              <p className="mx-4 -mt-1 mb-2 text-right text-caption leading-(--leading-copy) text-error">
                Проверьте e-mail
              </p>
            )}
          </div>
          <div>
            <SwitchRow
              label="Уведомления"
              description={notificationDescription}
              checked={isNotificationsActive}
              onChange={() => void handleToggleNotifications()}
            />
            {permissionNotice && (
              <p className="mx-4 -mt-1.5 mb-2 text-right text-caption leading-(--leading-copy) text-error">
                {permissionNotice}
              </p>
            )}
          </div>
          <SwitchRow label="Тёмная тема" checked={theme === 'dark'} onChange={onToggleTheme} />

          {isMobile && !isTelegramWebApp() && (
            isStandalone ? (
              <div className={setting}>
                <div>
                  <span className={settingLabel}>Приложение</span>
                  <span className="text-caption text-muted block">Установлено на домашний экран</span>
                </div>
                <span className="flex items-center gap-1 text-caption font-semibold text-open">
                  <CheckIcon className="size-3.5" />
                  Установлено
                </span>
              </div>
            ) : (
              <div className={setting}>
                <div className="min-w-0 pr-2">
                  <span className={settingLabel}>Установить приложение</span>
                  <span className="text-caption text-muted block truncate">Быстрый доступ с экрана «Домой»</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => void handleInstallClick()}>
                  Установить
                </Button>
              </div>
            )
          )}
        </Surface>
      </section>

      <Presence>{showInstallGuide && <InstallGuideSheet onClose={() => setShowInstallGuide(false)} />}</Presence>
    </>
  )
}
