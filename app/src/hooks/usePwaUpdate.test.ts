import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  _resetPwaUpdateState,
  _setPwaUpdateState,
  _setStandaloneOverride,
  checkForUpdate,
  usePwaUpdate,
} from './usePwaUpdate'

describe('usePwaUpdate', () => {
  beforeEach(() => {
    _resetPwaUpdateState()
    _setStandaloneOverride(true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    _resetPwaUpdateState()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts with default state (no update waiting)', () => {
    const { result } = renderHook(() => usePwaUpdate())

    expect(result.current.needRefresh).toBe(false)
    expect(result.current.isUpdating).toBe(false)
    expect(result.current.isDismissed).toBe(false)
    expect(result.current.showModal).toBe(false)
  })

  it('shows modal in PWA standalone mode when an update becomes available', () => {
    const { result } = renderHook(() => usePwaUpdate())

    act(() => {
      _setPwaUpdateState({ needRefresh: true })
    })

    expect(result.current.needRefresh).toBe(true)
    expect(result.current.isStandalone).toBe(true)
    expect(result.current.showModal).toBe(true)
  })

  it('does NOT show modal in regular browser mode even if update is available', () => {
    _setStandaloneOverride(false)
    const { result } = renderHook(() => usePwaUpdate())

    act(() => {
      _setPwaUpdateState({ needRefresh: true })
    })

    expect(result.current.needRefresh).toBe(true)
    expect(result.current.isStandalone).toBe(false)
    expect(result.current.showModal).toBe(false)
  })

  it('dismisses modal when user clicks later (dismissUpdate)', () => {
    const { result } = renderHook(() => usePwaUpdate())

    act(() => {
      _setPwaUpdateState({ needRefresh: true })
    })
    expect(result.current.showModal).toBe(true)

    act(() => {
      result.current.dismissUpdate()
    })

    expect(result.current.needRefresh).toBe(true)
    expect(result.current.isDismissed).toBe(true)
    expect(result.current.showModal).toBe(false)
  })

  it('sets isUpdating to true and initiates reload on updateApp', async () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    })

    const { result } = renderHook(() => usePwaUpdate())

    act(() => {
      _setPwaUpdateState({ needRefresh: true })
    })

    await act(async () => {
      await result.current.updateApp()
    })

    expect(result.current.isUpdating).toBe(true)
    expect(reloadMock).toHaveBeenCalled()
  })

  it('detects waiting service worker on checkForUpdate in PWA', async () => {
    const postMessageMock = vi.fn()
    const updateMock = vi.fn().mockResolvedValue(undefined)

    const fakeRegistration = {
      waiting: { postMessage: postMessageMock },
      update: updateMock,
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(fakeRegistration),
        addEventListener: vi.fn(),
      },
    })

    const { result } = renderHook(() => usePwaUpdate())

    await act(async () => {
      await checkForUpdate()
    })

    expect(result.current.needRefresh).toBe(true)
    expect(result.current.showModal).toBe(true)
    expect(updateMock).toHaveBeenCalled()
  })
})
