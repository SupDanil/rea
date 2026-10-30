import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '../api'
import { categories, ingredientGroups, menuItems, staticCatalog } from '../data/menu'
import { createCatalog, type Catalog, type CatalogData } from '../domain'
import { queryKeys } from './keys'

export const fallbackCatalogData: CatalogData = {
  items: menuItems,
  categories,
  ingredientGroups,
}

export { staticCatalog }

/** Hook providing indexed catalog with synchronous fallback to static menu data. */
export function useCatalog(): Catalog {
  const { data } = useQuery({
    queryKey: queryKeys.catalog,
    queryFn: () => api.getCatalog(),
    initialData: fallbackCatalogData,
    staleTime: 5 * 60_000,
  })

  return useMemo(() => createCatalog(data), [data])
}
