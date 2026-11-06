import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route,Routes } from 'react-router'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../api'
import { AppProvider } from '../../state/AppProvider'
import { catalogData } from '../../test/catalogFixture'
import { ProductPage } from './ProductPage'

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
    const panel = await screen.findByRole('region', { name: 'Сиропы' }).catch(() => screen.getByLabelText('Сиропы'))
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

  it('displays vertical builder list of chosen addons on the right without horizontal chips', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')

    // Initially State A: no addons chosen, right list absent
    await screen.findByText('Латте')
    expect(screen.queryByRole('region', { name: 'Выбранные добавки' })).not.toBeInTheDocument()

    // Add Oat milk
    fireEvent.click(screen.getByRole('button', { name: /Молоко/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Овсяное/ }))

    // Now transitions to State B: vertical addons list appears with Oat milk
    const addonsList = await screen.findByRole('region', { name: 'Выбранные добавки' })
    expect(within(addonsList).getByText('Овсяное')).toBeInTheDocument()

    // Switch to syrups and add Vanilla
    fireEvent.click(screen.getByRole('button', { name: /Сиропы/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Ваниль: добавить порцию' }))

    // List now displays both toppings
    expect(within(addonsList).getByText('Овсяное')).toBeInTheDocument()
    expect(within(addonsList).getByText('Ваниль')).toBeInTheDocument()

    // Deleting via ✕ button in right list removes the topping completely
    const removeVanillaBtn = within(addonsList).getByRole('button', { name: 'Удалить Ваниль' })
    fireEvent.click(removeVanillaBtn)
    expect(within(addonsList).queryByText('Ваниль')).not.toBeInTheDocument()
    expect(within(addonsList).getByText('Овсяное')).toBeInTheDocument()

    // Deleting last topping returns to State A
    const removeOatBtn = within(addonsList).getByRole('button', { name: 'Удалить Овсяное' })
    fireEvent.click(removeOatBtn)
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Выбранные добавки' })).not.toBeInTheDocument()
    })
  })

  it('allows adding multiple distinct toppings in succession without resetting and saves to cart', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')

    // Add Oat milk
    fireEvent.click(await screen.findByRole('button', { name: /Молоко/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Овсяное/ }))

    // Switch to syrups and add Vanilla
    fireEvent.click(screen.getByRole('button', { name: /Сиропы/ }))
    const panel = await screen.findByRole('region', { name: 'Сиропы' })
    fireEvent.click(within(panel).getByRole('button', { name: 'Ваниль: добавить порцию' }))

    const addonsList = screen.getByRole('region', { name: 'Выбранные добавки' })
    expect(within(addonsList).getByText('Овсяное')).toBeInTheDocument()
    expect(within(addonsList).getByText('Ваниль')).toBeInTheDocument()

    // Add to cart confirms both ingredients are persisted
    fireEvent.click(screen.getByRole('button', { name: /Добавить в корзину/ }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    const item = JSON.parse(localStorage.getItem('zerno-cart')!)[0]
    expect(item.ingredientIds).toContain('oat')
    expect(item.ingredientIds).toContain('vanilla')
  })

  it('switches temperature between hot and cold and persists chosen temperature to cart', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')

    const hotBtn = await screen.findByRole('radio', { name: 'Горячий' })
    const coldBtn = screen.getByRole('radio', { name: 'Холодный' })

    expect(hotBtn).toBeInTheDocument()
    expect(coldBtn).toBeInTheDocument()
    expect(hotBtn).toHaveAttribute('aria-checked', 'true')
    expect(coldBtn).toHaveAttribute('aria-checked', 'false')

    // Switch to cold
    fireEvent.click(coldBtn)
    expect(coldBtn).toHaveAttribute('aria-checked', 'true')
    expect(hotBtn).toHaveAttribute('aria-checked', 'false')

    // Add to cart
    fireEvent.click(screen.getByRole('button', { name: /Добавить в корзину/ }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    const item = JSON.parse(localStorage.getItem('zerno-cart')!)[0]
    expect(item.temperature).toBe('cold')
  })

  it('cycles selected controls and displays current portion nutrition inside info', async () => {
    vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    renderAt('/product/latte')
    const hot = await screen.findByRole('radio', { name: 'Горячий' })
    fireEvent.click(hot)
    expect(screen.getByRole('radio', { name: 'Холодный' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Холодный' }))
    expect(hot).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByRole('region', { name: 'Пищевая ценность' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'О напитке' }))
    const details = screen.getByRole('region', { name: 'О напитке' })
    expect(within(details).getByLabelText('энергия: 150 ккал')).toBeInTheDocument()
    expect(within(details).getByText('Мягкий кофе с молоком')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть описание' }))
    fireEvent.click(screen.getByRole('radio', { name: 'M 300 мл' }))
    expect(screen.getByRole('radio', { name: 'L 400 мл' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Сиропы/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ваниль: добавить порцию' }))
    fireEvent.click(screen.getByRole('button', { name: 'О напитке' }))
    expect(screen.getByLabelText('энергия: 220 ккал')).toBeInTheDocument()
    expect(screen.getByLabelText('белки: 9 г')).toBeInTheDocument()
    expect(screen.getByLabelText('жиры: 9 г')).toBeInTheDocument()
    expect(screen.getByLabelText('углеводы: 20 г')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'О напитке' })).not.toBeInTheDocument()
    expect(hot).toBeInTheDocument()
  })

  it('displays snowflake indicator when item has temperatureMode="cold" and nothing when temperatureMode="hot"', async () => {
    const coldOnlyCatalog = {
      ...catalogData,
      items: [
        {
          ...catalogData.items[0],
          id: 'cold-brew',
          name: 'Колд Брю',
          temperatureMode: 'cold' as const,
        },
      ],
    }
    vi.spyOn(api, 'getCatalog').mockResolvedValue(coldOnlyCatalog)
    renderAt('/product/cold-brew')

    expect(await screen.findByLabelText('Холодный напиток')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Горячий' })).not.toBeInTheDocument()

    // Add to cart saves cold
    fireEvent.click(screen.getByRole('button', { name: /Добавить в корзину/ }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    const item = JSON.parse(localStorage.getItem('zerno-cart')!)[0]
    expect(item.temperature).toBe('cold')
  })

  it('shows no temperature indicator when item is only hot (temperatureMode="hot")', async () => {
    const hotOnlyCatalog = {
      ...catalogData,
      items: [
        {
          ...catalogData.items[0],
          id: 'espresso',
          name: 'Эспрессо',
          temperatureMode: 'hot' as const,
        },
      ],
    }
    vi.spyOn(api, 'getCatalog').mockResolvedValue(hotOnlyCatalog)
    renderAt('/product/espresso')

    await screen.findByText('Эспрессо')
    expect(screen.queryByLabelText('Холодный напиток')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Горячий' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Холодный' })).not.toBeInTheDocument()
  })
})
