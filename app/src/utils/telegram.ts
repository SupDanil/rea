export interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramWebAppThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramWebAppUser
    auth_date?: string
    hash?: string
    query_id?: string
    start_param?: string
  }
  version: string
  platform: string
  themeParams: TelegramWebAppThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  ready(): void
  expand(): void
  close(): void
  disableVerticalSwipes?(): void
  enableVerticalSwipes?(): void
  requestWriteAccess?(callback?: (allowed: boolean) => void): void
  requestContact?(callback?: (shared: boolean, res?: any) => void): void
  addToHomeScreen?(): void
  checkHomeScreenStatus?(
    callback?: (status: 'unsupported' | 'unknown' | 'added' | 'missed') => void
  ): void
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(cb: () => void): void
    offClick(cb: () => void): void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(cb: () => void): void
    offClick(cb: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
  }
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

/**
 * Returns the Telegram WebApp instance if available
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

/**
 * Checks whether the app is currently running inside Telegram Mini App
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false

  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || ''
  if (/Telegram/i.test(ua)) return true

  const hash = window.location?.hash || ''
  const search = window.location?.search || ''
  if (
    hash.includes('tgWebAppData') ||
    hash.includes('tgWebAppPlatform') ||
    search.includes('tgWebAppData') ||
    search.includes('tgWebAppPlatform')
  ) {
    return true
  }

  if ((window as any).TelegramWebviewProxy) {
    return true
  }

  const tg = getTelegramWebApp()
  if (!tg) return false
  // Inside Telegram, initData is present or platform is not unknown
  return Boolean(tg.initData && tg.initData.length > 0) || (Boolean(tg.platform) && tg.platform !== 'unknown')
}

/**
 * Returns raw initData string
 */
export function getTelegramInitData(): string {
  const tg = getTelegramWebApp()
  return tg?.initData || ''
}

/**
 * Returns user object if running in Telegram
 */
export function getTelegramUser(): TelegramWebAppUser | null {
  const tg = getTelegramWebApp()
  return tg?.initDataUnsafe?.user || null
}

/**
 * Initializes Telegram Mini App view: calls ready, expand, disables accidental vertical swipes
 */
export function initTelegramApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) return

  try {
    tg.ready?.()
    tg.expand?.()
    tg.disableVerticalSwipes?.()
  } catch (err) {
    console.warn('[telegram-app] Init error:', err)
  }
}

/**
 * Requests permission for the bot to send messages/notifications to the user
 */
export function requestTelegramWriteAccess(): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp()
    if (!tg?.requestWriteAccess) {
      resolve(false)
      return
    }

    try {
      tg.requestWriteAccess((allowed: boolean) => {
        resolve(Boolean(allowed))
      })
    } catch {
      resolve(false)
    }
  })
}

/**
 * Requests phone number contact from user via Telegram native dialog
 */
export function requestTelegramContact(): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp()
    if (!tg?.requestContact) {
      resolve(false)
      return
    }
    try {
      tg.requestContact((shared: boolean) => {
        resolve(Boolean(shared))
      })
    } catch {
      resolve(false)
    }
  })
}

/**
 * Prompts user to add Mini App to Home Screen (PWA on Android / iOS)
 */
export function addTelegramAppToHomeScreen(): void {
  const tg = getTelegramWebApp()
  if (tg?.addToHomeScreen) {
    try {
      tg.addToHomeScreen()
    } catch (err) {
      console.warn('[telegram-app] addToHomeScreen error:', err)
    }
  }
}

/**
 * Checks home screen install status
 */
export function checkTelegramHomeScreenStatus(): Promise<'unsupported' | 'unknown' | 'added' | 'missed'> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp()
    if (!tg?.checkHomeScreenStatus) {
      resolve('unsupported')
      return
    }

    try {
      tg.checkHomeScreenStatus((status) => {
        resolve(status || 'unknown')
      })
    } catch {
      resolve('unsupported')
    }
  })
}

/**
 * Trigger haptic vibration feedback
 */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void {
  const tg = getTelegramWebApp()
  try {
    tg?.HapticFeedback?.impactOccurred?.(style)
  } catch {}
}

export function hapticNotification(type: 'error' | 'success' | 'warning'): void {
  const tg = getTelegramWebApp()
  try {
    tg?.HapticFeedback?.notificationOccurred?.(type)
  } catch {}
}

export function hapticSelection(): void {
  const tg = getTelegramWebApp()
  try {
    tg?.HapticFeedback?.selectionChanged?.()
  } catch {}
}
