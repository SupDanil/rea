import { flushSync } from 'react-dom'

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
export const SOFT = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/**
 * Runs a DOM-changing update as a View Transition when the browser can,
 * so shared elements (named via `view-transition-name`) morph between screens.
 * Falls back to a plain update elsewhere and when motion is reduced.
 */
export function withViewTransition(update: () => void, after?: () => void) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    after?.()
    return
  }
  const transition = document.startViewTransition(() => flushSync(update))
  void transition.finished.finally(() => after?.())
}

export const supportsViewTransitions = () => typeof document !== 'undefined' && !!document.startViewTransition

/**
 * Throws a copy of `source` along an arc to the centre of `target`, shrinking
 * as it goes — the add-on dropping into the cup. Resolves when it lands.
 */
export function flyTo(source: Element, target: Element, opts: { duration?: number; endScale?: number } = {}) {
  if (prefersReducedMotion()) return Promise.resolve()
  const { duration = 560, endScale = 0.35 } = opts
  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const clone = source.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: '0',
    zIndex: '60',
    pointerEvents: 'none',
  })
  document.body.appendChild(clone)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  // Lift above the straight line first, then drop in: reads as a toss, not a slide.
  const lift = Math.min(-60, dy * 0.35 - 40)
  const animation = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.3 + lift}px) scale(0.9) rotate(-12deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(8deg)`, opacity: 0.2 },
    ],
    { duration, easing: SOFT },
  )
  return animation.finished.then(() => clone.remove(), () => clone.remove())
}

/** Squash-and-stretch, as if something landed in it. */
export function bounce(el: Element | null, strength = 1) {
  if (!el || prefersReducedMotion()) return
  const s = (v: number) => 1 + (v - 1) * strength
  el.animate(
    [
      { transform: 'scale(1, 1)' },
      { transform: `scale(${s(1.06)}, ${s(0.93)})`, offset: 0.3 },
      { transform: `scale(${s(0.97)}, ${s(1.04)})`, offset: 0.6 },
      { transform: 'scale(1, 1)' },
    ],
    { duration: 520, easing: 'ease-out', composite: 'add' },
  )
}

/** Quick spring "boop" for counters and badges. */
export function pop(el: Element | null) {
  if (!el || prefersReducedMotion()) return
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 420, easing: SPRING })
}
