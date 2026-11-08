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
import { isEmail } from '../../utils/format'

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
  const { isStandalone, isMobile, promptInstall } = usePwaInstall()
  const { isSupported, permission, subscribe, unsubscribe, syncIfGranted } = usePushNotifications()
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const isNotificationsActive = Boolean(
    isSupported ? (permission === 'granted' && profile.notifications) : profile.notifications
  )

  useEffect(() => {
    if (isNotificationsActive) {
      void syncIfGranted(profile.phone)
    }
  }, [isNotificationsActive, profile.phone, syncIfGranted])

  const handleToggleNotifications = async () => {
    setPermissionNotice(null)

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
  if (!isSupported) {
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
          <div className={setting}>
            <span className={settingLabel}>Телефон</span>
            <span className="text-control text-muted">{profile.phone}</span>
          </div>
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

          {isMobile && (
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
