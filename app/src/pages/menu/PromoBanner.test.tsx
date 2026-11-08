import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { MenuItem, Promotion } from '../../domain'
import { AppProvider } from '../../state/AppProvider'
import { catalogData } from '../../test/catalogFixture'
import { PromoBanner } from './PromoBanner'

describe('PromoBanner', () => {
  const dummyProduct: MenuItem = catalogData.items[0] // cappuccino (300 мл, 400 мл)

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
    productIds: [dummyProduct.id, 'matcha', 'raf'],
    sort: 2,
    isActive: true,
  }

  it('renders product promo with title, subtitle, badge, price and "Выбрать →" transition button (NO + button)', () => {
    const onOpen = vi.fn()
    render(
      <AppProvider>
        <PromoBanner promo={productPromo} product={dummyProduct} onOpen={onOpen} />
      </AppProvider>,
    )

    // Key elements from API data
    expect(screen.getByText('Капучино с кроликом')).toBeInTheDocument()
    expect(screen.getByText('Шелковистая текстура и нежный вкус')).toBeInTheDocument()
    expect(screen.getByText('Спешл')).toBeInTheDocument()
    expect(screen.getByText(/от 210\s*₽/)).toBeInTheDocument()

    // Volume meta chip from product variants (300–400 мл) - hidden on mobile to avoid wasting vertical space
    const volumeChip = screen.getByText('300–400 мл')
    expect(volumeChip).toBeInTheDocument()
    expect(volumeChip).toHaveClass('hidden', 'sm:inline-flex')

    // STRICT CHECK: The '+' quick-add button is removed!
    expect(screen.queryByLabelText(/Быстро добавить/)).toBeNull()
    expect(screen.queryByRole('button', { name: /\+/ })).toBeNull()

    // Transition CTA button is present and triggers onOpen
    const selectBtn = screen.getByRole('button', { name: 'Выбрать' })
    expect(selectBtn).toBeInTheDocument()
    fireEvent.click(selectBtn)
    expect(onOpen).toHaveBeenCalledTimes(1)

    // Full card overlay button also triggers onOpen
    const card = screen.getByRole('button', { name: 'Подробнее: Капучино с кроликом' })
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('displays cold badge if product is cold-only', () => {
    const coldProduct: MenuItem = {
      ...dummyProduct,
      temperatureMode: 'cold',
    }
    render(
      <AppProvider>
        <PromoBanner promo={productPromo} product={coldProduct} onOpen={() => {}} />
      </AppProvider>,
    )

    expect(screen.getByText('Лёд')).toBeInTheDocument()
  })

  it('renders sold-out product promo with status badge and without action buttons', () => {
    const soldOutProduct: MenuItem = {
      ...dummyProduct,
      variants: dummyProduct.variants.map((v) => ({ ...v, stopped: true })),
    }

    render(
      <AppProvider>
        <PromoBanner promo={productPromo} product={soldOutProduct} onOpen={() => {}} />
      </AppProvider>,
    )

    expect(screen.getByText('Закончился')).toBeInTheDocument()
    expect(screen.queryByText(/от 210/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Выбрать/ })).toBeNull()
    expect(screen.queryByLabelText(/Быстро добавить/)).toBeNull()
  })

  it('renders article promo with cover image, title, badge, attached products counter and "Подробнее →"', () => {
    const onOpen = vi.fn()
    render(
      <AppProvider>
        <PromoBanner promo={articlePromo} onOpen={onOpen} />
      </AppProvider>,
    )

    expect(screen.getByText('Осеннее меню напитков')).toBeInTheDocument()
    expect(screen.getByText('Специальная согревающая коллекция')).toBeInTheDocument()
    expect(screen.getByText('Новинка')).toBeInTheDocument()
    const countChip = screen.getByText('3 товара')
    expect(countChip).toBeInTheDocument()
    expect(countChip).toHaveClass('hidden', 'sm:inline-flex')

    // No quick-add button for article promo
    expect(screen.queryByLabelText(/Быстро добавить/)).toBeNull()

    // Secondary transition button
    const readBtn = screen.getByRole('button', { name: 'Подробнее', exact: true })
    expect(readBtn).toBeInTheDocument()
    fireEvent.click(readBtn)
    expect(onOpen).toHaveBeenCalledTimes(1)

    // Card click
    const card = screen.getByRole('button', { name: 'Подробнее: Осеннее меню напитков' })
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('renders category variant ("второй дизайн") with col-span-2 and balanced layout', () => {
    const onOpen = vi.fn()
    const { container } = render(
      <AppProvider>
        <PromoBanner
          promo={articlePromo}
          product={dummyProduct}
          onOpen={onOpen}
          variant="category"
        />
      </AppProvider>,
    )

    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveClass('col-span-2')
    expect(root).toHaveClass('w-full')
    expect(screen.getByText('Осеннее меню напитков')).toBeInTheDocument()
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

    const readBtn = screen.getByRole('button', { name: 'Подробнее', exact: true })
    fireEvent.click(readBtn)
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
