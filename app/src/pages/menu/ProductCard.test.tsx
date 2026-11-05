import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach,describe, expect, it, vi } from 'vitest'

import type { MenuItem } from '../../domain'
import { AppProvider } from '../../state/AppProvider'
import { ProductCard } from './ProductCard'

const baseItem: MenuItem = {
  id: 'cappuccino',
  categoryId: 'coffee',
  name: 'Капучино',
  description: 'Эспрессо с воздушной молочной пенкой',
  composition: 'Эспрессо, молоко',
  badge: 'hit',
  groupIds: [],
  art: { kind: 'cup', fill: '#5e4b7e', bg: '#dcd8ec' },
  variants: [
    {
      id: 'm',
      size: 'M',
      volume: '300 мл',
      price: 250,
      nutrition: { kcal: 120, fat: 5, carbs: 8, protein: 5 },
    },
  ],
}

describe('ProductCard Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  const renderCard = (item: MenuItem, isWide = false, onOpen = vi.fn()) => {
    return render(
      <AppProvider>
        <ProductCard item={item} onOpen={onOpen} isWide={isWide} />
      </AppProvider>,
    )
  }

  describe('Clean cards without temperature switch on the main screen', () => {
    const dualPhotoItem: MenuItem = {
      ...baseItem,
      id: 'latte-dual',
      name: 'Латте Два Сезона',
      temperatureMode: 'both',
      imageUrl: '/uploads/fallback.webp',
      hotImageUrl: '/uploads/latte-hot.webp',
      coldImageUrl: '/uploads/latte-cold.webp',
    }

    it('does NOT render temperature toggle buttons on the card even when temperatureMode is "both"', () => {
      renderCard(dualPhotoItem)

      expect(screen.queryByRole('button', { name: 'Горячий' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Холодный' })).toBeNull()
    })

    it('displays hot photo by default for dual-temperature drinks', () => {
      const { container } = renderCard(dualPhotoItem)
      const img = container.querySelector('image')
      expect(decodeURIComponent(img!.getAttribute('href')!)).toContain('/uploads/latte-hot.webp')
    })

    it('quick-adds hot to cart by default when drink has both hot/cold variants', async () => {
      renderCard(dualPhotoItem)

      const addBtn = screen.getByRole('button', { name: /Добавить «Латте Два Сезона» в корзину/i })
      fireEvent.click(addBtn)

      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({
          itemId: 'latte-dual',
          variantId: 'm',
          temperature: 'hot',
          qty: 1,
        })
      })
    })

    it('quick-adds cold to cart when drink is cold-only', async () => {
      const coldItem: MenuItem = {
        ...baseItem,
        id: 'cold-brew',
        name: 'Колд Брю',
        temperatureMode: 'cold',
        coldImageUrl: '/uploads/cold-brew.webp',
      }

      const { container } = renderCard(coldItem)

      expect(screen.queryByRole('button', { name: 'Горячий' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Холодный' })).toBeNull()
      expect(screen.getByText('❄️ Лёд')).toBeInTheDocument()

      const img = container.querySelector('image')
      expect(decodeURIComponent(img!.getAttribute('href')!)).toContain('/uploads/cold-brew.webp')

      fireEvent.click(screen.getByRole('button', { name: /Добавить «Колд Брю» в корзину/i }))
      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem('zerno-cart') ?? '[]')
        expect(stored[0]?.temperature).toBe('cold')
      })
    })
  })

  describe('Standard 1-column card rendering for all products', () => {
    it('always renders as a standard 1-column card without wide 2-column layout', () => {
      const { container } = renderCard(baseItem, true)
      // Standard card doesn't have col-span-2 class on root
      expect(container.firstChild).not.toHaveClass('col-span-2')
    })
  })

  describe('Background tint and styling', () => {
    it('applies art.bg to the art-glow container --tint property', () => {
      const customBgItem: MenuItem = {
        ...baseItem,
        art: { kind: 'cup', fill: '#5e4b7e', bg: '#f8e1b8' },
      }

      const { container } = renderCard(customBgItem)
      const glowElement = container.querySelector('.art-glow') as HTMLElement
      expect(glowElement).toBeInTheDocument()
      expect(glowElement.style.getPropertyValue('--tint')).toBe('#f8e1b8')
    })
  })
})
