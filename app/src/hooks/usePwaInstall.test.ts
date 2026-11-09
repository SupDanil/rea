import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkIsIos, checkIsMobile, checkIsStandalone, usePwaInstall } from './usePwaInstall'

describe('usePwaInstall', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('detects standalone mode from matchMedia', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(checkIsStandalone()).toBe(true)
  })

  it('detects standalone mode from navigator.standalone on iOS', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })

    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      configurable: true,
    })

    expect(checkIsStandalone()).toBe(true)

    // Reset
    Object.defineProperty(window.navigator, 'standalone', {
      value: undefined,
      configurable: true,
    })
  })

  it('detects iOS from userAgent', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')
    expect(checkIsIos()).toBe(true)
  })

  it('detects mobile browsers vs desktop browsers', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14; Pixel 7)')
    expect(checkIsMobile()).toBe(true)

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')
    expect(checkIsMobile()).toBe(true)

    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36')
    expect(checkIsMobile()).toBe(false)
  })

  it('disables canInstall on desktop non-mobile browsers', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    const { result } = renderHook(() => usePwaInstall())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.canInstall).toBe(false)
  })

  it('returns guide outcome when iOS or no prompt available', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')
    const { result } = renderHook(() => usePwaInstall())

    expect(result.current.canInstall).toBe(true)
    expect(result.current.isPromptReady).toBe(false)

    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.promptInstall()
    })

    expect(outcome).toBe('guide')
  })

  it('captures beforeinstallprompt and triggers native install', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 13; Pixel 7)')
    const { result } = renderHook(() => usePwaInstall())

    const promptMock = vi.fn().mockResolvedValue(undefined)
    const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' })

    const fakeEvent = Object.assign(new Event('beforeinstallprompt'), { prompt: promptMock, userChoice: userChoiceMock })

    act(() => {
      window.dispatchEvent(fakeEvent)
    })

    expect(result.current.isPromptReady).toBe(true)

    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.promptInstall()
    })

    expect(outcome).toBe('native')
    expect(promptMock).toHaveBeenCalled()
    expect(result.current.isStandalone).toBe(true)
  })

  it('allows dismissing the banner and saves to localStorage', () => {
    const { result } = renderHook(() => usePwaInstall())

    expect(result.current.isBannerDismissed).toBe(false)

    act(() => {
      result.current.dismissBanner()
    })

    expect(result.current.isBannerDismissed).toBe(true)
    expect(localStorage.getItem('shit_coffee_pwa_banner_dismissed')).toBe('true')
  })
})
