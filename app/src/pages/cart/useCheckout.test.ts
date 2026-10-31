import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCheckout } from './useCheckout'
import * as AppContextModule from '../../state/AppContext'
import * as AppNavigateModule from '../../hooks/useAppNavigate'
import { SAVED_NAME_KEY } from '../../utils/storage'

describe('useCheckout hook', () => {
  const mockClearCart = vi.fn()
  const mockCreateOrder = vi.fn()
  const mockReplace = vi.fn()
  const mockOnMissingName = vi.fn()

  const mockPricing = {
    subtotal: 500,
    discount: 50,
    total: 450,
    levelDiscount: 20,
    promoDiscount: 30,
    rewardDiscount: 0,
    canGift: false,
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.useFakeTimers()

    vi.spyOn(AppNavigateModule, 'useAppNavigate').mockReturnValue({
      go: vi.fn(),
      back: vi.fn(),
      replace: mockReplace,
    } as any)

    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      cart: {
        lines: [{ key: 'line-1', itemId: 'cappuccino', variantId: 'cappuccino-m', ingredientIds: [], qty: 1 }],
        clear: mockClearCart,
      },
      orders: {
        create: mockCreateOrder.mockResolvedValue({ id: 'ord-created-99', number: 99 }),
      },
      profile: {
        phone: '+79997776655',
        name: 'Данил',
      },
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('triggers onMissingName and does not place order when name is empty', async () => {
    const { result } = renderHook(() =>
      useCheckout({
        pricing: mockPricing,
        pickup: { kind: 'asap' },
        payment: 'card',
        onMissingName: mockOnMissingName,
      }),
    )

    await act(async () => {
      await result.current.pay('   ')
    })

    expect(mockOnMissingName).toHaveBeenCalled()
    expect(mockCreateOrder).not.toHaveBeenCalled()
    expect(result.current.paying).toBe(false)
  })

  it('places order, saves name, clears cart, and navigates to order screen when valid', async () => {
    const { result } = renderHook(() =>
      useCheckout({
        pricing: mockPricing,
        pickup: { kind: 'asap' },
        payment: 'card',
        onMissingName: mockOnMissingName,
      }),
    )

    let payPromise: Promise<void> | undefined
    act(() => {
      payPromise = result.current.pay('Данил')
    })

    expect(result.current.paying).toBe(true)
    expect(localStorage.getItem(SAVED_NAME_KEY)).toBe('Данил')

    // Fast-forward payment delay timer
    await act(async () => {
      vi.advanceTimersByTime(1200)
      await payPromise
    })

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Данил',
        subtotal: 500,
        discount: 50,
        total: 450,
        phone: '+79997776655',
        payment: 'card',
      }),
    )
    expect(mockClearCart).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith('/order/ord-created-99')
  })
})
