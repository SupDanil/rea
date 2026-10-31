import type { CatalogData, Order, Shop, UserProfile } from '../domain'
import type { ApiClient } from './client'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

export const AUTH_PHONE_KEY = 'shit_coffee_phone'
/** Ids of orders placed on this device, so a guest without a phone can still follow them. */
export const GUEST_ORDERS_KEY = 'zerno-order-ids'
const GUEST_ORDERS_LIMIT = 30

/** Non-2xx response from the API; `reason` carries the server's machine-readable code when given. */
export class ApiError extends Error {
  readonly status: number
  readonly reason?: string

  constructor(status: number, message: string, reason?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.reason = reason
  }
}

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode, quota); the session just won't persist.
  }
}

const readGuestOrderIds = (): string[] => {
  try {
    const parsed = JSON.parse(readStorage(GUEST_ORDERS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private getAuthPhone(): string | null {
    return readStorage(AUTH_PHONE_KEY)
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    })
    if (!res.ok) {
      let message = `HTTP ${res.status} at ${path}`
      let reason: string | undefined
      try {
        const body = (await res.json()) as { error?: string; reason?: string }
        if (body.error) message = body.error
        reason = body.reason
      } catch {
        // Body is not JSON; keep the generic message.
      }
      throw new ApiError(res.status, message, reason)
    }
    return (await res.json()) as T
  }

  getCatalog(): Promise<CatalogData> {
    return this.request<CatalogData>('/catalog')
  }

  getShops(): Promise<Shop[]> {
    return this.request<Shop[]>('/shops')
  }

  async getProfile(): Promise<UserProfile | null> {
    const phone = this.getAuthPhone()
    if (!phone) return null
    try {
      return await this.request<UserProfile>(`/profile?phone=${encodeURIComponent(phone)}`)
    } catch (err) {
      // The customer was removed on the server: drop the stale session.
      if (err instanceof ApiError && err.status === 404) {
        writeStorage(AUTH_PHONE_KEY, null)
        return null
      }
      throw err
    }
  }

  sendSmsCode(phone: string): Promise<SendSmsDto> {
    return this.request<SendSmsDto>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  }

  async verifySmsCode(phone: string, code: string, name?: string): Promise<VerifySmsDto> {
    const res = await this.request<VerifySmsDto>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    })
    writeStorage(AUTH_PHONE_KEY, res.profile.phone)
    return res
  }

  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const phone = this.getAuthPhone()
    if (!phone) return Promise.reject(new ApiError(401, 'Not signed in'))
    return this.request<UserProfile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify({ ...patch, phone }),
    })
  }

  async signOut(): Promise<void> {
    writeStorage(AUTH_PHONE_KEY, null)
    await this.request<{ success: boolean }>('/auth/sign-out', { method: 'POST' })
  }

  async getOrders(): Promise<Order[]> {
    const phone = this.getAuthPhone()
    const ids = readGuestOrderIds()
    if (phone) {
      const own = await this.request<Order[]>(`/orders?phone=${encodeURIComponent(phone)}`)
      // Orders placed on this device before signing in are still shown.
      const extraIds = ids.filter((id) => !own.some((o) => o.id === id))
      if (extraIds.length === 0) return own
      const guest = await this.request<Order[]>(`/orders?ids=${extraIds.map(encodeURIComponent).join(',')}`)
      return [...own, ...guest].sort((a, b) => b.createdAt - a.createdAt)
    }
    if (ids.length === 0) return []
    return this.request<Order[]>(`/orders?ids=${ids.map(encodeURIComponent).join(',')}`)
  }

  async getOrder(id: string): Promise<Order | null> {
    try {
      return await this.request<Order>(`/orders/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const created = await this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    const ids = [created.id, ...readGuestOrderIds().filter((id) => id !== created.id)].slice(0, GUEST_ORDERS_LIMIT)
    writeStorage(GUEST_ORDERS_KEY, JSON.stringify(ids))
    return created
  }

  updateOrder(id: string, patch: UpdateOrderDto): Promise<Order> {
    return this.request<Order>(`/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  }

  checkPromo(code: string): Promise<CheckPromoDto> {
    return this.request<CheckPromoDto>(`/promo/check?code=${encodeURIComponent(code)}`)
  }

  orderEventsUrl(id: string): string {
    return `${this.baseUrl}/orders/${encodeURIComponent(id)}/events`
  }
}

export function createHttpClient(baseUrl: string): ApiClient {
  return new HttpApiClient(baseUrl)
}
