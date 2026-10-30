import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useCatalog } from './useCatalog'

describe('queries/useCatalog', () => {
  it('provides indexed catalog with instant access to items and helpers', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCatalog(), { wrapper })

    expect(result.current.items.length).toBeGreaterThan(0)
    expect(result.current.itemById.get('latte')?.name).toBe('Латте')
    expect(result.current.topCategories.length).toBeGreaterThan(0)
    expect(result.current.groupById.get('milk')?.name).toBe('Молоко')
  })
})
