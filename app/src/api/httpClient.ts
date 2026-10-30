import type { CatalogData, Order, UserProfile } from '../domain'
import type { ApiClient } from './client'
import { mockApiClient } from './mockClient'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      ...options,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText} at ${path}`)
    }
    return (await res.json()) as T
  }

  async getCatalog(): Promise<CatalogData> {
    try {
      return await this.request<CatalogData>('/catalog')
    } catch {
      return mockApiClient.getCatalog()
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      return await this.request<UserProfile | null>('/profile')
    } catch {
      return mockApiClient.getProfile()
    }
  }

  async sendSmsCode(phone: string): Promise<SendSmsDto> {
    try {
      return await this.request<SendSmsDto>('/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      })
    } catch {
      return mockApiClient.sendSmsCode(phone)
    }
  }

  async verifySmsCode(phone: string, code: string, name?: string): Promise<VerifySmsDto> {
    try {
      return await this.request<VerifySmsDto>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ phone, code, name }),
      })
    } catch {
      return mockApiClient.verifySmsCode(phone, code, name)
    }
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    try {
      return await this.request<UserProfile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    } catch {
      return mockApiClient.updateProfile(patch)
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.request<void>('/auth/sign-out', { method: 'POST' })
    } catch {
      await mockApiClient.signOut()
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      return await this.request<Order[]>('/orders')
    } catch {
      return mockApiClient.getOrders()
    }
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    try {
      return await this.request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(dto),
      })
    } catch {
      return mockApiClient.createOrder(dto)
    }
  }

  async updateOrder(id: string, patch: UpdateOrderDto): Promise<Order> {
    try {
      return await this.request<Order>(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    } catch {
      return mockApiClient.updateOrder(id, patch)
    }
  }

  async checkPromo(code: string): Promise<CheckPromoDto> {
    try {
      return await this.request<CheckPromoDto>(`/promo/check?code=${encodeURIComponent(code)}`)
    } catch {
      return mockApiClient.checkPromo(code)
    }
  }
}

export function createHttpClient(baseUrl: string): ApiClient {
  return new HttpApiClient(baseUrl)
}
