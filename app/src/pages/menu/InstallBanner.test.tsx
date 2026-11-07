import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InstallBanner } from './InstallBanner'

describe('InstallBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders install banner on main screen', () => {
    render(<InstallBanner onOpenGuide={vi.fn()} />)

    expect(screen.getByRole('region', { name: /Предложение установить приложение/i })).toBeInTheDocument()
    expect(screen.getByText('Установите shit кофе')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Установить' })).toBeInTheDocument()
  })

  it('calls onOpenGuide when clicked and no native prompt is ready', async () => {
    const onOpenGuide = vi.fn()
    render(<InstallBanner onOpenGuide={onOpenGuide} />)

    fireEvent.click(screen.getByRole('button', { name: 'Установить' }))

    // Let promptInstall promise resolve
    await vi.waitFor(() => {
      expect(onOpenGuide).toHaveBeenCalled()
    })
  })

  it('dismisses banner on close button click', () => {
    render(<InstallBanner onOpenGuide={vi.fn()} />)

    const closeBtn = screen.getByRole('button', { name: /Скрыть предложение/i })
    fireEvent.click(closeBtn)

    expect(screen.queryByRole('region', { name: /Предложение установить приложение/i })).not.toBeInTheDocument()
    expect(localStorage.getItem('shit_coffee_pwa_banner_dismissed')).toBe('true')
  })
})
