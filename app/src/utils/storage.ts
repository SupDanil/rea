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
