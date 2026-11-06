import { type RefObject,useLayoutEffect, useRef } from 'react'

/**
 * One highlight that slides between tabs instead of each tab fading its own
 * background in and out — two half-lit chips mid-switch read as flicker.
 * Positioned straight through the DOM so a scroll-driven switch costs no extra render.
 */
export function useSlidingIndicator(rowRef: RefObject<HTMLDivElement | null>, activeKey: string, selector = '[aria-selected="true"]') {
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
      const tab = row.querySelector<HTMLElement>(selector)
      if (!tab) return
      indicator.style.transition = animate ? '' : 'none'
      // offsetWidth/offsetLeft round to whole pixels and make the end inset uneven.
      // Normalize viewport measurements so entrance scaling does not alter layout.
      const rowRect = row.getBoundingClientRect()
      const tabRect = tab.getBoundingClientRect()
      const layoutWidth = Number.parseFloat(getComputedStyle(row).width)
      const scale = rowRect.width && layoutWidth ? rowRect.width / layoutWidth : 1
      indicator.style.width = `${tabRect.width / scale}px`
      indicator.style.transform = `translateX(${(tabRect.left - rowRect.left) / scale - row.clientLeft + row.scrollLeft}px)`
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
  }, [rowRef, activeKey, selector])

  return indicatorRef
}
