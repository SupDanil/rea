import type { CSSProperties } from 'react'
import { useLocation, useViewTransitionState } from 'react-router'
import { useApp } from '../state/AppContext'

/** View-transition name the product art morphs through (card ↔ product ↔ cart). */
export const PRODUCT_ART = 'product-art'

/**
 * Names a thumbnail of `itemId` as the product art's other end, but only on
 * `onPath` and only while a transition to/from that product runs. Several
 * screens stay mounted at once, so this keeps the name unique in each snapshot.
 */
export function useSharedArt(itemId: string, onPath: (pathname: string) => boolean): CSSProperties | undefined {
  const { pathname } = useLocation()
  const { flightId } = useApp()
  const transitioning = useViewTransitionState(`/product/${itemId}`)
  // While the item flies into the cart, the cart is its other end, not the card.
  if (!transitioning || !onPath(pathname) || flightId === itemId) return undefined
  return { viewTransitionName: PRODUCT_ART }
}

/** The cart badge that catches an item added from its product screen. */
export function useCartCatcher(): CSSProperties | undefined {
  const { flightId } = useApp()
  const transitioning = useViewTransitionState(flightId ? `/product/${flightId}` : '/__none__')
  return flightId && transitioning ? { viewTransitionName: PRODUCT_ART } : undefined
}
