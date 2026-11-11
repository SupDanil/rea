import { isTelegramWebApp } from './telegram'

export type ClientChannel = 'telegram' | 'installed' | 'web'

/**
 * Detects whether the app is currently accessed from:
 * - 'telegram': inside Telegram Mini App / WebApp
 * - 'installed': PWA standalone (added to homescreen) or native wrapper (TWA / APK / iOS WebClip)
 * - 'web': regular web browser
 */
export function getClientChannel(): ClientChannel {
  if (typeof window === 'undefined') return 'web'

  // 1. Telegram WebApp check
  if (isTelegramWebApp()) return 'telegram'

  // 2. Installed standalone check (PWA / TWA / iOS home screen app)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')

  if (isStandalone) return 'installed'

  // 3. Regular browser Web
  return 'web'
}
