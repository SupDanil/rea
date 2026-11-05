import { type ReactElement,useCallback, useState } from 'react'

import { ScreenEntry } from '../app/ScreenEntry'

/**
 * Keeps a conditionally rendered modal on screen for its exit, the way AnimatedOutlet
 * does for routes: `<Presence>{open && <SomeSheet />}</Presence>`.
 */
export function Presence({ children }: { children: ReactElement | false | null }) {
  const [shown, setShown] = useState(children || null)
  if (children && children !== shown) setShown(children)
  const clear = useCallback(() => setShown(null), [])

  if (!shown) return null
  return (
    <ScreenEntry leaving={!children} onLeft={clear}>
      {shown}
    </ScreenEntry>
  )
}
