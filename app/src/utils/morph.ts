import { prefersReducedMotion } from './motion'

/**
 * Shared-element flights between a product thumbnail (menu card, hero, cart
 * line) and the big cup on the product screen. A clone of the art flies over
 * everything on a fixed layer while both real elements stay hidden, so it looks
 * the same in every browser — no View Transitions API involved.
 */

// Same timing the View Transitions version used (index.css ::view-transition-group).
export const MORPH = { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
export const TO_CART = { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }

/** Mark product art with this attribute (`data-art-of={item.id}`) so flights can find it. */
export const ART_ATTR = 'data-art-of'

const visibleArea = (r: DOMRect) => {
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0)
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)
  return w > 0 && h > 0 ? w * h : 0
}

/** The most visible thumbnail of `itemId` outside `exclude` (usually the product screen itself). */
export function findThumb(itemId: string, exclude?: Element | null): Element | null {
  let best: Element | null = null
  let bestArea = 0
  for (const el of document.querySelectorAll(`[${ART_ATTR}="${CSS.escape(itemId)}"]`)) {
    if (exclude?.contains(el)) continue
    if (el.closest('[data-leaving]')) continue
    const area = visibleArea(el.getBoundingClientRect())
    if (area > bestArea) {
      best = el
      bestArea = area
    }
  }
  return best
}

const hide = (el: Element | null) => el instanceof SVGElement || el instanceof HTMLElement ? ((el.style.visibility = 'hidden'), () => (el.style.visibility = '')) : () => {}

/**
 * Flies a copy of `from` onto `to` (an element or a rect), scaling it to fit.
 * Both ends are hidden during the flight and shown again when it lands.
 */
export function flyArt(
  from: Element,
  to: Element | DOMRect,
  opts: { duration?: number; easing?: string; hideTo?: boolean; landFade?: boolean } = {},
) {
  const a = from.getBoundingClientRect()
  const b = to instanceof Element ? to.getBoundingClientRect() : to
  if (prefersReducedMotion() || !a.width || !b.width) return Promise.resolve()

  const clone = from.cloneNode(true) as SVGElement | HTMLElement
  clone.removeAttribute(ART_ATTR)
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    margin: '0',
    zIndex: '70',
    pointerEvents: 'none',
    transformOrigin: '0 0',
    visibility: 'visible',
    animation: 'none',
  })
  document.body.appendChild(clone)
  const showFrom = hide(from)
  const showTo = to instanceof Element && opts.hideTo !== false ? hide(to) : () => {}

  // Uniform scale by height (all product art shares one aspect ratio), centred on the target.
  const s = b.height / a.height
  const dx = b.left + b.width / 2 - (a.left + (a.width * s) / 2)
  const dy = b.top - a.top
  const animation = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
      // landFade: the clone melts into what it lands on (the cart badge) instead of becoming it.
      ...(opts.landFade ? [{ opacity: 1, offset: 0.7 }] : []),
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: opts.landFade ? 0 : 1, offset: 1 },
    ],
    { duration: opts.duration ?? MORPH.duration, easing: opts.easing ?? MORPH.easing, fill: 'forwards' },
  )
  const done = () => {
    showTo()
    showFrom()
    clone.remove()
  }
  return animation.finished.then(done, done)
}

/** Waits for the next screen to lay out (a couple of frames after navigating). */
export const nextFrames = (n = 2) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve())
    step(n)
  })

/**
 * Where `el` will sit once its screen's entrance has finished: its current box
 * minus the translate the screen (`sheet`) is still animating through.
 */
export function settledRect(el: Element, sheet: HTMLElement) {
  const r = el.getBoundingClientRect()
  const now = sheet.getBoundingClientRect()
  return new DOMRect(r.left - (now.left - sheet.offsetLeft), r.top - (now.top - sheet.offsetTop), r.width, r.height)
}
