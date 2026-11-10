import { useForm } from '@tanstack/react-form'
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
import { guestName, NAME_MAX, optionalEmail, phoneSchema } from '../../forms/schemas'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useApp } from '../../state/AppContext'
import type { Profile } from '../../state/loyalty'
import type { Theme } from '../../state/theme'
import { cx } from '../../utils/cx'
import { formatPhone, phoneDigits, phoneInputValue } from '../../utils/format'
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
  // Name and e-mail are one form whose fields save themselves on blur.
  const form = useForm({ defaultValues: { name: profile.name, email: profile.email } })
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const phoneForm = useForm({
    defaultValues: { digits: '' },
    validators: { onSubmit: phoneSchema },
    onSubmit: ({ value }) => savePhone(value.digits),
  })
  const [isSharingContact, setIsSharingContact] = useState(false)
  const { isStandalone, isMobile, promptInstall } = usePwaInstall()
  const { isSupported, permission, subscribe, unsubscribe, syncIfGranted } = usePushNotifications()
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const isTg = isTelegramWebApp() || Boolean(profile.telegramId)
  const hasTelegram = isTelegramWebApp() || Boolean(profile.telegramId) || Boolean(profile.telegramUsername)
  const cleanPhone = profile.phone && !profile.phone.startsWith('tg_') ? profile.phone : ''

  // The profile changed elsewhere (sign-in, merge, server answer): show the saved values.
  useEffect(() => {
    form.reset({ name: profile.name, email: profile.email })
  }, [form, profile.name, profile.email])

  const appNotificationsActive = Boolean(
    profile.notificationsApp !== undefined
      ? profile.notificationsApp
      : profile.notifications
  )
  const tgNotificationsActive = profile.notificationsTelegram ?? true

  useEffect(() => {
    if (appNotificationsActive && !isTelegramWebApp() && cleanPhone && isSupported && permission === 'granted') {
      void syncIfGranted(cleanPhone)
    }
  }, [appNotificationsActive, cleanPhone, isSupported, permission, syncIfGranted])

  const handleToggleAppNotifications = async () => {
    setPermissionNotice(null)

    if (appNotificationsActive) {
      if (isSupported) {
        await unsubscribe().catch(() => {})
      }
      onUpdate({ notificationsApp: false })
      return
    }

    if (!isSupported) {
      if (isMobile && !isStandalone && !isTelegramWebApp()) {
        setShowInstallGuide(true)
      } else {
        setPermissionNotice('Push-уведомления не поддерживаются в этом браузере')
        onUpdate({ notificationsApp: true })
      }
      return
    }

    if (permission === 'denied') {
      setPermissionNotice('Разрешите уведомления в настройках браузера')
      return
    }

    const ok = await subscribe(profile.phone)
    if (ok) {
      onUpdate({ notificationsApp: true, notifications: true })
    } else {
      onUpdate({ notificationsApp: false })
    }
  }

  const handleToggleTgNotifications = () => {
    const nextState = !tgNotificationsActive
    onUpdate({ notificationsTelegram: nextState })
    if (nextState && isTelegramWebApp()) {
      void requestTelegramWriteAccess()
    }
  }

  let appNotificationDescription = 'О готовности заказа'
  if (isTelegramWebApp()) {
    appNotificationDescription = appNotificationsActive
      ? 'Включены для отдельного приложения'
      : 'Для уведомлений на экране смартфона'
  } else if (!isSupported) {
    appNotificationDescription =
      isMobile && !isStandalone
        ? 'Добавьте на экран «Домой», чтобы включить пуши'
        : 'Не поддерживается на этом устройстве'
  } else if (permission === 'denied') {
    appNotificationDescription = 'Разрешите уведомления в настройках браузера'
  } else if (appNotificationsActive && permission === 'granted') {
    appNotificationDescription = 'Уведомления включены'
  }

  const tgNotificationDescription = tgNotificationsActive
    ? 'В боте @shit_coffee_bot'
    : 'Уведомления в Telegram отключены'

  const handleInstallClick = async () => {
    const outcome = await promptInstall()
    if (outcome === 'guide') {
      setShowInstallGuide(true)
    }
  }

  const saveName = (value: string) => {
    const parsed = guestName.safeParse(value)
    if (parsed.success && parsed.data !== profile.name) onUpdate({ name: parsed.data })
    // An emptied name is not saved: the field goes back to the stored one.
    else form.setFieldValue('name', profile.name)
  }

  const saveEmail = (value: string) => {
    const parsed = optionalEmail.safeParse(value)
    if (parsed.success && parsed.data !== profile.email) onUpdate({ email: parsed.data })
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
        showToast({ text: 'Номер успешно привязан!' })
      } else {
        const p = await api.getProfile().catch(() => null)
        if (p?.phone) {
          signIn(p)
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

  const savePhone = async (digits: string) => {
    const fullPhone = `+7${digits}`
    if (isTelegramWebApp()) {
      const initData = getTelegramInitData()
      try {
        const res = await api.telegramWebAppAuth(initData, fullPhone)
        if (res.profile) {
          signIn(res.profile)
          setIsEditingPhone(false)
          showToast({ text: 'Номер успешно сохранён!' })
          return
        }
      } catch {}
    }
    onUpdate({ phone: fullPhone })
    setIsEditingPhone(false)
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
                <form.Field name="name">
                  {(field) => (
                    <TextField
                      id="profile-name-input"
                      fieldSize="inline"
                      value={field.state.value}
                      maxLength={NAME_MAX}
                      placeholder="Укажите имя"
                      className="w-full min-w-20 sm:min-w-32 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={() => {
                        field.handleBlur()
                        saveName(field.state.value)
                      }}
                    />
                  )}
                </form.Field>
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
                  <phoneForm.Field name="digits">
                    {(field) => (
                      <TextField
                        fieldSize="inline"
                        inputMode="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={phoneInputValue(field.state.value)}
                        onChange={(e) => field.handleChange(phoneDigits(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && void phoneForm.handleSubmit()}
                        className="w-36 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                        autoFocus
                      />
                    )}
                  </phoneForm.Field>
                </div>
                <phoneForm.Subscribe selector={(state) => phoneSchema.safeParse(state.values).success}>
                  {(isValid) => (
                    <Button size="sm" variant="primary" onClick={() => void phoneForm.handleSubmit()} disabled={!isValid}>
                      Сохранить
                    </Button>
                  )}
                </phoneForm.Subscribe>
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

          <form.Field name="email" validators={{ onBlur: optionalEmail }}>
            {(field) => {
              const emailError = field.state.meta.errors.length > 0
              return (
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
                    value={field.state.value}
                    aria-invalid={emailError}
                    className="w-full min-w-28 sm:min-w-44 text-right !p-0 !bg-transparent !border-0 !shadow-none font-medium text-ink focus:outline-none"
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      // Typing again withdraws the complaint until the next blur.
                      field.setErrorMap({ onBlur: undefined })
                    }}
                    onBlur={() => {
                      field.handleBlur()
                      saveEmail(field.state.value)
                    }}
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
              )
            }}
          </form.Field>
          <div>
            <SwitchRow
              label={hasTelegram ? 'Уведомления в приложении' : 'Уведомления'}
              description={appNotificationDescription}
              checked={
                isTelegramWebApp()
                  ? appNotificationsActive
                  : isSupported
                    ? (permission === 'granted' && appNotificationsActive)
                    : appNotificationsActive
              }
              onChange={() => void handleToggleAppNotifications()}
            />
            {permissionNotice && (
              <p className="mx-4 -mt-1.5 mb-2 text-right text-caption leading-(--leading-copy) text-error">
                {permissionNotice}
              </p>
            )}
          </div>

          {hasTelegram && (
            <div>
              <SwitchRow
                label="Уведомления в Telegram"
                description={tgNotificationDescription}
                checked={tgNotificationsActive}
                onChange={() => void handleToggleTgNotifications()}
              />
            </div>
          )}
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
