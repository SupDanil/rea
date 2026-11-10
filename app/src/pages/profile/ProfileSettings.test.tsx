import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserProfile } from '../../domain'
import * as pushHook from '../../hooks/usePushNotifications'
import * as pwaHook from '../../hooks/usePwaInstall'
import { AppContext } from '../../state/AppContext'
import * as tgUtils from '../../utils/telegram'
import { ProfileSettings } from './ProfileSettings'

const baseProfile: UserProfile = {
  phone: '+79991112233',
  name: 'Данил',
  email: 'danil@example.com',
  notifications: true,
  notificationsApp: true,
  notificationsTelegram: true,
  joinedAt: Date.now(),
}

const mockAppContext = {
  profile: baseProfile,
  showToast: vi.fn(),
  updateProfile: vi.fn(),
} as any

function renderWithContext(ui: React.ReactElement) {
  return render(
    <AppContext.Provider value={mockAppContext}>
      {ui}
    </AppContext.Provider>
  )
}

describe('ProfileSettings: Dual Notification Toggles', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it('renders single "Уведомления" switch when Telegram is NOT connected', () => {
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(false)

    const webOnlyProfile: UserProfile = {
      ...baseProfile,
      telegramId: undefined,
      telegramUsername: undefined,
    }

    renderWithContext(
      <ProfileSettings
        profile={webOnlyProfile}
        theme="light"
        onToggleTheme={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByRole('switch', { name: /Уведомления/i })).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Уведомления в Telegram/i })).not.toBeInTheDocument()
  })

  it('renders separate switches for App and Telegram when Telegram is connected', () => {
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(false)

    const tgLinkedProfile: UserProfile = {
      ...baseProfile,
      telegramId: '12345678',
      telegramUsername: 'danil_tg',
    }

    renderWithContext(
      <ProfileSettings
        profile={tgLinkedProfile}
        theme="light"
        onToggleTheme={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByRole('switch', { name: /Уведомления в приложении/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Уведомления в Telegram/i })).toBeInTheDocument()
    expect(screen.getByText(/В боте @shit_coffee_bot/i)).toBeInTheDocument()
  })

  it('toggles app notifications independently and calls onUpdate with notificationsApp: false', async () => {
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(false)

    const tgLinkedProfile: UserProfile = {
      ...baseProfile,
      telegramId: '12345678',
      notificationsApp: true,
    }
    const onUpdate = vi.fn()

    renderWithContext(
      <ProfileSettings
        profile={tgLinkedProfile}
        theme="light"
        onToggleTheme={vi.fn()}
        onUpdate={onUpdate}
      />
    )

    const appSwitch = screen.getByRole('switch', { name: /Уведомления в приложении/i })
    fireEvent.click(appSwitch)

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ notificationsApp: false })
    })
  })

  it('toggles Telegram notifications independently and calls onUpdate with notificationsTelegram: false', () => {
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(false)

    const tgLinkedProfile: UserProfile = {
      ...baseProfile,
      telegramId: '12345678',
      notificationsTelegram: true,
    }
    const onUpdate = vi.fn()

    renderWithContext(
      <ProfileSettings
        profile={tgLinkedProfile}
        theme="light"
        onToggleTheme={vi.fn()}
        onUpdate={onUpdate}
      />
    )

    const tgSwitch = screen.getByRole('switch', { name: /Уведомления в Telegram/i })
    fireEvent.click(tgSwitch)

    expect(onUpdate).toHaveBeenCalledWith({ notificationsTelegram: false })
  })

  it('inside Telegram Mini App, always shows Telegram notifications toggle', () => {
    vi.spyOn(tgUtils, 'isTelegramWebApp').mockReturnValue(true)

    const tmaProfile: UserProfile = {
      ...baseProfile,
      telegramId: '999888',
      notificationsTelegram: true,
      notificationsApp: false,
    }

    renderWithContext(
      <ProfileSettings
        profile={tmaProfile}
        theme="dark"
        onToggleTheme={vi.fn()}
        onUpdate={vi.fn()}
      />
    )

    expect(screen.getByRole('switch', { name: /Уведомления в приложении/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Уведомления в Telegram/i })).toBeInTheDocument()
  })
})
