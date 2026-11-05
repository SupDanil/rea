import { useEffect, useState } from 'react'

/**
 * False for the first frame on screen, true right after: lets a screen show up and start
 * moving first, and build what can wait while the compositor is already animating it.
 */
export function useAfterFirstPaint() {
  const [painted, setPainted] = useState(false)
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPainted(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return painted
}
