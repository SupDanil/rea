import { useCallback, useEffect, useState } from 'react'

const DISMISSED_KEY = 'shit_coffee_pwa_banner_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

/** Check whether the web app is running in standalone (PWA) mode */
export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const isIosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  return isStandaloneMedia || isIosStandalone
}

/** Detect whether current device is running iOS (iPhone, iPad, iPod) */
export function checkIsIos(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * PWA installation state and trigger.
 * Captures `beforeinstallprompt` on Android / Chromium and detects iOS Safari standalone requirements.
 */
export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone())
  const [isIos] = useState<boolean>(() => checkIsIos())
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    // Re-check standalone when display mode changes
    const media = window.matchMedia('(display-mode: standalone)')
    const onMediaChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches)
    }
    media.addEventListener?.('change', onMediaChange)

    const onBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent browser default infobar to show custom matching UI
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const onAppInstalled = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      media.removeEventListener?.('change', onMediaChange)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<'native' | 'guide'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsStandalone(true)
        }
        setDeferredPrompt(null)
        return 'native'
      } catch {
        return 'guide'
      }
    }
    return 'guide'
  }, [deferredPrompt])

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {}
  }, [])

  return {
    isStandalone,
    isIos,
    isPromptReady: deferredPrompt !== null,
    canInstall: !isStandalone,
    isBannerDismissed,
    promptInstall,
    dismissBanner,
  }
}
