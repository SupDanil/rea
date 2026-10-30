import { useCallback } from 'react'
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
import { usePersistent } from '../hooks/usePersistent'

export type { Pickup, PaymentMethod, Order, OrderStatus }
export { readyTimeFor, statusOf, makingProgress, canCancel, isActive }

export function useOrders() {
  const [orders, setOrders] = usePersistent<Order[]>('zerno-orders', [])
  const create = useCallback(
    (order: Omit<Order, 'id' | 'number'>) => {
      const created: Order = {
        ...order,
        id: Math.random().toString(36).slice(2, 10),
        number: 10 + Math.floor(Math.random() * 90),
      }
      setOrders((prev) => [created, ...prev].slice(0, 20))
      return created
    },
    [setOrders],
  )
  const update = useCallback(
    (id: string, patch: Partial<Order>) =>
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o))),
    [setOrders],
  )
  return { orders, create, update }
}

export type Orders = ReturnType<typeof useOrders>
