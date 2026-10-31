import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '../api'
import { createCatalog, type Catalog } from '../domain'
import { queryKeys } from './keys'

/** Stand-in while the menu loads or when it failed: every lookup simply finds nothing. */
export const emptyCatalog: Catalog = createCatalog({ items: [], categories: [], ingredientGroups: [] })

// Prices and the stop-list change in the admin during the day, so the menu is refreshed periodically.
const CATALOG_REFRESH_MS = 60_000

export function useCatalogQuery() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: () => api.getCatalog(),
    staleTime: CATALOG_REFRESH_MS,
    refetchInterval: CATALOG_REFRESH_MS,
  })
}

/** Indexed catalog from the API; empty until the first response arrives. */
export function useCatalog(): Catalog {
  const { data } = useCatalogQuery()
  return useMemo(() => (data ? createCatalog(data) : emptyCatalog), [data])
}
