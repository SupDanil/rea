import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpApiClient, createHttpClient } from './httpClient'
import { mockApiClient } from './mockClient'

describe('HttpApiClient', () => {
  const baseUrl = 'https://api.test.rea.local/api/v1'
  let client: HttpApiClient

  beforeEach(() => {
    client = new HttpApiClient(baseUrl)
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('createHttpClient factory returns an HttpApiClient instance', () => {
    const instance = createHttpClient(baseUrl)
    expect(instance).toBeInstanceOf(HttpApiClient)
  })

  describe('getCatalog()', () => {
    it('fetches catalog from backend when endpoint succeeds', async () => {
      const mockCatalog = {
        topCategories: [{ id: 'coffee', name: 'Кофе', sort: 1 }],
        subCategories: [{ id: 'classic', topId: 'coffee', name: 'Классика', sort: 1 }],
        items: [],
        ingredients: [],
        ingredientGroups: [],
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCatalog,
      } as Response)

      const result = await client.getCatalog()
      expect(result).toEqual(mockCatalog)
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/catalog`, expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }))
    })

    it('falls back to mockApiClient when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const mockSpy = vi.spyOn(mockApiClient, 'getCatalog')

      const result = await client.getCatalog()
      expect(mockSpy).toHaveBeenCalled()
      expect(result.categories.length).toBeGreaterThan(0)
      expect(result.items.length).toBeGreaterThan(0)
    })
  })

  describe('getProfile() and Auth Phone Handling', () => {
    it('returns null if no phone is saved in localStorage', async () => {
      const fetchSpy = vi.fn()
      globalThis.fetch = fetchSpy

      const profile = await client.getProfile()
      expect(profile).toBeNull()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('fetches profile from backend when phone is present in localStorage', async () => {
      localStorage.setItem('shit_coffee_phone', '+79991234567')
      const mockProfile = {
        phone: '+79991234567',
        name: 'Данил',
        stamps: 4,
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      } as Response)

      const profile = await client.getProfile()
      expect(profile).toEqual(mockProfile)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/profile?phone=%2B79991234567`,
        expect.anything(),
      )
    })

    it('returns null on network failure during getProfile()', async () => {
      localStorage.setItem('shit_coffee_phone', '+79991234567')
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('500 Server error'))

      const profile = await client.getProfile()
      expect(profile).toBeNull()
    })
  })

  describe('sendSmsCode() and verifySmsCode()', () => {
    it('sends SMS code via POST /auth/send-code', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, retryAfter: 60 }),
      } as Response)

      const res = await client.sendSmsCode('+79990001122')
      expect(res.success).toBe(true)
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/auth/send-code`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '+79990001122' }),
      }))
    })

    it('falls back to mockApiClient on sendSmsCode failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response)
      const mockSpy = vi.spyOn(mockApiClient, 'sendSmsCode')

      const res = await client.sendSmsCode('+79990001122')
      expect(mockSpy).toHaveBeenCalledWith('+79990001122')
      expect(res.success).toBe(true)
    })

    it('verifies code and saves phone in localStorage on success', async () => {
      const mockVerifyRes = {
        token: 'jwt-token-xyz',
        profile: { phone: '+79990001122', name: 'Алекс' },
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockVerifyRes,
      } as Response)

      const res = await client.verifySmsCode('+79990001122', '1234', 'Алекс')
      expect(res).toEqual(mockVerifyRes)
      expect(localStorage.getItem('shit_coffee_phone')).toBe('+79990001122')
    })
  })

  describe('updateProfile() and signOut()', () => {
    it('sends PATCH /profile with patch and saved phone', async () => {
      localStorage.setItem('shit_coffee_phone', '+79990001122')
      const updatedProfile = { phone: '+79990001122', name: 'Данил Новый' }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedProfile,
      } as Response)

      const res = await client.updateProfile({ name: 'Данил Новый' })
      expect(res.name).toBe('Данил Новый')
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/profile`, expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Данил Новый', phone: '+79990001122' }),
      }))
    })

    it('signOut() removes phone from localStorage and calls /auth/sign-out', async () => {
      localStorage.setItem('shit_coffee_phone', '+79990001122')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)

      await client.signOut()
      expect(localStorage.getItem('shit_coffee_phone')).toBeNull()
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/auth/sign-out`, expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  describe('Orders API: getOrders(), getOrder(), createOrder(), updateOrder()', () => {
    it('getOrders() queries with phone query parameter when user is logged in', async () => {
      localStorage.setItem('shit_coffee_phone', '+79998887766')
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'order-1', number: 10, total: 350 }],
      } as Response)

      const orders = await client.getOrders()
      expect(orders.length).toBe(1)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${baseUrl}/orders?phone=%2B79998887766`,
        expect.anything(),
      )
    })

    it('getOrder(id) requests /orders/:id', async () => {
      const mockOrder = { id: 'ord-99', number: 99, status: 'making', total: 400 }
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOrder,
      } as Response)

      const order = await client.getOrder('ord-99')
      expect(order).toEqual(mockOrder)
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/orders/ord-99`, expect.anything())
    })

    it('getOrder(id) falls back to mock client when backend fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network fail'))
      const mockSpy = vi.spyOn(mockApiClient, 'getOrder').mockResolvedValue({
        id: 'mock-1',
        number: 1,
        status: 'accepted',
      } as any)

      const order = await client.getOrder('mock-1')
      expect(mockSpy).toHaveBeenCalledWith('mock-1')
      expect(order?.id).toBe('mock-1')
    })

    it('createOrder() posts to /orders and returns created order', async () => {
      const dto = {
        lines: [],
        subtotal: 500,
        discount: 50,
        total: 450,
        name: 'Данил',
        pickup: { kind: 'asap' as const },
        payment: 'card' as const,
      }

      const createdOrder = { ...dto, id: 'ord-new', number: 12, createdAt: 1000, readyAt: 2000, status: 'accepted' }
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => createdOrder,
      } as Response)

      const res = await client.createOrder(dto)
      expect(res).toEqual(createdOrder)
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/orders`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(dto),
      }))
    })

    it('updateOrder() sends PATCH /orders/:id', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'ord-1', rating: 'good' }),
      } as Response)

      const res = await client.updateOrder('ord-1', { rating: 'good' })
      expect(res.rating).toBe('good')
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/orders/ord-1`, expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ rating: 'good' }),
      }))
    })
  })

  describe('checkPromo()', () => {
    it('checks promo code via GET /promo/check?code=...', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, discount: 10, percent: true }),
      } as Response)

      const res = await client.checkPromo('COFFEE10')
      expect(res.valid).toBe(true)
      expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/promo/check?code=COFFEE10`, expect.anything())
    })

    it('falls back to mockApiClient when checkPromo fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const mockSpy = vi.spyOn(mockApiClient, 'checkPromo')

      const res = await client.checkPromo('RABBIT')
      expect(mockSpy).toHaveBeenCalledWith('RABBIT')
      expect(res.valid).toBe(true)
    })
  })
})
