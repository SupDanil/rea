import { useCallback, useEffect, useState } from 'react'
import { readString, writeString } from '../utils/storage'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'zerno-theme'
const themeColor = { light: '#f4f0ea', dark: '#15120f' } as const
const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const readStored = (): Theme | null => {
  const v = readString(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
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

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      writeString(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { theme, toggle }
}
