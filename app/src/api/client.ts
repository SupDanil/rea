import type { CatalogData, Order, UserProfile } from '../domain'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

export interface ApiClient {
  getCatalog(): Promise<CatalogData>
  getProfile(): Promise<UserProfile | null>
  sendSmsCode(phone: string): Promise<SendSmsDto>
  verifySmsCode(phone: string, code: string, name?: string): Promise<VerifySmsDto>
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile>
  signOut(): Promise<void>
  getOrders(): Promise<Order[]>
  getOrder(id: string): Promise<Order | null>
  createOrder(dto: CreateOrderDto): Promise<Order>
  updateOrder(id: string, patch: UpdateOrderDto): Promise<Order>
  checkPromo(code: string): Promise<CheckPromoDto>
}
