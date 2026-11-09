import { type RefObject,useEffect, useRef, useState } from 'react'

import { Button } from '../../components/Button'
import type { Catalog, Category } from '../../domain'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'
import { cx } from '../../utils/cx'
import { COVER_ATTR } from '../../utils/morph'

type Props = {
  catalog: Catalog
  navRef: RefObject<HTMLElement | null>
  activeTop: Category
  activeSub: string
  activeSubs: Category[]
  showSubtabs: boolean
  onSelect: (subId: string) => void
}

/**
 * 2026 Liquid Glass CategoryNav:
 * Unbounded display titles for active categories with liquid indicator sliding underneath,
 * synchronized with scroll-spy.
 * Dynamically tracks sticky position relative to header, providing generous top/bottom
 * touch targets and breathing room on mobile when pinned to the top.
 */
export function CategoryNav({ catalog, navRef, activeTop, activeSub, activeSubs, showSubtabs, onSelect }: Props) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const subTabsRef = useRef<HTMLDivElement>(null)
  const tabIndicator = useSlidingIndicator(tabsRef, activeTop.id)
  const subIndicator = useSlidingIndicator(subTabsRef, showSubtabs ? activeSub : '')
  const [isStuck, setIsStuck] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    const checkStuck = () => {
      if (!navRef.current) return
      const headerH = typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '68')
        : 68
      const top = navRef.current.getBoundingClientRect().top
      const joinDistance = parseFloat(getComputedStyle(navRef.current).getPropertyValue('--nav-join-distance')) || 0
      setIsJoining(top <= headerH + joinDistance && window.scrollY > 10)
      setIsStuck(top <= headerH + 2 && window.scrollY > 10)
    }
    window.addEventListener('scroll', checkStuck, { passive: true })
    checkStuck()
    return () => window.removeEventListener('scroll', checkStuck)
  }, [navRef])

  useEffect(() => {
    for (const row of [tabsRef.current, subTabsRef.current]) {
      const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!row || !tab || row.scrollWidth <= row.clientWidth + 1) continue
      const visible = tab.offsetLeft >= row.scrollLeft && tab.offsetLeft + tab.offsetWidth <= row.scrollLeft + row.clientWidth
      if (visible) continue
      row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [activeSub])

  return (
    <nav
      className={cx(
        'sticky z-20 border-b-(length:--stroke-width) border-transparent transition-[padding,box-shadow] duration-200',
        isJoining && 'ui-menu-nav--joining',
        isStuck
          ? 'bg-bg pt-4 sm:pt-4.5 pb-3.5 sm:pb-4 shadow-sticky'
          // Let the promo shadow fade through; the opaque cover is only needed when stuck.
          : cx('mt-1 pt-3 pb-2.5', isJoining ? 'bg-bg' : 'bg-transparent'),
      )}
      style={{ top: 'var(--header-h)' }}
      aria-label="Категории меню"
      ref={navRef}
      {...{ [COVER_ATTR]: '' }}
    >
      {/* Top Categories */}
      <div className="no-scrollbar relative flex gap-4 sm:gap-6 overflow-x-auto px-3.5 sm:px-4" role="tablist" ref={tabsRef}>
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-0.75 rounded-pill bg-accent opacity-0 transition-[transform,scale,width] duration-350 ease-soft "
          ref={tabIndicator}
          aria-hidden="true"
        />
        {catalog.topCategories.map((top) => {
          const selected = top.id === activeTop.id
          return (
            <Button
              key={top.id}
              role="tab"
              aria-selected={selected}
              className={cx(
                'relative whitespace-nowrap transition-all duration-200 cursor-pointer',
                isStuck
                  ? 'pt-1.5 pb-2.5 sm:pt-2 sm:pb-3 text-body-lg sm:text-lead'
                  : 'pt-0.5 pb-2 text-body-lg sm:text-lead',
                selected
                  ? 'font-display font-bold text-ink'
                  : 'font-display font-medium text-muted hover:text-ink/80',
              )}
              onClick={() => {
                const first = catalog.subcategoriesOf(top.id)[0]
                if (first) {
                  onSelect(first.id)
                } else {
                  onSelect(top.id)
                }
              }}
            >
              {top.name}
            </Button>
          )
        })}
      </div>

      {/* Subcategories (Chips) */}
      {showSubtabs && (
        <div
          className={cx(
            // Paint space for raised chips, compensated margins preserve the row position.
            'no-scrollbar relative flex gap-1.5 overflow-x-auto px-3.5 sm:px-4 py-3 -mb-3 animate-fade-in transition-all duration-200',
            isStuck ? 'mt-0 sm:mt-0.5' : '-mt-0.5',
          )}
          role="tablist"
          ref={subTabsRef}
        >
          <span
            className="ui-category-indicator pointer-events-none absolute top-3 bottom-3 left-0 rounded-control opacity-0 transition-[transform,scale,width] duration-350 ease-soft"
            ref={subIndicator}
            aria-hidden="true"
          />
          {activeSubs.map((sub) => {
            const selected = sub.id === activeSub
            return (
              <Button
                key={sub.id}
                role="tab"
                aria-selected={selected}
                className={cx(
                  // Border is constant on both states: toggling it made border-color animate
                  // from currentColor (white) to transparent on the chip being deselected.
                  'relative z-1 min-h-11 rounded-control px-3.5 whitespace-nowrap transition-colors duration-250 cursor-pointer border-(length:--stroke-width) border-transparent',
                  isStuck ? 'py-1.5 text-compact sm:py-2' : 'py-1.5 text-compact',
                  'font-semibold',
                  selected
                    ? 'text-ink'
                    : 'ui-category-chip text-ink-2',
                )}
                onClick={() => onSelect(sub.id)}
              >
                {sub.name}
              </Button>
            )
          })}
        </div>
      )}
    </nav>
  )
}
