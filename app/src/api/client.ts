import type { CatalogData, Order, Promotion, Shop, UserProfile } from '../domain'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, TelegramWebAppAuthDto, UpdateOrderDto, VerifySmsDto } from './types'

export interface ApiClient {
  getCatalog(): Promise<CatalogData>
  getPromos(): Promise<Promotion[]>
  getShops(): Promise<Shop[]>
  getProfile(): Promise<UserProfile | null>
  sendSmsCode(phone: string): Promise<SendSmsDto>
  verifySmsCode(phone: string, code: string, name?: string): Promise<VerifySmsDto>
  telegramWebAppAuth(initData: string, phone?: string, name?: string): Promise<TelegramWebAppAuthDto>
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile>
  signOut(): Promise<void>
  getOrders(): Promise<Order[]>
  getOrder(id: string): Promise<Order | null>
  createOrder(dto: CreateOrderDto): Promise<Order>
  updateOrder(id: string, patch: UpdateOrderDto): Promise<Order>
  checkPromo(code: string): Promise<CheckPromoDto>
  /** URL of the server-sent events stream for one order */
  orderEventsUrl(id: string): string
  getVapidPublicKey(): Promise<string>
  subscribePush(subscription: PushSubscriptionJSON, phone?: string): Promise<{ success: boolean; subscriptionId: string }>
  unsubscribePush(endpoint: string): Promise<{ success: boolean }>
}
