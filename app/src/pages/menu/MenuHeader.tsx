import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Button, IconButton } from '../../components/Button'
import { BagIcon, ChevronDownIcon, PersonIcon, RabbitIcon } from '../../components/icons'
import { Presence } from '../../components/Presence'
import { ShopPickerSheet } from '../../components/ShopPickerSheet'
import { avatar, openDot } from '../../components/ui'
import { shopStatus } from '../../domain'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useShop } from '../../queries/useShop'
import { useApp } from '../../state/AppContext'
import { countOf } from '../../state/cart'
import { cx } from '../../utils/cx'
import { COVER_ATTR } from '../../utils/morph'

/** Shop identity and actions; an opaque surface joins the sticky navigation. */
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
      const h = headerRef.current.getBoundingClientRect().height
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
      setScrolled(window.scrollY > 4)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className={cx(
          'sticky top-0 z-30 flex items-center justify-between gap-1.5 px-2 xs:px-3 sm:px-4 pt-[calc(calc(var(--space-unit)*2.5)+env(safe-area-inset-top))] pb-2.5 border-b-(length:--stroke-width) transition-[background-color,border-color,box-shadow] duration-200',
          scrolled
            ? 'bg-bg border-transparent'
            : 'bg-transparent border-line/0',
        )}
        {...{ [COVER_ATTR]: '' }}
      >
        {/* Coffee Shop Capsule Button */}
        <Button
          onClick={() => setShowShopPicker(true)}
          variant="secondary"
          className="flex min-w-0 max-w-80 sm:max-w-96 flex-1 items-center gap-1.5 xs:gap-2 py-1.5 pl-1.5 pr-2.5 text-left"
          aria-label={shop && status ? `shit кофе: ${shop.address}, ${status.text}` : 'shit кофе'}
        >
          <div className="grid size-7 xs:size-9 place-items-center rounded-pill bg-ink text-surface dark:bg-surface-2 dark:text-crema shadow-xs flex-none">
            <RabbitIcon size={20} className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 font-display text-caption xs:text-compact sm:text-body font-bold text-ink tracking-tight">
              <span>shit кофе</span>
              <ChevronDownIcon className="text-muted size-3" />
            </div>
            {shop && status && (
              <div
                className="flex items-center gap-1 text-caption text-muted font-medium"
              >
                <span className="min-w-0 truncate">{shop.address}</span>
                <span data-shop-status={status.kind} className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                  <span className={cx('shrink-0', status.kind === 'open' ? openDot : 'size-1.5 rounded-pill bg-danger')} aria-hidden="true" />
                  {status.text}
                </span>
              </div>
            )}
          </div>
        </Button>

        {/* Action Controls */}
        <div className="flex shrink-0 gap-1 xs:gap-2 items-center">
          <IconButton

            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <ThemeIcon dark={theme === 'dark'} />
          </IconButton>

          <IconButton

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
                className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-pill bg-surface text-micro animate-[pop_0.35s_var(--spring)]"
                aria-hidden="true"
              >
                🎁
              </span>
            )}
          </IconButton>

          <IconButton

            onClick={() => go('/cart')}
            aria-label={`Корзина, товаров: ${cartCount}`}
          >
            <BagIcon />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="absolute -top-[calc(var(--space-unit)*0.75)] -right-[calc(var(--space-unit)*0.75)] grid h-5 min-w-5 place-items-center rounded-pill border-(length:--stroke-width-strong) border-bg bg-accent px-1 text-micro font-display font-extrabold text-accent-ink animate-[pop_0.35s_var(--spring)]"
              >
                {cartCount}
              </span>
            )}
          </IconButton>
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
        <g fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </g>
      ) : (
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinejoin="round" />
      )}
    </svg>
  )
}
