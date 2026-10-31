import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { CreateOrderDto, UpdateOrderDto } from '../api/types'
import {
  canCancel,
  isActive,
  makingProgress,
  readyTimeFor,
  statusOf,
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type Pickup,
} from '../domain/orders'

export type { Pickup, PaymentMethod, Order, OrderStatus }
export { readyTimeFor, statusOf, makingProgress, canCancel, isActive }

const POLL_MS = 4000

/** Orders of this device / signed-in guest, kept in sync with the server. */
export function useOrders(sessionKey: string | null = null) {
  const [orders, setOrders] = useState<Order[]>([])

  const refresh = useCallback(async () => {
    try {
      setOrders(await api.getOrders())
    } catch {
      // Keep the last known list; the next poll retries.
    }
  }, [])

  // Re-fetch right away when the signed-in phone changes, then poll.
  useEffect(() => {
    let alive = true
    const tick = () =>
      api.getOrders().then(
        (list) => alive && setOrders(list),
        () => {
          // Keep the last known list; the next poll retries.
        },
      )
    void tick()
    const timer = setInterval(() => void tick(), POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [sessionKey])

  const upsert = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)].sort((a, b) => b.createdAt - a.createdAt))
  }, [])

  const create = useCallback(
    async (dto: CreateOrderDto): Promise<Order> => {
      const created = await api.createOrder(dto)
      upsert(created)
      return created
    },
    [upsert],
  )

  /** Rate or cancel: the server's answer replaces the local copy. */
  const update = useCallback(
    async (id: string, patch: UpdateOrderDto): Promise<Order> => {
      const updated = await api.updateOrder(id, patch)
      upsert(updated)
      return updated
    },
    [upsert],
  )

  /** Applies a live status push (SSE / polling) without another round trip. */
  const merge = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  return { orders, refresh, create, update, merge, upsert }
}

export type Orders = ReturnType<typeof useOrders>
