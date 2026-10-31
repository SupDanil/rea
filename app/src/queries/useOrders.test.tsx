import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useOrdersQuery, useCreateOrderMutation, useUpdateOrderMutation } from './useOrders'
import { api } from '../api'

describe('useOrders hooks', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.restoreAllMocks()
  })

  it('useOrdersQuery fetches orders from api.getOrders()', async () => {
    const mockOrders = [{ id: 'ord-1', number: 10, total: 300, status: 'making' }]
    vi.spyOn(api, 'getOrders').mockResolvedValue(mockOrders as any)

    const { result } = renderHook(() => useOrdersQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockOrders)
  })

  it('useCreateOrderMutation adds order and prepends to query cache', async () => {
    const newOrder = { id: 'ord-new', number: 11, total: 450, status: 'accepted' }
    vi.spyOn(api, 'createOrder').mockResolvedValue(newOrder as any)

    const { result } = renderHook(() => useCreateOrderMutation(), { wrapper })
    await result.current.mutateAsync({
      lines: [],
      subtotal: 450,
      discount: 0,
      total: 450,
      name: 'Данил',
      pickup: { kind: 'asap' },
      payment: 'card',
    })

    const cached = queryClient.getQueryData<any[]>(['orders'])
    expect(cached?.[0]).toEqual(newOrder)
  })

  it('useUpdateOrderMutation updates order in query cache', async () => {
    const initialOrders = [{ id: 'ord-1', number: 10, total: 300, status: 'making' }]
    queryClient.setQueryData(['orders'], initialOrders)

    const updatedOrder = { id: 'ord-1', number: 10, total: 300, status: 'ready', rating: 'good' }
    vi.spyOn(api, 'updateOrder').mockResolvedValue(updatedOrder as any)

    const { result } = renderHook(() => useUpdateOrderMutation(), { wrapper })
    await result.current.mutateAsync({ id: 'ord-1', patch: { rating: 'good' } })

    const cached = queryClient.getQueryData<any[]>(['orders'])
    expect(cached?.[0].rating).toBe('good')
  })
})
