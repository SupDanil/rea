import { categories, ingredientGroups, menuItems } from '../data/menu'
import type { CatalogData, Order, UserProfile } from '../domain'
import { readyTimeFor } from '../domain/orders'
import { normalizePromo, promoCodes } from '../domain/cart'
import type { ApiClient } from './client'
import type { CheckPromoDto, CreateOrderDto, SendSmsDto, UpdateOrderDto, VerifySmsDto } from './types'

const PROFILE_KEY = 'zerno-profile'
const ORDERS_KEY = 'zerno-orders'

const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write errors (quota, incognito)
  }
}

export class MockApiClient implements ApiClient {
  async getCatalog(): Promise<CatalogData> {
    return {
      items: menuItems,
      categories,
      ingredientGroups,
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    return readStorage<UserProfile | null>(PROFILE_KEY, null)
  }

  async sendSmsCode(phone: string): Promise<SendSmsDto> {
    return { phone, success: true }
  }

  async verifySmsCode(phone: string, code: string, name?: string): Promise<VerifySmsDto> {
    const existing = await this.getProfile()
    const profile: UserProfile = {
      phone,
      name: name ?? existing?.name ?? '',
      email: existing?.email ?? '',
      notifications: existing?.notifications ?? true,
      joinedAt: existing?.joinedAt ?? Date.now(),
    }
    writeStorage(PROFILE_KEY, profile)
    return { phone, code, profile }
  }

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const current = (await this.getProfile()) ?? {
      phone: '',
      name: '',
      email: '',
      notifications: true,
      joinedAt: Date.now(),
    }
    const updated: UserProfile = { ...current, ...patch }
    writeStorage(PROFILE_KEY, updated)
    return updated
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PROFILE_KEY)
      } catch {}
    }
  }

  async getOrders(): Promise<Order[]> {
    return readStorage<Order[]>(ORDERS_KEY, [])
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const orders = await this.getOrders()
    const now = Date.now()
    const created: Order = {
      ...dto,
      id: Math.random().toString(36).slice(2, 10),
      number: 10 + Math.floor(Math.random() * 90),
      createdAt: now,
      readyAt: readyTimeFor(dto.pickup, now),
    }
    const next = [created, ...orders].slice(0, 20)
    writeStorage(ORDERS_KEY, next)
    return created
  }

  async updateOrder(id: string, patch: UpdateOrderDto): Promise<Order> {
    const orders = await this.getOrders()
    const target = orders.find((o) => o.id === id)
    if (!target) {
      throw new Error(`Order ${id} not found`)
    }
    const updated: Order = { ...target, ...patch }
    const next = orders.map((o) => (o.id === id ? updated : o))
    writeStorage(ORDERS_KEY, next)
    return updated
  }

  async checkPromo(code: string): Promise<CheckPromoDto> {
    const normalized = normalizePromo(code)
    const found = promoCodes[normalized]
    if (found) {
      return { code: normalized, valid: true, percent: found.percent, label: found.label }
    }
    return { code: normalized, valid: false }
  }
}

export const mockApiClient = new MockApiClient()
