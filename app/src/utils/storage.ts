// localStorage can throw (private mode, blocked site data); these never do.

export function readString(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not critical: the value just won't survive a reload.
  }
}

/** Name typed at a previous checkout, offered as the default next time. */
export const SAVED_NAME_KEY = 'zerno-name'
export const readSavedName = () => readString(SAVED_NAME_KEY) ?? ''

export const AUTH_PROFILE_KEY = 'shit_coffee_profile_cache'

export function readCachedProfile<T>(): T | null {
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeCachedProfile(profile: unknown | null): void {
  try {
    if (profile === null) {
      localStorage.removeItem(AUTH_PROFILE_KEY)
    } else {
      localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
    }
  } catch {}
}

export function hasAuthToken(): boolean {
  try {
    return !!(
      localStorage.getItem('shit_coffee_access_token') ||
      localStorage.getItem('shit_coffee_refresh_token') ||
      localStorage.getItem('shit_coffee_phone')
    )
  } catch {
    return false
  }
}
