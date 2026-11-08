import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as pushHook from '../../hooks/usePushNotifications'
import * as pwaHook from '../../hooks/usePwaInstall'
import { InstallBanner } from './InstallBanner'

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

describe('InstallBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(MOBILE_UA)
  })

  it('does NOT render on non-mobile desktop browsers', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(DESKTOP_UA)
    render(<InstallBanner onOpenGuide={vi.fn()} />)

    expect(screen.queryByRole('region', { name: /Предложение установить приложение/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Установите shit кофе')).not.toBeInTheDocument()
  })

  it('renders install banner on mobile browser', () => {
    render(<InstallBanner onOpenGuide={vi.fn()} />)

    expect(screen.getByRole('region', { name: /Предложение установить приложение/i })).toBeInTheDocument()
    expect(screen.getByText('Установите shit кофе')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Установить' })).toBeInTheDocument()
  })

  it('calls onOpenGuide when clicked and no native prompt is ready', async () => {
    const onOpenGuide = vi.fn()
    render(<InstallBanner onOpenGuide={onOpenGuide} />)

    fireEvent.click(screen.getByRole('button', { name: 'Установить' }))

    // Let promptInstall promise resolve
    await vi.waitFor(() => {
      expect(onOpenGuide).toHaveBeenCalled()
    })
  })

  it('automatically attempts push notification subscribe when native install succeeds', async () => {
    const subscribeMock = vi.fn().mockResolvedValue(true)
    vi.spyOn(pwaHook, 'usePwaInstall').mockReturnValue({
      isStandalone: false,
      isIos: false,
      isMobile: true,
      isPromptReady: true,
      canInstall: true,
      isBannerDismissed: false,
      promptInstall: vi.fn().mockResolvedValue('native'),
      dismissBanner: vi.fn(),
    })
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: subscribeMock,
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    render(<InstallBanner onOpenGuide={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Установить' }))

    await vi.waitFor(() => {
      expect(subscribeMock).toHaveBeenCalled()
    })
  })

  it('dismisses banner on close button click', () => {
    render(<InstallBanner onOpenGuide={vi.fn()} />)

    const closeBtn = screen.getByRole('button', { name: /Скрыть предложение/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByRole('region', { name: /Предложение установить приложение/i })).not.toBeInTheDocument()
    expect(localStorage.getItem('shit_coffee_pwa_banner_dismissed')).toBe('true')
  })
})
