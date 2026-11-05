import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { testShop } from '../../test/catalogFixture'
import type { Order } from '../../domain'

const seedCart = (lines: unknown[]) => localStorage.setItem('zerno-cart', JSON.stringify(lines))
const latteLine = { key: 'latte|m|vanilla', itemId: 'latte', variantId: 'm', ingredientIds: ['vanilla'], qty: 2 }
const summary = () => screen.getByText('Итого').closest('div')!.parentElement!

const createdOrder: Order = {
  id: 'ord-777',
  number: 42,
  createdAt: Date.now(),
  readyAt: Date.now() + 420_000,
  lines: [latteLine],
  subtotal: 560,
  discount: 56,
  total: 504,
  name: 'Аня',
  pickup: { kind: 'asap' },
  payment: 'card',
  status: 'accepted',
}

const testProfile = { phone: '+79990001122', name: '', email: '', notifications: true, joinedAt: 1 }

const usedGiftOrder: Order = {
  id: 'ord-gift-used',
  number: 1,
  createdAt: 1000,
  readyAt: 2000,
  lines: [],
  subtotal: 300,
  discount: 200,
  total: 100,
  name: 'Аня',
  pickup: { kind: 'asap' },
  payment: 'card',
  status: 'ready',
  phone: testProfile.phone,
  rewardDiscount: 200,
}

const renderCart = (overrides: Record<string, unknown> = {}) =>
  renderApp('/cart', {
    getProfile: async () => testProfile,
    getOrders: async () => [usedGiftOrder],
    ...overrides,
  })

describe('CartPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('signed out, the cart route shows the login', async () => {
    renderApp('/cart')
    expect(await screen.findByText('Вход по номеру')).toBeInTheDocument()
  })

  it('with cached profile, renders the cart immediately without flashing the login screen', () => {
    localStorage.setItem('shit_coffee_profile_cache', JSON.stringify(testProfile))
    renderApp('/cart')
    // Synchronously renders empty cart without login screen
    expect(screen.queryByText('Вход по номеру')).not.toBeInTheDocument()
    expect(screen.getByText('Пока пусто')).toBeInTheDocument()
  })

  it('while checking auth with token, shows skeleton and never flashes login', async () => {
    localStorage.setItem('shit_coffee_access_token', 'mock_jwt_token')
    let resolveProfile: (p: typeof testProfile) => void = () => {}
    const profilePromise = new Promise<typeof testProfile>((res) => {
      resolveProfile = res
    })
    renderApp('/cart', {
      getProfile: () => profilePromise,
    })

    // Shows skeleton loading state, NOT login page
    expect(screen.getByLabelText('Проверяем авторизацию')).toBeInTheDocument()
    expect(screen.queryByText('Вход по номеру')).not.toBeInTheDocument()

    // When profile finishes loading, transitions smoothly to cart
    resolveProfile(testProfile)
    expect(await screen.findByText('Пока пусто')).toBeInTheDocument()
    expect(screen.queryByText('Вход по номеру')).not.toBeInTheDocument()
  })

  it('shows the empty state when nothing is in the cart', async () => {
    renderCart()
    expect(await screen.findByText('Пока пусто')).toBeInTheDocument()
  })

  it('prices cart lines with the server menu (variant + add-ons)', async () => {
    seedCart([latteLine])
    renderCart()
    // (230 + 50) × 2 = 560
    expect(await screen.findByText('Итого')).toBeInTheDocument()
    expect(summary()).toHaveTextContent(/560/)
  })

  it('drops lines whose product disappeared from the server menu', async () => {
    seedCart([{ key: 'ghost|m', itemId: 'ghost', variantId: 'm', ingredientIds: [], qty: 1 }])
    renderCart()
    expect(await screen.findByText('Пока пусто')).toBeInTheDocument()
  })

  it('suggests available food only (no drinks, no stop-listed items)', async () => {
    seedCart([latteLine])
    renderCart()
    const upsell = (await screen.findByRole('heading', { name: 'Добавить к заказу' })).closest('section')!
    expect(within(upsell).getByText('Круассан')).toBeInTheDocument()
    expect(within(upsell).queryByText('Печенье')).toBeNull()
    expect(within(upsell).queryByText('Капучино')).toBeNull()
  })

  it('applies a promo code only after the server confirms it', async () => {
    seedCart([latteLine])
    const checkPromo = vi.fn().mockResolvedValue({ code: 'ЗЕРНО10', valid: true, percent: 10, label: '−10% на заказ' })
    renderCart({ checkPromo })
    fireEvent.change(await screen.findByLabelText('Промокод'), { target: { value: 'зерно10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }))

    expect(await screen.findByText('ЗЕРНО10: −10% на заказ')).toBeInTheDocument()
    expect(checkPromo).toHaveBeenCalledWith('ЗЕРНО10')
    expect(screen.getByText('Промокод ЗЕРНО10')).toBeInTheDocument()
    expect(summary()).toHaveTextContent(/504/)
  })

  it('rejects a code the server does not know', async () => {
    seedCart([latteLine])
    renderCart({ checkPromo: async () => ({ code: 'NOPE', valid: false }) })
    fireEvent.change(await screen.findByLabelText('Промокод'), { target: { value: 'nope' } })
    fireEvent.keyDown(screen.getByLabelText('Промокод'), { key: 'Enter' })
    expect(await screen.findByText('Такого промокода нет')).toBeInTheDocument()
  })

  it('says so when the promo check cannot reach the server', async () => {
    seedCart([latteLine])
    renderCart({ checkPromo: () => Promise.reject(new Error('offline')) })
    fireEvent.change(await screen.findByLabelText('Промокод'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
    expect(await screen.findByText('Не удалось проверить промокод — попробуйте ещё раз')).toBeInTheDocument()
  })

  it('asks for a name before paying', async () => {
    seedCart([latteLine])
    const createOrder = vi.fn()
    renderCart({ createOrder })
    fireEvent.click(await screen.findByRole('button', { name: /Оплатить/ }))
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('places the order on the server with the promo and opens its status screen', async () => {
    seedCart([latteLine])
    const createOrder = vi.fn().mockResolvedValue(createdOrder)
    const { router } = renderCart({
      createOrder,
      checkPromo: async () => ({ code: 'ЗЕРНО10', valid: true, percent: 10, label: '−10%' }),
      getOrder: async () => createdOrder,
      orderEventsUrl: () => 'http://x/events',
    })
    fireEvent.change(await screen.findByLabelText('Промокод'), { target: { value: 'ЗЕРНО10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }))
    await screen.findByText('Промокод ЗЕРНО10')

    fireEvent.click(screen.getByRole('radio', { name: /Наличными|наличн/i }))
    fireEvent.change(screen.getByLabelText('Как вас назвать?'), { target: { value: 'Аня' } })
    fireEvent.click(screen.getByRole('button', { name: /Заказать/ }))

    await waitFor(() => expect(createOrder).toHaveBeenCalled())
    expect(createOrder.mock.calls[0][0]).toMatchObject({
      name: 'Аня',
      payment: 'cash',
      pickup: { kind: 'asap' },
      subtotal: 560,
      promoCode: 'ЗЕРНО10',
      promoDiscount: 56,
      total: 504,
      lines: [latteLine],
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/order/ord-777'))
    expect(JSON.parse(localStorage.getItem('zerno-cart')!)).toEqual([])
  })

  it('keeps the cart and shows an error when the order is rejected', async () => {
    seedCart([latteLine])
    renderCart({ createOrder: () => Promise.reject(new Error('500')) })
    fireEvent.click(await screen.findByRole('radio', { name: /Наличными|наличн/i }))
    fireEvent.change(screen.getByLabelText('Как вас назвать?'), { target: { value: 'Аня' } })
    fireEvent.click(screen.getByRole('button', { name: /Заказать/ }))
    expect(await screen.findByText('Не получилось оформить заказ — попробуйте ещё раз')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('zerno-cart')!)).toHaveLength(1)
  })

  it('changes quantity of a line', async () => {
    seedCart([latteLine])
    renderCart()
    fireEvent.click(await screen.findByRole('button', { name: 'Больше' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('zerno-cart')!)[0].qty).toBe(3))
    expect(summary()).toHaveTextContent(/840/)
  })

  it('shows the prep time from the shop and sends its id with the order', async () => {
    seedCart([latteLine])
    const createOrder = vi.fn().mockResolvedValue(createdOrder)
    renderCart({ getShops: async () => [{ ...testShop, basePrepMinutes: 9 }], createOrder, getOrder: async () => createdOrder, orderEventsUrl: () => 'x' })
    expect(await screen.findByText('Невский проспект, 12 · приготовим за 9–11 минут')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /При получении/ }))
    fireEvent.change(screen.getByLabelText('Как вас назвать?'), { target: { value: 'Аня' } })
    fireEvent.click(screen.getByRole('button', { name: /Заказать/ }))
    await waitFor(() => expect(createOrder).toHaveBeenCalled())
    expect(createOrder.mock.calls[0][0].shopId).toBe('spb-nevsky')
  })

  it('blocks paying while the shop has paused orders and shows why', async () => {
    seedCart([latteLine])
    const createOrder = vi.fn()
    renderCart({ getShops: async () => [{ ...testShop, isAccepting: false, pauseReason: 'санитарный час' }], createOrder })
    expect(await screen.findByRole('alert')).toHaveTextContent('Кофейня временно не принимает заказы: санитарный час')
    expect(screen.getByRole('button', { name: /Оплатить/ })).toBeDisabled()
  })

  it('renders temperature badge in item meta when temperature is specified', async () => {
    const coldLine = {
      key: 'latte|m||temp:cold',
      itemId: 'latte',
      variantId: 'm',
      ingredientIds: [],
      temperature: 'cold' as const,
      qty: 1,
    }
    const hotLine = {
      key: 'latte|m||temp:hot',
      itemId: 'latte',
      variantId: 'm',
      ingredientIds: [],
      temperature: 'hot' as const,
      qty: 1,
    }
    seedCart([coldLine, hotLine])
    renderCart()

    expect(await screen.findByText('🧊 Холодный, M · 300 мл')).toBeInTheDocument()
    expect(screen.getByText('☕ Горячий, M · 300 мл')).toBeInTheDocument()
  })
})
