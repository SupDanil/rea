import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import {
  GIFT_DRINK_LIMIT,
  giftValue as domainGiftValue,
  levels,
  loyaltyOf,
  STAMP_MIN_TOTAL,
  STAMPS_PER_GIFT,
  type Level,
  type Loyalty,
} from '../domain/loyalty'
import type { CartLine } from '../domain/cart'
import type { UserProfile } from '../domain/profile'
import { staticCatalog } from '../queries/useCatalog'

export type Profile = UserProfile
export type { Level, Loyalty }
export { levels, STAMPS_PER_GIFT, STAMP_MIN_TOTAL, GIFT_DRINK_LIMIT, loyaltyOf }

export const giftValue = (lines: CartLine[]) => domainGiftValue(lines, staticCatalog)

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)

  const refreshProfile = useCallback(async () => {
    try {
      const p = await api.getProfile()
      if (p) setProfile(p)
    } catch {}
  }, [])

  useEffect(() => {
    // Clear any legacy mock localStorage keys
    try {
      localStorage.removeItem('zerno-orders')
      localStorage.removeItem('zerno-profile')
      localStorage.removeItem('mock-api-orders')
      localStorage.removeItem('mock-api-profile')
    } catch {}
    refreshProfile()
  }, [refreshProfile])

  const signIn = useCallback(
    async (phone: string, name = 'Гость') => {
      try {
        const res = await api.verifySmsCode(phone, '1234', name)
        if (res?.profile) {
          setProfile(res.profile)
          return
        }
      } catch {}
      setProfile((prev) => ({
        phone,
        name: prev?.name || name,
        email: prev?.email || '',
        notifications: prev?.notifications ?? true,
        joinedAt: prev?.joinedAt || Date.now(),
      }))
    },
    [],
  )

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      try {
        const updated = await api.updateProfile(patch)
        if (updated) {
          setProfile(updated)
          return
        }
      } catch {}
      setProfile((prev) => (prev ? { ...prev, ...patch } : null))
    },
    [],
  )

  const signOut = useCallback(async () => {
    try {
      await api.signOut()
    } catch {}
    setProfile(null)
  }, [])

  return { profile, signIn, update, signOut }
}
