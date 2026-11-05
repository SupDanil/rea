import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NutritionBar } from './NutritionBar'

describe('NutritionBar Component', () => {
  it('renders kcal button and unfolds detailed BJU modal on click', () => {
    const nutrition = { kcal: 150, protein: 7, fat: 6, carbs: 12 }
    render(<NutritionBar nutrition={nutrition} />)

    expect(screen.getByRole('button', { name: /Пищевая ценность: 150 ккал/i })).toBeInTheDocument()

    // Unfold BJU modal
    fireEvent.click(screen.getByRole('button', { name: /Пищевая ценность/i }))
    expect(screen.getByRole('region', { name: 'Подробный состав БЖУ' })).toBeInTheDocument()
    expect(screen.getByText(/белки/i)).toBeInTheDocument()
    expect(screen.getByText(/жиры/i)).toBeInTheDocument()
    expect(screen.getByText(/углеводы/i)).toBeInTheDocument()
  })

  it('renders animated delta badge below the button when kcal changes, without covering top controls', () => {
    const { rerender } = render(<NutritionBar nutrition={{ kcal: 150, protein: 7, fat: 6, carbs: 12 }} />)

    // Initial render: no delta badge
    expect(screen.queryByText(/\+.*ккал/)).not.toBeInTheDocument()

    // Update with +40 kcal (e.g. syrup added)
    rerender(<NutritionBar nutrition={{ kcal: 190, protein: 7, fat: 6, carbs: 22 }} />)

    const deltaBadge = screen.getByText('+40 ккал')
    expect(deltaBadge).toBeInTheDocument()
    // Positioned below the button so it never covers the temperature/size buttons above
    expect(deltaBadge.className).toContain('top-[calc(100%+4px)]')
    expect(deltaBadge.className).toContain('animate-[delta-float-down_1.1s_var(--ease-soft)_both]')
  })
})
