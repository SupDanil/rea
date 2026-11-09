import { useEffect, useState } from 'react'

import { Button } from '../../components/Button'
import { CheckIcon } from '../../components/icons'
import { InstallGuideSheet } from '../../components/InstallGuideSheet'
import { Presence } from '../../components/Presence'
import { Surface } from '../../components/Surface'
import { SwitchRow } from '../../components/SwitchRow'
import { TextField } from '../../components/TextField'
import { block, blockTitle } from '../../components/ui'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import type { Profile } from '../../state/loyalty'
import type { Theme } from '../../state/theme'
import { formatPhone, isEmail, phoneDigits } from '../../utils/format'
import { isTelegramWebApp, requestTelegramContact, requestTelegramWriteAccess } from '../../utils/telegram'

const setting = 'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left'
const fieldRow = 'flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 px-4 py-2.5 text-left min-h-14'
const settingLabel = 'block flex-none text-control font-semibold'

type Props = { profile: Profile; theme: Theme; onToggleTheme: () => void; onUpdate: (patch: Partial<Profile>) => void }

/** Name and e-mail save on blur; switches apply at once. */
export function ProfileSettings({ profile, theme, onToggleTheme, onUpdate }: Props) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [emailError, setEmailError] = useState(false)
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const { isStandalone, isMobile, promptInstall } = usePwaInstall()
  const { isSupported, permission, subscribe, unsubscribe, syncIfGranted } = usePushNotifications()
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const isTg = isTelegramWebApp() || Boolean(profile.telegramId)
  const cleanPhone = profile.phone && !profile.phone.startsWith('tg_') ? profile.phone : ''

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
    try {
      const shared = await requestTelegramContact()
      if (shared) {
        // Wait briefly for webhook to process and refresh
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      }
    } catch {}
  }

  const handleSavePhone = () => {
    const digits = phoneDigits(phoneInput)
    if (digits.length === 10) {
      onUpdate({ phone: `+7${digits}` })
      setIsEditingPhone(false)
    }
  }

  return (
    <>
      <section className={block}>
        <h2 className={blockTitle}>Настройки</h2>
        <Surface className="divide-y-(length:--stroke-width) divide-line overflow-hidden">
          <div className={fieldRow}>
            <label htmlFor="profile-name-input" className={settingLabel}>
              Имя
            </label>
            <div className="w-full sm:w-auto sm:min-w-56 sm:max-w-xs">
              <TextField
                id="profile-name-input"
                fieldSize="inline"
                value={name}
                maxLength={20}
                className="w-full text-left sm:text-right"
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
              />
            </div>
          </div>

          {/* Telegram Account Row */}
          {(isTg || profile.telegramUsername || profile.telegramId) && (
            <div className={setting}>
              <span className={settingLabel}>Telegram</span>
              <span className="text-control text-sky-400 font-medium flex items-center gap-1.5">
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
            <div className={fieldRow}>
              <span className={settingLabel}>Телефон</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <TextField
                  fieldSize="inline"
                  inputMode="tel"
                  placeholder="+7 (___) ___-__-__"
                  value={formatPhone(phoneDigits(phoneInput))}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full sm:w-44 text-left sm:text-right"
                />
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
              <span className={settingLabel}>Телефон</span>
              {cleanPhone ? (
                <span className="text-control text-muted">
                  {formatPhone(cleanPhone.replace(/^\+7/, ''))}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-control text-muted">не указан</span>
                  {isTelegramWebApp() ? (
                    <button
                      type="button"
                      onClick={() => void handleShareTelegramContact()}
                      className="text-xs text-sky-400 underline hover:opacity-80"
                    >
                      Поделиться номером
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(true)}
                      className="text-xs text-accent underline hover:opacity-80"
                    >
                      Указать
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <div className={fieldRow}>
              <label htmlFor="profile-email-input" className={settingLabel}>
                E-mail для чеков
              </label>
              <div className="w-full sm:w-auto sm:min-w-56 sm:max-w-xs">
                <TextField
                  id="profile-email-input"
                  fieldSize="inline"
                  error={emailError}
                  type="email"
                  inputMode="email"
                  placeholder="не указан"
                  value={email}
                  aria-invalid={emailError}
                  className="w-full text-left sm:text-right"
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(false)
                  }}
                  onBlur={saveEmail}
                />
              </div>
            </div>
            {emailError && (
              <p className="mx-4 -mt-1 mb-2 text-left sm:text-right text-caption leading-(--leading-copy) text-error">
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
                  <span className="text-caption text-muted">Установлено на домашний экран</span>
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
