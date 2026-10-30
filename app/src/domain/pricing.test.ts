import { describe, expect, it } from 'vitest'
import { cartPricing } from './pricing'
import { staticCatalog } from '../queries/useCatalog'

describe('domain/pricing', () => {
  const lines = [
    { key: '1', itemId: 'latte', variantId: 'l', ingredientIds: ['vanilla'], qty: 2 }, // (280 + 50) * 2 = 660
    { key: '2', itemId: 'croissant', variantId: 'one', ingredientIds: [], qty: 1 }, // 160
  ]
  // Total subtotal: 660 + 160 = 820

  it('calculates full price without discounts', () => {
    const result = cartPricing(lines, null, null, false, staticCatalog)
    expect(result.subtotal).toBe(820)
    expect(result.discount).toBe(0)
    expect(result.total).toBe(820)
  })

  it('applies loyalty level discount', () => {
    const loyalty = { levelName: 'Эспрессо', levelPercent: 7, giftValue: 0, giftsAvailable: 0 }
    const result = cartPricing(lines, loyalty, null, false, staticCatalog)
    // 7% of 820 = 57.4 -> 57
    expect(result.levelDiscount).toBe(57)
    expect(result.total).toBe(820 - 57)
  })

  it('applies gift drink first before percentage discounts', () => {
    // Gift drink = 330 (latte L + vanilla). Base becomes 820 - 330 = 490.
    const loyalty = { levelName: 'Обжарка', levelPercent: 5, giftValue: 330, giftsAvailable: 1 }
    const result = cartPricing(lines, loyalty, 'SHIT10', true, staticCatalog)

    expect(result.canGift).toBe(true)
    expect(result.rewardDiscount).toBe(330)
    // Base: 820 - 330 = 490
    // Level: 5% of 490 = 24.5 -> 25 (Math.round)
    expect(result.levelDiscount).toBe(25)
    // Promo: 10% of 490 = 49
    expect(result.promoDiscount).toBe(49)
    expect(result.discount).toBe(330 + 25 + 49)
    expect(result.total).toBe(820 - (330 + 25 + 49))
  })
})
