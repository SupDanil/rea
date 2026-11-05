import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EntranceContext, LeavingContext, whenExitEnds } from './leaving'

type Props = {
  id?: number
  leaving: boolean
  /** Its exit has played: time to take it off the page. */
  onLeft: (id: number) => void
  children: ReactNode
}

/**
 * One screen or modal on its way in or out: `data-leaving` plays its exit, and the
 * entrance record lets it rise once, however many times what's inside gets replaced
 * (a skeleton by the cart, the login by the profile).
 */
export function ScreenEntry({ id = 0, leaving, onLeft, children }: Props) {
  const [entrance] = useState(() => {
    let played = false
    return { played: () => played, markPlayed: () => void (played = true) }
  })

  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (leaving && root.current) return whenExitEnds(root.current, () => onLeft(id))
  }, [leaving, id, onLeft])

  return (
    <div ref={root} className="contents" data-leaving={leaving || undefined}>
      <EntranceContext.Provider value={entrance}>
        <LeavingContext.Provider value={leaving}>{children}</LeavingContext.Provider>
      </EntranceContext.Provider>
    </div>
  )
}
