import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '../api'
import { catalogData } from '../test/catalogFixture'
import { emptyCatalog, useCatalog, useCatalogQuery } from './useCatalog'

const wrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('queries/useCatalog', () => {
  afterEach(() => vi.restoreAllMocks())

  it('starts empty (no bundled menu) and indexes the catalog once the API answers', async () => {
    const spy = vi.spyOn(api, 'getCatalog').mockResolvedValue(catalogData)
    const { result } = renderHook(() => useCatalog(), { wrapper: wrapper() })

    expect(result.current).toBe(emptyCatalog)
    expect(result.current.items).toEqual([])

    await waitFor(() => expect(result.current.items.length).toBe(catalogData.items.length))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(result.current.itemById.get('latte')?.name).toBe('Латте')
    expect(result.current.topCategories.map((c) => c.id)).toEqual(['coffee', 'food'])
    expect(result.current.subcategoriesOf('coffee').map((c) => c.id)).toEqual(['milk-coffee', 'black-coffee'])
    expect(result.current.groupById.get('milk')?.name).toBe('Молоко')
  })

  it('exposes the error so the menu can offer a retry', async () => {
    vi.spyOn(api, 'getCatalog').mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => ({ query: useCatalogQuery(), catalog: useCatalog() }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.query.isError).toBe(true))
    expect(result.current.catalog).toBe(emptyCatalog)
  })

  it('emptyCatalog lookups are safe', () => {
    expect(emptyCatalog.subcategoriesOf('coffee')).toEqual([])
    expect(emptyCatalog.itemsOf('x')).toEqual([])
    expect(emptyCatalog.itemById.get('latte')).toBeUndefined()
  })
})
