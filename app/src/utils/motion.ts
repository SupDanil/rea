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
export function flyTo(source: Element, target: Element | DOMRect, opts: { duration?: number; endScale?: number } = {}) {
  if (prefersReducedMotion()) return Promise.resolve()
  const { duration = 560, endScale = 0.35 } = opts
  const from = source.getBoundingClientRect()
  const to = target instanceof Element ? target.getBoundingClientRect() : target
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

/**
 * Removes a list row: it slides aside and fades, then its height (and margin)
 * collapses so the rows below glide up. Resolves when it is gone; the caller
 * then drops it from state. The element is left collapsed until it unmounts.
 */
export async function collapseOut(el: HTMLElement | null, delay = 0) {
  if (!el || prefersReducedMotion()) return
  const h = el.offsetHeight
  el.style.pointerEvents = 'none'
  await el.animate(
    [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(-28%) scale(0.96)', opacity: 0 },
    ],
    { duration: 260, delay, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
  ).finished
  el.style.overflow = 'hidden'
  await el.animate(
    [
      { height: `${h}px`, marginBottom: '0px' },
      // The list uses gap-2: pull the next row up by the gap as well.
      { height: '0px', marginBottom: '-8px', paddingTop: '0px', paddingBottom: '0px' },
    ],
    { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
  ).finished
}

/** Fades blocks down and out together (the cart's form when the last item goes). */
export function fadeAway(els: (Element | null)[], duration = 260) {
  if (prefersReducedMotion()) return Promise.resolve()
  return Promise.all(
    els.filter((el): el is Element => !!el).map(
      (el) => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(14px)' }], { duration, easing: 'ease-in', fill: 'forwards' }).finished,
    ),
  ).then(() => undefined)
}
