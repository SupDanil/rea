import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { OrderPage } from './OrderPage'
import { MemoryRouter, Route, Routes } from 'react-router'
import * as AppContextModule from '../../state/AppContext'
import * as AppNavigateModule from '../../hooks/useAppNavigate'
import { api } from '../../api'
import type { Order } from '../../state/orders'

describe('OrderPage real-time order tracking', () => {
  const mockBack = vi.fn()
  const mockUpdateOrder = vi.fn()

  const sampleOrder: Order = {
    id: 'ord-test-456',
    number: 88,
    createdAt: Date.now() - 60_000,
    readyAt: Date.now() + 300_000,
    lines: [
      { key: 'cappuccino|m', itemId: 'cappuccino', variantId: 'm', ingredientIds: [], qty: 1 },
    ],
    subtotal: 210,
    discount: 0,
    total: 210,
    name: 'Данил',
    pickup: { kind: 'asap' },
    payment: 'card',
    status: 'accepted',
  }

  const renderWithRouter = (orderId = 'ord-test-456') => {
    return render(
      <MemoryRouter initialEntries={[`/order/${orderId}`]}>
        <Routes>
          <Route path="/order/:id" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(AppNavigateModule, 'useAppNavigate').mockReturnValue({
      go: vi.fn(),
      back: mockBack,
      replace: vi.fn(),
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders order details when found in local state', () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      orders: {
        orders: [sampleOrder],
        update: mockUpdateOrder,
      },
    } as any)

    renderWithRouter()

    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByText('Данил')).toBeInTheDocument()
    expect(screen.getByText('shit кофе · Невский, 12')).toBeInTheDocument()
  })

  it('fetches order from api if not currently in state', async () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      orders: {
        orders: [],
        update: mockUpdateOrder,
      },
    } as any)

    const getOrderSpy = vi.spyOn(api, 'getOrder').mockResolvedValue(sampleOrder)

    renderWithRouter()

    await act(async () => {
      await Promise.resolve()
    })

    expect(getOrderSpy).toHaveBeenCalledWith('ord-test-456')
    expect(mockUpdateOrder).toHaveBeenCalledWith('ord-test-456', sampleOrder)
  })

  it('displays empty state when order does not exist anywhere', async () => {
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      orders: {
        orders: [],
        update: mockUpdateOrder,
      },
    } as any)

    vi.spyOn(api, 'getOrder').mockResolvedValue(null)

    renderWithRouter()

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('Заказ не найден')).toBeInTheDocument()
  })
})
