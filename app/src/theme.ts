import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'zerno-theme'
const themeColor = { light: '#f4f0ea', dark: '#15120f' } as const
const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const readStored = (): Theme | null => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor[theme])
}

/** Follows the system until the user picks a theme, then remembers that pick. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? (systemQuery().matches ? 'dark' : 'light'))

  useEffect(() => apply(theme), [theme])

  useEffect(() => {
    const mq = systemQuery()
    const onChange = (e: MediaQueryListEvent) => {
      if (!readStored()) setTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode: the choice just won't survive a reload.
    }
    setTheme(next)
  }

  return { theme, toggle }
}
