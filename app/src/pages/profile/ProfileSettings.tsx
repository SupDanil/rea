import { useState } from 'react'
import { block, blockTitle, panel, toggle } from '../../components/ui'
import type { Profile } from '../../state/loyalty'
import type { Theme } from '../../state/theme'
import { cx } from '../../utils/cx'
import { isEmail } from '../../utils/format'

const setting = 'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left'
const settingLabel = 'block flex-none text-[15px] font-semibold'
const settingInput = (error: boolean) =>
  cx(
    'min-w-0 flex-1 bg-transparent py-1.5 text-right text-[15px] placeholder:text-faint focus:outline-none',
    error ? 'text-error' : 'text-ink focus:text-accent-soft',
  )

type Props = { profile: Profile; theme: Theme; onToggleTheme: () => void; onUpdate: (patch: Partial<Profile>) => void }

/** Name and e-mail save on blur; switches apply at once. */
export function ProfileSettings({ profile, theme, onToggleTheme, onUpdate }: Props) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [emailError, setEmailError] = useState(false)

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
    <section className={block}>
      <h2 className={blockTitle}>Настройки</h2>
      <div className={cx('divide-y divide-line overflow-hidden rounded-[20px]', panel)}>
        <label className={setting}>
          <span className={settingLabel}>Имя</span>
          <input className={settingInput(false)} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
        </label>
        <div className={setting}>
          <span className={settingLabel}>Телефон</span>
          <span className="text-[15px] text-muted">{profile.phone}</span>
        </div>
        <div>
          <label className={setting}>
            <span className={settingLabel}>E-mail для чеков</span>
            <input
              className={settingInput(emailError)}
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
          {emailError && <p className="mx-4 -mt-1.5 mb-2 text-right text-[12px] leading-[1.4] text-error">Проверьте e-mail</p>}
        </div>
        <button className={cx(setting, 'group')} role="switch" aria-checked={profile.notifications} onClick={() => onUpdate({ notifications: !profile.notifications })}>
          <span>
            <span className={settingLabel}>Уведомления</span>
            <span className="mt-0.5 block text-[12px] text-muted">О готовности заказа и новых акциях</span>
          </span>
          <span className={toggle} aria-hidden="true" />
        </button>
        <button className={cx(setting, 'group')} role="switch" aria-checked={theme === 'dark'} onClick={onToggleTheme}>
          <span className={settingLabel}>Тёмная тема</span>
          <span className={toggle} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
