import type { CartLine } from './cart'
import { promoCodes, subtotalOf } from './cart'
import type { Catalog } from './catalog'

/** What the signed-in guest brings to the cart; null for a guest. */
export type CartLoyalty = {
  levelName: string
  levelPercent: number
  giftValue: number
  giftsAvailable: number
} | null

export type PricingResult = {
  subtotal: number
  canGift: boolean
  rewardDiscount: number
  levelDiscount: number
  promoDiscount: number
  discount: number
  total: number
}

export function cartPricing(
  lines: CartLine[],
  loyalty: CartLoyalty,
  promo: string | null,
  useGift: boolean,
  catalog: Catalog,
): PricingResult {
  const subtotal = subtotalOf(lines, catalog)
  // Gift drink comes off first, then level and promo percentages apply to the rest.
  const canGift = !!loyalty && loyalty.giftsAvailable > 0 && loyalty.giftValue > 0
  const rewardDiscount = canGift && useGift ? loyalty.giftValue : 0
  const base = subtotal - rewardDiscount
  const levelDiscount = loyalty ? Math.round((base * loyalty.levelPercent) / 100) : 0
  const promoConfig = promo ? promoCodes[promo] : null
  const promoDiscount = promoConfig ? Math.round((base * promoConfig.percent) / 100) : 0
  const discount = rewardDiscount + levelDiscount + promoDiscount
  return {
    subtotal,
    canGift,
    rewardDiscount,
    levelDiscount,
    promoDiscount,
    discount,
    total: Math.max(0, subtotal - discount),
  }
}
