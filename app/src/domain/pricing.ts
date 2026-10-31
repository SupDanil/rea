import type { CartLine } from './cart'
import { subtotalOf } from './cart'
import type { Catalog } from './catalog'

/** What the signed-in guest brings to the cart; null for a guest. */
export type CartLoyalty = {
  levelName: string
  levelPercent: number
  giftValue: number
  giftsAvailable: number
} | null

/** A promo code the server confirmed, with its percentage off. */
export type AppliedPromo = { code: string; percent: number; label?: string }

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
  promo: AppliedPromo | null,
  useGift: boolean,
  catalog: Catalog,
): PricingResult {
  const subtotal = subtotalOf(lines, catalog)
  // Gift drink comes off first, then level and promo percentages apply to the rest.
  const canGift = !!loyalty && loyalty.giftsAvailable > 0 && loyalty.giftValue > 0
  const rewardDiscount = canGift && useGift ? loyalty.giftValue : 0
  const base = subtotal - rewardDiscount
  const levelDiscount = loyalty ? Math.round((base * loyalty.levelPercent) / 100) : 0
  const promoDiscount = promo ? Math.round((base * promo.percent) / 100) : 0
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
