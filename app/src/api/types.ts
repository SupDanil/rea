import type { CartLine, CatalogData, Order, PaymentMethod, Pickup, UserProfile } from '../domain'

export type CreateOrderDto = {
  lines: CartLine[]
  subtotal: number
  discount: number
  total: number
  name: string
  pickup: Pickup
  payment: PaymentMethod
  phone?: string
  shopId?: string
  levelDiscount?: number
  promoCode?: string
  promoDiscount?: number
  rewardDiscount?: number
}

export type UpdateOrderDto = Partial<Pick<Order, 'cancelledAt' | 'rating' | 'status'>>

export type CheckPromoDto = {
  code: string
  valid: boolean
  percent?: number
  label?: string
}

export type SendSmsDto = {
  phone: string
  success: boolean
  /** Returned by the server outside production while no SMS provider is connected */
  devCode?: string
}

export type VerifySmsDto = {
  phone: string
  code: string
  /** The phone had no customer yet and one was just created */
  isNew?: boolean
  profile: UserProfile
}

export type { CatalogData }
