import { useEffect, useRef, type RefObject } from 'react'
import { subcategoriesOf, topCategories, type Category } from '../../data/menu'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

type Props = {
  navRef: RefObject<HTMLElement | null>
  activeTop: Category
  activeSub: string
  activeSubs: Category[]
  showSubtabs: boolean
  onSelect: (subId: string) => void
}

/** Sticky two-row tab bar: categories, then subcategories of the active one. */
export function CategoryNav({ navRef, activeTop, activeSub, activeSubs, showSubtabs, onSelect }: Props) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const subTabsRef = useRef<HTMLDivElement>(null)
  const tabIndicator = useSlidingIndicator(tabsRef, activeTop.id)
  const subIndicator = useSlidingIndicator(subTabsRef, showSubtabs ? activeSub : '')

  // Keep the active tabs visible inside their horizontal scrollers. Scroll the
  // rows directly: scrollIntoView here would cancel the page's smooth scroll.
  useEffect(() => {
    for (const row of [tabsRef.current, subTabsRef.current]) {
      const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!row || !tab) continue
      row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [activeSub])

  return (
    <nav className="sticky top-0 z-5 mt-2.5 bg-sticky pt-3 pb-2.5 backdrop-blur-[14px] backdrop-saturate-140" aria-label="Категории меню" ref={navRef}>
      <div className="no-scrollbar relative flex gap-3.5 sm:gap-[22px] overflow-x-auto px-3 sm:px-4" role="tablist" ref={tabsRef}>
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-[2px] bg-ink opacity-0 transition-[transform,width] duration-350 ease-soft"
          ref={tabIndicator}
          aria-hidden="true"
        />
        {topCategories.map((top) => (
          <button
            key={top.id}
            role="tab"
            aria-selected={top.id === activeTop.id}
            className="relative pt-0.5 pb-1.5 text-[18px] sm:text-[21px] font-extrabold tracking-[-0.035em] whitespace-nowrap text-faint transition-[color] duration-250 ease-[ease] aria-selected:text-ink"
            onClick={() => onSelect(subcategoriesOf(top.id)[0].id)}
          >
            {top.name}
          </button>
        ))}
      </div>
      {showSubtabs && (
        <div className="no-scrollbar relative mt-2.5 flex gap-1.5 overflow-x-auto px-3 sm:px-4 animate-fade-in" role="tablist" ref={subTabsRef}>
          <span
            className="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-inverse opacity-0 transition-[transform,width] duration-350 ease-soft"
            ref={subIndicator}
            aria-hidden="true"
          />
          {activeSubs.map((sub) => (
            <button
              key={sub.id}
              role="tab"
              aria-selected={sub.id === activeSub}
              className="relative z-1 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-ink-2 transition-[color] duration-300 ease-soft aria-selected:text-inverse-ink"
              onClick={() => onSelect(sub.id)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
