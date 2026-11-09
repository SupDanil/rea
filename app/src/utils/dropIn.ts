import { prefersReducedMotion } from './motion'

const DURATION = 620
const VIEW_W = 200
const VIEW_H = 220

/**
 * The cup's mouth in viewport pixels. `data-art-box` ("x y w h" in the 200×220 art viewBox) is the
 * visible artwork, so we aim at the rim, not the transparent margin around the photo.
 */
function mouthOf(cup: Element) {
  const r = cup.getBoundingClientRect()
  const [bx, by, bw] = (cup.getAttribute('data-art-box') ?? '47.75 0 104.5 220').split(' ').map(Number)
  return {
    x: r.left + ((bx + bw / 2) / VIEW_W) * r.width,
    y: r.top + ((by + 6) / VIEW_H) * r.height,
    width: (bw / VIEW_W) * r.width,
  }
}

/**
 * An add-on drops into the cup along an arc: a copy of its picture leaves the card, rises, and falls
 * shrinking into the rim. The cup is re-measured every frame, because the first add-on also moves it
 * (centre → left half, new scale) while the copy is in the air.
 *
 * Weak-device budget: two compositor animations (X on the outer box, Y/scale/opacity on the inner),
 * one getBoundingClientRect of the cup per frame, nothing else.
 */
export function dropIntoCup(source: Element, cup: Element): Promise<void> {
  // Fly the picture itself, not the full-width slot it is centred in.
  const from = source.querySelector('img, svg') ?? source
  const a = from.getBoundingClientRect()
  if (prefersReducedMotion() || !a.width || !a.height) return Promise.resolve()

  const outer = document.createElement('div')
  const inner = document.createElement('div')
  const copy = from.cloneNode(true) as HTMLElement
  Object.assign(outer.style, {
    position: 'fixed', left: '0', top: '0', width: `${a.width}px`, height: `${a.height}px`,
    zIndex: '70', pointerEvents: 'none', willChange: 'transform',
  })
  Object.assign(inner.style, { width: '100%', height: '100%', willChange: 'transform, opacity' })
  Object.assign(copy.style, { width: '100%', height: '100%', margin: '0' })
  inner.appendChild(copy)
  outer.appendChild(inner)
  document.body.appendChild(outer)

  const frames = () => {
    const m = mouthOf(cup)
    const end = Math.min(1, (m.width * 0.42) / a.width) // lands about the rim's width
    const endX = m.x - a.width / 2
    const endY = m.y - a.height / 2
    // Peak above both ends; higher for longer throws, never off the top of the screen.
    const peak = Math.max(8, Math.min(a.top, endY) - Math.max(48, Math.hypot(endX - a.left, endY - a.top) * 0.28))
    const x: Keyframe[] = [{ transform: `translateX(${a.left}px)` }, { transform: `translateX(${endX}px)` }]
    const y: Keyframe[] = [
      // Ease-out up, ease-in down: zero vertical speed at the peak, so the arc has no corner.
      { transform: `translateY(${a.top}px) scale(1)`, opacity: 1, easing: 'cubic-bezier(0.33, 0.66, 0.66, 1)' },
      { transform: `translateY(${peak}px) scale(1.08)`, opacity: 1, offset: 0.42, easing: 'cubic-bezier(0.5, 0, 0.85, 0.4)' },
      { transform: `translateY(${endY}px) scale(${(end * 1.15).toFixed(3)})`, opacity: 1, offset: 0.85 },
      { transform: `translateY(${endY + a.height * end * 0.25}px) scale(${end.toFixed(3)})`, opacity: 0 },
    ]
    return { x, y }
  }

  const first = frames()
  const ax = outer.animate(first.x, { duration: DURATION, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' })
  const ay = inner.animate(first.y, { duration: DURATION, fill: 'forwards' })

  let raf = 0
  let last = ''
  const track = () => {
    const m = mouthOf(cup)
    const sig = `${m.x.toFixed(1)} ${m.y.toFixed(1)} ${m.width.toFixed(1)}`
    if (sig !== last) {
      last = sig
      const next = frames()
      ;(ax.effect as KeyframeEffect).setKeyframes(next.x)
      ;(ay.effect as KeyframeEffect).setKeyframes(next.y)
    }
    raf = requestAnimationFrame(track)
  }
  raf = requestAnimationFrame(track)

  const done = () => {
    cancelAnimationFrame(raf)
    outer.remove()
  }
  return ay.finished.then(done, done)
}
