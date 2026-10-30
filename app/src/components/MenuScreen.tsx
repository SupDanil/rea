import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { formatPrice, itemById, itemsOf, subcategoriesOf, topCategories, type MenuItem } from '../data/menu'
import type { Theme } from '../theme'
import { avatar, cx, openDot, roundBtn } from '../ui'
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
    <div>
      <header className="flex items-center justify-between gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-2.5">
        <button className="flex min-w-0 items-center gap-2.5 text-left" aria-label="Кофейня: Покровка, 12, открыто до 22:00">
          <img className="block size-10 rounded-[13px] shadow-card" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <div>
            <div className="flex items-center gap-[5px] text-[15px] font-bold tracking-[-0.01em]">
              Покровка, 12
              <svg className="text-muted" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-px flex items-center gap-1.5 text-[12px] text-muted">
              <span className={openDot} aria-hidden="true" />
              открыто до 22:00
            </div>
          </div>
        </button>
        <div className="flex gap-2">
          <button
            className={roundBtn}
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <svg key={theme} className="animate-spin-in" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
          <button className={roundBtn} onClick={onOpenProfile} aria-label={profileInitial ? `Профиль${giftsAvailable ? `, подарков: ${giftsAvailable}` : ''}` : 'Войти'}>
            {profileInitial ? (
              <span className={avatar(true)} aria-hidden="true">{profileInitial}</span>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19.5c1.2-3.2 3.8-4.8 7-4.8s5.8 1.6 7 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
            {giftsAvailable > 0 && <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-surface text-[11px] shadow-card animate-[pop_0.35s_var(--ease-soft)]" aria-hidden="true">🎁</span>}
          </button>
          <button className={roundBtn} onClick={onOpenCart} aria-label={`Корзина, товаров: ${cartCount}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 7h12l-1 13H7L6 7Z M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            {cartCount > 0 && <span className="absolute -top-[3px] -right-[3px] grid h-5 min-w-5 place-items-center rounded-[10px] border-2 border-bg bg-accent px-[5px] text-[11px] font-extrabold text-accent-ink animate-[pop_0.35s_var(--ease-soft)]">{cartCount}</span>}
          </button>
        </div>
      </header>

      {hero && (
        <button
          className="tinted relative mx-3 mt-1 block w-[calc(100%-24px)] overflow-hidden rounded-[32px] text-left text-ink shadow-card [background:radial-gradient(120%_90%_at_70%_35%,var(--glow)_0%,transparent_55%),var(--tinted)]"
          style={{ '--tint': hero.art.bg } as CSSProperties} onClick={() => onOpen(hero)}>
          <div className="grid min-h-[236px] grid-cols-2 items-center animate-[fade-in_0.45s_var(--ease-soft)]" key={hero.id}>
            <ItemArt art={hero.art} className="block h-auto w-full animate-[float_5s_ease-in-out_infinite]" />
            <div className="-order-1 py-[22px] pl-5">
              <div className="inline-block rounded-full bg-glass-strong px-[9px] py-1 text-[11px] font-bold tracking-[0.04em] text-accent-soft uppercase">{hero.badge ?? 'Рекомендуем'}</div>
              <div className="mt-2.5 text-[26px] leading-[1.05] font-extrabold tracking-[-0.035em]">{hero.name}</div>
              <div className="mt-2 line-clamp-3 text-[13px] leading-[1.35] text-ink-2">{hero.description}</div>
              <span className="mt-3.5 inline-block rounded-full bg-inverse px-3.5 py-2 text-[14px] font-bold text-inverse-ink">от {formatPrice(minPrice(hero))}</span>
            </div>
          </div>
        </button>
      )}

      <nav className="sticky top-0 z-5 mt-2.5 bg-sticky pt-3 pb-2.5 backdrop-blur-[14px] backdrop-saturate-140" aria-label="Категории меню" ref={navRef}>
        <div className="no-scrollbar relative flex gap-[22px] overflow-x-auto px-4" role="tablist" ref={tabsRef}>
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
              className="relative pt-0.5 pb-1.5 text-[21px] font-extrabold tracking-[-0.035em] whitespace-nowrap text-faint transition-[color] duration-250 ease-[ease] aria-selected:text-ink"
              onClick={() => scrollToSub(subcategoriesOf(top.id)[0].id)}
            >
              {top.name}
            </button>
          ))}
        </div>
        {showSubtabs && (
          <div className="no-scrollbar relative mt-2.5 flex gap-1.5 overflow-x-auto px-4 animate-fade-in" role="tablist" ref={subTabsRef}>
            <span
              className="pointer-events-none absolute top-0 bottom-0 left-0 rounded-full bg-inverse opacity-0 transition-[transform,width] duration-350 ease-soft"
              ref={subIndicator}
              aria-hidden="true"
            />
            {activeSubs.map((sub) => (
              <button key={sub.id} role="tab" aria-selected={sub.id === activeSub} className="relative z-1 rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-ink-2 transition-[color] duration-300 ease-soft aria-selected:text-inverse-ink"
                onClick={() => scrollToSub(sub.id)}>
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </nav>

      <main>
        {sections.map(({ sub }) => (
          <section key={sub.id} id={`section-${sub.id}`} className="scroll-mt-(--tabs-h) px-3 pt-[18px] pb-1">
            <h2 className="mx-1 mb-3 text-[22px]">{sub.name}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {itemsOf(sub.id).map((item) => (
                <button
                  key={item.id}
                  className={cx(
                    'group flex flex-col rounded-[24px] px-1.5 pt-1.5 pb-3 text-left [transition:transform_0.18s_var(--ease-soft),scale_0.18s_var(--ease-soft),box-shadow_0.18s,background-color_0.3s_ease] active:scale-97',
                    isStopped(item) ? 'bg-[color-mix(in_oklab,var(--surface)_55%,transparent)]' : 'bg-surface shadow-card hover:shadow-lift',
                  )}
                  onClick={() => onOpen(item)}
                  aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${isStopped(item) ? ', закончилось' : ''}`}
                >
                  <div
                    className={cx('art-glow relative grid aspect-square place-items-center overflow-hidden rounded-[19px]', isStopped(item) && 'opacity-55 grayscale-70')}
                    style={{ '--tint': item.art.bg } as CSSProperties}>
                    <ItemArt art={item.art} className="size-[84%] transition-transform duration-300 ease-soft group-hover:-translate-y-[3px] group-hover:scale-103" />
                    {item.badge && <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-1 text-[10px] font-extrabold tracking-[0.04em] text-accent-ink uppercase">{item.badge}</span>}
                  </div>
                  <div className={cx('mx-2 mt-2.5 text-[15px] leading-[1.2] font-bold tracking-[-0.015em]', isStopped(item) && 'opacity-55')}>{item.name}</div>
                  <div className={cx('mx-2 mt-1 line-clamp-2 flex-1 text-[12px] leading-[1.35] text-muted', isStopped(item) && 'opacity-55')}>{item.description}</div>
                  <div className="mt-2.5 mr-1 ml-2 flex items-center justify-between">
                    <span className={isStopped(item) ? 'text-[13px] font-semibold text-muted' : 'text-[15px] font-bold'}>
                      {isStopped(item) ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
                    </span>
                    {!isStopped(item) && (
                      <span
                        className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink transition-[background,color] duration-200 ease-[ease] group-hover:bg-accent group-hover:text-accent-ink"
                        aria-hidden="true"
                      >
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
        <p className="px-8 pt-7 pb-[calc(96px+env(safe-area-inset-bottom))] text-center text-[12px] text-muted">Цены указаны для кофейни на Покровке. Состав и аллергены — в карточке товара.</p>
      </main>
    </div>
  )
}

/** Must match the sections' `scroll-mt-(--tabs-h)` (--tabs-h in index.css). */
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
