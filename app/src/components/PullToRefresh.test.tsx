import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PullToRefresh } from './PullToRefresh'

describe('PullToRefresh', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollY = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children content correctly', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )

    expect(screen.getByText('Menu Content')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'idle')
  })

  const pull = (wrapper: HTMLElement, dy: number) => {
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100, clientY: 10 + dy }] })
  }

  it('pulls, brims, refreshes, says the menu is fresh, then hides', async () => {
    vi.useFakeTimers()
    let resolveRefresh!: () => void
    const onRefresh = vi.fn(() => new Promise<void>((r) => (resolveRefresh = r)))
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} threshold={50}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )
    const wrapper = container.firstChild as HTMLElement
    const status = screen.getByRole('status')

    pull(wrapper, 100)
    expect(status).toHaveAttribute('data-state', 'ready')
    expect(status).toHaveTextContent('Отпустите, чтобы обновить меню')

    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(status).toHaveAttribute('data-state', 'refreshing')
    expect(status).toHaveTextContent('Обновляем меню')

    await act(async () => resolveRefresh())
    expect(status).toHaveAttribute('data-state', 'done')
    expect(status).toHaveTextContent('Меню обновлено')

    act(() => vi.advanceTimersByTime(1000))
    expect(status).toHaveAttribute('data-state', 'idle')
    expect(status.style.opacity).toBe('0')
    vi.useRealTimers()
  })

  it('says so when the menu could not be fetched', async () => {
    const onRefresh = vi.fn(() => Promise.reject(new Error('offline')))
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} threshold={50}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )
    const wrapper = container.firstChild as HTMLElement
    pull(wrapper, 100)
    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('data-state', 'error')
    expect(status).toHaveTextContent('Нет связи')
  })

  it('moves the pill only vertically, so the CSS centring holds', () => {
    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()} threshold={50}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )
    pull(container.firstChild as HTMLElement, 40)
    const status = screen.getByRole('status')
    expect(status).toHaveClass('ui-ptr')
    expect(status.style.transform).toMatch(/^translate3d\(0, -?[\d.]+px, 0\)$/)
  })

  it('does not trigger onRefresh when pulled less than threshold', async () => {
    const onRefresh = vi.fn()
    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} threshold={60}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )
    const wrapper = container.firstChild as HTMLElement
    const status = screen.getByRole('status')

    pull(wrapper, 15)
    expect(status).toHaveAttribute('data-state', 'pulling')

    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })
    expect(onRefresh).not.toHaveBeenCalled()
    expect(status).toHaveAttribute('data-state', 'idle')
  })

  it('does not trigger onRefresh when disabled', async () => {
    const onRefresh = vi.fn()

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh} disabled={true}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )

    const wrapper = container.firstChild as HTMLElement

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100, clientY: 150 }] })

    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })

    expect(onRefresh).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'idle')
  })

  it('ignores pull when page is already scrolled down', async () => {
    const onRefresh = vi.fn()
    window.scrollY = 40 // scrolled down

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )

    const wrapper = container.firstChild as HTMLElement

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100, clientY: 150 }] })

    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('ignores horizontal swipes like category tab navigation', async () => {
    const onRefresh = vi.fn()

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )

    const wrapper = container.firstChild as HTMLElement

    // Horizontal swipe: dx = 80, dy = 10
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100, clientY: 50 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 180, clientY: 60 }] })

    await act(async () => {
      fireEvent.touchEnd(wrapper)
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('triggers haptic feedback when crossing the threshold', () => {
    const vibrateSpy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    })

    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()} threshold={50}>
        <div>Menu Content</div>
      </PullToRefresh>,
    )

    const wrapper = container.firstChild as HTMLElement

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100, clientY: 110 }] })

    expect(vibrateSpy).toHaveBeenCalledTimes(1)
    expect(vibrateSpy).toHaveBeenCalledWith(12)
  })
})
