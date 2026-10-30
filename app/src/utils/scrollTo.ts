import { prefersReducedMotion } from './motion'

let active: { cancel: () => void } | null = null

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Smoothly scrolls the window to `getTarget()`, re-reading the target on every
 * frame so layout that shifts mid-scroll (a tab row appearing) can't make it
 * land short. Unlike native `behavior: 'smooth'`, no other scroll call (e.g. a
 * tab row scrolling into view) can silently cancel it; a user's own wheel or
 * touch does. Resolves when it stops, either way.
 */
export function animateWindowScroll(getTarget: () => number): Promise<void> {
  active?.cancel()
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight
  const clamp = (y: number) => Math.max(0, Math.min(maxY(), y))

  if (prefersReducedMotion()) {
    window.scrollTo({ top: clamp(getTarget()), behavior: 'instant' })
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const startY = window.scrollY
    const distance = Math.abs(clamp(getTarget()) - startY)
    // Long jumps take a little longer, but never drag.
    const duration = Math.min(720, 340 + distance * 0.09)
    const t0 = performance.now()
    let frame = 0

    const stop = () => {
      cancelAnimationFrame(frame)
      for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.removeEventListener(type, stop)
      if (active === handle) active = null
      resolve()
    }
    const handle = { cancel: stop }
    active = handle
    for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.addEventListener(type, stop, { passive: true })

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const target = clamp(getTarget())
      window.scrollTo({ top: startY + (target - startY) * easeInOutCubic(p), behavior: 'instant' })
      if (p < 1) frame = requestAnimationFrame(tick)
      else stop()
    }
    frame = requestAnimationFrame(tick)
  })
}
