import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../utils/motion'

/**
 * Eases a number towards its new value instead of jumping, like Drinkit's
 * nutrition and price counters.
 */
export function useAnimatedNumber(value: number, duration = 450) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  const frame = useRef(0)

  useEffect(() => {
    const start = from.current
    if (start === value || prefersReducedMotion()) {
      from.current = value
      frame.current = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(frame.current)
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const current = start + (value - start) * eased
      from.current = current
      setShown(current)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])

  return shown
}
