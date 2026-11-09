import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenEntry } from '../app/ScreenEntry'
import { Modal } from './Modal'
import { Presence } from './Presence'
import { Sheet } from './Sheet'

const panel = () => document.querySelector<HTMLElement>('[data-modal-panel]')!
const grabber = () => document.querySelector('.cursor-grab')!

describe('Modal', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const swipe = (distance: number) => {
    fireEvent.touchStart(grabber(), { touches: [{ clientY: 100 }] })
    fireEvent.touchMove(grabber(), { touches: [{ clientY: 100 + distance }] })
  }

  it('does not let content decide its height', () => {
    render(<Sheet label="Вход" onBack={() => {}}><p>Коротко</p></Sheet>)
    expect(panel().className).not.toMatch(/(^| )(wide:)?(max-)?h-/) // height lives in index.css, with a vh fallback
  })

  it('has nothing that blurs on a phone', () => {
    render(<Sheet label="Вход" onBack={() => {}}><p>Текст</p></Sheet>)
    const classes = [...document.querySelectorAll('[data-modal], [data-modal] *')].map((el) => el.getAttribute('class') ?? '')
    expect(classes.join(' ').split(/\s+/).filter((c) => c.startsWith('backdrop-blur'))).toEqual([])
  })

  it('holds the page still while open', () => {
    const { unmount } = render(<Modal label="Окно" onClose={() => {}}>x</Modal>)
    expect(document.documentElement).toHaveAttribute('data-scroll-lock')
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-scroll-lock')
  })

  it('closes on the backdrop and on Escape, but not while locked', () => {
    const onClose = vi.fn()
    const { rerender } = render(<Modal label="Окно" onClose={onClose}>x</Modal>)
    fireEvent.click(document.querySelector('[data-modal-backdrop]')!)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)

    rerender(<Modal label="Окно" onClose={onClose} locked>x</Modal>)
    fireEvent.click(document.querySelector('[data-modal-backdrop]')!)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('waits for the rise to finish, then focuses the panel and not its first button', () => {
    render(<Modal label="Окно" onClose={() => {}}><button>Закрыть</button></Modal>)
    act(() => void vi.advanceTimersByTime(300))
    expect(panel()).not.toHaveFocus()
    act(() => void vi.advanceTimersByTime(200))
    expect(panel()).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Закрыть' })).not.toHaveFocus()
  })

  const fieldModal = <Modal label="Окно" onClose={() => {}}><button>Назад</button><input aria-label="Телефон" data-autofocus /></Modal>
  const withPointer = (fine: boolean) => {
    const media = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...media(query), matches: fine }))
  }

  it('gives focus to the field that asks for it when there is a mouse', () => {
    withPointer(true)
    render(fieldModal)
    act(() => void vi.advanceTimersByTime(500))
    expect(screen.getByLabelText('Телефон')).toHaveFocus()
    vi.restoreAllMocks()
  })

  it('leaves the keyboard down on a touch screen until the field is tapped', () => {
    withPointer(false)
    render(fieldModal)
    act(() => void vi.advanceTimersByTime(500))
    expect(screen.getByLabelText('Телефон')).not.toHaveFocus()
    expect(panel()).toHaveFocus()
    vi.restoreAllMocks()
  })

  it('answers Escape only when it is on top', () => {
    const under = vi.fn()
    const over = vi.fn()
    const { rerender } = render(<Modal label="Вход" onClose={under}>{null}</Modal>)
    rerender(
      <Modal label="Вход" onClose={under}>
        <Modal label="Оферта" onClose={over}>x</Modal>
      </Modal>,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(over).toHaveBeenCalledOnce()
    expect(under).not.toHaveBeenCalled()
  })

  it('rises once per screen, however often what is inside it is replaced', () => {
    const Skeleton = () => <Modal label="Корзина" onClose={() => {}}>грузим</Modal>
    const Cart = () => <Modal label="Корзина" onClose={() => {}}>товары</Modal>
    const { rerender } = render(<ScreenEntry leaving={false} onLeft={() => {}}><Skeleton /></ScreenEntry>)
    expect(document.querySelector('[data-modal]')).not.toHaveAttribute('data-modal-settled')

    rerender(<ScreenEntry leaving={false} onLeft={() => {}}><Cart /></ScreenEntry>)
    expect(document.querySelector('[data-modal]')).toHaveAttribute('data-modal-settled')
  })

  it('follows the finger without re-rendering, and springs back from a short swipe', () => {
    const onClose = vi.fn()
    render(<Modal label="Окно" onClose={onClose}>x</Modal>)

    swipe(60)
    expect(panel().style.transform).toBe('translateY(60px)')

    fireEvent.touchEnd(grabber())
    expect(panel().style.transform).toBe('')
    act(() => void vi.advanceTimersByTime(500))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('rises when it opens over a calm page, dissolves in when it takes over from a leaving screen', () => {
    const { unmount } = render(<Modal label="Окно" onClose={() => {}}>x</Modal>)
    expect(document.querySelector('[data-modal]')).not.toHaveAttribute('data-modal-swap')
    unmount()

    render(
      <>
        <ScreenEntry leaving onLeft={() => {}}><Modal label="Товар" onClose={() => {}}>x</Modal></ScreenEntry>
        <Modal label="Корзина" onClose={() => {}}>y</Modal>
      </>,
    )
    expect(screen.getByRole('dialog', { name: 'Корзина' })).toHaveAttribute('data-modal-swap')
    // The one it takes over from holds still underneath instead of dropping away.
    expect(screen.getByRole('dialog', { name: 'Товар' })).toHaveAttribute('data-modal-replaced')
  })

  it('does not follow an upward drag', () => {
    render(<Modal label="Окно" onClose={() => {}}>x</Modal>)
    swipe(-80)
    expect(panel().style.transform).toBe('translateY(0px)')
  })

  it('slides away and closes on a long swipe', () => {
    const onClose = vi.fn()
    render(<Modal label="Окно" onClose={onClose}>x</Modal>)

    swipe(200)
    fireEvent.touchEnd(grabber())
    expect(panel().style.transform).toBe('translateY(100%)')

    act(() => void vi.advanceTimersByTime(200))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has no grabber when it covers the whole screen', () => {
    render(<Modal label="Окно" onClose={() => {}} kind="screen">x</Modal>)
    expect(document.querySelector('.cursor-grab')).toBeNull()
  })
})

describe('Presence', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function Host() {
    const [open, setOpen] = useState(true)
    return (
      <>
        <button onClick={() => setOpen((v) => !v)}>toggle</button>
        <Presence>{open && <Modal label="Окно" onClose={() => {}}>x</Modal>}</Presence>
      </>
    )
  }

  it('keeps the modal for its exit, then removes it', () => {
    render(<Host />)
    expect(document.querySelector('[data-leaving]')).toBeNull()

    fireEvent.click(screen.getByText('toggle'))
    expect(document.querySelector('[data-leaving] [data-modal]')).toBeInTheDocument()

    act(() => void vi.advanceTimersByTime(400))
    expect(document.querySelector('[data-modal]')).toBeNull()
  })

  const withExit = (finished: Promise<unknown>) => {
    Element.prototype.getAnimations = () => [{ finished } as unknown as Animation]
  }
  afterEach(() => {
    // jsdom has no Web Animations: drop the stub again
    delete (Element.prototype as Partial<Element>).getAnimations
  })

  it('waits for the exit to play out, however long a stalled phone takes to start it', async () => {
    let finish = () => {}
    withExit(new Promise<void>((resolve) => (finish = resolve)))
    render(<Host />)

    fireEvent.click(screen.getByText('toggle'))
    act(() => void vi.advanceTimersByTime(1000))
    expect(document.querySelector('[data-modal]')).toBeInTheDocument()

    await act(async () => finish())
    expect(document.querySelector('[data-modal]')).toBeNull()
  })

  it('does not wait forever for an animation that never ends', () => {
    withExit(new Promise(() => {}))
    render(<Host />)

    fireEvent.click(screen.getByText('toggle'))
    act(() => void vi.advanceTimersByTime(1600))
    expect(document.querySelector('[data-modal]')).toBeNull()
  })

  it('ignores Escape on the way out', () => {
    const onClose = vi.fn()
    function Closing() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button onClick={() => setOpen(false)}>close</button>
          <Presence>{open && <Modal label="Окно" onClose={onClose}>x</Modal>}</Presence>
        </>
      )
    }
    render(<Closing />)
    fireEvent.click(screen.getByText('close'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('brings the modal straight back if reopened during the exit', () => {
    render(<Host />)
    fireEvent.click(screen.getByText('toggle'))
    fireEvent.click(screen.getByText('toggle'))
    act(() => void vi.advanceTimersByTime(400))
    expect(document.querySelector('[data-modal]')).toBeInTheDocument()
    expect(document.querySelector('[data-leaving]')).toBeNull()
  })
})
