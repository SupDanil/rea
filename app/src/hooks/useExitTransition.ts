import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../utils/motion'

/**
 * Keeps the last non-null `value` rendered for `ms` after it turns null, so the
 * element can play an exit animation instead of vanishing. `leaving` is true
 * during that window.
 */
export function useExitTransition<T>(value: T | null | undefined, ms: number) {
  const [rendered, setRendered] = useState<T | null>(value ?? null)
  const [leaving, setLeaving] = useState(false)

  // Adopt a new value at once (adjusting state during render, not in an effect).
  if (value != null && (value !== rendered || leaving)) {
    setRendered(value)
    setLeaving(false)
  }
  if (value == null && rendered != null && !leaving) setLeaving(true)

  useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(
      () => {
        setRendered(null)
        setLeaving(false)
      },
      prefersReducedMotion() ? 0 : ms,
    )
    return () => window.clearTimeout(t)
  }, [leaving, ms])

  return { rendered, leaving }
}
