import { useEffect, useState } from 'react'

/** useState mirrored into localStorage and kept in sync across tabs. */
export function usePersistent<T>(key: string, initial: T) {
  // Stable copy: callers pass fresh literals like [] on every render.
  const [fallback] = useState(initial)
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      const next = JSON.stringify(value)
      if (localStorage.getItem(key) !== next) localStorage.setItem(key, next)
    } catch {
      // Storage full or blocked: state still works for this session.
    }
  }, [key, value])
  // Another tab changed the same key: adopt it instead of overwriting it later.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        setValue(e.newValue ? (JSON.parse(e.newValue) as T) : fallback)
      } catch {
        // Ignore malformed values written by something else.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, fallback])
  return [value, setValue] as const
}
