import { useEffect, useState, type ReactElement } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { prefersReducedMotion } from '../utils/motion'
import { LeavingContext } from './leaving'

/** How long a screen keeps rendering after you leave it, for its exit animation. */
const EXIT_MS = 320

type Entry = {
  id: number
  kind: string
  element: ReactElement
  leaving: boolean
}

let nextId = 0
const nextEntryId = () => ++nextId

// One entry per screen kind: a product swapping to its hot/iced twin stays the
// same screen (and keeps its state); menu routes render nothing over the menu.
const screenKey = (pathname: string) => pathname.split('/')[1] ?? ''

/**
 * Renders the current route over the menu and keeps the previous one alive for
 * a moment with `data-leaving`, so screens animate out the same way in every
 * browser (no View Transitions API). Entries are uniquely keyed by entry id,
 * so leaving and entering screens of the same route kind never collide or share
 * DOM instances, while hot ↔ iced product swaps still update in place.
 */
export function AnimatedOutlet() {
  const outlet = useOutlet()
  const { pathname } = useLocation()
  const kind = screenKey(pathname)

  const [entries, setEntries] = useState<Entry[]>(() => {
    if (!outlet) return []
    return [{ id: nextEntryId(), kind, element: outlet, leaving: false }]
  })
  const [prevRoute, setPrevRoute] = useState({ kind, outlet })

  // Sync the list with the route while rendering (no effect → no blank frame).
  if (prevRoute.kind !== kind || prevRoute.outlet !== outlet) {
    setPrevRoute({ kind, outlet })
    setEntries((prev) => {
      // If we're swapping within the same screen kind (e.g. hot ↔ iced twin)
      // and that screen is currently active (not leaving), update it in place!
      const activeIdx = prev.findIndex((e) => e.kind === kind && !e.leaving)
      if (outlet && activeIdx >= 0) {
        return prev.map((e, idx) => (idx === activeIdx ? { ...e, element: outlet } : e))
      }

      // Otherwise, any currently active screen starts its exit animation:
      const leavingPrev = prev.map((e) => (e.leaving ? e : { ...e, leaving: true }))

      // If the incoming route renders a screen, add it with a fresh unique ID:
      if (outlet) {
        return [...leavingPrev, { id: nextEntryId(), kind, element: outlet, leaving: false }]
      }

      return leavingPrev
    })
  }

  useEffect(() => {
    const hasLeaving = entries.some((e) => e.leaving)
    if (!hasLeaving) return
    const t = window.setTimeout(
      () => setEntries((prev) => prev.filter((e) => !e.leaving)),
      prefersReducedMotion() ? 0 : EXIT_MS,
    )
    return () => window.clearTimeout(t)
  }, [entries])

  return (
    <>
      {entries.map((e) => (
        <div key={e.id} className="contents" data-leaving={e.leaving || undefined}>
          <LeavingContext.Provider value={e.leaving}>{e.element}</LeavingContext.Provider>
        </div>
      ))}
    </>
  )
}
