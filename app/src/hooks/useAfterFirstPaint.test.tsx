import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAfterFirstPaint } from './useAfterFirstPaint'

describe('useAfterFirstPaint', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('turns true two frames after mounting, and not if unmounted first', () => {
    const frames = new Map<number, FrameRequestCallback>()
    let id = 0
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (frames.set(++id, cb), id))
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => frames.delete(handle))
    const tick = () => {
      const due = [...frames.values()]
      frames.clear()
      act(() => due.forEach((cb) => cb(0)))
    }

    const { result, unmount } = renderHook(() => useAfterFirstPaint())
    expect(result.current).toBe(false)
    tick()
    expect(result.current).toBe(false)
    tick()
    expect(result.current).toBe(true)
    unmount()

    const second = renderHook(() => useAfterFirstPaint())
    second.unmount()
    expect(frames.size).toBe(0)
  })
})
