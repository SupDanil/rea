import { useCallback, useEffect, useState } from 'react'

import { api } from '../api'
import {
  GIFT_DRINK_LIMIT,
  giftValue,
  type Level,
  levels,
  type Loyalty,
  loyaltyOf,
  STAMP_MIN_TOTAL,
  STAMPS_PER_GIFT,
} from '../domain/loyalty'
import type { UserProfile } from '../domain/profile'
import { getTelegramInitData, isTelegramWebApp } from '../utils/telegram'
import { hasAuthToken, readCachedProfile, writeCachedProfile } from '../utils/storage'

export type Profile = UserProfile
export type { Level, Loyalty }
export { GIFT_DRINK_LIMIT, giftValue,levels, loyaltyOf, STAMP_MIN_TOTAL, STAMPS_PER_GIFT }

// Keys the old demo build kept its fake profile and orders under.
const LEGACY_KEYS = ['zerno-orders', 'zerno-profile', 'mock-api-orders', 'mock-api-profile']

/** The signed-in guest, loaded from the server for the phone saved on this device. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(() => readCachedProfile<Profile>())
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => {
    return hasAuthToken() && !readCachedProfile<Profile>()
  })

  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    } catch {
      // Storage unavailable: nothing to clean up.
    }
    let cancelled = false

    api
      .getProfile()
      .then(async (p) => {
        if (!cancelled) {
          if (p) {
            setProfile(p)
            writeCachedProfile(p)
            setIsAuthLoading(false)
          } else if (isTelegramWebApp()) {
            const initData = getTelegramInitData()
            if (initData) {
              try {
                const tgAuth = await api.telegramWebAppAuth(initData)
                if (!cancelled && tgAuth.profile) {
                  setProfile(tgAuth.profile)
                  writeCachedProfile(tgAuth.profile)
                }
              } catch {}
            }
            setIsAuthLoading(false)
          } else {
            setIsAuthLoading(false)
          }
        }
      })
      .catch(async () => {
        if (!cancelled) {
          if (isTelegramWebApp()) {
            const initData = getTelegramInitData()
            if (initData) {
              try {
                const tgAuth = await api.telegramWebAppAuth(initData)
                if (!cancelled && tgAuth.profile) {
                  setProfile(tgAuth.profile)
                  writeCachedProfile(tgAuth.profile)
                }
              } catch {}
            }
          }
          setIsAuthLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Called with the profile the server returned after a successful SMS check. */
  const signIn = useCallback((next: Profile) => {
    setProfile(next)
    writeCachedProfile(next)
    setIsAuthLoading(false)
  }, [])

  const update = useCallback(async (patch: Partial<Profile>) => {
    const updated = await api.updateProfile(patch)
    setProfile(updated)
    writeCachedProfile(updated)
    return updated
  }, [])

  const signOut = useCallback(async () => {
    setProfile(null)
    writeCachedProfile(null)
    setIsAuthLoading(false)
    await api.signOut().catch(() => {})
  }, [])

  return { profile, isAuthLoading, signIn, update, signOut }
}
