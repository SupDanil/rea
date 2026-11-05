import { floatingCopy, prefersReducedMotion } from './motion'

/**
 * Shared-element flights between a product thumbnail (menu card, hero, cart
 * line) and the big cup on the product screen. A clone of the art flies over
 * everything on a fixed layer while both real elements stay hidden, so it looks
 * the same in every browser — no View Transitions API involved.
 */

// Same timing the View Transitions version used (index.css ::view-transition-group).
export const MORPH = { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
export const TO_CART = { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }

const ART_ATTR = 'data-art-of'
const SLOT_ATTR = 'data-art-slot'

/**
 * Attributes for product art, so flights can find it. The same product can show in
 * several places at once (its card and a promo): `slot` names this one, so a flight
 * can return to the place it left from. Pass it on with `go(to, { artSlot })`.
 */
export const artProps = (itemId: string, slot?: string) => ({ [ART_ATTR]: itemId, [SLOT_ATTR]: slot })

const visibleArea = (r: DOMRect) => {
  const w = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0)
  const h = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * The thumbnail of `itemId` in `slot` if it is on screen, else the most visible one,
 * outside `exclude` (usually the product screen itself). A screen on its way out
 * only counts with `leaving`: a flight can start from it, but not land on it.
 */
export function findThumb(
  itemId: string,
  { exclude, slot, leaving }: { exclude?: Element | null; slot?: string; leaving?: boolean } = {},
): Element | null {
  let best: Element | null = null
  let bestArea = 0
  for (const el of document.querySelectorAll(`[${ART_ATTR}="${CSS.escape(itemId)}"]`)) {
    if (exclude?.contains(el)) continue
    if (!leaving && el.closest('[data-leaving]')) continue
    const area = visibleArea(el.getBoundingClientRect())
    if (area && slot && el.getAttribute(SLOT_ATTR) === slot) return el
    if (area > bestArea) {
      best = el
      bestArea = area
    }
  }
  return best
}

const hide = (el: Element | null) => el instanceof SVGElement || el instanceof HTMLElement ? ((el.style.visibility = 'hidden'), () => (el.style.visibility = '')) : () => {}

/** Mark a page with `PAGE_ATTR` and its sticky bars with `COVER_ATTR`: art under them gets cut at their edge. */
export const PAGE_ATTR = 'data-morph-page'
export const COVER_ATTR = 'data-morph-cover'

/** The share of a thumbnail hidden under its page's sticky bars, 0 to 1. */
function covered(el: Element | null, r: DOMRect) {
  let share = 0
  for (const bar of el?.closest(`[${PAGE_ATTR}]`)?.querySelectorAll(`[${COVER_ATTR}]`) ?? []) {
    const { top, bottom } = bar.getBoundingClientRect()
    if (r.bottom > top && r.top < bottom) share = Math.max(share, Math.min(1, (bottom - r.top) / r.height))
  }
  return share
}

const clipTop = (share: number) => `inset(${(share * 100).toFixed(2)}% 0 0 0)`

// Half a pixel: a slowly floating target must not restart the flight on the compositor every frame.
const sameRect = (a: DOMRect, b: DOMRect) =>
  Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.height - b.height) < 0.5

// The latest flight: turning it around picks the cup up from wherever it got to.
let inFlight: { from: Element; to: Element | DOMRect; rect: () => DOMRect; cancel: () => void } | null = null

/**
 * Flies a copy of `from` onto `to` (an element or a rect), scaling it to fit.
 * Both ends are hidden during the flight and shown again when it lands.
 *
 * An element target is re-measured every frame, so the clone lands exactly where
 * the real thing is by then, whatever moved it: the hero sizing itself after the
 * first commit, a pressed card springing back, the browser restoring the scroll.
 * `rect` overrides how it is measured.
 */
export function flyArt(
  from: Element,
  to: Element | DOMRect,
  opts: { duration?: number; easing?: string; hideTo?: boolean; landFade?: boolean; rect?: (el: Element) => DOMRect } = {},
) {
  const target = to instanceof Element ? to : null
  const aim = () => (target ? (opts.rect ?? ((el: Element) => el.getBoundingClientRect()))(target) : (to as DOMRect))
  const turned = inFlight && (inFlight.to === from || inFlight.from === from) ? inFlight : null
  const a = turned?.rect() ?? from.getBoundingClientRect()
  let b = aim()
  if (prefersReducedMotion() || !a.width || !b.width) return Promise.resolve()
  turned?.cancel()

  // Drawn at the larger end and only ever scaled down, so it stays sharp all the way.
  const { width: w, height: h } = a.height >= b.height ? a : b
  const clone = floatingCopy(from, { width: w, height: h }, 70)
  clone.firstElementChild?.removeAttribute(ART_ATTR)
  const showFrom = hide(from)
  const showTo = target && opts.hideTo !== false ? hide(target) : () => {}

  // Uniform scale by height (all product art shares one aspect ratio), centred on the target.
  const place = (r: DOMRect) => {
    const s = r.height / h
    return `translate(${r.left + r.width / 2 - (w * s) / 2}px, ${r.top}px) scale(${s})`
  }
  const keyframes = (end: DOMRect): Keyframe[] => [
    { transform: place(a), opacity: 1, offset: 0 },
    // landFade: the clone melts into what it lands on (the cart badge) instead of becoming it.
    ...(opts.landFade ? [{ opacity: 1, offset: 0.7 }] : []),
    { transform: place(end), opacity: opts.landFade ? 0 : 1, offset: 1 },
  ]
  const timing: KeyframeAnimationOptions = {
    duration: opts.duration ?? MORPH.duration,
    easing: opts.easing ?? MORPH.easing,
    fill: 'forwards',
  }
  const animation = clone.animate(keyframes(b), timing)

  // A clip-path can't run on the compositor: its own animation keeps it from dragging the flight along.
  const startCover = covered(from, a)
  const clipFrames = (end: DOMRect) => [{ clipPath: clipTop(startCover) }, { clipPath: clipTop(covered(target, end)) }]
  const clip = startCover || covered(target, b) ? clone.animate(clipFrames(b), timing) : null

  let frame = 0
  const track = () => {
    if (target?.isConnected) {
      const next = aim()
      if (!sameRect(next, b)) {
        b = next
        ;(animation.effect as KeyframeEffect).setKeyframes(keyframes(b))
        ;(clip?.effect as KeyframeEffect | undefined)?.setKeyframes(clipFrames(b))
      }
    }
    frame = requestAnimationFrame(track)
  }
  frame = requestAnimationFrame(track)

  let landed = false
  const done = () => {
    if (landed) return
    landed = true
    cancelAnimationFrame(frame)
    if (inFlight === flight) inFlight = null
    showTo()
    showFrom()
    clone.remove()
  }
  const flight = {
    from,
    to,
    rect: () => clone.getBoundingClientRect(),
    cancel: () => {
      done()
      animation.cancel()
    },
  }
  inFlight = flight
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
