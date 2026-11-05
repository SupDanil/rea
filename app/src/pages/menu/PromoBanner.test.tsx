import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PromoBanner } from './PromoBanner'
import { AppProvider } from '../../state/AppProvider'
import { catalogData } from '../../test/catalogFixture'
import type { MenuItem, Promotion } from '../../domain'

describe('PromoBanner (2026 Bento Liquid Glass Design)', () => {
  const dummyProduct: MenuItem = catalogData.items[0] // cappuccino

  const productPromo: Promotion = {
    id: 'promo-capp',
    title: 'Капучино с кроликом',
    subtitle: 'Шелковистая текстура и нежный вкус',
    badge: 'Спешл',
    placement: 'main',
    targetType: 'product',
    targetProductId: dummyProduct.id,
    sort: 1,
    isActive: true,
  }

  const articlePromo: Promotion = {
    id: 'promo-story',
    title: 'Осеннее меню напитков',
    subtitle: 'Специальная согревающая коллекция',
    badge: 'Новинка',
    placement: 'category',
    categoryId: 'coffee',
    targetType: 'article',
    content: 'История про сезонные новинки...',
    imageUrl: 'https://example.com/autumn.jpg',
    bgColor: '#E88B4C',
    productIds: [dummyProduct.id],
    sort: 2,
    isActive: true,
  }

  it('renders product promo with title, subtitle, badge, price and quick-add + button', () => {
    const onOpen = vi.fn()
    render(
      <AppProvider>
        <PromoBanner promo={productPromo} product={dummyProduct} onOpen={onOpen} />
      </AppProvider>,
    )

    expect(screen.getByText('Капучино с кроликом')).toBeInTheDocument()
    expect(screen.getByText('Шелковистая текстура и нежный вкус')).toBeInTheDocument()
    expect(screen.getByText('Спешл')).toBeInTheDocument()
    expect(screen.getByText(/от 210\s*₽/)).toBeInTheDocument()

    const plusBtn = screen.getByLabelText(/Быстро добавить «Капучино» в корзину/)
    expect(plusBtn).toBeInTheDocument()

    // Quick add click does not trigger onOpen
    fireEvent.click(plusBtn)
    expect(onOpen).not.toHaveBeenCalled()

    // Clicking card triggers onOpen
    const card = screen.getByText('Капучино с кроликом').closest('[data-promo-id]')!
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('renders article promo with cover image, title and "Подробнее →" action without + button', () => {
    const onOpen = vi.fn()
    render(
      <AppProvider>
        <PromoBanner promo={articlePromo} onOpen={onOpen} />
      </AppProvider>,
    )

    expect(screen.getByText('Осеннее меню напитков')).toBeInTheDocument()
    expect(screen.getByText('Специальная согревающая коллекция')).toBeInTheDocument()
    expect(screen.getByText('Новинка')).toBeInTheDocument()
    expect(screen.getByText('Подробнее')).toBeInTheDocument()

    // No quick-add button for article promo
    expect(screen.queryByLabelText(/Быстро добавить/)).toBeNull()

    const card = screen.getByText('Осеннее меню напитков').closest('[data-promo-id]')!
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
