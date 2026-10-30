import { useCallback } from 'react'
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
import { usePersistent } from '../hooks/usePersistent'
import { staticCatalog } from '../queries/useCatalog'

export type Profile = UserProfile
export type { Level, Loyalty }
export { levels, STAMPS_PER_GIFT, STAMP_MIN_TOTAL, GIFT_DRINK_LIMIT, loyaltyOf }

export const giftValue = (lines: CartLine[]) => domainGiftValue(lines, staticCatalog)

export function useProfile() {
  const [profile, setProfile] = usePersistent<Profile | null>('zerno-profile', null)

  const signIn = useCallback(
    (phone: string, name = 'Гость') =>
      setProfile((prev) => ({
        phone,
        name: prev?.name || name,
        email: prev?.email || '',
        notifications: prev?.notifications ?? true,
        joinedAt: prev?.joinedAt || Date.now(),
      })),
    [setProfile],
  )
  const update = useCallback(
    (patch: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...patch } : null)),
    [setProfile],
  )
  const signOut = useCallback(() => setProfile(null), [setProfile])

  return { profile, signIn, update, signOut }
}
