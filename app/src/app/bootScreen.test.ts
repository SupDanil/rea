import { afterEach, describe, expect, it, vi } from 'vitest'
import { dismissBootScreen } from './bootScreen'

describe('dismissBootScreen', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('fades the launch screen out, then takes it off the page', () => {
    vi.useFakeTimers()
    const boot = document.body.appendChild(document.createElement('div'))
    boot.id = 'boot'

    dismissBootScreen()
    expect(boot).toHaveAttribute('data-gone')
    expect(boot.isConnected).toBe(true)

    boot.dispatchEvent(new Event('transitionend'))
    expect(boot.isConnected).toBe(false)
  })

  it('does not wait for a transition that never runs', () => {
    vi.useFakeTimers()
    const boot = document.body.appendChild(document.createElement('div'))
    boot.id = 'boot'

    dismissBootScreen()
    vi.advanceTimersByTime(600)
    expect(boot.isConnected).toBe(false)
  })

  it('hands the page and the status bar from the splash colour to the theme', () => {
    const boot = document.body.appendChild(document.createElement('div'))
    boot.id = 'boot'
    const meta = document.head.appendChild(document.createElement('meta'))
    meta.name = 'theme-color'
    meta.content = '#16120F'
    document.documentElement.dataset.themeBg = '#EDE8DF'

    dismissBootScreen()
    expect(document.documentElement.style.backgroundColor).toBe('rgb(237, 232, 223)')
    expect(meta.content).toBe('#EDE8DF')
    meta.remove()
    delete document.documentElement.dataset.themeBg
  })

  it('is harmless with no launch screen, or called twice', () => {
    expect(() => {
      dismissBootScreen()
      dismissBootScreen()
    }).not.toThrow()
  })
})
