import { prefersReducedMotion } from './motion'

/**
 * Gyroscopic tilt for the promo banner, phones only. The gyroscope's angle is eased on animation
 * frames and written as `--tilt-x` / `--tilt-y` (-1…1) straight onto the tracked `.ui-tilt`
 * elements that are on screen — never on <html>, where every change would restyle the whole
 * page. `<html data-tilt>` switches the 3D CSS on once the first reading arrives, so desktops
 * and phones without a sensor never get the extra layers. Hand jitter is ignored, and the
 * frame loop sleeps whenever the phone is still.
 */

const RANGE_DEG = 12 // How far the phone has to turn from its resting angle for a full tilt.
// How fast the resting angle catches up with the phone (events come ~60 a second). While the
// phone moves it barely follows, so the tilt shows in full; once the hand is still it follows
// in ~0.5 s, so a phone held level always shows a level card, whatever the grip.
const FOLLOW_MOVING = 0.002
const FOLLOW_STILL = 0.06
const STILL_SPEED = 0.12 // Degrees per reading, smoothed: below it the hand counts as still.
const EASE = 0.09 // Lower is silkier: the card glides after the phone instead of snapping.
const DEADZONE = 0.015 // ~0.3°: smaller moves are a steady hand, not a tilt.
const SETTLE = 0.002

type OrientationPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

const visible = new Set<HTMLElement>()
const target = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
let frame = 0
let observer: IntersectionObserver | null = null
let enabled = false
let started = false

const paint = (el: HTMLElement) => {
  el.style.setProperty('--tilt-x', current.x.toFixed(3))
  el.style.setProperty('--tilt-y', current.y.toFixed(3))
}

// The menu stays mounted under every other screen: no point tilting it under a modal.
const covered = () => !!document.querySelector('[data-modal]:not([data-leaving] *)')

const tick = () => {
  if (covered()) {
    frame = 0
    return
  }
  current.x += (target.x - current.x) * EASE
  current.y += (target.y - current.y) * EASE
  const settled = Math.abs(target.x - current.x) < SETTLE && Math.abs(target.y - current.y) < SETTLE
  if (settled) {
    current.x = target.x
    current.y = target.y
  }
  visible.forEach(paint)
  frame = settled || !visible.size ? 0 : requestAnimationFrame(tick)
}

const aim = (x: number, y: number) => {
  if (Math.abs(x - target.x) < DEADZONE && Math.abs(y - target.y) < DEADZONE) return
  target.x = x
  target.y = y
  if (!frame && visible.size) frame = requestAnimationFrame(tick)
}

let rest: { beta: number; gamma: number } | null = null
let last: { beta: number; gamma: number } | null = null
let speed = 0
const onOrientation = ({ beta, gamma }: DeviceOrientationEvent) => {
  if (beta == null || gamma == null || document.hidden) return
  if (!enabled) {
    enabled = true
    document.documentElement.dataset.tilt = ''
  }
  if (!rest || !last) rest = last = { beta, gamma }
  speed += (Math.abs(beta - last.beta) + Math.abs(gamma - last.gamma) - speed) * 0.2
  last = { beta, gamma }
  // Relative to how the phone is being held: a still hand is level, only turning it tilts.
  const follow = speed < STILL_SPEED ? FOLLOW_STILL : FOLLOW_MOVING
  rest.beta += (beta - rest.beta) * follow
  rest.gamma += (gamma - rest.gamma) * follow
  aim(clamp((gamma - rest.gamma) / RANGE_DEG), clamp((beta - rest.beta) / RANGE_DEG))
}

const supported = () =>
  typeof window !== 'undefined' &&
  'DeviceOrientationEvent' in window &&
  typeof IntersectionObserver !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches &&
  !prefersReducedMotion()

function start() {
  if (started) return
  started = true
  const listen = () => window.addEventListener('deviceorientation', onOrientation, { passive: true })
  const permission = (window.DeviceOrientationEvent as unknown as OrientationPermission).requestPermission
  if (typeof permission === 'function') {
    // iOS asks once, and only from a tap.
    window.addEventListener('touchend', () => {
      permission().then((state) => state === 'granted' && listen()).catch(() => {})
    }, { once: true, passive: true })
  } else {
    listen()
  }
}

/** Follow the gyroscope with `el` while it is on screen. Returns the cleanup. */
export function trackTilt(el: HTMLElement): () => void {
  if (!supported()) return () => {}
  start()
  observer ??= new IntersectionObserver((entries) => {
    for (const { target: node, isIntersecting } of entries) {
      const tilted = node as HTMLElement
      if (isIntersecting) {
        visible.add(tilted)
        paint(tilted)
      } else {
        visible.delete(tilted)
      }
    }
  })
  observer.observe(el)
  return () => {
    observer?.unobserve(el)
    visible.delete(el)
  }
}

/** Ref callback for a `.ui-tilt` element: `<div ref={tiltRef} className="ui-tilt">`. */
export const tiltRef = (el: HTMLElement | null) => (el ? trackTilt(el) : undefined)
