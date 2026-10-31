import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
})
