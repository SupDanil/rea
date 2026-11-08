import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  _resetPwaUpdateState,
  _setPwaUpdateState,
  _setStandaloneOverride,
} from '../hooks/usePwaUpdate'
import { UpdateModal } from './UpdateModal'

describe('UpdateModal', () => {
  afterEach(() => {
    _resetPwaUpdateState()
  })

  it('renders nothing when needRefresh is false', () => {
    const { container } = render(<UpdateModal needRefresh={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render in regular browser mode when using hook state', () => {
    _resetPwaUpdateState()
    _setStandaloneOverride(false)
    _setPwaUpdateState({ needRefresh: true })

    const { container } = render(<UpdateModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders in PWA standalone mode when an update is available', () => {
    _resetPwaUpdateState()
    _setStandaloneOverride(true)
    _setPwaUpdateState({ needRefresh: true })

    render(<UpdateModal />)
    expect(screen.getByRole('alertdialog', { name: 'Доступно обновление' })).toBeInTheDocument()
  })

  it('renders alertdialog with title, text, and update controls', () => {
    const onUpdate = vi.fn()
    const onDismiss = vi.fn()

    render(
      <UpdateModal
        needRefresh={true}
        isUpdating={false}
        onUpdate={onUpdate}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByRole('alertdialog', { name: 'Доступно обновление' })).toBeInTheDocument()
    expect(screen.getByText('Доступно обновление')).toBeInTheDocument()
    expect(screen.getByText(/Вышла новая версия/)).toBeInTheDocument()

    const updateBtn = screen.getByRole('button', { name: 'Обновить' })
    const laterBtn = screen.getByRole('button', { name: 'Позже' })

    expect(updateBtn).toBeInTheDocument()
    expect(laterBtn).toBeInTheDocument()

    fireEvent.click(updateBtn)
    expect(onUpdate).toHaveBeenCalledTimes(1)

    fireEvent.click(laterBtn)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows loading state and disables buttons when isUpdating is true', () => {
    render(
      <UpdateModal
        needRefresh={true}
        isUpdating={true}
        onUpdate={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )

    const updateBtn = screen.getByRole('button', { name: 'Обновляем…' })
    const laterBtn = screen.getByRole('button', { name: 'Позже' })

    expect(updateBtn).toBeDisabled()
    expect(laterBtn).toBeDisabled()
  })

  it('dismisses when clicking the backdrop overlay', () => {
    const onDismiss = vi.fn()

    const { container } = render(
      <UpdateModal
        needRefresh={true}
        isUpdating={false}
        onUpdate={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    // Backdrop is the root container div
    const backdrop = container.firstElementChild as HTMLElement
    fireEvent.click(backdrop)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss when clicking inside the dialog card', () => {
    const onDismiss = vi.fn()

    render(
      <UpdateModal
        needRefresh={true}
        isUpdating={false}
        onUpdate={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    const dialog = screen.getByRole('alertdialog', { name: 'Доступно обновление' })
    fireEvent.click(dialog)

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismisses on Escape key', () => {
    const onDismiss = vi.fn()

    render(
      <UpdateModal
        needRefresh={true}
        isUpdating={false}
        onUpdate={vi.fn()}
        onDismiss={onDismiss}
      />,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
