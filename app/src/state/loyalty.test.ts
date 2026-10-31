import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfile, giftValue } from './loyalty'
import { api } from '../api'

describe('useProfile state hook and loyalty calculation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('initializes profile by calling api.getProfile()', async () => {
    const mockProfile = {
      phone: '+79991112233',
      name: 'Данил',
      email: '',
      notifications: true,
      joinedAt: 1000,
    }
    vi.spyOn(api, 'getProfile').mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useProfile())

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.profile).toEqual(mockProfile)
    expect(api.getProfile).toHaveBeenCalled()
  })

  it('signIn() verifies code and sets profile', async () => {
    vi.spyOn(api, 'getProfile').mockResolvedValue(null)
    const verifiedProfile = {
      phone: '+79998889900',
      name: 'Мария',
      email: '',
      notifications: true,
      joinedAt: 1000,
    }
    vi.spyOn(api, 'verifySmsCode').mockResolvedValue({
      phone: '+79998889900',
      code: '1234',
      profile: verifiedProfile,
    })

    const { result } = renderHook(() => useProfile())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.signIn('+79998889900', 'Мария')
    })

    expect(api.verifySmsCode).toHaveBeenCalledWith('+79998889900', '1234', 'Мария')
    expect(result.current.profile).toEqual(verifiedProfile)
  })

  it('update() calls api.updateProfile and updates state', async () => {
    const initialProfile = {
      phone: '+79998889900',
      name: 'Мария',
      email: '',
      notifications: true,
      joinedAt: 1000,
    }
    vi.spyOn(api, 'getProfile').mockResolvedValue(initialProfile)
    vi.spyOn(api, 'updateProfile').mockResolvedValue({
      ...initialProfile,
      name: 'Мария Новая',
      email: 'maria@test.com',
    })

    const { result } = renderHook(() => useProfile())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.update({ name: 'Мария Новая', email: 'maria@test.com' })
    })

    expect(api.updateProfile).toHaveBeenCalledWith({ name: 'Мария Новая', email: 'maria@test.com' })
    expect(result.current.profile?.name).toBe('Мария Новая')
    expect(result.current.profile?.email).toBe('maria@test.com')
  })

  it('signOut() calls api.signOut and clears profile in state', async () => {
    const initialProfile = {
      phone: '+79998889900',
      name: 'Мария',
      email: '',
      notifications: true,
      joinedAt: 1000,
    }
    vi.spyOn(api, 'getProfile').mockResolvedValue(initialProfile)
    const signOutSpy = vi.spyOn(api, 'signOut').mockResolvedValue(undefined)

    const { result } = renderHook(() => useProfile())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(signOutSpy).toHaveBeenCalled()
    expect(result.current.profile).toBeNull()
  })

  it('giftValue() computes value of least expensive eligible drink in cart', () => {
    const lines = [
      { key: 'cappuccino|m', itemId: 'cappuccino', variantId: 'm', ingredientIds: [], qty: 1 },
      { key: 'flat-white|m', itemId: 'flat-white', variantId: 'm', ingredientIds: [], qty: 1 },
    ]

    const val = giftValue(lines)
    expect(val).toBeGreaterThan(0)
  })
})
