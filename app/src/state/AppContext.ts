import { createContext, useContext } from 'react'
import type { Cart } from './cart'
import type { Loyalty, Profile } from './loyalty'
import type { Order, Orders } from './orders'
import type { Theme } from './theme'

export type Toast = { text: string; action?: { label: string; run: () => void } }

export type AppState = {
  cart: Cart
  orders: Orders
  profile: Profile | null
  loyalty: Loyalty
  signIn: (profile: Profile) => void
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>
  signOut: () => Promise<void>
  /** Orders placed while signed in to the current profile */
  myOrders: Order[]
  selectedShopId: string | null
  setSelectedShopId: (id: string) => void
  theme: Theme
  toggleTheme: () => void
  toast: Toast | null
  showToast: (toast: Toast) => void
  hideToast: () => void
}

export const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const state = useContext(AppContext)
  if (!state) throw new Error('useApp must be used inside <AppProvider>')
  return state
}
