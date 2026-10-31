import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductPage } from './ProductPage'
import { AppProvider } from '../../state/AppProvider'
import { api } from '../../api'
import { catalogData } from '../../test/catalogFixture'

describe('ProductPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(api, 'getProfile').mockResolvedValue(null)
    vi.spyOn(api, 'getOrders').mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const renderAt = (path: string) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/" element={<div>menu-root</div>} />
            </Routes>
          </MemoryRouter>
        </AppProvider>
      </QueryClientProvider>,
    )
  }

  it('waits for the API menu on a deep link, then renders the product and its art', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    const { container } = renderAt('/product/cappuccino')

    expect(screen.getByRole('status', { name: 'Загружаем товар' })).toBeInTheDocument()
    expect(await screen.findByText('Капучино')).toBeInTheDocument()

    const artSvg = container.querySelector('svg[role="img"]')
    expect(artSvg?.getAttribute('data-art-of')).toBe('cappuccino')
    expect(screen.getByRole('button', { name: /Добавить в корзину/i })).toBeInTheDocument()
  })

  it('adds the configured product to the persisted cart', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')
    fireEvent.click(await screen.findByRole('button', { name: /Добавить в корзину/i }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    expect(JSON.parse(localStorage.getItem('zerno-cart')!)[0]).toMatchObject({ itemId: 'latte', variantId: 'm', qty: 1 })
  })

  it('goes back to the menu when the product does not exist on the server', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/ghost')
    expect(await screen.findByText('menu-root')).toBeInTheDocument()
  })

  it('counter add-ons from the API (syrups) use steppers and add one id per portion', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')
    fireEvent.click(await screen.findByRole('button', { name: /Сиропы/ }))
    const panel = await screen.findByRole('dialog', { name: 'Сиропы' }).catch(() => screen.getByLabelText('Сиропы'))
    fireEvent.click(within(panel).getByRole('button', { name: 'Ваниль: добавить порцию' }))
    fireEvent.click(within(panel).getByRole('button', { name: 'Ваниль: добавить порцию' }))
    // Stop-listed syrup from the server cannot be added.
    expect(within(panel).getByRole('button', { name: 'Карамель: добавить порцию' })).toBeDisabled()

    const add = screen.getByRole('button', { name: /Добавить в корзину за 330/ })
    fireEvent.click(add)
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    expect(JSON.parse(localStorage.getItem('zerno-cart')!)[0]).toMatchObject({ itemId: 'latte', ingredientIds: ['vanilla', 'vanilla'] })
  })

  it('single-choice add-ons (milk) toggle a tile', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')
    fireEvent.click(await screen.findByRole('button', { name: /Молоко/ }))
    const tile = await screen.findByRole('button', { name: /Овсяное/, pressed: false })
    fireEvent.click(tile)
    expect(await screen.findByRole('button', { name: /Добавить в корзину за 300/ })).toBeInTheDocument()
  })
})
