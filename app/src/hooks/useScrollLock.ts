import { useLayoutEffect } from 'react'

let locks = 0

/**
 * Keeps the page under a full-screen layer from scrolling. The menu stays exactly
 * where it was, so a flight back to its card lands on the spot the card is in.
 * Counted, because a leaving screen and the next one overlap for a moment.
 */
export function useScrollLock() {
  useLayoutEffect(() => {
    if (++locks === 1) document.documentElement.setAttribute('data-scroll-lock', '')
    return () => {
      if (--locks === 0) document.documentElement.removeAttribute('data-scroll-lock')
    }
  }, [])
}
