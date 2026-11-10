import { type ReactNode,useCallback, useEffect, useMemo, useState } from 'react'

import { usePushNotifications } from '../hooks/usePushNotifications'
import { checkIsStandalone } from '../hooks/usePwaInstall'
import { isTelegramWebApp } from '../utils/telegram'
import { AppContext, type AppState, type Toast } from './AppContext'
import { useCart } from './cart'
import { loyaltyOf, useProfile } from './loyalty'
import { useOrders } from './orders'
import { useTheme } from './theme'

export const SELECTED_SHOP_KEY = 'zerno_selected_shop_id'

export function AppProvider({ children }: { children: ReactNode }) {
  const cart = useCart()
  const { profile, isAuthLoading, signIn, update: updateProfile, signOut } = useProfile()
  const orders = useOrders(profile?.phone ?? null)
  const { theme, toggle: toggleTheme } = useTheme()
  const { isSupported, permission, subscribe, syncIfGranted } = usePushNotifications()
  const [toast, setToast] = useState<Toast | null>(null)
  const [selectedShopId, setSelectedShopIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_SHOP_KEY)
    } catch {
      return null
    }
  })

  const setSelectedShopId = useCallback((id: string) => {
    setSelectedShopIdState(id)
    try {
      localStorage.setItem(SELECTED_SHOP_KEY, id)
    } catch {}
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.action ? 4000 : 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  // Automatically request push notification permission after PWA installation or on standalone launch,
  // ONLY if the user is logged in and has not yet enabled app notifications.
  useEffect(() => {
    if (!isSupported || isTelegramWebApp()) return
    const isStandalone = checkIsStandalone()

    const triggerAutoPrompt = async () => {
      if (!profile?.phone || profile.notificationsApp) return

      const KEY = 'shit_coffee_pwa_push_autoprompted'
      try {
        if (sessionStorage.getItem(KEY) === '1') return
        sessionStorage.setItem(KEY, '1')
      } catch {}

      try {
        const ok = await subscribe(profile.phone)
        if (ok) {
          if (updateProfile) {
            await updateProfile({ notificationsApp: true, notifications: true }).catch(() => {})
          }
          setToast({ text: 'Уведомления включены! Сообщим о готовности кофе ☕️' })
        }
      } catch {
        // Suppressed or rejected without gesture — in-app prompts remain for manual tap
      }
    }

    if (isStandalone) {
      if (permission === 'default' && profile?.phone && !profile.notificationsApp) {
        void triggerAutoPrompt()
      } else if (permission === 'granted' && profile?.phone && profile.notificationsApp !== false) {
        void syncIfGranted(profile.phone)
      }
    }

    const onAppInstalled = () => {
      if (permission === 'default' && profile?.phone && !profile.notificationsApp) {
        void triggerAutoPrompt()
      }
    }

    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [isSupported, permission, profile?.phone, profile?.notificationsApp, subscribe, syncIfGranted, updateProfile])

  const hideToast = useCallback(() => setToast(null), [])
  const myOrders = useMemo(() => (profile ? orders.orders.filter((o) => o.phone === profile.phone) : []), [orders.orders, profile])

  const value: AppState = {
    cart,
    orders,
    profile,
    isAuthLoading,
    loyalty: loyaltyOf(orders.orders, profile),
    signIn,
    updateProfile,
    signOut,
    myOrders,
    selectedShopId,
    setSelectedShopId,
    theme,
    toggleTheme,
    toast,
    showToast: setToast,
    hideToast,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
