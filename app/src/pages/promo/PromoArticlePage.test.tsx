import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import type { CatalogData, Promotion } from '../../domain'
import { catalogData } from '../../test/catalogFixture'
import { renderApp } from '../../test/renderApp'

describe('PromoArticlePage (Dedicated Promo Story & Product Links)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const testPromo: Promotion = {
    id: 'promo-special-beans',
    title: 'Зерно недели: Эфиопия Иргачефф',
    subtitle: 'Цветочные ноты, бергамот и абрикос',
    badge: 'Новинка',
    placement: 'main',
    targetType: 'article',
    content: 'Мы привезли уникальный лот свежего урожая анаэробной обработки из региона Иргачефф. Попробуйте в капучино и фильтре!',
    imageUrl: 'https://example.com/ethiopia.jpg',
    bgColor: '#3D2C55',
    productIds: ['cappuccino', 'latte'],
    sort: 1,
    isActive: true,
  }

  const catalogWithPromo: CatalogData = {
    ...catalogData,
    promos: [testPromo],
  }

  it('renders promo article details, cover and attached product cards with + buttons', async () => {
    renderApp('/promo/promo-special-beans', {
      getCatalog: async () => catalogWithPromo,
    })

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Зерно недели: Эфиопия Иргачефф')).toBeInTheDocument()
    expect(within(dialog).getByText('Цветочные ноты, бергамот и абрикос')).toBeInTheDocument()
    expect(within(dialog).getByText(/Мы привезли уникальный лот/)).toBeInTheDocument()
    expect(within(dialog).getByRole('img', { name: 'Зерно недели: Эфиопия Иргачефф' })).toBeInTheDocument()

    // Attached products
    expect(within(dialog).getByText('Товары из акции')).toBeInTheDocument()
    expect(within(dialog).getByText('Капучино')).toBeInTheDocument()
    expect(within(dialog).getByText('Латте')).toBeInTheDocument()
    expect(within(dialog).getByText(/от 210\s*₽/)).toBeInTheDocument()

    // Quick add button on linked product
    const addCappBtn = within(dialog).getByLabelText('Добавить Капучино в корзину')
    expect(addCappBtn).toBeInTheDocument()
    fireEvent.click(addCappBtn)

    // Close button works
    const closeBtn = within(dialog).getByLabelText('Закрыть')
    fireEvent.click(closeBtn)
  })

  it('redirects to home if promo id does not exist', async () => {
    renderApp('/promo/unknown-promo-id', {
      getCatalog: async () => catalogWithPromo,
    })

    // Should redirect to menu page
    expect(await screen.findByRole('navigation', { name: 'Категории меню' })).toBeInTheDocument()
  })
})
