import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * One highlight that slides between tabs instead of each tab fading its own
 * background in and out — two half-lit chips mid-switch read as flicker.
 * Positioned straight through the DOM so a scroll-driven switch costs no extra render.
 */
export function useSlidingIndicator(rowRef: RefObject<HTMLDivElement | null>, activeKey: string) {
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    const indicator = indicatorRef.current
    if (!row || !indicator) {
      placed.current = false
      return
    }
    const place = (animate: boolean) => {
      const tab = row.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!tab) return
      indicator.style.transition = animate ? '' : 'none'
      indicator.style.width = `${tab.offsetWidth}px`
      indicator.style.transform = `translateX(${tab.offsetLeft}px)`
      indicator.style.opacity = '1'
    }
    // First placement (and a freshly shown row) snaps; later switches glide.
    place(placed.current)
    placed.current = true
    // Web fonts and rotation change tab widths after the first measure.
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    void document.fonts?.ready.then(() => place(false))
    return () => window.removeEventListener('resize', onResize)
  }, [rowRef, activeKey])

  return indicatorRef
}
