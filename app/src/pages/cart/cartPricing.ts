import { promoCodes, subtotalOf, type CartLine } from '../../state/cart'

/** What the signed-in guest brings to the cart; null for a guest. */
export type CartLoyalty = { levelName: string; levelPercent: number; giftValue: number; giftsAvailable: number } | null

export function cartPricing(lines: CartLine[], loyalty: CartLoyalty, promo: string | null, useGift: boolean) {
  const subtotal = subtotalOf(lines)
  // Gift drink comes off first, then level and promo percentages apply to the rest.
  const canGift = !!loyalty && loyalty.giftsAvailable > 0 && loyalty.giftValue > 0
  const rewardDiscount = canGift && useGift ? loyalty.giftValue : 0
  const base = subtotal - rewardDiscount
  const levelDiscount = loyalty ? Math.round((base * loyalty.levelPercent) / 100) : 0
  const promoDiscount = promo ? Math.round((base * promoCodes[promo].percent) / 100) : 0
  const discount = rewardDiscount + levelDiscount + promoDiscount
  return { subtotal, canGift, rewardDiscount, levelDiscount, promoDiscount, discount, total: Math.max(0, subtotal - discount) }
}
