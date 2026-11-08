import { useEffect, useState, useSyncExternalStore } from 'react'
import { registerSW } from 'virtual:pwa-register'

import { checkIsStandalone } from './usePwaInstall'

export interface PwaUpdateState {
  needRefresh: boolean
  isUpdating: boolean
  isDismissed: boolean
}

let standaloneOverride: boolean | null = null

export function checkIsAppStandalone(): boolean {
  if (standaloneOverride !== null) return standaloneOverride
  return checkIsStandalone()
}

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let registration: ServiceWorkerRegistration | null = null
let state: PwaUpdateState = {
  needRefresh: false,
  isUpdating: false,
  isDismissed: false,
}

const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

function updateState(partial: Partial<PwaUpdateState>): void {
  state = { ...state, ...partial }
  emitChange()
}

/** Check if service worker has an update waiting or query the server for new sw.js */
export async function checkForUpdate(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    if (!registration) {
      registration = (await navigator.serviceWorker.getRegistration()) ?? null
    }
    if (registration) {
      if (registration.waiting) {
        updateState({ needRefresh: true })
      }
      await registration.update().catch(() => {})
    }
  } catch {
    // Ignore network or registration check errors
  }
}

let initialized = false

/** Initialize PWA service worker registration and background update triggers */
export function initPwaUpdate(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  // Handle dynamic chunk loading errors (e.g. after a deploy removed old chunks)
  window.addEventListener('vite:preloadError', () => {
    const reloadKey = 'pwa_preload_reload'
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1')
      window.location.reload()
    }
  })

  if ('serviceWorker' in navigator) {
    try {
      updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateState({ needRefresh: true })
        },
        onRegisteredSW(_swUrl, reg) {
          registration = reg ?? null
          if (reg?.waiting) {
            updateState({ needRefresh: true })
          }
        },
      })
    } catch {
      // Ignore registration errors in unsupported or test environments
    }

    // Re-check for updates when user brings the app from background to foreground
    let hiddenAt = 0
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (document.visibilityState === 'visible') {
        // If app was backgrounded for more than 10 minutes, reset dismissed flag on return
        if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) {
          updateState({ isDismissed: false })
        }
        void checkForUpdate()
      }
    })

    // Check when network connection is re-established
    window.addEventListener('online', () => {
      void checkForUpdate()
    })

    // Periodic check every 30 minutes for long-running sessions
    window.setInterval(() => {
      void checkForUpdate()
    }, 30 * 60 * 1000)

    // Initial check on mount
    void checkForUpdate()
  }
}

/** Activate waiting service worker and reload the page to load fresh assets */
export async function updateApp(): Promise<void> {
  updateState({ isUpdating: true })
  try {
    if (updateServiceWorker) {
      await updateServiceWorker(true)
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            window.location.reload()
          },
          { once: true },
        )
        // Fallback reload if controllerchange does not fire within 1.5s
        window.setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        window.location.reload()
      }
    } else {
      window.location.reload()
    }
  } catch {
    window.location.reload()
  }
}

/** Dismiss the update prompt for the current session */
export function dismissUpdate(): void {
  updateState({ isDismissed: true })
}

/** React hook for PWA update state and control */
export function usePwaUpdate() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsAppStandalone())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(display-mode: standalone)')
    const onMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || checkIsAppStandalone())
    }
    media.addEventListener('change', onMediaChange)
    return () => media.removeEventListener('change', onMediaChange)
  }, [])

  const current = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => state,
    () => state,
  )

  useEffect(() => {
    initPwaUpdate()
  }, [])

  return {
    needRefresh: current.needRefresh,
    isUpdating: current.isUpdating,
    isDismissed: current.isDismissed,
    isStandalone,
    showModal: isStandalone && current.needRefresh && !current.isDismissed,
    updateApp,
    dismissUpdate,
    checkForUpdate,
  }
}

/** Reset update state (for testing) */
export function _resetPwaUpdateState(): void {
  state = {
    needRefresh: false,
    isUpdating: false,
    isDismissed: false,
  }
  updateServiceWorker = null
  registration = null
  initialized = false
  standaloneOverride = null
  emitChange()
}

/** Override standalone detection (for testing) */
export function _setStandaloneOverride(value: boolean | null): void {
  standaloneOverride = value
}

/** Set update state directly (for testing) */
export function _setPwaUpdateState(partial: Partial<PwaUpdateState>): void {
  updateState(partial)
}
