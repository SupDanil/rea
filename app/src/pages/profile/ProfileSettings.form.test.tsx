import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserProfile } from '../../domain'
import * as pushHook from '../../hooks/usePushNotifications'
import * as pwaHook from '../../hooks/usePwaInstall'
import { AppContext } from '../../state/AppContext'
import * as tgUtils from '../../utils/telegram'
import { ProfileSettings } from './ProfileSettings'

const profile: UserProfile = {
  phone: '+79991112233',
  name: 'Данил',
  email: 'danil@example.com',
  notifications: true,
  notificationsApp: true,
  notificationsTelegram: true,
  joinedAt: 1,
}

const appContext = { profile, showToast: vi.fn(), updateProfile: vi.fn(), signIn: vi.fn() } as never

function renderSettings(overrides: Partial<UserProfile> = {}) {
  const onUpdate = vi.fn()
  const view = (p: UserProfile) => (
    <AppContext.Provider value={appContext}>
      <ProfileSettings profile={p} theme="light" onToggleTheme={vi.fn()} onUpdate={onUpdate} />
    </AppContext.Provider>
  )
  const utils = render(view({ ...profile, ...overrides }))
  return { onUpdate, rerenderWith: (next: Partial<UserProfile>) => utils.rerender(view({ ...profile, ...overrides, ...next })) }
}

describe('ProfileSettings: name, e-mail and phone forms (TanStack Form + zod)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(false)
    vi.spyOn(pwaHook, 'usePwaInstall').mockReturnValue({
      isStandalone: true,
      isIos: false,
      isMobile: true,
      isPromptReady: false,
      canInstall: false,
      isBannerDismissed: false,
      promptInstall: vi.fn(),
      dismissBanner: vi.fn(),
    })
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: true,
      isLoading: false,
      error: null,
      subscribe: vi.fn().mockResolvedValue(true),
      unsubscribe: vi.fn().mockResolvedValue(true),
      syncIfGranted: vi.fn(),
    })
  })

  it('saves a changed name on blur, trimmed', () => {
    const { onUpdate } = renderSettings()
    const name = screen.getByLabelText('Имя')
    fireEvent.change(name, { target: { value: '  Даня  ' } })
    fireEvent.blur(name)
    expect(onUpdate).toHaveBeenCalledWith({ name: 'Даня' })
  })

  it('does not save an emptied or unchanged name and restores the stored one', async () => {
    const { onUpdate } = renderSettings()
    const name = screen.getByLabelText('Имя') as HTMLInputElement
    fireEvent.change(name, { target: { value: '   ' } })
    fireEvent.blur(name)
    expect(onUpdate).not.toHaveBeenCalled()
    await waitFor(() => expect(name.value).toBe('Данил'))

    fireEvent.blur(name)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('flags a malformed e-mail on blur without saving, and withdraws the error on typing', async () => {
    const { onUpdate } = renderSettings()
    const email = screen.getByLabelText(/E-mail/)
    fireEvent.change(email, { target: { value: 'danil@' } })
    fireEvent.blur(email)

    expect(await screen.findByText('Проверьте e-mail')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(onUpdate).not.toHaveBeenCalled()

    fireEvent.change(email, { target: { value: 'danil@new.ru' } })
    await waitFor(() => expect(screen.queryByText('Проверьте e-mail')).toBeNull())
    fireEvent.blur(email)
    expect(onUpdate).toHaveBeenCalledWith({ email: 'danil@new.ru' })
  })

  it('lets the e-mail be cleared', () => {
    const { onUpdate } = renderSettings()
    const email = screen.getByLabelText(/E-mail/)
    fireEvent.change(email, { target: { value: '' } })
    fireEvent.blur(email)
    expect(onUpdate).toHaveBeenCalledWith({ email: '' })
  })

  it('shows the values the profile received from elsewhere', async () => {
    const { rerenderWith } = renderSettings()
    rerenderWith({ name: 'Даниил', email: 'd@ya.ru' })
    await waitFor(() => expect(screen.getByLabelText('Имя')).toHaveValue('Даниил'))
    expect(screen.getByLabelText(/E-mail/)).toHaveValue('d@ya.ru')
  })

  it('phone: «Сохранить» unlocks at ten digits and saves the number with +7', async () => {
    const { onUpdate } = renderSettings({ phone: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Указать' }))

    const phone = screen.getByPlaceholderText('+7 (___) ___-__-__') as HTMLInputElement
    const save = screen.getByRole('button', { name: 'Сохранить' })
    expect(save).toBeDisabled()

    fireEvent.change(phone, { target: { value: '999123' } })
    expect(save).toBeDisabled()

    fireEvent.change(phone, { target: { value: '+7 999 123-45-67' } })
    await waitFor(() => expect(save).toBeEnabled())
    fireEvent.click(save)
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ phone: '+79991234567' }))
  })
})
