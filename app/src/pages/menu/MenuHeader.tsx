import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { BagIcon, ChevronDownIcon, PersonIcon, RabbitIcon } from '../../components/icons'
import { Presence } from '../../components/Presence'
import { ShopPickerSheet } from '../../components/ShopPickerSheet'
import { avatar, openDot, roundBtn } from '../../components/ui'
import { shopStatus } from '../../domain'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useShop } from '../../queries/useShop'
import { useApp } from '../../state/AppContext'
import { countOf } from '../../state/cart'
import { cx } from '../../utils/cx'
import { COVER_ATTR } from '../../utils/morph'

/**
 * 2026 Liquid Glass MenuHeader:
 * Transparent at the top, turns into a sleek frosted liquid glass bar when scrolled.
 * Selected coffee shop rendered as an elegant capsule button.
 */
export function MenuHeader() {
  const { cart, profile, loyalty, theme, toggleTheme } = useApp()
  const { go } = useAppNavigate()
  const [showShopPicker, setShowShopPicker] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const cartCount = countOf(cart.lines)
  const gifts = loyalty.giftsAvailable
  const shop = useShop()
  const now = useNow(60_000)
  const status = shop ? shopStatus(shop, now) : null
  const headerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const update = () => {
      if (!headerRef.current) return
      const h = headerRef.current.offsetHeight
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (headerRef.current && ro) ro.observe(headerRef.current)
    window.addEventListener('resize', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className={cx(
          'sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 border-b transition-[background-color,border-color,box-shadow] duration-200',
          scrolled
            ? 'bg-bg/95 wide:bg-bg/85 wide:backdrop-blur-xl border-line/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : 'bg-transparent border-line/0',
        )}
        {...{ [COVER_ATTR]: '' }}
      >
        {/* Coffee Shop Capsule Button */}
        <button
          onClick={() => setShowShopPicker(true)}
          className="flex min-w-0 items-center gap-2.5 rounded-full bg-surface/90 border border-line py-1.5 pl-1.5 pr-3.5 shadow-sm backdrop-blur-md text-left cursor-pointer hover:bg-surface active:scale-98 transition-all"
          aria-label={shop && status ? `shit кофе: ${shop.address}, ${status.text}` : 'shit кофе'}
        >
          <div className="grid size-9 place-items-center rounded-full bg-ink text-surface dark:bg-surface-2 dark:text-crema shadow-xs flex-none">
            <RabbitIcon size={20} className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-display text-[13px] sm:text-[14px] font-bold text-ink tracking-tight">
              <span>shit кофе</span>
              <ChevronDownIcon className="text-muted size-3" />
            </div>
            {shop && status && (
              <div
                className="flex items-center gap-1.5 text-[11px] text-muted font-medium truncate"
                data-shop-status={status.kind}
              >
                <span className={status.kind === 'open' ? openDot : 'size-1.5 rounded-full bg-danger'} aria-hidden="true" />
                {shop.address} · {status.text}
              </div>
            )}
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex gap-2 items-center">
          <button
            className={roundBtn}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <ThemeIcon dark={theme === 'dark'} />
          </button>

          <button
            className={roundBtn}
            onClick={() => go('/profile')}
            aria-label={profile ? `Профиль${gifts ? `, подарков: ${gifts}` : ''}` : 'Войти'}
          >
            {profile ? (
              <span className={avatar(true)} aria-hidden="true">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <PersonIcon />
            )}
            {gifts > 0 && (
              <span
                className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-surface text-[11px] shadow-card animate-[pop_0.35s_var(--spring)]"
                aria-hidden="true"
              >
                🎁
              </span>
            )}
          </button>

          <button
            className={roundBtn}
            onClick={() => go('/cart')}
            aria-label={`Корзина, товаров: ${cartCount}`}
          >
            <BagIcon />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="absolute -top-[3px] -right-[3px] grid h-5 min-w-5 place-items-center rounded-full border-2 border-bg bg-accent px-1 text-[11px] font-display font-extrabold text-accent-ink animate-[pop_0.35s_var(--spring)]"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <Presence>{showShopPicker && <ShopPickerSheet onClose={() => setShowShopPicker(false)} />}</Presence>
    </>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg key={String(dark)} className="animate-spin-in" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      {dark ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
      ) : (
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      )}
    </svg>
  )
}
