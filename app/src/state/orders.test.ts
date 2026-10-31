import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrders } from './orders'
import { api } from '../api'
import type { Order } from '../domain/orders'

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

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('fetches orders from api on mount and sets state', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])

    const { result } = renderHook(() => useOrders())

    // Initial state is empty before fetch resolves
    expect(result.current.orders).toEqual([])

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.orders).toEqual([mockOrder])
    expect(api.getOrders).toHaveBeenCalledTimes(1)
  })

  it('periodically polls orders every 4 seconds', async () => {
    const getOrdersSpy = vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])

    renderHook(() => useOrders())

    await act(async () => {
      await Promise.resolve()
    })
    expect(getOrdersSpy).toHaveBeenCalledTimes(1)

    // Advance 4s
    await act(async () => {
      vi.advanceTimersByTime(4000)
      await Promise.resolve()
    })
    expect(getOrdersSpy).toHaveBeenCalledTimes(2)

    // Advance another 4s
    await act(async () => {
      vi.advanceTimersByTime(4000)
      await Promise.resolve()
    })
    expect(getOrdersSpy).toHaveBeenCalledTimes(3)
  })

  it('create() posts new order and prepends it to orders list', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([])
    vi.spyOn(api, 'createOrder').mockResolvedValue(mockOrder)

    const { result } = renderHook(() => useOrders())

    await act(async () => {
      await Promise.resolve()
    })

    let created: Order | undefined
    await act(async () => {
      created = await result.current.create({
        createdAt: 1000,
        readyAt: 2000,
        lines: [],
        subtotal: 300,
        discount: 0,
        total: 300,
        name: 'Данил',
        pickup: { kind: 'asap' },
        payment: 'card',
      })
    })

    expect(created).toEqual(mockOrder)
    expect(result.current.orders[0]).toEqual(mockOrder)
  })

  it('update() calls api.updateOrder for rating or cancellation', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const updateSpy = vi.spyOn(api, 'updateOrder').mockResolvedValue({
      ...mockOrder,
      rating: 'good',
    })

    const { result } = renderHook(() => useOrders())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.update('ord-123', { rating: 'good' })
    })

    expect(updateSpy).toHaveBeenCalledWith('ord-123', { rating: 'good' })
    expect(result.current.orders[0].rating).toBe('good')
  })

  it('update() updates status locally without calling api.updateOrder for status push', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([mockOrder])
    const updateSpy = vi.spyOn(api, 'updateOrder')

    const { result } = renderHook(() => useOrders())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.update('ord-123', { status: 'making' })
    })

    // Status is pushed from KDS/SSE down to client, so client does NOT patch status back to server
    expect(updateSpy).not.toHaveBeenCalled()
    expect(result.current.orders[0].status).toBe('making')
  })

  it('update() adds order if it was not in local list and patch contains order number', async () => {
    vi.spyOn(api, 'getOrders').mockResolvedValue([])

    const { result } = renderHook(() => useOrders())
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await result.current.update('ord-new', { number: 88, status: 'ready' } as any)
    })

    expect(result.current.orders.length).toBe(1)
    expect(result.current.orders[0].id).toBe('ord-new')
    expect(result.current.orders[0].number).toBe(88)
  })
})
