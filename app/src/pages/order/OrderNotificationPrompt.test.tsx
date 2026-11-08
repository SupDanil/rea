import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as pushHook from '../../hooks/usePushNotifications'
import * as pwaHook from '../../hooks/usePwaInstall'
import { AppContext } from '../../state/AppContext'
import { OrderNotificationPrompt } from './OrderNotificationPrompt'

describe('OrderNotificationPrompt', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  const mockApp = (overrides = {}) => ({
    profile: { phone: '+79991112233', name: 'Данил', email: '', notifications: false, joinedAt: 1 },
    updateProfile: vi.fn().mockResolvedValue({}),
    showToast: vi.fn(),
    cart: {} as any,
    catalog: {} as any,
    loyalty: {} as any,
    myOrders: {} as any,
    orders: {} as any,
    theme: 'dark' as any,
    toggleTheme: vi.fn(),
    isAuthLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  })

  it('renders nothing if notifications are already active', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: true,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp({
      profile: { phone: '+79991112233', name: 'Данил', email: '', notifications: true, joinedAt: 1 },
    })

    const { container } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders prompt and enables notifications on click when permission is granted', async () => {
    const subscribeMock = vi.fn().mockResolvedValue(true)
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

    const appValue = mockApp()

    render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(screen.getByText('Бариста уже варит ваш кофе ☕️')).toBeInTheDocument()
    const enableBtn = screen.getByRole('button', { name: 'Включить' })
    fireEvent.click(enableBtn)

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalledWith('+79991112233')
      expect(appValue.updateProfile).toHaveBeenCalledWith({ notifications: true })
      expect(appValue.showToast).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('Уведомления включены') }))
    })
  })

  it('does NOT enable notifications if permission is declined', async () => {
    const subscribeMock = vi.fn().mockResolvedValue(false)
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

    const appValue = mockApp()

    render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    const enableBtn = screen.getByRole('button', { name: 'Включить' })
    fireEvent.click(enableBtn)

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalledWith('+79991112233')
      expect(appValue.updateProfile).toHaveBeenCalledWith({ notifications: false })
    })
  })

  it('renders install guide button when on mobile Safari without PWA installed', async () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: false,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    vi.spyOn(pwaHook, 'usePwaInstall').mockReturnValue({
      isInstallable: true,
      isStandalone: false,
      isIos: true,
      isMobile: true,
      promptInstall: vi.fn(),
    })

    const appValue = mockApp()

    render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="created" />
      </AppContext.Provider>
    )

    expect(screen.getByText('Добавьте на экран «Домой», чтобы получать пуши на iPhone')).toBeInTheDocument()
    const installBtn = screen.getByRole('button', { name: 'Установить' })
    expect(installBtn).toBeInTheDocument()

    fireEvent.click(installBtn)
    expect(screen.getByRole('dialog', { name: /Как установить приложение/ })).toBeInTheDocument()
  })

  it('can be dismissed via close button', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp()

    const { unmount } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    const closeBtn = screen.getByRole('button', { name: 'Закрыть подсказку' })
    fireEvent.click(closeBtn)

    expect(sessionStorage.getItem('hide-order-prompt-ord-1')).toBe('1')

    unmount()

    const { container } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders nothing if permission is denied', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'denied',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp()

    const { container } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders nothing if order is completed or cancelled', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp()

    const { container: completedContainer } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="completed" />
      </AppContext.Provider>
    )
    expect(completedContainer.firstChild).toBeNull()

    const { container: cancelledContainer } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-2" status="cancelled" />
      </AppContext.Provider>
    )
    expect(cancelledContainer.firstChild).toBeNull()
  })

  it('renders prompt if permission is granted but profile.notifications is false', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp({
      profile: { phone: '+79991112233', name: 'Данил', email: '', notifications: false, joinedAt: 1 },
    })

    render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(screen.getByText('Бариста уже варит ваш кофе ☕️')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Включить' })).toBeInTheDocument()
  })

  it('renders prompt if profile.notifications is true but browser permission is default', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp({
      profile: { phone: '+79991112233', name: 'Данил', email: '', notifications: true, joinedAt: 1 },
    })

    render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(screen.getByText('Бариста уже варит ваш кофе ☕️')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Включить' })).toBeInTheDocument()
  })

  it('renders correct title depending on order status ("ready" vs default)', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    const appValue = mockApp()

    const { rerender } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="ready" />
      </AppContext.Provider>
    )
    expect(screen.getByText('Заказ ждёт у стойки!')).toBeInTheDocument()

    rerender(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="accepted" />
      </AppContext.Provider>
    )
    expect(screen.getByText('Включите уведомления')).toBeInTheDocument()
  })

  it('renders nothing if push is not supported on non-mobile platform', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: false,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    vi.spyOn(pwaHook, 'usePwaInstall').mockReturnValue({
      isInstallable: false,
      isStandalone: false,
      isIos: false,
      isMobile: false,
      promptInstall: vi.fn(),
    })

    const appValue = mockApp()

    const { container } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-1" status="making" />
      </AppContext.Provider>
    )

    expect(container.firstChild).toBeNull()
  })

  it('dismisses iOS install prompt via close button', () => {
    vi.spyOn(pushHook, 'usePushNotifications').mockReturnValue({
      isSupported: false,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      syncIfGranted: vi.fn(),
    })

    vi.spyOn(pwaHook, 'usePwaInstall').mockReturnValue({
      isInstallable: true,
      isStandalone: false,
      isIos: true,
      isMobile: true,
      promptInstall: vi.fn(),
    })

    const appValue = mockApp()

    const { unmount } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-ios-1" status="making" />
      </AppContext.Provider>
    )

    const closeBtn = screen.getByRole('button', { name: 'Закрыть подсказку' })
    fireEvent.click(closeBtn)

    expect(sessionStorage.getItem('hide-order-prompt-ord-ios-1')).toBe('1')

    unmount()

    const { container } = render(
      <AppContext.Provider value={appValue as any}>
        <OrderNotificationPrompt orderId="ord-ios-1" status="making" />
      </AppContext.Provider>
    )

    expect(container.firstChild).toBeNull()
  })
})
