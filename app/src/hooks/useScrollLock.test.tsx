import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollLock } from './useScrollLock'

const locked = () => document.documentElement.hasAttribute('data-scroll-lock')

describe('useScrollLock', () => {
  it('locks the page while mounted', () => {
    const { unmount } = renderHook(() => useScrollLock())
    expect(locked()).toBe(true)
    unmount()
    expect(locked()).toBe(false)
  })

  it('stays locked until the last screen is gone', () => {
    const leaving = renderHook(() => useScrollLock())
    const entering = renderHook(() => useScrollLock())
    leaving.unmount()
    expect(locked()).toBe(true)
    entering.unmount()
    expect(locked()).toBe(false)
  })
})
