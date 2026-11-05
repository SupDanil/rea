import { act,renderHook } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { testCatalog } from '../test/catalogFixture'
import { giftValue,useProfile } from './loyalty'

const flush = () => act(async () => {
  await Promise.resolve()
  await Promise.resolve()
})

const profile = { phone: '+79991112233', name: 'Данил', email: '', notifications: true, joinedAt: 1000 }

describe('useProfile state hook and loyalty calculation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('loads the profile from the API on mount', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(profile)
    const { result } = renderHook(() => useProfile())
    await flush()
    expect(result.current.profile).toEqual(profile)
  })

  it('stays signed out when the API is unreachable', async () => {
    vi.spyOn(api, 'getProfile').mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useProfile())
    await flush()
    expect(result.current.profile).toBeNull()
  })

  it('removes the old demo build’s fake profile/orders from storage', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(null)
    localStorage.setItem('zerno-profile', '{}')
    localStorage.setItem('mock-api-orders', '[]')
    localStorage.setItem('zerno-cart', '[]')
    renderHook(() => useProfile())
    await flush()
    expect(localStorage.getItem('zerno-profile')).toBeNull()
    expect(localStorage.getItem('mock-api-orders')).toBeNull()
    expect(localStorage.getItem('zerno-cart')).toBe('[]')
  })

  it('signIn() takes the profile the server verified — it never checks a code itself', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(null)
    const verify = vi.spyOn(api, 'verifySmsCode')
    const { result } = renderHook(() => useProfile())
    await flush()
    act(() => result.current.signIn(profile))
    expect(result.current.profile).toEqual(profile)
    expect(verify).not.toHaveBeenCalled()
  })

  it('update() saves on the server and keeps the server copy', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(profile)
    const spy = vi.spyOn(api, 'updateProfile').mockResolvedValue({ ...profile, name: 'Данила' })
    const { result } = renderHook(() => useProfile())
    await flush()
    await act(async () => {
      await result.current.update({ name: 'Данила' })
    })
    expect(spy).toHaveBeenCalledWith({ name: 'Данила' })
    expect(result.current.profile?.name).toBe('Данила')
  })

  it('update() rejects and keeps the old profile when saving fails', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(profile)
    vi.spyOn(api, 'updateProfile').mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useProfile())
    await flush()
    await act(async () => {
      await expect(result.current.update({ name: 'X' })).rejects.toThrow()
    })
    expect(result.current.profile?.name).toBe('Данил')
  })

  it('signOut() clears the profile even if the server call fails', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(profile)
    const spy = vi.spyOn(api, 'signOut').mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useProfile())
    await flush()
    await act(async () => {
      await result.current.signOut()
    })
    expect(spy).toHaveBeenCalled()
    expect(result.current.profile).toBeNull()
  })

  it('giftValue() picks the priciest drink under the limit from the live catalog', () => {
    const lines = [
      { key: '1', itemId: 'espresso', variantId: 's', ingredientIds: [], qty: 1 },
      { key: '2', itemId: 'latte', variantId: 'l', ingredientIds: ['vanilla'], qty: 1 },
      { key: '3', itemId: 'croissant', variantId: 'one', ingredientIds: [], qty: 1 },
    ]
    expect(giftValue(lines, testCatalog)).toBe(330)
  })
})
