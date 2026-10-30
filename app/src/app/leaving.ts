import { createContext, useContext } from 'react'

export const LeavingContext = createContext(false)

/** True while this screen is on its way out (its route is no longer current). */
export const useIsLeaving = () => useContext(LeavingContext)
