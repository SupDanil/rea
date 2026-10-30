import { cartPricing as domainCartPricing, type CartLoyalty } from '../../domain/pricing'
import type { CartLine } from '../../domain/cart'
import { staticCatalog } from '../../queries/useCatalog'

export type { CartLoyalty }

export function cartPricing(lines: CartLine[], loyalty: CartLoyalty, promo: string | null, useGift: boolean) {
  return domainCartPricing(lines, loyalty, promo, useGift, staticCatalog)
}
