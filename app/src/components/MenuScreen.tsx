import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { formatPrice, itemById, itemsOf, subcategoriesOf, topCategories, type MenuItem } from '../data/menu'
import type { Theme } from '../theme'
import { ItemArt } from './ItemArt'

type Props = {
  cartCount: number
  onOpen: (item: MenuItem) => void
  onOpenCart: () => void
  profileInitial?: string
  giftsAvailable: number
  onOpenProfile: () => void
  theme: Theme
  onToggleTheme: () => void
}

const minPrice = (item: MenuItem) => Math.min(...item.variants.map((v) => v.price))
const isStopped = (item: MenuItem) => item.variants.every((v) => v.stopped)

export function MenuScreen({ cartCount, onOpen, onOpenCart, profileInitial, giftsAvailable, onOpenProfile, theme, onToggleTheme }: Props) {
  const sections = useMemo(
    () => topCategories.flatMap((top) => subcategoriesOf(top.id).map((sub) => ({ top, sub }))),
    [],
  )
  const [activeSub, setActiveSub] = useState(sections[0].sub.id)
  const activeTop = sections.find((s) => s.sub.id === activeSub)?.top ?? topCategories[0]
  const hero = itemById.get(activeTop.heroItemId ?? '')
  // A lone subcategory would only repeat the section heading below it.
  const activeSubs = subcategoriesOf(activeTop.id)
  const showSubtabs = activeSubs.length > 1

  const navRef = useRef<HTMLElement>(null)
  const navHeight = useRef(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  const subTabsRef = useRef<HTMLDivElement>(null)
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
        const el = document.getElementById(`section-${sub.id}`)
        if (el && el.getBoundingClientRect().top <= offset) current = sub.id
      }
      setActiveSub(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

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

  const scrollToSub = (subId: string) => {
    const el = document.getElementById(`section-${subId}`)
    if (!el) return
    setActiveSub(subId)
    scrollLock.current = true
    const release = () => (scrollLock.current = false)
    window.addEventListener('scrollend', release, { once: true })
    window.setTimeout(release, 1200)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="menu">
      <header className="topbar">
        <button className="brand" aria-label="Кофейня: Покровка, 12, открыто до 22:00">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <div>
            <div className="shop-name">
              Покровка, 12
              <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="shop-hours">
              <span className="open-dot" aria-hidden="true" />
              открыто до 22:00
            </div>
          </div>
        </button>
        <div className="topbar-actions">
          <button
            className="round-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <svg key={theme} className="theme-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              {theme === 'dark' ? (
                <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
                </g>
              ) : (
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              )}
            </svg>
          </button>
          <button className="round-btn" onClick={onOpenProfile} aria-label={profileInitial ? `Профиль${giftsAvailable ? `, подарков: ${giftsAvailable}` : ''}` : 'Войти'}>
            {profileInitial ? (
              <span className="avatar avatar-sm" aria-hidden="true">{profileInitial}</span>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19.5c1.2-3.2 3.8-4.8 7-4.8s5.8 1.6 7 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
            {giftsAvailable > 0 && <span className="gift-dot" aria-hidden="true">🎁</span>}
          </button>
          <button className="round-btn" onClick={onOpenCart} aria-label={`Корзина, товаров: ${cartCount}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>

      {hero && (
        <button className="hero" style={{ '--tint': hero.art.bg } as CSSProperties} onClick={() => onOpen(hero)}>
          <div className="hero-inner" key={hero.id}>
            <ItemArt art={hero.art} className="hero-art" />
            <div className="hero-text">
              <div className="hero-kicker">{hero.badge ?? 'Рекомендуем'}</div>
              <div className="hero-name">{hero.name}</div>
              <div className="hero-desc">{hero.description}</div>
              <span className="hero-price">от {formatPrice(minPrice(hero))}</span>
            </div>
          </div>
        </button>
      )}

      <nav className="tabs-sticky" aria-label="Категории меню" ref={navRef}>
        <div className="tabs" role="tablist" ref={tabsRef}>
          <span className="tab-indicator" ref={tabIndicator} aria-hidden="true" />
          {topCategories.map((top) => (
            <button
              key={top.id}
              role="tab"
              aria-selected={top.id === activeTop.id}
              className="tab"
              onClick={() => scrollToSub(subcategoriesOf(top.id)[0].id)}
            >
              {top.name}
            </button>
          ))}
        </div>
        {showSubtabs && (
          <div className="subtabs" role="tablist" ref={subTabsRef}>
            <span className="subtab-indicator" ref={subIndicator} aria-hidden="true" />
            {activeSubs.map((sub) => (
              <button key={sub.id} role="tab" aria-selected={sub.id === activeSub} className="subtab" onClick={() => scrollToSub(sub.id)}>
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main>
        {sections.map(({ sub }) => (
          <section key={sub.id} id={`section-${sub.id}`} className="section">
            <h2>{sub.name}</h2>
            <div className="grid">
              {itemsOf(sub.id).map((item) => (
                <button
                  key={item.id}
                  className={`card${isStopped(item) ? ' is-stopped' : ''}`}
                  onClick={() => onOpen(item)}
                  aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${isStopped(item) ? ', закончилось' : ''}`}
                >
                  <div className="card-art" style={{ '--tint': item.art.bg } as CSSProperties}>
                    <ItemArt art={item.art} />
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </div>
                  <div className="card-name">{item.name}</div>
                  <div className="card-desc">{item.description}</div>
                  <div className="card-foot">
                    <span className="card-price">
                      {isStopped(item) ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
                    </span>
                    {!isStopped(item) && (
                      <span className="card-add" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
        <p className="footnote">Цены указаны для кофейни на Покровке. Состав и аллергены — в карточке товара.</p>
      </main>
    </div>
  )
}

/** Must match `.section { scroll-margin-top }` (var(--tabs-h)) in index.css. */
const SECTION_SCROLL_MARGIN = 96

/**
 * One highlight that slides between tabs instead of each tab fading its own
 * background in and out — two half-lit chips mid-switch read as flicker.
 * Positioned straight through the DOM so a scroll-driven switch costs no extra render.
 */
function useSlidingIndicator(rowRef: RefObject<HTMLDivElement | null>, activeKey: string) {
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
