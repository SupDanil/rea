import { describe, expect, it } from 'vitest'
import {
  ACCEPT_AFTER,
  canCancel,
  isActive,
  MAKE_AFTER,
  makingProgress,
  readyTimeFor,
  statusOf,
  type Order,
} from './orders'

describe('domain/orders', () => {
  const baseOrder: Order = {
    id: 'test-1',
    number: 42,
    createdAt: 1000,
    readyAt: 50_000,
    lines: [],
    subtotal: 500,
    discount: 0,
    total: 500,
    name: 'Иван',
    pickup: { kind: 'asap' },
    payment: 'card',
  }

  it('calculates pickup ready time', () => {
    expect(readyTimeFor({ kind: 'asap' }, 10_000)).toBe(10_000 + 45_000)
    expect(readyTimeFor({ kind: 'in', minutes: 20 }, 10_000)).toBe(10_000 + 20 * 60_000)
  })

  it('transitions through status lifecycle', () => {
    // 1. Immediately after creation: paying (< ACCEPT_AFTER)
    expect(statusOf(baseOrder, baseOrder.createdAt + ACCEPT_AFTER - 500)).toBe('paying')

    // 2. After accept, before make: accepted
    expect(statusOf(baseOrder, baseOrder.createdAt + ACCEPT_AFTER + 100)).toBe('accepted')

    // 3. After make starts: making
    expect(statusOf(baseOrder, baseOrder.createdAt + MAKE_AFTER + 100)).toBe('making')

    // 4. When ready time reached: ready
    expect(statusOf(baseOrder, baseOrder.readyAt)).toBe('ready')

    // 5. Cancelled takes precedence over everything
    expect(statusOf({ ...baseOrder, cancelledAt: 2000 }, baseOrder.readyAt)).toBe('cancelled')
  })

  it('respects real backend status when provided by KDS', () => {
    // Even if local clock is before readyAt, server status takes priority
    expect(statusOf({ ...baseOrder, status: 'accepted' }, baseOrder.createdAt)).toBe('accepted')
    expect(statusOf({ ...baseOrder, status: 'making' }, baseOrder.createdAt)).toBe('making')
    expect(statusOf({ ...baseOrder, status: 'ready' }, baseOrder.createdAt)).toBe('ready')
    expect(statusOf({ ...baseOrder, status: 'completed' }, baseOrder.createdAt)).toBe('ready')
    expect(statusOf({ ...baseOrder, status: 'cancelled' }, baseOrder.createdAt)).toBe('cancelled')
  })

  it('reports makingProgress as 0..1 clamp', () => {
    const start = baseOrder.createdAt + MAKE_AFTER
    expect(makingProgress(baseOrder, start)).toBe(0)
    expect(makingProgress(baseOrder, (start + baseOrder.readyAt) / 2)).toBeCloseTo(0.5)
    expect(makingProgress(baseOrder, baseOrder.readyAt + 5000)).toBe(1)
  })

  it('checks cancellation rules', () => {
    // Only paying or accepted can be cancelled
    expect(canCancel(baseOrder, baseOrder.createdAt + 500)).toBe(true)
    expect(canCancel(baseOrder, baseOrder.createdAt + ACCEPT_AFTER + 100)).toBe(true)
    expect(canCancel(baseOrder, baseOrder.createdAt + MAKE_AFTER + 100)).toBe(false)
  })

  it('evaluates active orders on menu', () => {
    expect(isActive(baseOrder, baseOrder.readyAt - 1000)).toBe(true)
    // Stays active up to 15 min after ready
    expect(isActive(baseOrder, baseOrder.readyAt + 14 * 60_000)).toBe(true)
    expect(isActive(baseOrder, baseOrder.readyAt + 16 * 60_000)).toBe(false)
    // Rated or cancelled is no longer active
    expect(isActive({ ...baseOrder, rating: 'good' }, baseOrder.readyAt + 1000)).toBe(false)
    expect(isActive({ ...baseOrder, cancelledAt: 2000 }, baseOrder.readyAt - 1000)).toBe(false)
  })
})
