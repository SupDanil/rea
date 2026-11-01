import { useEffect, useRef, type RefObject } from 'react'
import type { Catalog, Category } from '../../domain'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

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
 */
export function CategoryNav({ catalog, navRef, activeTop, activeSub, activeSubs, showSubtabs, onSelect }: Props) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const subTabsRef = useRef<HTMLDivElement>(null)
  const tabIndicator = useSlidingIndicator(tabsRef, activeTop.id)
  const subIndicator = useSlidingIndicator(subTabsRef, showSubtabs ? activeSub : '')

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
      className="sticky top-[58px] z-10 mt-1 bg-bg/85 pt-3 pb-2.5 backdrop-blur-xl border-b border-line/40 transition-colors"
      aria-label="Категории меню"
      ref={navRef}
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
              className={`relative pt-0.5 pb-2 text-[17px] sm:text-[19px] whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selected
                  ? 'font-display font-bold text-ink'
                  : 'font-display font-medium text-muted hover:text-ink/80'
              }`}
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
        <div className="no-scrollbar relative mt-2.5 flex gap-1.5 overflow-x-auto px-3.5 sm:px-4 animate-fade-in" role="tablist" ref={subTabsRef}>
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
                className={`relative z-1 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-250 cursor-pointer ${
                  selected
                    ? 'text-accent-ink'
                    : 'text-ink-2 bg-surface/80 border border-line hover:border-accent/30'
                }`}
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
