import { act,renderHook } from '@testing-library/react'
import { beforeEach,describe, expect, it } from 'vitest'

import { useTheme } from './theme'

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('initializes with light or dark theme and applies data-theme on documentElement', () => {
    const { result } = renderHook(() => useTheme())

    expect(['light', 'dark']).toContain(result.current.theme)
    expect(document.documentElement.dataset.theme).toBe(result.current.theme)
  })

  it('toggle() switches theme and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    const initial = result.current.theme
    const expected = initial === 'dark' ? 'light' : 'dark'

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe(expected)
    expect(document.documentElement.dataset.theme).toBe(expected)
    expect(localStorage.getItem('zerno-theme')).toBe(expected)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.theme).toBe(initial)
  })

  it('uses the current CSS background token for browser chrome in both themes', () => {
    const style = document.createElement('style')
    style.textContent = ':root { --bg: #f1e9ff; } :root[data-theme="dark"] { --bg: #211530; }'
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(style, meta)
    try {
      const { result, unmount } = renderHook(() => useTheme())
      expect(meta.content).toBe('#f1e9ff')
      act(() => result.current.toggle())
      expect(meta.content).toBe('#211530')
      unmount()
    } finally {
      style.remove()
      meta.remove()
    }
  })

})
