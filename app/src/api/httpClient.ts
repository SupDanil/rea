import type { CatalogData, Order, UserProfile } from '../domain'
import type { ApiClient } from './client'
import { mockApiClient } from './mockClient'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getAuthPhone(): string | null {
    try {
      return localStorage.getItem('shit_coffee_phone')
    } catch {
      return null
    }
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
    const phone = this.getAuthPhone()
    if (!phone) return null
    try {
      return await this.request<UserProfile | null>(`/profile?phone=${encodeURIComponent(phone)}`)
    } catch {
      return null
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
      const res = await this.request<VerifySmsDto>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ phone, code, name }),
      })
      try {
        localStorage.setItem('shit_coffee_phone', phone)
      } catch {}
      return res
    } catch {
      return mockApiClient.verifySmsCode(phone, code, name)
    }
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const phone = this.getAuthPhone() || (patch as any).phone
    try {
      return await this.request<UserProfile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ ...patch, phone }),
      })
    } catch {
      return mockApiClient.updateProfile(patch)
    }
  }

  async signOut(): Promise<void> {
    try {
      localStorage.removeItem('shit_coffee_phone')
    } catch {}
    try {
      await this.request<void>('/auth/sign-out', { method: 'POST' })
    } catch {
      await mockApiClient.signOut()
    }
  }

  async getOrders(): Promise<Order[]> {
    const phone = this.getAuthPhone()
    const path = phone ? `/orders?phone=${encodeURIComponent(phone)}` : '/orders'
    try {
      return await this.request<Order[]>(path)
    } catch {
      return mockApiClient.getOrders()
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    try {
      return await this.request<Order>(`/orders/${id}`)
    } catch {
      return mockApiClient.getOrder(id)
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
