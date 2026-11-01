import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Shop } from '../domain'
import { queryKeys } from './keys'
import { AppContext } from '../state/AppContext'

// The pause switch should reach guests quickly, so shops refresh more often than the menu.
const SHOPS_REFRESH_MS = 30_000

export function useShopsQuery() {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: () => api.getShops(),
    staleTime: SHOPS_REFRESH_MS,
    refetchInterval: SHOPS_REFRESH_MS,
  })
}

/** The shop with `id`, or currently selected in app, or the first active one. */
export function useShop(id?: string): Shop | undefined {
  const { data } = useShopsQuery()
  const app = useContext(AppContext)
  const selectedId = app?.selectedShopId ?? null
  const targetId = id || selectedId
  return (targetId && data?.find((s) => s.id === targetId)) || data?.[0]
}
