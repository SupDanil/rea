import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InstallGuideSheet } from './InstallGuideSheet'

describe('InstallGuideSheet', () => {
  it('renders title, steps and close button', () => {
    const onClose = vi.fn()
    render(<InstallGuideSheet onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: /Как установить/i })).toBeInTheDocument()
    expect(screen.getByText('shit кофе')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Понятно' })).toBeInTheDocument()
  })

  it('allows toggling between iOS and Android tabs', () => {
    render(<InstallGuideSheet onClose={vi.fn()} />)

    const androidTab = screen.getByRole('radio', { name: /Android/i })
    fireEvent.click(androidTab)

    expect(screen.getByText('Окно установки')).toBeInTheDocument()
    expect(screen.getByText('Или меню Chrome (⋮)')).toBeInTheDocument()

    const iosTab = screen.getByRole('radio', { name: /iOS/i })
    fireEvent.click(iosTab)

    expect(screen.getByText('Нажмите «Поделиться»')).toBeInTheDocument()
    expect(screen.getByText('«На экран „Домой“»')).toBeInTheDocument()
  })

  it('calls onClose when clicking action or close', () => {
    const onClose = vi.fn()
    render(<InstallGuideSheet onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Понятно' }))
    expect(onClose).toHaveBeenCalled()
  })
})
