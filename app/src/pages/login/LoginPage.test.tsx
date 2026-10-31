import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../api'
import { renderApp } from '../../test/renderApp'

const profile = { phone: '+79990001122', name: 'Гость', email: '', notifications: true, joinedAt: 1 }

const typePhone = async () => {
  const input = await screen.findByLabelText('Телефон')
  fireEvent.change(input, { target: { value: '9990001122' } })
  fireEvent.click(screen.getByRole('button', { name: 'Получить код' }))
}

describe('LoginPage (SMS code checked by the server)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('requests a code from the API and shows the dev code the server returned', async () => {
    const sendSmsCode = vi.fn().mockResolvedValue({ phone: profile.phone, success: true, devCode: '4821' })
    renderApp('/login', { sendSmsCode })
    await typePhone()
    expect(await screen.findByText(/код для входа: 4821/)).toBeInTheDocument()
    expect(sendSmsCode).toHaveBeenCalledWith('+79990001122')
    expect(screen.queryByText(/1234/)).toBeNull()
  })

  it('without a dev code it just says the SMS is on its way', async () => {
    renderApp('/login', { sendSmsCode: async () => ({ phone: profile.phone, success: true }) })
    await typePhone()
    expect(await screen.findByText('Код придёт в течение минуты')).toBeInTheDocument()
  })

  it('shows a toast and stays on the phone step when sending fails', async () => {
    renderApp('/login', { sendSmsCode: () => Promise.reject(new Error('offline')) })
    await typePhone()
    expect(await screen.findByText('Не удалось отправить код — попробуйте ещё раз')).toBeInTheDocument()
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument()
  })

  it('shows the server’s message for a wrong code', async () => {
    const verifySmsCode = vi.fn().mockRejectedValue(new ApiError(401, 'Неверный код', 'invalid'))
    renderApp('/login', { sendSmsCode: async () => ({ phone: profile.phone, success: true, devCode: '4821' }), verifySmsCode })
    await typePhone()
    fireEvent.change(await screen.findByLabelText('Код из SMS'), { target: { value: '0000' } })
    expect(await screen.findByText('Неверный код')).toBeInTheDocument()
    expect(verifySmsCode).toHaveBeenCalledWith('+79990001122', '0000', undefined)
  })

  it('shows a connection error when verification cannot reach the server', async () => {
    renderApp('/login', {
      sendSmsCode: async () => ({ phone: profile.phone, success: true }),
      verifySmsCode: () => Promise.reject(new TypeError('Failed to fetch')),
    })
    await typePhone()
    fireEvent.change(await screen.findByLabelText('Код из SMS'), { target: { value: '1111' } })
    expect(await screen.findByText('Нет связи — попробуйте ещё раз')).toBeInTheDocument()
  })

  it('a new guest verifies, enters a name that is saved on the server, and is signed in', async () => {
    const updateProfile = vi.fn().mockResolvedValue({ ...profile, name: 'Аня' })
    const { router } = renderApp('/login', {
      sendSmsCode: async () => ({ phone: profile.phone, success: true, devCode: '4821' }),
      verifySmsCode: async () => ({ phone: profile.phone, code: '4821', profile }),
      updateProfile,
    })
    await typePhone()
    fireEvent.change(await screen.findByLabelText('Код из SMS'), { target: { value: '4821' } })

    const nameInput = await screen.findByLabelText('Имя')
    fireEvent.change(nameInput, { target: { value: 'Аня' } })
    fireEvent.submit(nameInput.closest('form')!)

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ name: 'Аня' }))
    expect(await screen.findByText('Аня, напиток в подарок уже ждёт 🎁')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('a returning guest keeps the CRM name and is welcomed back, skipping the name step', async () => {
    localStorage.setItem('zerno-name', 'Ник из корзины')
    const updateProfile = vi.fn()
    const verifySmsCode = vi.fn().mockResolvedValue({ phone: profile.phone, code: '4821', isNew: false, profile: { ...profile, name: 'Олег' } })
    renderApp('/login', { sendSmsCode: async () => ({ phone: profile.phone, success: true, devCode: '4821' }), verifySmsCode, updateProfile })
    await typePhone()
    fireEvent.change(await screen.findByLabelText('Код из SMS'), { target: { value: '4821' } })
    expect(await screen.findByText('С возвращением, Олег!')).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('a new guest whose name the device remembers is created with it and greeted with the gift', async () => {
    localStorage.setItem('zerno-name', 'Маша')
    const verifySmsCode = vi.fn().mockResolvedValue({ phone: profile.phone, code: '4821', isNew: true, profile: { ...profile, name: 'Маша' } })
    renderApp('/login', { sendSmsCode: async () => ({ phone: profile.phone, success: true, devCode: '4821' }), verifySmsCode })
    await typePhone()
    fireEvent.change(await screen.findByLabelText('Код из SMS'), { target: { value: '4821' } })
    expect(await screen.findByText('Маша, напиток в подарок уже ждёт 🎁')).toBeInTheDocument()
    expect(verifySmsCode).toHaveBeenCalledWith('+79990001122', '4821', 'Маша')
  })
})
