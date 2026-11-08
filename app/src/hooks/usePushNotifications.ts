import { useCallback, useEffect, useState } from 'react'

import { api } from '../api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function usePushNotifications() {
  const [isSupported] = useState<boolean>(() => isPushSupported())
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification !== 'undefined') {
      return Notification.permission
    }
    return 'default'
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupported) return
    let cancelled = false

    navigator.serviceWorker.ready
      .then((reg) => {
        if (cancelled) return
        return reg.pushManager.getSubscription().then((sub) => {
          if (cancelled) return
          setIsSubscribed(Boolean(sub))
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isSupported])

  const subscribe = useCallback(
    async (phone?: string): Promise<boolean> => {
      if (!isSupported) {
        setError('Push-уведомления не поддерживаются на этом устройстве')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const perm = await Notification.requestPermission()
        setPermission(perm)

        if (perm !== 'granted') {
          setError('Разрешение на уведомления отклонено')
          return false
        }

        const registration = await navigator.serviceWorker.ready
        const vapidKey = await api.getVapidPublicKey()
        const convertedVapidKey = urlBase64ToUint8Array(vapidKey)

        let sub = await registration.pushManager.getSubscription()
        if (!sub) {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as unknown as BufferSource,
          })
        }

        await api.subscribePush(sub.toJSON(), phone)
        setIsSubscribed(true)
        return true
      } catch (err) {
        console.error('[PUSH] Failed to subscribe:', err)
        setError('Не удалось подписаться на уведомления')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [isSupported],
  )

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()

      if (sub) {
        try {
          await api.unsubscribePush(sub.endpoint)
        } catch {
          // Backend might already have expired it
        }
        await sub.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('[PUSH] Failed to unsubscribe:', err)
      setError('Не удалось отключить уведомления')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const syncIfGranted = useCallback(
    async (phone?: string) => {
      if (!isSupported || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        let sub = await registration.pushManager.getSubscription()
        if (!sub) {
          const vapidKey = await api.getVapidPublicKey()
          const converted = urlBase64ToUint8Array(vapidKey)
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: converted as unknown as BufferSource,
          })
        }
        if (sub) {
          await api.subscribePush(sub.toJSON(), phone)
          setIsSubscribed(true)
        }
      } catch {
        // Silent background sync
      }
    },
    [isSupported],
  )

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    syncIfGranted,
  }
}
