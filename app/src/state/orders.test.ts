import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrders } from './orders'
import { api } from '../api'
import type { CreateOrderDto } from '../api/types'
import type { Order } from '../domain/orders'

const flush = () => act(async () => {
  await Promise.resolve()
  await Promise.resolve()
})

describe('useOrders hook', () => {
  const mockOrder: Order = {
    id: 'ord-123',
    number: 77,
    createdAt: 1000,
    readyAt: 2000,
    lines: [],
    subtotal: 300,
    discount: 0,
    total: 300,
    name: 'Данил',
    pickup: { kind: 'asap' },
    payment: 'card',
    status: 'accepted',
  }

  const dto: CreateOrderDto = {
    lines: [{ key: 'latte|m', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 1 }],
    subtotal: 230,
    discount: 0,
    total: 230,
    name: 'Аня',
    pickup: { kind: 'asap' },
    payment: 'card',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('fetches orders from api on mount', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const { result } = renderHook(() => useOrders())
    expect(result.current.orders).toEqual([])
    await flush()
    expect(result.current.orders).toEqual([mockOrder])
    expect(api.getOrders).toHaveBeenCalledTimes(1)
  })

  it('polls every 4 seconds and stops on unmount', async () => {
    const spy = vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const { unmount } = renderHook(() => useOrders())
    await flush()
    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    expect(spy).toHaveBeenCalledTimes(2)
    unmount()
    await act(async () => {
      vi.advanceTimersByTime(8000)
    })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('keeps the last list when a poll fails', async () => {
    const spy = vi.spyOn(api, 'getOrders').mockResolvedValueOnce([mockOrder]).mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useOrders())
    await flush()
    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await flush()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(result.current.orders).toEqual([mockOrder])
  })

  it('refetches immediately when the session changes', async () => {
    const spy = vi.spyOn(api, 'getOrders').mockResolvedValue([])
    const { rerender } = renderHook(({ phone }) => useOrders(phone), { initialProps: { phone: null as string | null } })
    await flush()
    rerender({ phone: '+79990001122' })
    await flush()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('create() posts to the API and adds the server order, newest first', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const created = { ...mockOrder, id: 'ord-new', createdAt: 5000 }
    const createSpy = vi.spyOn(api, 'createOrder').mockResolvedValue(created)
    const { result } = renderHook(() => useOrders())
    await flush()

    let returned: Order | undefined
    await act(async () => {
      returned = await result.current.create(dto)
    })
    expect(createSpy).toHaveBeenCalledWith(dto)
    expect(returned).toEqual(created)
    expect(result.current.orders.map((o) => o.id)).toEqual(['ord-new', 'ord-123'])
  })

  it('create() rejects instead of inventing a local order when the API fails', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([])
    vi.spyOn(api, 'createOrder').mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useOrders())
    await flush()
    await act(async () => {
      await expect(result.current.create(dto)).rejects.toThrow('offline')
    })
    expect(result.current.orders).toEqual([])
  })

  it('update() sends the patch and replaces the local copy with the server answer', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const rated = { ...mockOrder, rating: 'good' as const }
    const spy = vi.spyOn(api, 'updateOrder').mockResolvedValue(rated)
    const { result } = renderHook(() => useOrders())
    await flush()
    await act(async () => {
      await result.current.update('ord-123', { rating: 'good' })
    })
    expect(spy).toHaveBeenCalledWith('ord-123', { rating: 'good' })
    expect(result.current.orders[0].rating).toBe('good')
  })

  it('update() leaves the order untouched when the server refuses', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    vi.spyOn(api, 'updateOrder').mockRejectedValue(new Error('409'))
    const { result } = renderHook(() => useOrders())
    await flush()
    await act(async () => {
      await expect(result.current.update('ord-123', { cancelledAt: 1 })).rejects.toThrow()
    })
    expect(result.current.orders[0].cancelledAt).toBeUndefined()
  })

  it('merge() applies a live status push locally without calling the API', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const spy = vi.spyOn(api, 'updateOrder')
    const { result } = renderHook(() => useOrders())
    await flush()
    act(() => result.current.merge('ord-123', { status: 'ready' }))
    expect(result.current.orders[0].status).toBe('ready')
    expect(spy).not.toHaveBeenCalled()
  })

  it('upsert() adds an order fetched by id', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([])
    const { result } = renderHook(() => useOrders())
    await flush()
    act(() => result.current.upsert(mockOrder))
    expect(result.current.orders).toEqual([mockOrder])
  })
})
