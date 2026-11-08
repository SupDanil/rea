import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { usePushNotifications } from './usePushNotifications'

describe('usePushNotifications hook', () => {
  const originalNotification = globalThis.Notification
  const originalNavigator = globalThis.navigator

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.Notification = originalNotification
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  it('reports supported when Notification and ServiceWorker exist', () => {
    const { result } = renderHook(() => usePushNotifications())
    expect(result.current.isSupported).toBeDefined()
  })

  it('subscribes successfully when permission is granted', async () => {
    const fakeSubscription = {
      endpoint: 'https://push.example.com/sub/123',
      toJSON: () => ({
        endpoint: 'https://push.example.com/sub/123',
        keys: { p256dh: 'p256', auth: 'auth' },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    }

    const fakeRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(fakeSubscription),
      },
    }

    // Mock Notification
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as unknown as typeof Notification

    // Mock navigator.serviceWorker
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          ready: Promise.resolve(fakeRegistration),
        },
      },
      writable: true,
      configurable: true,
    })

    // Mock PushManager
    ;(globalThis as unknown as { PushManager: unknown }).PushManager = class PushManager {}

    vi.spyOn(api, 'getVapidPublicKey').mockResolvedValue(
      'BEij1cd0bAft4Jm0k-2BaLHY9gJiC77-YVdpsLq2wtXx8zPTJ2MZKhi-3tSJ-KJ3XIknh7U4KIjxe6JSOmhvE90',
    )
    const subscribePushSpy = vi
      .spyOn(api, 'subscribePush')
      .mockResolvedValue({ success: true, subscriptionId: 'sub-1' })

    const { result } = renderHook(() => usePushNotifications())

    let ok = false
    await act(async () => {
      ok = await result.current.subscribe('+79991234567')
    })

    expect(ok).toBe(true)
    expect(result.current.isSubscribed).toBe(true)
    expect(subscribePushSpy).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example.com/sub/123' }),
      '+79991234567',
    )
  })

  it('does not subscribe when user denies notification permission', async () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    } as unknown as typeof Notification

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          ready: Promise.resolve({}),
        },
      },
      writable: true,
      configurable: true,
    })

    ;(globalThis as unknown as { PushManager: unknown }).PushManager = class PushManager {}

    const { result } = renderHook(() => usePushNotifications())

    let ok = true
    await act(async () => {
      ok = await result.current.subscribe('+79991234567')
    })

    expect(ok).toBe(false)
    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.error).toBe('Разрешение на уведомления отклонено')
  })

  it('unsubscribes successfully and calls backend and pushManager', async () => {
    const fakeSubscription = {
      endpoint: 'https://push.example.com/sub/123',
      unsubscribe: vi.fn().mockResolvedValue(true),
    }

    const fakeRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(fakeSubscription),
      },
    }

    globalThis.Notification = {
      permission: 'granted',
    } as unknown as typeof Notification

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          ready: Promise.resolve(fakeRegistration),
        },
      },
      writable: true,
      configurable: true,
    })

    ;(globalThis as unknown as { PushManager: unknown }).PushManager = class PushManager {}

    const unsubscribePushSpy = vi
      .spyOn(api, 'unsubscribePush')
      .mockResolvedValue({ success: true })

    const { result } = renderHook(() => usePushNotifications())

    let ok = false
    await act(async () => {
      ok = await result.current.unsubscribe()
    })

    expect(ok).toBe(true)
    expect(result.current.isSubscribed).toBe(false)
    expect(unsubscribePushSpy).toHaveBeenCalledWith('https://push.example.com/sub/123')
    expect(fakeSubscription.unsubscribe).toHaveBeenCalled()
  })
})
