import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type IOCallback = (entries: { target: Element; isIntersecting: boolean }[]) => void

let ioCallback: IOCallback
const observe = vi.fn()

function mockEnv({ coarse = true, reduced = false } = {}) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('coarse') ? coarse : q.includes('reduce') ? reduced : false }))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IOCallback) { ioCallback = cb }
    observe = observe
    unobserve = vi.fn()
  })
  vi.stubGlobal('DeviceOrientationEvent', class {})
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number)
}

const orient = (beta: number, gamma: number) =>
  window.dispatchEvent(Object.assign(new Event('deviceorientation'), { beta, gamma }))

describe('tilt', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    observe.mockClear()
    delete document.documentElement.dataset.tilt
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('does nothing on a desktop', async () => {
    mockEnv({ coarse: false })
    const { trackTilt } = await import('./tilt')
    trackTilt(document.createElement('div'))
    orient(40, 10)
    expect(observe).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.tilt).toBeUndefined()
  })

  it('writes the tilt onto visible elements only, never on <html>', async () => {
    mockEnv()
    const { trackTilt } = await import('./tilt')
    const shown = document.createElement('div')
    const hidden = document.createElement('div')
    trackTilt(shown)
    trackTilt(hidden)
    ioCallback([{ target: shown, isIntersecting: true }, { target: hidden, isIntersecting: false }])

    orient(45, 0) // resting angle
    orient(45, 9) // half a tilt to the right
    vi.advanceTimersByTime(2000)

    expect(document.documentElement.dataset.tilt).toBe('')
    expect(Number(shown.style.getPropertyValue('--tilt-x'))).toBeGreaterThan(0.3)
    expect(hidden.style.getPropertyValue('--tilt-x')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--tilt-x')).toBe('')
  })

  it('ignores hand jitter', async () => {
    mockEnv()
    const { trackTilt } = await import('./tilt')
    const el = document.createElement('div')
    trackTilt(el)
    ioCallback([{ target: el, isIntersecting: true }])
    orient(45, 0)
    orient(45.1, 0.1)
    vi.advanceTimersByTime(2000)
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.000')
  })

  it('levels the card out once the phone is held still', async () => {
    mockEnv()
    const { trackTilt } = await import('./tilt')
    const el = document.createElement('div')
    trackTilt(el)
    ioCallback([{ target: el, isIntersecting: true }])
    orient(45, 0)
    orient(45, 9) // turned
    vi.advanceTimersByTime(500)
    expect(Number(el.style.getPropertyValue('--tilt-x'))).toBeGreaterThan(0.3)

    for (let i = 0; i < 120; i++) orient(45, 9) // ~2 s held still in the new grip
    vi.advanceTimersByTime(3000)
    expect(Math.abs(Number(el.style.getPropertyValue('--tilt-x')))).toBeLessThan(0.05)
  })

  it('stays off with reduced motion', async () => {
    mockEnv({ reduced: true })
    const { trackTilt } = await import('./tilt')
    trackTilt(document.createElement('div'))
    expect(observe).not.toHaveBeenCalled()
  })
})
