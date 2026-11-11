import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getClientChannel } from './platform'
import type { TelegramWebApp } from './telegram'

describe('getClientChannel detection', () => {
  beforeEach(() => {
    delete (window as any).Telegram
    Object.defineProperty(window.navigator, 'standalone', {
      value: undefined,
      configurable: true,
    })
  })

  afterEach(() => {
    delete (window as any).Telegram
  })

  it('detects "web" in standard desktop/mobile browser', () => {
    window.matchMedia = () =>
      ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList

    expect(getClientChannel()).toBe('web')
  })

  it('detects "telegram" when Telegram WebApp is active', () => {
    window.Telegram = {
      WebApp: {
        initData: 'query_id=123&user=%7B%22id%22%3A1%7D',
        platform: 'ios',
      } as unknown as TelegramWebApp,
    }

    expect(getClientChannel()).toBe('telegram')
  })

  it('detects "installed" via display-mode: standalone media query', () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList

    expect(getClientChannel()).toBe('installed')
  })

  it('detects "installed" via iOS navigator.standalone', () => {
    window.matchMedia = () =>
      ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList

    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      configurable: true,
    })

    expect(getClientChannel()).toBe('installed')
  })
})
