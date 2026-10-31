import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductPage } from './ProductPage'
import { AppProvider } from '../../state/AppProvider'

describe('ProductPage Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  it('renders product name and product cup illustration on open', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <MemoryRouter initialEntries={['/product/cappuccino']}>
            <Routes>
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </QueryClientProvider>
    )

    // Heading exists
    expect(screen.getByText('Капучино')).toBeInTheDocument()

    // SVG art exists and is rendered
    const artSvg = container.querySelector('svg[role="img"]')
    expect(artSvg).toBeInTheDocument()
    expect(artSvg?.getAttribute('data-art-of')).toBe('cappuccino')

    // Add to cart button is present
    expect(screen.getByRole('button', { name: /Добавить в корзину/i })).toBeInTheDocument()
  })
})
