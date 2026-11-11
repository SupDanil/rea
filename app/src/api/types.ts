import type { CartLine, CatalogData, Order, PaymentMethod, Pickup, Promotion, UserProfile } from '../domain'

export type CreateOrderDto = {
  lines: CartLine[]
  subtotal: number
  discount: number
  total: number
  name: string
  pickup: Pickup
  payment: PaymentMethod
  channel?: 'web' | 'installed' | 'telegram'
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
  devCode?: string
  ticket?: string
  telegramUrl?: string
  expiresAt?: number
}

export type VerifySmsDto = {
  phone: string
  code: string
  isNew?: boolean
  profile: UserProfile
  accessToken?: string
  refreshToken?: string
}

export type TelegramWebAppAuthDto = {
  success?: boolean
  needsPhone?: boolean
  phone?: string
  isNew?: boolean
  profile?: UserProfile
  accessToken?: string
  refreshToken?: string
  telegramLinked?: boolean
  telegramUser?: {
    id: number
    firstName?: string
    lastName?: string
    username?: string
  }
}

export type { CatalogData, Promotion }
