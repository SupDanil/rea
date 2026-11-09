import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addTelegramAppToHomeScreen,
  checkTelegramHomeScreenStatus,
  getTelegramInitData,
  getTelegramUser,
  getTelegramWebApp,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  initTelegramApp,
  isTelegramWebApp,
  requestTelegramWriteAccess,
  type TelegramWebApp,
} from './telegram'

describe('Telegram Mini App utilities (client-side)', () => {
  beforeEach(() => {
    delete (window as any).Telegram
  })

  afterEach(() => {
    delete (window as any).Telegram
  })

  it('isTelegramWebApp returns false when Telegram is not present', () => {
    expect(isTelegramWebApp()).toBe(false)
    expect(getTelegramWebApp()).toBeNull()
    expect(getTelegramInitData()).toBe('')
    expect(getTelegramUser()).toBeNull()
  })

  it('isTelegramWebApp returns true when initData is present', () => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=123&user=%7B%22id%22%3A1%7D',
        initDataUnsafe: {
          user: { id: 1, first_name: 'Павел', username: 'durov' },
        },
        platform: 'ios',
      } as unknown as TelegramWebApp,
    }

    expect(isTelegramWebApp()).toBe(true)
    expect(getTelegramInitData()).toBe('query_id=123&user=%7B%22id%22%3A1%7D')
    expect(getTelegramUser()?.username).toBe('durov')
    expect(getTelegramUser()?.first_name).toBe('Павел')
  })

  it('initTelegramApp invokes ready, expand and disableVerticalSwipes', () => {
    const readySpy = vi.fn()
    const expandSpy = vi.fn()
    const disableSwipesSpy = vi.fn()

    window.Telegram = {
      WebApp: {
        initData: 'query_id=1',
        ready: readySpy,
        expand: expandSpy,
        disableVerticalSwipes: disableSwipesSpy,
      } as unknown as TelegramWebApp,
    }

    initTelegramApp()
    expect(readySpy).toHaveBeenCalledOnce()
    expect(expandSpy).toHaveBeenCalledOnce()
    expect(disableSwipesSpy).toHaveBeenCalledOnce()
  })

  it('requestTelegramWriteAccess resolves true when Telegram permits write access', async () => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=1',
        requestWriteAccess: vi.fn((cb) => cb(true)),
      } as unknown as TelegramWebApp,
    }

    const allowed = await requestTelegramWriteAccess()
    expect(allowed).toBe(true)
  })

  it('requestTelegramWriteAccess resolves false when unsupported or denied', async () => {
    // Unsupported
    expect(await requestTelegramWriteAccess()).toBe(false)

    // Denied
    window.Telegram = {
      WebApp: {
        initData: 'query_id=1',
        requestWriteAccess: vi.fn((cb) => cb(false)),
      } as unknown as TelegramWebApp,
    }
    expect(await requestTelegramWriteAccess()).toBe(false)
  })

  it('addTelegramAppToHomeScreen invokes addToHomeScreen', () => {
    const addSpy = vi.fn()
    window.Telegram = {
      WebApp: {
        initData: 'query_id=1',
        addToHomeScreen: addSpy,
      } as unknown as TelegramWebApp,
    }

    addTelegramAppToHomeScreen()
    expect(addSpy).toHaveBeenCalledOnce()
  })

  it('checkTelegramHomeScreenStatus checks and resolves current home screen status', async () => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=1',
        checkHomeScreenStatus: vi.fn((cb) => cb('added')),
      } as unknown as TelegramWebApp,
    }

    const status = await checkTelegramHomeScreenStatus()
    expect(status).toBe('added')
  })

  it('haptic helpers invoke HapticFeedback safely without throwing', () => {
    const impactSpy = vi.fn()
    const notifSpy = vi.fn()
    const selectSpy = vi.fn()

    window.Telegram = {
      WebApp: {
        HapticFeedback: {
          impactOccurred: impactSpy,
          notificationOccurred: notifSpy,
          selectionChanged: selectSpy,
        },
      } as unknown as TelegramWebApp,
    }

    hapticImpact('medium')
    expect(impactSpy).toHaveBeenCalledWith('medium')

    hapticNotification('success')
    expect(notifSpy).toHaveBeenCalledWith('success')

    hapticSelection()
    expect(selectSpy).toHaveBeenCalledOnce()

    // And verify safe fallback when Telegram is not present
    delete (window as any).Telegram
    expect(() => hapticImpact('light')).not.toThrow()
    expect(() => hapticNotification('error')).not.toThrow()
    expect(() => hapticSelection()).not.toThrow()
  })
})
