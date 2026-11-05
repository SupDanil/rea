import { createContext, useContext } from 'react'

// For browsers that can't report their animations.
const EXIT_MS = 320
// A hidden tab never finishes an animation: nothing may wait for one forever.
const EXIT_TIMEOUT_MS = 1500

/**
 * Calls `done` once the exit of the modal inside `root` has played to its end. Waiting for the
 * animation, not for a set time: on a stalled phone a timer would run out before it even starts,
 * and the screen would vanish. Returns a function that calls it off.
 */
export function whenExitEnds(root: Element, done: () => void) {
  const animations = root.querySelector('[data-modal-panel]')?.getAnimations?.()
  const timer = window.setTimeout(() => finish(), animations ? EXIT_TIMEOUT_MS : EXIT_MS)
  let cancelled = false
  const finish = () => {
    if (cancelled) return
    cancelled = true
    window.clearTimeout(timer)
    done()
  }
  if (animations) void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish)
  return () => {
    cancelled = true
    window.clearTimeout(timer)
  }
}

/** Whether this screen has already played its entrance; null outside a ScreenEntry. */
export const EntranceContext = createContext<{ played: () => boolean; markPlayed: () => void } | null>(null)

export const LeavingContext = createContext(false)

/** True while this screen is on its way out (its route is no longer current). */
export const useIsLeaving = () => useContext(LeavingContext)
