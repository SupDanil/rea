import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useProfileQuery,
  useSendSmsMutation,
  useVerifySmsMutation,
  useUpdateProfileMutation,
  useSignOutMutation,
} from './useProfile'
import { api } from '../api'

describe('useProfile hooks', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.restoreAllMocks()
  })

  it('useProfileQuery calls api.getProfile()', async () => {
    const mockProfile = { name: 'Данил', phone: '+79991234567', stamps: 5 }
    vi.spyOn(api, 'getProfile').mockResolvedValue(mockProfile as any)

    const { result } = renderHook(() => useProfileQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProfile)
  })

  it('useSendSmsMutation calls api.sendSmsCode()', async () => {
    vi.spyOn(api, 'sendSmsCode').mockResolvedValue({ success: true, phone: '+79991234567' })

    const { result } = renderHook(() => useSendSmsMutation(), { wrapper })
    const res = await result.current.mutateAsync('+79991234567')

    expect(res.success).toBe(true)
    expect(api.sendSmsCode).toHaveBeenCalledWith('+79991234567')
  })

  it('useVerifySmsMutation calls api.verifySmsCode and updates profile cache', async () => {
    const verifiedProfile = { name: 'Анна', phone: '+79997778899', stamps: 0 }
    vi.spyOn(api, 'verifySmsCode').mockResolvedValue({ token: 'tok-1', profile: verifiedProfile } as any)

    const { result } = renderHook(() => useVerifySmsMutation(), { wrapper })
    await result.current.mutateAsync({ phone: '+79997778899', code: '1234', name: 'Анна' })

    const cached = queryClient.getQueryData(['profile'])
    expect(cached).toEqual(verifiedProfile)
  })

  it('useUpdateProfileMutation updates profile in cache', async () => {
    const updated = { name: 'Данил Обновленный', phone: '+79991234567', stamps: 6 }
    vi.spyOn(api, 'updateProfile').mockResolvedValue(updated as any)

    const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper })
    await result.current.mutateAsync({ name: 'Данил Обновленный' })

    const cached = queryClient.getQueryData(['profile'])
    expect(cached).toEqual(updated)
  })

  it('useSignOutMutation clears profile from cache', async () => {
    queryClient.setQueryData(['profile'], { name: 'Гость' })
    vi.spyOn(api, 'signOut').mockResolvedValue(undefined)

    const { result } = renderHook(() => useSignOutMutation(), { wrapper })
    await result.current.mutateAsync()

    const cached = queryClient.getQueryData(['profile'])
    expect(cached).toBeNull()
  })
})
