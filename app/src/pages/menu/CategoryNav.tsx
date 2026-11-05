import { type RefObject,useEffect, useRef, useState } from 'react'

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

  useEffect(() => {
    const checkStuck = () => {
      if (!navRef.current) return
      const headerH = typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '68')
        : 68
      const top = navRef.current.getBoundingClientRect().top
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
        'sticky z-10 border-b transition-all duration-200',
        isStuck
          ? 'bg-bg/95 pt-4 sm:pt-4.5 pb-3.5 sm:pb-4 border-line/60 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-2xl'
          : 'mt-1 bg-bg/95 pt-3 pb-2.5 border-line/40 wide:bg-bg/85 wide:backdrop-blur-xl',
      )}
      style={{ top: 'var(--header-h, 68px)' }}
      aria-label="Категории меню"
      ref={navRef}
      {...{ [COVER_ATTR]: '' }}
    >
      {/* Top Categories */}
      <div className="no-scrollbar relative flex gap-4 sm:gap-6 overflow-x-auto px-3.5 sm:px-4" role="tablist" ref={tabsRef}>
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-full bg-accent opacity-0 transition-[transform,scale,width] duration-350 ease-soft shadow-[0_0_8px_rgba(196,91,36,0.35)]"
          ref={tabIndicator}
          aria-hidden="true"
        />
        {catalog.topCategories.map((top) => {
          const selected = top.id === activeTop.id
          return (
            <button
              key={top.id}
              role="tab"
              aria-selected={selected}
              className={cx(
                'relative whitespace-nowrap transition-all duration-200 cursor-pointer',
                isStuck
                  ? 'pt-1.5 pb-2.5 sm:pt-2 sm:pb-3 text-[17px] sm:text-[19px]'
                  : 'pt-0.5 pb-2 text-[17px] sm:text-[19px]',
                selected
                  ? 'font-display font-bold text-ink'
                  : 'font-display font-medium text-muted hover:text-ink/80',
              )}
              onClick={() => {
                const first = catalog.subcategoriesOf(top.id)[0]
                if (first) onSelect(first.id)
              }}
            >
              {top.name}
            </button>
          )
        })}
      </div>

      {/* Subcategories (Chips) */}
      {showSubtabs && (
        <div
          className={cx(
            'no-scrollbar relative flex gap-1.5 overflow-x-auto px-3.5 sm:px-4 animate-fade-in transition-all duration-200',
            isStuck ? 'mt-3 sm:mt-3.5' : 'mt-2.5',
          )}
          role="tablist"
          ref={subTabsRef}
        >
          <span
            className="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-accent opacity-0 transition-[transform,scale,width] duration-350 ease-soft shadow-sm"
            ref={subIndicator}
            aria-hidden="true"
          />
          {activeSubs.map((sub) => {
            const selected = sub.id === activeSub
            return (
              <button
                key={sub.id}
                role="tab"
                aria-selected={selected}
                className={cx(
                  'relative z-1 rounded-full px-3.5 whitespace-nowrap transition-colors duration-250 cursor-pointer',
                  isStuck ? 'py-1.5 text-[13px] sm:py-2' : 'py-1.5 text-[13px]',
                  'font-semibold',
                  selected
                    ? 'text-accent-ink'
                    : 'text-ink-2 bg-surface/80 border border-line hover:border-accent/30',
                )}
                onClick={() => onSelect(sub.id)}
              >
                {sub.name}
              </button>
            )
          })}
        </div>
      )}
    </nav>
  )
}
