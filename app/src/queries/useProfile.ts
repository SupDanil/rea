import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api } from '../api'
import type { UserProfile } from '../domain'
import { queryKeys } from './keys'

export function useProfileQuery() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.getProfile(),
    staleTime: 60_000,
  })
}

export function useSendSmsMutation() {
  return useMutation({
    mutationFn: (phone: string) => api.sendSmsCode(phone),
  })
}

export function useVerifySmsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ phone, code, name }: { phone: string; code: string; name?: string }) =>
      api.verifySmsCode(phone, code, name),
    onSuccess: (res) => {
      queryClient.setQueryData<UserProfile | null>(queryKeys.profile, res.profile)
    },
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) => api.updateProfile(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile | null>(queryKeys.profile, updated)
    },
  })
}

export function useSignOutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.signOut(),
    onSuccess: () => {
      queryClient.setQueryData<UserProfile | null>(queryKeys.profile, null)
    },
  })
}

/** Legacy-compatible profile hook for AppProvider and components */
export function useProfileService() {
  const { data: profile = null } = useProfileQuery()
  const verifyMutation = useVerifySmsMutation()
  const updateMutation = useUpdateProfileMutation()
  const signOutMutation = useSignOutMutation()

  const signIn = useCallback(
    (phone: string, name?: string) => {
      verifyMutation.mutate({ phone, code: '1234', name })
    },
    [verifyMutation],
  )

  const update = useCallback(
    (patch: Partial<UserProfile>) => {
      updateMutation.mutate(patch)
    },
    [updateMutation],
  )

  const signOut = useCallback(() => {
    signOutMutation.mutate()
  }, [signOutMutation])

  return { profile, signIn, update, signOut }
}
