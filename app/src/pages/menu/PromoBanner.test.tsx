import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { MenuItem, Promotion } from '../../domain'
import { AppProvider } from '../../state/AppProvider'
import { catalogData } from '../../test/catalogFixture'
import { PromoBanner } from './PromoBanner'

describe('PromoBanner', () => {
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
    const card = screen.getByRole('button', { name: 'Подробнее: Капучино с кроликом' })
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

    const card = screen.getByRole('button', { name: 'Подробнее: Осеннее меню напитков' })
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('uses a related product as article artwork without turning it into a product purchase', () => {
    const onOpen = vi.fn()
    const { container } = render(
      <AppProvider>
        <PromoBanner promo={{ ...articlePromo, imageUrl: undefined }} product={dummyProduct} onOpen={onOpen} />
      </AppProvider>,
    )
    expect(container.querySelector('[data-art-of]')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Быстро добавить/)).toBeNull()
    expect(container.querySelector('button button')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Подробнее', exact: true }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('keeps the shadow off the art, on a layer that stays while the cup is away', () => {
    const { container } = render(
      <AppProvider>
        <PromoBanner promo={productPromo} product={dummyProduct} onOpen={() => {}} />
      </AppProvider>,
    )
    const art = container.querySelector('[data-art-of]')!

    expect(art.getAttribute('class')).not.toContain('drop-shadow')
    expect(container.querySelector('[data-art-glow]')).toBeInTheDocument()
    expect(container.querySelector('[data-art-glow]')).not.toContainElement(art as unknown as HTMLElement)
  })
})
