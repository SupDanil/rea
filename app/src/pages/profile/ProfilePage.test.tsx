import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import type { Order } from '../../domain'

const profile = { phone: '+79990001122', name: 'Аня', email: '', notifications: true, joinedAt: 1 }

const order = (id: string, number: number, extra: Partial<Order> = {}): Order => ({
  id,
  number,
  createdAt: Date.now() - 3_600_000,
  readyAt: Date.now() - 3_000_000,
  lines: [{ key: 'latte|m', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 1 }],
  subtotal: 230,
  discount: 0,
  total: 230,
  name: 'Аня',
  pickup: { kind: 'asap' },
  payment: 'card',
  status: 'ready',
  phone: profile.phone,
  ...extra,
})

describe('ProfilePage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('signed out, the profile route shows the login', async () => {
    renderApp('/profile')
    expect(await screen.findByText('Вход по номеру')).toBeInTheDocument()
  })

  it('shows the server profile, loyalty and order history', async () => {
    renderApp('/profile', {
      getProfile: async () => profile,
      getOrders: async () => [order('o1', 31), order('o2', 32, { status: 'cancelled', cancelledAt: Date.now() })],
    })
    expect((await screen.findAllByText('+79990001122')).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Уровень лояльности' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Штампы' })).toBeInTheDocument()
    expect(await screen.findByText('№ 31')).toBeInTheDocument()
    expect(screen.getByText('№ 32')).toBeInTheDocument()
    expect(screen.getByText('Отменён')).toBeInTheDocument()
  })

  it('saves a new name on blur through the API', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ ...profile, name: 'Анна' })
    renderApp('/profile', { getProfile: async () => profile, updateProfile })
    const input = await screen.findByDisplayValue('Аня')
    fireEvent.change(input, { target: { value: 'Анна' } })
    fireEvent.blur(input)
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ name: 'Анна' }))
  })

  it('shows an error toast when saving fails', async () => {
    renderApp('/profile', { getProfile: async () => profile, updateProfile: () => Promise.reject(new Error('offline')) })
    fireEvent.click(await screen.findByRole('switch', { name: /Уведомления/ }))
    expect(await screen.findByText('Не удалось сохранить — попробуйте ещё раз')).toBeInTheDocument()
  })

  it('rejects an invalid e-mail without calling the API', async () => {
    const updateProfile = vi.fn()
    renderApp('/profile', { getProfile: async () => profile, updateProfile })
    const email = await screen.findByPlaceholderText('не указан')
    fireEvent.change(email, { target: { value: 'not-an-email' } })
    fireEvent.blur(email)
    expect(await screen.findByText('Проверьте e-mail')).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('repeating an order puts its lines into the cart', async () => {
    const { router } = renderApp('/profile', { getProfile: async () => profile, getOrders: async () => [order('o1', 31)] })
    fireEvent.click(await screen.findByRole('button', { name: /Повторить/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/cart'))
    expect(JSON.parse(localStorage.getItem('zerno-cart')!)).toEqual([expect.objectContaining({ itemId: 'latte', variantId: 'm', qty: 1 })])
  })

  it('signing out calls the API and returns to the menu', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderApp('/profile', { getProfile: async () => profile, signOut })
    fireEvent.click(await screen.findByRole('button', { name: 'Выйти из профиля' }))
    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }))
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(await screen.findByText('Вы вышли из профиля')).toBeInTheDocument()
  })
})
