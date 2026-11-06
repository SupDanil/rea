import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NutritionBar } from './NutritionBar'

describe('NutritionBar', () => {
  it('shows portion values and updates all nutrients with the configured recipe', () => {
    const { rerender } = render(<NutritionBar nutrition={{ kcal: 150, protein: 7, fat: 6, carbs: 12 }} />)
    expect(screen.getByLabelText('энергия: 150 ккал')).toBeInTheDocument()
    expect(screen.getByLabelText('белки: 7 г')).toBeInTheDocument()
    expect(screen.getByLabelText('жиры: 6 г')).toBeInTheDocument()
    expect(screen.getByLabelText('углеводы: 12 г')).toBeInTheDocument()

    rerender(<NutritionBar nutrition={{ kcal: 190, protein: 8, fat: 7, carbs: 22 }} />)
    expect(screen.getByLabelText('энергия: 190 ккал')).toBeInTheDocument()
    expect(screen.getByLabelText('белки: 8 г')).toBeInTheDocument()
    expect(screen.getByLabelText('жиры: 7 г')).toBeInTheDocument()
    expect(screen.getByLabelText('углеводы: 22 г')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
