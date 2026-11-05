import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import type { Order } from '../domain'
import { ApiError, AUTH_ACCESS_TOKEN_KEY, AUTH_PHONE_KEY, AUTH_REFRESH_TOKEN_KEY, createHttpClient,GUEST_ORDERS_KEY, HttpApiClient } from './httpClient'

const baseUrl = 'https://api.test.rea.local/api/v1'

const json = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response

const order = (id: string, createdAt = 1000, extra: Partial<Order> = {}): Order => ({
  id,
  number: 12,
  createdAt,
  readyAt: createdAt + 420_000,
  lines: [],
  subtotal: 200,
  discount: 0,
  total: 200,
  name: 'Аня',
  pickup: { kind: 'asap' },
  payment: 'card',
  status: 'accepted',
  ...extra,
})

describe('HttpApiClient', () => {
  let client: HttpApiClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new HttpApiClient(`${baseUrl}/`)
    localStorage.clear()
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const lastCall = () => fetchMock.mock.calls.at(-1) as [string, RequestInit]

  it('createHttpClient returns an HttpApiClient and trims the trailing slash', async () => {
    const instance = createHttpClient(`${baseUrl}///`)
    expect(instance).toBeInstanceOf(HttpApiClient)
    fetchMock.mockResolvedValue(json({ items: [], categories: [], ingredientGroups: [] }))
    await instance.getCatalog()
    expect(lastCall()[0]).toBe(`${baseUrl}/catalog`)
  })

  describe('errors are surfaced, never replaced with fake data', () => {
    it('throws ApiError with the server message and reason on a non-2xx response', async () => {
      fetchMock.mockResolvedValue(json({ error: 'Неверный код', reason: 'invalid' }, 401))
      const err = await client.verifySmsCode('+79990001122', '0000').catch((e) => e)
      expect(err).toBeInstanceOf(ApiError)
      expect(err).toMatchObject({ status: 401, message: 'Неверный код', reason: 'invalid' })
    })

    it('falls back to a generic message when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => Promise.reject(new Error('html')) } as unknown as Response)
      await expect(client.getCatalog()).rejects.toMatchObject({ status: 502, message: 'HTTP 502 at /catalog' })
    })

    it('propagates network failures from getCatalog', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(client.getCatalog()).rejects.toThrow('Failed to fetch')
    })

    it.each([
      ['createOrder', () => client.createOrder({ lines: [], subtotal: 0, discount: 0, total: 0, name: 'X', pickup: { kind: 'asap' }, payment: 'card' })],
      ['updateOrder', () => client.updateOrder('ord-1', { rating: 'good' })],
      ['checkPromo', () => client.checkPromo('X')],
      ['sendSmsCode', () => client.sendSmsCode('+79990001122')],
    ])('%s rejects when the server is down', async (_name, call) => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(call()).rejects.toThrow()
    })
  })

  describe('catalog', () => {
    it('GETs /catalog with JSON headers', async () => {
      const catalog = { items: [], categories: [{ id: 'coffee', name: 'Кофе' }], ingredientGroups: [] }
      fetchMock.mockResolvedValue(json(catalog))
      expect(await client.getCatalog()).toEqual(catalog)
      const [url, init] = lastCall()
      expect(url).toBe(`${baseUrl}/catalog`)
      expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    })
  })

  describe('auth & profile', () => {
    const profile = { phone: '+79990001122', name: 'Аня', email: '', notifications: true, joinedAt: 1 }

    it('sendSmsCode POSTs the phone and returns the devCode when the server gives one', async () => {
      fetchMock.mockResolvedValue(json({ phone: profile.phone, success: true, devCode: '4821' }))
      const res = await client.sendSmsCode(profile.phone)
      expect(res.devCode).toBe('4821')
      const [url, init] = lastCall()
      expect(url).toBe(`${baseUrl}/auth/send-code`)
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({ phone: profile.phone })
    })

    it('verifySmsCode saves the normalized phone as the session only on success', async () => {
      fetchMock.mockResolvedValueOnce(json({ error: 'Неверный код' }, 401))
      await expect(client.verifySmsCode('8 999 000 11 22', '0000')).rejects.toBeInstanceOf(ApiError)
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBeNull()

      fetchMock.mockResolvedValueOnce(json({ phone: profile.phone, code: '4821', profile }))
      const res = await client.verifySmsCode('8 999 000 11 22', '4821', 'Аня')
      expect(res.profile).toEqual(profile)
      expect(JSON.parse(lastCall()[1].body as string)).toEqual({ phone: '8 999 000 11 22', code: '4821', name: 'Аня' })
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBe(profile.phone)
    })

    it('getProfile returns null without a session and does not call the server', async () => {
      expect(await client.getProfile()).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('getProfile loads the profile for the saved phone', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, profile.phone)
      fetchMock.mockResolvedValue(json(profile))
      expect(await client.getProfile()).toEqual(profile)
      expect(lastCall()[0]).toBe(`${baseUrl}/profile?phone=%2B79990001122`)
    })

    it('getProfile drops a stale session when the server no longer knows the phone', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, profile.phone)
      fetchMock.mockResolvedValue(json({ error: 'Profile not found' }, 404))
      expect(await client.getProfile()).toBeNull()
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBeNull()
    })

    it('getProfile rethrows other failures and keeps the session', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, profile.phone)
      fetchMock.mockResolvedValue(json({ error: 'boom' }, 500))
      await expect(client.getProfile()).rejects.toMatchObject({ status: 500 })
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBe(profile.phone)
    })

    it('updateProfile PATCHes with the session phone', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, profile.phone)
      fetchMock.mockResolvedValue(json({ ...profile, name: 'Анна' }))
      const updated = await client.updateProfile({ name: 'Анна' })
      expect(updated.name).toBe('Анна')
      const [url, init] = lastCall()
      expect(url).toBe(`${baseUrl}/profile`)
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body as string)).toEqual({ name: 'Анна', phone: profile.phone })
    })

    it('updateProfile refuses to run without a session', async () => {
      await expect(client.updateProfile({ name: 'X' })).rejects.toMatchObject({ status: 401 })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('signOut clears the session even if the server call fails', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, profile.phone)
      fetchMock.mockRejectedValue(new TypeError('offline'))
      await expect(client.signOut()).rejects.toThrow()
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBeNull()
    })

    it('signOut POSTs /auth/sign-out', async () => {
      fetchMock.mockResolvedValue(json({ success: true }))
      await client.signOut()
      expect(lastCall()[0]).toBe(`${baseUrl}/auth/sign-out`)
      expect(lastCall()[1].method).toBe('POST')
    })
  })

  describe('JWT Bearer tokens and automatic refresh', () => {
    const testProfile = { phone: '+79990001122', name: 'Аня', email: '', notifications: true, joinedAt: 1 }

    it('attaches Authorization: Bearer <token> when access token is present', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, 'valid.jwt.token')
      fetchMock.mockResolvedValue(json([{ id: 'p1', title: 'Акция' }]))

      await client.getPromos()

      const [, init] = lastCall()
      expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer valid.jwt.token')
    })

    it('on 401 response, automatically calls /auth/refresh, updates tokens, and retries the request', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, 'expired.jwt.token')
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'old.refresh.token')

      // Call 1: Original request fails with 401
      fetchMock.mockResolvedValueOnce(json({ error: 'Token expired', reason: 'token_expired' }, 401))
      // Call 2: Refresh token request succeeds with rotated tokens
      fetchMock.mockResolvedValueOnce(json({ accessToken: 'new.jwt.token', refreshToken: 'new.refresh.token' }, 200))
      // Call 3: Retried request succeeds
      fetchMock.mockResolvedValueOnce(json({ ...testProfile, name: 'Анна' }, 200))

      const res = await client.updateProfile({ name: 'Анна' })
      expect(res.name).toBe('Анна')

      // Assert storage updated with rotated tokens
      expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBe('new.jwt.token')
      expect(localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)).toBe('new.refresh.token')

      // Assert call history
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/profile`)
      expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Authorization']).toBe('Bearer expired.jwt.token')

      expect(fetchMock.mock.calls[1][0]).toBe(`${baseUrl}/auth/refresh`)
      expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({ refreshToken: 'old.refresh.token' })

      expect(fetchMock.mock.calls[2][0]).toBe(`${baseUrl}/profile`)
      expect((fetchMock.mock.calls[2][1].headers as Record<string, string>)['Authorization']).toBe('Bearer new.jwt.token')
    })

    it('on 401 when refresh also fails, clears auth tokens and getProfile returns null', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, 'expired.jwt.token')
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'revoked.refresh.token')

      // Call 1: Original request returns 401
      fetchMock.mockResolvedValueOnce(json({ error: 'Token expired' }, 401))
      // Call 2: Refresh call returns 401 (invalid/expired refresh token)
      fetchMock.mockResolvedValueOnce(json({ error: 'Invalid refresh token' }, 401))

      const res = await client.getProfile()
      expect(res).toBeNull()

      // Auth storage should be wiped clean
      expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBeNull()
    })

    it('deduplicates concurrent refresh requests using the same in-flight promise', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, 'expired.jwt.token')
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'active.refresh.token')

      // Both requests fail with 401
      fetchMock.mockResolvedValueOnce(json({ error: 'expired' }, 401))
      fetchMock.mockResolvedValueOnce(json({ error: 'expired' }, 401))

      // Exactly ONE refresh call happens
      fetchMock.mockResolvedValueOnce(json({ accessToken: 'rotated.access', refreshToken: 'rotated.refresh' }, 200))

      // Both replayed requests succeed
      fetchMock.mockResolvedValueOnce(json(testProfile, 200))
      fetchMock.mockResolvedValueOnce(json([{ id: 'p1', title: 'Акция' }], 200))

      const [prof, promos] = await Promise.all([client.updateProfile({ name: 'Аня' }), client.getPromos()])

      expect(prof).toBeDefined()
      expect(promos).toHaveLength(1)

      // Total fetch calls = 2 (initial fails) + 1 (refresh) + 2 (replays) = 5 calls
      const refreshCalls = fetchMock.mock.calls.filter((c) => c[0] === `${baseUrl}/auth/refresh`)
      expect(refreshCalls).toHaveLength(1)
    })

    it('signOut clears all auth keys from localStorage', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, 'some.token')
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, 'some.refresh')

      fetchMock.mockResolvedValue(json({ success: true }))
      await client.signOut()

      expect(localStorage.getItem(AUTH_PHONE_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_ACCESS_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)).toBeNull()
    })
  })

  describe('orders', () => {
    it('getOrders returns [] for a fresh guest without asking the server for everyone’s orders', async () => {
      expect(await client.getOrders()).toEqual([])
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('createOrder remembers the id so a guest can follow it, newest first, de-duplicated', async () => {
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(['ord-old', 'ord-new']))
      fetchMock.mockResolvedValue(json(order('ord-new')))
      await client.createOrder({ lines: [], subtotal: 200, discount: 0, total: 200, name: 'Аня', pickup: { kind: 'asap' }, payment: 'card' })
      expect(JSON.parse(localStorage.getItem(GUEST_ORDERS_KEY)!)).toEqual(['ord-new', 'ord-old'])
      expect(lastCall()[1].method).toBe('POST')
    })

    it('getOrders for a guest fetches the remembered ids', async () => {
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(['a', 'b c']))
      fetchMock.mockResolvedValue(json([order('a')]))
      await client.getOrders()
      expect(lastCall()[0]).toBe(`${baseUrl}/orders?ids=a,b%20c`)
    })

    it('getOrders tolerates corrupted guest storage', async () => {
      localStorage.setItem(GUEST_ORDERS_KEY, '{not json')
      expect(await client.getOrders()).toEqual([])
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify({ a: 1 }))
      expect(await client.getOrders()).toEqual([])
    })

    it('getOrders for a signed-in guest merges phone orders with earlier device orders, newest first', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(['mine', 'device']))
      fetchMock.mockResolvedValueOnce(json([order('mine', 2000)])).mockResolvedValueOnce(json([order('device', 3000)]))
      const list = await client.getOrders()
      expect(list.map((o) => o.id)).toEqual(['device', 'mine'])
      expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/orders?phone=%2B79990001122`)
      expect(fetchMock.mock.calls[1][0]).toBe(`${baseUrl}/orders?ids=device`)
    })

    it('getOrders for a signed-in guest makes one call when there are no extra device orders', async () => {
      localStorage.setItem(AUTH_PHONE_KEY, '+79990001122')
      localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(['mine']))
      fetchMock.mockResolvedValue(json([order('mine')]))
      expect((await client.getOrders()).map((o) => o.id)).toEqual(['mine'])
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('getOrder returns the order, null on 404, and throws on other errors', async () => {
      fetchMock.mockResolvedValueOnce(json(order('ord-1')))
      expect((await client.getOrder('ord-1'))?.id).toBe('ord-1')
      fetchMock.mockResolvedValueOnce(json({ error: 'Order not found' }, 404))
      expect(await client.getOrder('nope')).toBeNull()
      fetchMock.mockResolvedValueOnce(json({ error: 'boom' }, 500))
      await expect(client.getOrder('x')).rejects.toMatchObject({ status: 500 })
    })

    it('updateOrder PATCHes and returns the server copy', async () => {
      fetchMock.mockResolvedValue(json(order('ord-1', 1000, { rating: 'good' })))
      const updated = await client.updateOrder('ord-1', { rating: 'good' })
      expect(updated.rating).toBe('good')
      expect(lastCall()[0]).toBe(`${baseUrl}/orders/ord-1`)
      expect(lastCall()[1].method).toBe('PATCH')
    })

    it('updateOrder surfaces a 409 when the order can no longer be cancelled', async () => {
      fetchMock.mockResolvedValue(json({ error: 'Order can no longer be cancelled' }, 409))
      await expect(client.updateOrder('ord-1', { cancelledAt: 1 })).rejects.toMatchObject({ status: 409 })
    })

    it('orderEventsUrl points at the SSE stream', () => {
      expect(client.orderEventsUrl('ord 1')).toBe(`${baseUrl}/orders/ord%201/events`)
    })
  })

  describe('promo', () => {
    it('checkPromo URL-encodes Cyrillic codes and returns the server verdict', async () => {
      fetchMock.mockResolvedValue(json({ code: 'ЗЕРНО10', valid: true, percent: 10, label: '−10%' }))
      const res = await client.checkPromo('ЗЕРНО10')
      expect(res).toEqual({ code: 'ЗЕРНО10', valid: true, percent: 10, label: '−10%' })
      expect(lastCall()[0]).toBe(`${baseUrl}/promo/check?code=${encodeURIComponent('ЗЕРНО10')}`)
    })

    it('getPromos fetches /promos', async () => {
      fetchMock.mockResolvedValue(json([{ id: 'p1', title: 'Акция' }]))
      const res = await client.getPromos()
      expect(res).toEqual([{ id: 'p1', title: 'Акция' }])
      expect(lastCall()[0]).toBe(`${baseUrl}/promos`)
    })
  })
})
