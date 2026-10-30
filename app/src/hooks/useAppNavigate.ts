import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'

type NavState = { inApp?: boolean } | null

/**
 * Screens open on top of the menu. `go` marks the entry as opened from inside
 * the app so `back` can pop history; a screen reached by deep link has nothing
 * of ours behind it, so `back` replaces it with the menu instead.
 */
export function useAppNavigate() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as NavState

  return useMemo(
    () => ({
      go: (to: string) => navigate(to, { state: { inApp: true } }),
      // Swapping screens in place (hot ↔ iced, cart → order) keeps the way back.
      replace: (to: string) => navigate(to, { replace: true, state }),
      back: () => (state?.inApp ? navigate(-1) : navigate('/', { replace: true })),
    }),
    [navigate, state],
  )
}
