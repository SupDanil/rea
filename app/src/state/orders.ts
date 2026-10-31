import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
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

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])

  const fetchOrders = useCallback(async () => {
    try {
      const list = await api.getOrders()
      if (Array.isArray(list)) {
        setOrders(list)
      }
    } catch (e) {
      // Ignore background fetch error
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(fetchOrders, 4000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  const create = useCallback(
    async (order: Omit<Order, 'id' | 'number'>): Promise<Order> => {
      try {
        const created = await api.createOrder(order as any)
        setOrders((prev) => [created, ...prev.filter((o) => o.id !== created.id)].slice(0, 30))
        return created
      } catch (err) {
        // Fallback for offline/test environments
        const fallback: Order = {
          ...order,
          id: Math.random().toString(36).slice(2, 10),
          number: 10 + Math.floor(Math.random() * 90),
        }
        setOrders((prev) => [fallback, ...prev].slice(0, 20))
        return fallback
      }
    },
    [],
  )

  const update = useCallback(
    async (id: string, patch: Partial<Order>) => {
      if (patch.rating !== undefined || patch.cancelledAt !== undefined) {
        try {
          await api.updateOrder(id, patch as any)
        } catch {}
      }
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === id)
        if (!exists && (patch as any).number) {
          return [{ id, ...(patch as any) }, ...prev]
        }
        return prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      })
    },
    [],
  )

  return { orders, create, update }
}

export type Orders = ReturnType<typeof useOrders>
