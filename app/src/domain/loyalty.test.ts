import { describe, expect, it } from 'vitest'
import { giftValue, loyaltyOf, STAMP_MIN_TOTAL } from './loyalty'
import type { Order } from './orders'
import type { UserProfile } from './profile'
import { staticCatalog } from '../queries/useCatalog'

describe('domain/loyalty', () => {
  const profile: UserProfile = {
    phone: '+7 999 111-22-33',
    name: 'Тест',
    email: '',
    notifications: true,
    joinedAt: 1000,
  }

  const makeOrder = (id: string, total: number, phone = profile.phone): Order => ({
    id,
    number: 1,
    createdAt: 1000,
    readyAt: 2000,
    lines: [],
    subtotal: total,
    discount: 0,
    total,
    name: 'Тест',
    pickup: { kind: 'asap' },
    payment: 'card',
    phone,
  })

  it('provides welcome gift on sign up with 0 orders', () => {
    const loyalty = loyaltyOf([], profile)
    expect(loyalty.completed).toBe(0)
    expect(loyalty.level.name).toBe('Зерно')
    expect(loyalty.giftsAvailable).toBe(1)
  })

  it('earns stamps on qualifying orders and grants gifts every 6 stamps', () => {
    // 6 orders above STAMP_MIN_TOTAL
    const orders = Array.from({ length: 6 }, (_, i) => makeOrder(`ord-${i}`, STAMP_MIN_TOTAL + 50))
    const loyalty = loyaltyOf(orders, profile)

    expect(loyalty.completed).toBe(6)
    expect(loyalty.level.name).toBe('Росток') // 3+ orders
    expect(loyalty.stamps).toBe(0) // 6 % 6 = 0
    // 1 welcome gift + 1 earned from 6 stamps = 2
    expect(loyalty.giftsEarned).toBe(2)
    expect(loyalty.giftsAvailable).toBe(2)
  })

  it('calculates gift value up to limit for priciest drink', () => {
    const lines = [
      { key: '1', itemId: 'espresso', variantId: 's', ingredientIds: [], qty: 1 }, // 160
      { key: '2', itemId: 'latte', variantId: 'l', ingredientIds: ['vanilla'], qty: 1 }, // 280 + 50 = 330
    ]
    // 330 is the priciest drink (under GIFT_DRINK_LIMIT 350)
    expect(giftValue(lines, staticCatalog)).toBe(330)
  })
})
