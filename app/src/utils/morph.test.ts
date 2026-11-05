import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { artProps, COVER_ATTR, findThumb, flyArt, PAGE_ATTR, settledRect } from './morph'

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect

function art(box: DOMRect, parent: Element = document.body) {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => box
  parent.appendChild(el)
  return el
}

type FakeAnimation = {
  keyframes: Keyframe[]
  effect: { setKeyframes: (k: Keyframe[]) => void }
  finished: Promise<void>
  land: () => void
  cancel: () => void
}

describe('flyArt', () => {
  let animations: FakeAnimation[]
  let frames: FrameRequestCallback[]
  const tick = () => frames.splice(0).forEach((cb) => cb(0))
  const clones = () => [...document.querySelectorAll<HTMLElement>('[data-flight]')]
  const lastFrame = (a: FakeAnimation) => a.keyframes[a.keyframes.length - 1]

  beforeEach(() => {
    animations = []
    frames = []
    document.body.innerHTML = ''
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', () => void (frames = []))
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[]) {
      let land = () => {}
      let abort = () => {}
      const animation: FakeAnimation = {
        keyframes,
        effect: { setKeyframes: (k) => void (animation.keyframes = k) },
        finished: new Promise<void>((resolve, reject) => {
          land = resolve
          abort = () => reject(new Error('cancelled'))
        }),
        land: () => land(),
        cancel: () => abort(),
      }
      animations.push(animation)
      return animation as unknown as Animation
    } as typeof Element.prototype.animate
  })

  afterEach(async () => {
    // Land whatever a test left in the air: only one flight exists at a time.
    animations.forEach((a) => a.land())
    await Promise.all(animations.map((a) => a.finished.catch(() => {})))
    await Promise.resolve()
    vi.unstubAllGlobals()
    // @ts-expect-error jsdom has no Web Animations
    delete Element.prototype.animate
  })

  it('hides both ends in flight, then shows them and removes the clone', async () => {
    const from = art(rect(10, 20, 100, 110))
    const to = art(rect(40, 50, 200, 220))

    const flight = flyArt(from, to)
    expect(from.style.visibility).toBe('hidden')
    expect(to.style.visibility).toBe('hidden')
    expect(clones()).toHaveLength(1)

    animations[0].land()
    await flight
    expect(from.style.visibility).toBe('')
    expect(to.style.visibility).toBe('')
    expect(clones()).toHaveLength(0)
  })

  it('starts on the source and ends on the target', () => {
    void flyArt(art(rect(10, 20, 100, 110)), art(rect(40, 50, 200, 220)))
    const [first] = animations[0].keyframes
    expect(first.transform).toBe('translate(10px, 20px) scale(0.5)')
    expect(lastFrame(animations[0]).transform).toBe('translate(40px, 50px) scale(1)')
  })

  it('sheds what the art looks like in place, or the flight comes out clipped and costly', () => {
    const from = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    from.setAttribute('class', 'max-h-[160px] drop-shadow-lg animate-float')
    from.setAttribute('data-art-of', 'latte')
    from.getBoundingClientRect = () => rect(10, 20, 100, 110)
    document.body.appendChild(from)

    void flyArt(from, art(rect(40, 50, 200, 220)))

    const copy = clones()[0].firstElementChild as SVGElement
    expect(copy.style).toMatchObject({ maxHeight: 'none', filter: 'none', animation: 'none', height: '100%' })
    expect(copy.hasAttribute('data-art-of')).toBe(false)
  })

  it('flies an HTML box, since an <svg> root would keep the flight on the main thread', () => {
    void flyArt(art(rect(10, 20, 100, 110)), art(rect(40, 50, 200, 220)))
    expect(clones()[0].tagName).toBe('DIV')
    expect(clones()[0].style.willChange).toBe('transform')
  })

  it('is drawn at the larger end, so it never scales up', () => {
    void flyArt(art(rect(0, 0, 100, 110)), art(rect(0, 0, 200, 220)))
    expect((clones()[0] as HTMLElement).style.height).toBe('220px')
  })

  it('lands where the target is now, not where it was at take-off', () => {
    let box = rect(50, 100, 320, 352)
    const to = art(box)
    to.getBoundingClientRect = () => box
    void flyArt(art(rect(40, 160, 135, 148.5)), to)

    // The hero sizes itself right after the first commit: the cup is smaller than first measured.
    box = rect(65, 146, 300, 330)
    tick()
    expect(lastFrame(animations[0]).transform).toContain('translate(65px, 146px)')
    expect(lastFrame(animations[0]).transform).toContain('scale(0.9375)')

    // The browser restores the scroll under the card mid-flight.
    box = rect(65, 96, 300, 330)
    tick()
    expect(lastFrame(animations[0]).transform).toContain('translate(65px, 96px)')
  })

  it('leaves the keyframes alone while the target holds still or barely drifts', () => {
    let box = rect(40, 50, 200, 220)
    const to = art(box)
    to.getBoundingClientRect = () => box
    void flyArt(art(rect(10, 20, 100, 110)), to)
    const planned = animations[0].keyframes
    tick()
    box = rect(40, 50.3, 200, 220) // a promo floating in place
    tick()
    expect(animations[0].keyframes).toBe(planned)
  })

  it('measures the target with `rect` when given', () => {
    void flyArt(art(rect(10, 20, 100, 110)), art(rect(0, 500, 200, 220)), { rect: () => rect(40, 50, 200, 220) })
    expect(lastFrame(animations[0]).transform).toBe('translate(40px, 50px) scale(1)')
  })

  it('stops following a target that left the page', () => {
    const to = art(rect(40, 50, 200, 220))
    void flyArt(art(rect(10, 20, 100, 110)), to)
    to.getBoundingClientRect = () => rect(0, 0, 0, 0)
    to.remove()
    tick()
    expect(lastFrame(animations[0]).transform).toBe('translate(40px, 50px) scale(1)')
  })

  it('turning a flight around picks the cup up from where it got to, with no second cup', async () => {
    const thumb = art(rect(10, 20, 100, 110))
    const cup = art(rect(40, 50, 200, 220))
    const opening = flyArt(thumb, cup)
    clones()[0].getBoundingClientRect = () => rect(25, 35, 150, 165)

    const closing = flyArt(cup, thumb)
    expect(clones()).toHaveLength(1)
    expect(animations[1].keyframes[0].transform).toBe('translate(25px, 35px) scale(1)')

    await opening
    // The interrupted flight must not uncover what the new one is hiding.
    expect(thumb.style.visibility).toBe('hidden')
    expect(cup.style.visibility).toBe('hidden')

    animations[1].land()
    await closing
    expect(clones()).toHaveLength(0)
    expect(thumb.style.visibility).toBe('')
  })

  it('leaves an unrelated flight alone and starts from its own art', async () => {
    const cartFlight = flyArt(art(rect(10, 20, 100, 110)), art(rect(23, 758, 40, 40)), { landFade: true })
    clones()[0].getBoundingClientRect = () => rect(24, 700, 40, 44)

    const next = flyArt(art(rect(250, 160, 100, 110)), art(rect(40, 50, 200, 220)))
    expect(clones()).toHaveLength(2)
    expect(animations[1].keyframes[0].transform).toBe('translate(250px, 160px) scale(0.5)')

    animations.forEach((a) => a.land())
    await Promise.all([cartFlight, next])
    expect(clones()).toHaveLength(0)
  })

  describe('under the sticky bar', () => {
    const page = () => {
      const el = document.body.appendChild(document.createElement('div'))
      el.setAttribute(PAGE_ATTR, '')
      art(rect(0, 58, 400, 100), el).setAttribute(COVER_ATTR, '')
      return el
    }

    it('clips the clone where the bar will cover the card it lands on', () => {
      void flyArt(art(rect(60, 140, 300, 330)), art(rect(40, 108, 100, 100), page()))
      expect(animations[1].keyframes[0].clipPath).toBe('inset(0.00% 0 0 0)')
      expect(lastFrame(animations[1]).clipPath).toBe('inset(50.00% 0 0 0)')
    })

    it('keeps the clip in its own animation, so the flight itself stays on the compositor', () => {
      void flyArt(art(rect(60, 140, 300, 330)), art(rect(40, 108, 100, 100), page()))
      expect(animations[0].keyframes.some((k) => 'clipPath' in k)).toBe(false)
    })

    it('adds no clip to a flight in the open, which keeps it on the compositor', () => {
      void flyArt(art(rect(60, 140, 300, 330)), art(rect(40, 300, 100, 100), page()))
      expect(animations).toHaveLength(1)
    })

    it('ignores the bars of a page the art is not on', () => {
      page()
      void flyArt(art(rect(60, 140, 300, 330)), art(rect(40, 108, 100, 100)))
      expect(animations).toHaveLength(1)
    })
  })

  it('fades out on landing with landFade', () => {
    void flyArt(art(rect(10, 20, 100, 110)), art(rect(40, 50, 40, 40)), { landFade: true })
    expect(lastFrame(animations[0]).opacity).toBe(0)
    expect(animations[0].keyframes[1]).toEqual({ opacity: 1, offset: 0.7 })
  })

  it('does nothing under reduced motion', async () => {
    const media = window.matchMedia
    window.matchMedia = ((query: string) => ({ ...media(query), matches: true })) as typeof window.matchMedia
    const from = art(rect(10, 20, 100, 110))
    await flyArt(from, art(rect(40, 50, 200, 220)))
    window.matchMedia = media
    expect(animations).toHaveLength(0)
    expect(from.style.visibility).toBe('')
  })
})

describe('findThumb', () => {
  it('skips the excluded screen and screens on their way out', () => {
    document.body.innerHTML = ''
    const dialog = document.body.appendChild(document.createElement('div'))
    const leaving = document.body.appendChild(document.createElement('div'))
    leaving.setAttribute('data-leaving', '')
    const inDialog = art(rect(10, 10, 100, 100), dialog)
    const inLeaving = art(rect(10, 10, 100, 100), leaving)
    const onMenu = art(rect(10, 200, 50, 50))
    for (const el of [inDialog, inLeaving, onMenu]) el.setAttribute('data-art-of', 'latte')

    expect(findThumb('latte', { exclude: dialog })).toBe(onMenu)
  })

  const place = (box: DOMRect, slot: string) => {
    const el = art(box)
    for (const [name, value] of Object.entries(artProps('espresso', slot))) el.setAttribute(name, value!)
    return el
  }

  it('picks the art in the slot it was opened from, even when a bigger one is on screen', () => {
    document.body.innerHTML = ''
    const promo = place(rect(10, 10, 300, 300), 'promo-1')
    const card = place(rect(10, 400, 100, 100), 'card')

    expect(findThumb('espresso', { slot: 'card' })).toBe(card)
    expect(findThumb('espresso', { slot: 'promo-1' })).toBe(promo)
  })

  it('falls back to the most visible art when its slot is gone or off screen', () => {
    document.body.innerHTML = ''
    const promo = place(rect(10, 10, 300, 300), 'promo-1')
    place(rect(10, 5000, 100, 100), 'card')

    expect(findThumb('espresso', { slot: 'card' })).toBe(promo)
    expect(findThumb('espresso', { slot: 'promo-gone' })).toBe(promo)
  })

  it('takes off from a screen on its way out, the one the art was tapped on', () => {
    document.body.innerHTML = ''
    const cart = document.body.appendChild(document.createElement('div'))
    cart.setAttribute('data-leaving', '')
    const line = place(rect(10, 10, 76, 76), 'cart-line')
    cart.appendChild(line)
    place(rect(10, 200, 300, 300), 'card')

    expect(findThumb('espresso', { slot: 'cart-line', leaving: true })).toBe(line)
    expect(findThumb('espresso', { slot: 'cart-line' })).not.toBe(line)
  })
})

describe('settledRect', () => {
  it('takes the running entrance out of the box', () => {
    const sheet = art(rect(0, 64, 400, 800))
    const el = art(rect(60, 210, 300, 330))
    const settled = settledRect(el, sheet)
    expect([settled.left, settled.top, settled.width, settled.height]).toEqual([60, 146, 300, 330])
  })
})
