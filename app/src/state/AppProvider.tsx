import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppContext, type AppState, type Toast } from './AppContext'
import { useCart } from './cart'
import { loyaltyOf, useProfile } from './loyalty'
import { useOrders } from './orders'
import { useTheme } from './theme'

export function AppProvider({ children }: { children: ReactNode }) {
  const cart = useCart()
  const orders = useOrders()
  const { profile, signIn, update: updateProfile, signOut } = useProfile()
  const { theme, toggle: toggleTheme } = useTheme()
  const [toast, setToast] = useState<Toast | null>(null)
  const [flightId, setFlightId] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.action ? 4000 : 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const hideToast = useCallback(() => setToast(null), [])
  const myOrders = useMemo(() => (profile ? orders.orders.filter((o) => o.phone === profile.phone) : []), [orders.orders, profile])

  const value: AppState = {
    cart,
    orders,
    profile,
    loyalty: loyaltyOf(orders.orders, profile),
    signIn,
    updateProfile,
    signOut,
    myOrders,
    theme,
    toggleTheme,
    flightId,
    setFlightId,
    toast,
    showToast: setToast,
    hideToast,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
