import type { CatalogData, Order, Promotion, Shop, UserProfile } from '../domain'
import type { ApiClient } from './client'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

export const AUTH_PHONE_KEY = 'shit_coffee_phone'
export const AUTH_ACCESS_TOKEN_KEY = 'shit_coffee_access_token'
export const AUTH_REFRESH_TOKEN_KEY = 'shit_coffee_refresh_token'
export const AUTH_PROFILE_KEY = 'shit_coffee_profile_cache'

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
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private getAuthPhone(): string | null {
    return readStorage(AUTH_PHONE_KEY)
  }

  private getAccessToken(): string | null {
    return readStorage(AUTH_ACCESS_TOKEN_KEY)
  }

  private getRefreshToken(): string | null {
    return readStorage(AUTH_REFRESH_TOKEN_KEY)
  }

  private clearAuth() {
    writeStorage(AUTH_PHONE_KEY, null)
    writeStorage(AUTH_ACCESS_TOKEN_KEY, null)
    writeStorage(AUTH_REFRESH_TOKEN_KEY, null)
    writeStorage(AUTH_PROFILE_KEY, null)
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearAuth()
      return null
    }

    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const res = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          })
          if (!res.ok) {
            this.clearAuth()
            return null
          }
          const data = (await res.json()) as { accessToken: string; refreshToken: string }
          writeStorage(AUTH_ACCESS_TOKEN_KEY, data.accessToken)
          writeStorage(AUTH_REFRESH_TOKEN_KEY, data.refreshToken)
          return data.accessToken
        } catch {
          this.clearAuth()
          return null
        } finally {
          this.refreshPromise = null
        }
      })()
    }

    return this.refreshPromise
  }

  private async request<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
    const token = this.getAccessToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })

    // Auto-refresh token on 401 Unauthorized if we have a refresh token
    if (res.status === 401 && !isRetry && !path.startsWith('/auth/')) {
      const newToken = await this.tryRefreshToken()
      if (newToken) {
        return this.request<T>(path, options, true)
      }
    }

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

  getPromos(): Promise<Promotion[]> {
    return this.request<Promotion[]>('/promos')
  }

  getShops(): Promise<Shop[]> {
    return this.request<Shop[]>('/shops')
  }

  async getProfile(): Promise<UserProfile | null> {
    const token = this.getAccessToken()
    const phone = this.getAuthPhone()
    if (!token && !phone) return null

    try {
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : ''
      const profile = await this.request<UserProfile>(`/profile${query}`)
      writeStorage(AUTH_PROFILE_KEY, JSON.stringify(profile))
      return profile
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
        this.clearAuth()
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
    if (res.accessToken) writeStorage(AUTH_ACCESS_TOKEN_KEY, res.accessToken)
    if (res.refreshToken) writeStorage(AUTH_REFRESH_TOKEN_KEY, res.refreshToken)
    writeStorage(AUTH_PHONE_KEY, res.profile.phone)
    writeStorage(AUTH_PROFILE_KEY, JSON.stringify(res.profile))
    return res
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const phone = this.getAuthPhone()
    const token = this.getAccessToken()
    if (!token && !phone) return Promise.reject(new ApiError(401, 'Not signed in'))
    const updated = await this.request<UserProfile>('/profile', {
      method: 'PATCH',
      body: JSON.stringify({ ...patch, phone }),
    })
    writeStorage(AUTH_PROFILE_KEY, JSON.stringify(updated))
    return updated
  }

  async signOut(): Promise<void> {
    const refreshToken = this.getRefreshToken()
    this.clearAuth()
    try {
      await this.request<{ success: boolean }>('/auth/sign-out', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    } finally {
      this.clearAuth()
    }
  }

  async getOrders(): Promise<Order[]> {
    const phone = this.getAuthPhone()
    const token = this.getAccessToken()
    const ids = readGuestOrderIds()

    if (token || phone) {
      const query = phone ? `?phone=${encodeURIComponent(phone)}` : ''
      const own = await this.request<Order[]>(`/orders${query}`)
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
