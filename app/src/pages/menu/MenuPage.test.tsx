import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { catalogData, testShop } from '../../test/catalogFixture'
import { renderApp } from '../../test/renderApp'

describe('MenuPage (API-driven menu)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const bootScreen = () => {
    const boot = document.body.appendChild(document.createElement('div'))
    boot.id = 'boot'
    boot.setAttribute('role', 'status')
    boot.setAttribute('aria-label', 'Загружаем меню')
    return boot
  }

  it('lets the launch screen go when the menu cannot load, to show why', async () => {
    const boot = bootScreen()
    renderApp('/', { getCatalog: () => Promise.reject(new Error('offline')) })

    await waitFor(() => expect(boot).toHaveAttribute('data-gone'))
    boot.remove()
  })

  it('keeps the launch screen while the menu loads, then hands over to categories and products', async () => {
    const boot = bootScreen()
    let resolve!: (v: typeof catalogData) => void
    renderApp('/', { getCatalog: () => new Promise((r) => (resolve = r)) })

    expect(screen.getByRole('status', { name: 'Загружаем меню' })).toBeInTheDocument()
    expect(boot).not.toHaveAttribute('data-gone')

    resolve(catalogData)
    await waitFor(() => expect(boot).toHaveAttribute('data-gone'))
    boot.remove()
    const nav = await screen.findByRole('navigation', { name: 'Категории меню' })
    expect(within(nav).getAllByRole('tab').map((t) => t.textContent)).toEqual(expect.arrayContaining(['Кофе', 'Еда']))
    expect(within(nav).getAllByRole('tab', { selected: true }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'С молоком' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Латте, от/ })).toBeInTheDocument()
  })

  it('marks sold-out products from the server stop-list', async () => {
    renderApp('/')
    expect(await screen.findByRole('button', { name: /Печенье.*закончилось/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Круассан/ })).toBeInTheDocument()
  })

  it('preserves server category and product order with promo pinned before products', async () => {
    renderApp('/', { getCatalog: async () => ({
      ...catalogData,
      categories: [...catalogData.categories].reverse(),
      items: [...catalogData.items].reverse(),
      promos: [{ id: 'p-order', title: 'Промо кофе', placement: 'category', categoryId: 'milk-coffee', targetType: 'article', sort: 1 }],
    }) })
    const nav = await screen.findByRole('navigation', { name: 'Категории меню' })
    expect(within(nav).getAllByRole('tablist')[0].textContent).toBe('ЕдаКофе')
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Выпечка', 'Чёрный', 'С молоком'])
    const section = screen.getByRole('heading', { name: 'С молоком' }).closest('section')!
    const controls = within(section).getAllByRole('button')
    expect(controls[0]).toHaveAccessibleName('Подробнее: Промо кофе')
    expect(controls.filter((button) => /^(Латте|Капучино), от/.test(button.getAttribute('aria-label') ?? '')).map((button) => button.getAttribute('aria-label')))
      .toEqual(['Латте, от 230 ₽', 'Капучино, от 210 ₽'])
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

  it('opens a product and adds it to cart, showing the cart total computed from live prices', async () => {
    const { router } = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: /^Круассан/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/croissant'))
    fireEvent.click(await screen.findByRole('button', { name: /^Добавить в корзину/ }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')).toHaveLength(1))
    await waitFor(() => expect(document.querySelector('[data-cart-target="dock"]')).toHaveTextContent(/1\s*Корзина\s*160/))
  })

  it('hides the cart dock when navigating to the cart page so it does not stay on screen', async () => {
    const { router } = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: /^Круассан/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/product/croissant'))
    fireEvent.click(await screen.findByRole('button', { name: /^Добавить в корзину/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    await waitFor(() => expect(document.querySelector('[data-cart-target="dock"]')).toBeInTheDocument())
    const dockButton = document.querySelector<HTMLElement>('[data-cart-target="dock"]')!
    const dockContainer = dockButton.parentElement!
    await waitFor(() => expect(dockContainer).not.toHaveClass('opacity-0'))
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

  it('renders flat categories without subcategories on the home screen and navigates to them', async () => {
    const catalogWithToys: typeof catalogData = {
      ...catalogData,
      categories: [
        ...catalogData.categories,
        { id: 'toys', name: 'Игрушки' },
      ],
      items: [
        ...catalogData.items,
        {
          id: 'rabbit-toy',
          name: 'Мягкий заяц на стакан',
          description: 'Мягкий спутник для стакана',
          composition: 'Текстиль',
          categoryId: 'toys',
          art: { kind: 'toy', fill: '#4a3869', bg: '#e8e6f5' },
          variants: [{ id: 'one', size: 'ONE', price: 450, nutrition: { kcal: 0, fat: 0, carbs: 0, protein: 0 } }],
          groupIds: [],
        },
      ],
    }

    renderApp('/', { getCatalog: async () => catalogWithToys })

    const nav = await screen.findByRole('navigation', { name: 'Категории меню' })
    const toysTab = within(nav).getByRole('tab', { name: 'Игрушки' })
    expect(toysTab).toBeInTheDocument()

    // Heading and product must be rendered on the main screen
    expect(screen.getByRole('heading', { name: 'Игрушки' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Мягкий заяц на стакан, от 450/ })).toBeInTheDocument()

    // Clicking the flat category tab should select it without crashing
    fireEvent.click(toysTab)
    expect(toysTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders correctly when catalog has only flat categories without subcategories', async () => {
    const onlyFlatCatalog: typeof catalogData = {
      categories: [{ id: 'toys', name: 'Игрушки' }],
      ingredientGroups: [],
      items: [
        {
          id: 'rabbit-toy',
          name: 'Мягкий заяц на стакан',
          description: 'Мягкий спутник для стакана',
          composition: 'Текстиль',
          categoryId: 'toys',
          art: { kind: 'toy', fill: '#4a3869', bg: '#e8e6f5' },
          variants: [{ id: 'one', size: 'ONE', price: 450, nutrition: { kcal: 0, fat: 0, carbs: 0, protein: 0 } }],
          groupIds: [],
        },
      ],
    }

    renderApp('/', { getCatalog: async () => onlyFlatCatalog })

    expect(await screen.findByRole('navigation', { name: 'Категории меню' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Игрушки' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Мягкий заяц на стакан/ })).toBeInTheDocument()
    expect(screen.queryByText('Меню пока пустое')).toBeNull()
  })

  it('triggers catalog refresh on pull-down gesture on the menu page', async () => {
    let refreshCalls = 0
    const { spies } = renderApp('/', {
      getCatalog: async () => {
        refreshCalls++
        return catalogData
      },
    })

    expect(await screen.findByRole('navigation', { name: 'Категории меню' })).toBeInTheDocument()
    expect(refreshCalls).toBe(1)

    const status = screen.getByRole('status')
    const pageWrapper = status.parentElement as HTMLElement

    // Pull down beyond threshold
    fireEvent.touchStart(pageWrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(pageWrapper, { touches: [{ clientX: 100, clientY: 120 }] })
    expect(status).toHaveAttribute('data-state', 'ready')

    await act(async () => {
      fireEvent.touchEnd(pageWrapper)
    })

    await waitFor(() => {
      expect(refreshCalls).toBeGreaterThanOrEqual(2)
      expect(spies.getShops).toHaveBeenCalled()
    })
  })

  it('disables pull-to-refresh when navigating away to another page (like /cart)', async () => {
    let refreshCalls = 0
    renderApp('/cart', {
      getCatalog: async () => {
        refreshCalls++
        return catalogData
      },
    })

    const status = screen.getByRole('status')
    const pageWrapper = status.parentElement as HTMLElement

    // Pull down
    fireEvent.touchStart(pageWrapper, { touches: [{ clientX: 100, clientY: 10 }] })
    fireEvent.touchMove(pageWrapper, { touches: [{ clientX: 100, clientY: 120 }] })

    await act(async () => {
      fireEvent.touchEnd(pageWrapper)
    })

    // Should NOT have triggered any extra catalog refetch
    expect(status).toHaveAttribute('data-state', 'idle')
    expect(refreshCalls).toBe(1)
  })
})
