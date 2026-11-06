import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { catalogData, testShop } from '../../test/catalogFixture'
import { renderApp } from '../../test/renderApp'

describe('MenuPage (API-driven menu)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('shows a skeleton while the menu loads, then categories and products from the API', async () => {
    let resolve!: (v: typeof catalogData) => void
    renderApp('/', { getCatalog: () => new Promise((r) => (resolve = r)) })

    expect(screen.getByRole('status', { name: 'Загружаем меню' })).toBeInTheDocument()

    resolve(catalogData)
    const nav = await screen.findByRole('navigation', { name: 'Категории меню' })
    expect(within(nav).getAllByRole('tab').map((t) => t.textContent)).toEqual(expect.arrayContaining(['Кофе', 'Еда']))
    expect(within(nav).getAllByRole('tab', { selected: true }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'С молоком' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Латте, от/ })).toBeInTheDocument()
  })

  it('marks sold-out products from the server stop-list and hides their quick add', async () => {
    renderApp('/')
    expect(await screen.findByRole('button', { name: /Печенье, от .*, закончилось/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Добавить «Печенье» в корзину' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Добавить «Круассан» в корзину' })).toBeInTheDocument()
  })

  it('shows the main promo banner when provided by the API', async () => {
    const promoCatalog: typeof catalogData = {
      ...catalogData,
      promos: [
        {
          id: 'promo-1',
          title: 'Капучино',
          subtitle: 'шелковистая текстура',
          badge: 'Рекомендуем',
          placement: 'main',
          targetType: 'product',
          targetProductId: 'cappuccino',
          sort: 1,
          isActive: true,
        },
      ],
    }
    renderApp('/', { getCatalog: async () => promoCatalog })
    await screen.findByRole('navigation', { name: 'Категории меню' })
    expect(screen.getByText('Рекомендуем')).toBeInTheDocument()
  })

  it('offers a retry when the API is down and recovers on success', async () => {
    const getCatalog = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(catalogData)
    renderApp('/', { getCatalog })

    expect(await screen.findByText('Меню не загрузилось')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }))
    expect(await screen.findByRole('navigation', { name: 'Категории меню' })).toBeInTheDocument()
    expect(getCatalog).toHaveBeenCalledTimes(2)
  })

  it('shows an empty-menu message when the server has nothing published', async () => {
    renderApp('/', { getCatalog: async () => ({ items: [], categories: [], ingredientGroups: [] }) })
    expect(await screen.findByText('Меню пока пустое')).toBeInTheDocument()
  })

  it('quick-adds a product and shows the cart total computed from live prices', async () => {
    renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: 'Добавить «Круассан» в корзину' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    await waitFor(() => expect(document.querySelector('[data-cart-target="dock"]')).toHaveTextContent(/1\s*Корзина\s*160/))
  })

  it('hides the cart dock when navigating to the cart page so it does not stay on screen', async () => {
    const { router } = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: 'Добавить «Круассан» в корзину' }))
    await waitFor(() => expect(document.querySelector('[data-cart-target="dock"]')).toBeInTheDocument())
    const dockButton = document.querySelector<HTMLElement>('[data-cart-target="dock"]')!
    const dockContainer = dockButton.parentElement!
    expect(dockContainer).not.toHaveClass('opacity-0')
    expect(dockContainer).toHaveClass('z-20')

    fireEvent.click(dockButton)
    await waitFor(() => expect(router.state.location.pathname).toBe('/cart'))
    expect(dockContainer).toHaveClass('opacity-0')
    expect(dockContainer).toHaveClass('translate-y-24')
    expect(dockContainer).toHaveAttribute('aria-hidden', 'true')
  })

  it('opens the product screen from a card', async () => {
    const { router } = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: /^Латте, от/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/latte'))
  })

  it('every category tab is clickable without crashing', async () => {
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Категории меню' })
    for (const tab of within(nav).getAllByRole('tab')) fireEvent.click(tab)
    expect(nav).toBeInTheDocument()
  })

  it('shows the shop address and hours from /api/v1/shops in the header', async () => {
    renderApp('/')
    const shop = await screen.findByRole('button', { name: 'shit кофе: Невский проспект, 12, до 23:59' })
    expect(within(shop).getByText('Невский проспект, 12')).toBeInTheDocument()
    const status = within(shop).getByText('до 23:59')
    expect(status).toHaveAttribute('data-shop-status', 'open')
  })

  it('shows a paused shop in the header', async () => {
    renderApp('/', { getShops: async () => [{ ...testShop, isAccepting: false, pauseReason: 'санитарный час' }] })
    const status = await screen.findByText(/заказы на паузе/)
    expect(status).toHaveAttribute('data-shop-status', 'paused')
  })
})
