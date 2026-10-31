import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCheckout } from './useCheckout'
import * as AppContextModule from '../../state/AppContext'
import * as AppNavigateModule from '../../hooks/useAppNavigate'
import { SAVED_NAME_KEY } from '../../utils/storage'
import { ApiError } from '../../api'

describe('useCheckout hook', () => {
  const mockClearCart = vi.fn()
  const mockCreateOrder = vi.fn()
  const mockReplace = vi.fn()
  const mockOnMissingName = vi.fn()
  const mockShowToast = vi.fn()

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
      showToast: mockShowToast,
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
        promo: null,
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
        promo: { code: 'ЗЕРНО10', percent: 10 },
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
        promoCode: 'ЗЕРНО10',
        levelDiscount: 20,
        promoDiscount: 30,
      }),
    )
    expect(mockClearCart).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith('/order/ord-created-99')
  })

  it('keeps the cart and shows an error when the server rejects the order', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() =>
      useCheckout({ pricing: mockPricing, promo: null, pickup: { kind: 'asap' }, payment: 'cash', onMissingName: mockOnMissingName }),
    )
    await act(async () => {
      await result.current.pay('Данил')
    })
    expect(mockClearCart).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith({ text: expect.stringContaining('Не получилось') })
    expect(result.current.paying).toBe(false)
  })

  it('cash orders skip the card confirmation pause and send no promo when none applied', async () => {
    const { result } = renderHook(() =>
      useCheckout({ pricing: { ...mockPricing, levelDiscount: 0, promoDiscount: 0 }, promo: null, pickup: { kind: 'in', minutes: 15 }, payment: 'cash', onMissingName: mockOnMissingName }),
    )
    await act(async () => {
      await result.current.pay('Аня')
    })
    const dto = mockCreateOrder.mock.calls.at(-1)![0]
    expect(dto).toMatchObject({ payment: 'cash', pickup: { kind: 'in', minutes: 15 } })
    expect(dto.promoCode).toBeUndefined()
    expect(dto.levelDiscount).toBeUndefined()
    expect(mockReplace).toHaveBeenCalledWith('/order/ord-created-99')
  })

  it('shows the server’s reason when the shop has paused orders', async () => {
    mockCreateOrder.mockRejectedValueOnce(new ApiError(409, 'Кофейня временно не принимает заказы: санитарный час', 'shop_paused'))
    const { result } = renderHook(() =>
      useCheckout({ pricing: mockPricing, promo: null, pickup: { kind: 'asap' }, payment: 'cash', onMissingName: mockOnMissingName }),
    )
    await act(async () => {
      await result.current.pay('Данил')
    })
    expect(mockShowToast).toHaveBeenCalledWith({ text: 'Кофейня временно не принимает заказы: санитарный час' })
    expect(mockClearCart).not.toHaveBeenCalled()
  })
})
