import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { subcategoriesOf, topCategories } from '../../data/menu'
import { animateWindowScroll } from '../../utils/scrollTo'

/** Must match the sections' `scroll-mt-(--tabs-h)` (--tabs-h in index.css). */
const SECTION_SCROLL_MARGIN = 96

export const sectionId = (subId: string) => `section-${subId}`

/**
 * Tracks which subcategory is under the sticky category bar and scrolls to
 * one on demand. Also keeps the list still when the bar changes height.
 */
export function useMenuScrollSpy() {
  const sections = useMemo(() => topCategories.flatMap((top) => subcategoriesOf(top.id).map((sub) => ({ top, sub }))), [])
  const [activeSub, setActiveSub] = useState(sections[0].sub.id)
  const activeTop = sections.find((s) => s.sub.id === activeSub)?.top ?? topCategories[0]
  // A lone subcategory would only repeat the section heading below it.
  const activeSubs = subcategoriesOf(activeTop.id)
  const showSubtabs = activeSubs.length > 1

  const navRef = useRef<HTMLElement>(null)
  const navHeight = useRef(0)
  const scrollLock = useRef(false)

  // The sticky bar grows or shrinks when the subcategory row comes and goes.
  // While it is stuck, scroll by the same amount so the content stays put and
  // the row simply slides over it — otherwise the list jumps under the finger.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const height = nav.offsetHeight
    const delta = height - navHeight.current
    const stuck = nav.getBoundingClientRect().top <= 0.5 && window.scrollY > 0
    if (navHeight.current && delta && stuck && !scrollLock.current) {
      window.scrollBy({ top: delta, behavior: 'instant' })
    }
    navHeight.current = height
  }, [showSubtabs])

  // Highlight the subcategory whose heading has reached the bottom of the whole
  // sticky bar (both rows), so the chip switches as the heading slides under it.
  useEffect(() => {
    const onScroll = () => {
      if (scrollLock.current) return
      const barBottom = navRef.current?.getBoundingClientRect().bottom ?? 0
      // Never below where a tapped tab parks its heading (scroll-margin-top).
      const offset = Math.max(barBottom, SECTION_SCROLL_MARGIN) + 12
      let current = sections[0].sub.id
      for (const { sub } of sections) {
        const el = document.getElementById(sectionId(sub.id))
        if (el && el.getBoundingClientRect().top <= offset) current = sub.id
      }
      setActiveSub(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  const scrollToSub = (subId: string) => {
    const el = document.getElementById(sectionId(subId))
    if (!el) return
    setActiveSub(subId)
    scrollLock.current = true
    // Park the section right under the sticky bar, measured live: the bar can
    // gain or lose its subcategory row while we travel.
    const target = () => el.getBoundingClientRect().top + window.scrollY - (navRef.current?.offsetHeight ?? SECTION_SCROLL_MARGIN)
    void animateWindowScroll(target).then(() => {
      scrollLock.current = false
      // Settle on whatever is really under the bar (the user may have taken over).
      window.dispatchEvent(new Event('scroll'))
    })
  }

  return { sections, activeSub, activeTop, activeSubs, showSubtabs, navRef, scrollToSub }
}
