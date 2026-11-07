import { useState } from 'react'

import { Button } from '../../components/Button'
import { CheckIcon } from '../../components/icons'
import { InstallGuideSheet } from '../../components/InstallGuideSheet'
import { Presence } from '../../components/Presence'
import { Surface } from '../../components/Surface'
import { SwitchRow } from '../../components/SwitchRow'
import { TextField } from '../../components/TextField'
import { block, blockTitle } from '../../components/ui'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import type { Profile } from '../../state/loyalty'
import type { Theme } from '../../state/theme'
import { isEmail } from '../../utils/format'

const setting = 'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left'
const settingLabel = 'block flex-none text-control font-semibold'

type Props = { profile: Profile; theme: Theme; onToggleTheme: () => void; onUpdate: (patch: Partial<Profile>) => void }

/** Name and e-mail save on blur; switches apply at once. */
export function ProfileSettings({ profile, theme, onToggleTheme, onUpdate }: Props) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [emailError, setEmailError] = useState(false)
  const { isStandalone, promptInstall } = usePwaInstall()
  const [showInstallGuide, setShowInstallGuide] = useState(false)

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
          <label className={setting}>
            <span className={settingLabel}>Имя</span>
            <TextField fieldSize="inline" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
          </label>
          <div className={setting}>
            <span className={settingLabel}>Телефон</span>
            <span className="text-control text-muted">{profile.phone}</span>
          </div>
          <div>
            <label className={setting}>
              <span className={settingLabel}>E-mail для чеков</span>
              <TextField
                fieldSize="inline" error={emailError}
                type="email"
                inputMode="email"
                placeholder="не указан"
                value={email}
                aria-invalid={emailError}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(false)
                }}
                onBlur={saveEmail}
              />
            </label>
            {emailError && <p className="mx-4 -mt-1.5 mb-2 text-right text-caption leading-(--leading-copy) text-error">Проверьте e-mail</p>}
          </div>
          <SwitchRow label="Уведомления" description="О готовности заказа и новых акциях" checked={profile.notifications} onChange={() => onUpdate({ notifications: !profile.notifications })} />
          <SwitchRow label="Тёмная тема" checked={theme === 'dark'} onChange={onToggleTheme} />

          {isStandalone ? (
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
          )}
        </Surface>
      </section>

      <Presence>{showInstallGuide && <InstallGuideSheet onClose={() => setShowInstallGuide(false)} />}</Presence>
    </>
  )
}
