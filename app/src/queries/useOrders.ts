import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '../api'
import type { CreateOrderDto, UpdateOrderDto } from '../api/types'
import type { Order } from '../domain'
import { queryKeys } from './keys'

export function useOrdersQuery() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => api.getOrders(),
    staleTime: 10_000,
    refetchInterval: 5_000,
  })
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateOrderDto) => api.createOrder(dto),
    onSuccess: (newOrder) => {
      queryClient.setQueryData<Order[]>(queryKeys.orders, (prev = []) => [newOrder, ...prev].slice(0, 20))
    },
  })
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateOrderDto }) => api.updateOrder(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<Order[]>(queryKeys.orders, (prev = []) =>
        prev.map((o) => (o.id === updated.id ? updated : o)),
      )
    },
  })
}

/** Legacy-compatible orders hook for AppProvider and components */
export function useOrdersService() {
  const { data: orders = [] } = useOrdersQuery()
  const createMutation = useCreateOrderMutation()
  const updateMutation = useUpdateOrderMutation()

  const create = useCallback(
    async (order: CreateOrderDto) => {
      return await createMutation.mutateAsync(order)
    },
    [createMutation],
  )

  const update = useCallback(
    (id: string, patch: UpdateOrderDto) => {
      updateMutation.mutate({ id, patch })
    },
    [updateMutation],
  )

  return { orders, create, update }
}
