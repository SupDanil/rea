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
  levelDiscount?: number
  promoDiscount?: number
  rewardDiscount?: number
}

export type UpdateOrderDto = Partial<Pick<Order, 'cancelledAt' | 'rating'>>

export type CheckPromoDto = {
  code: string
  valid: boolean
  percent?: number
  label?: string
}

export type SendSmsDto = {
  phone: string
  success: boolean
}

export type VerifySmsDto = {
  phone: string
  code: string
  profile: UserProfile
}

export type { CatalogData }
