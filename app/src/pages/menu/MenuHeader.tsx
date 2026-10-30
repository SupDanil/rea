import { avatar, openDot, roundBtn } from '../../components/ui'
import { BagIcon, ChevronDownIcon, PersonIcon } from '../../components/icons'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import { countOf } from '../../state/cart'

export function MenuHeader() {
  const { cart, profile, loyalty, theme, toggleTheme } = useApp()
  const { go } = useAppNavigate()
  const cartCount = countOf(cart.lines)
  const gifts = loyalty.giftsAvailable

  return (
    <header className="flex items-center justify-between gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-2.5">
      <button className="flex min-w-0 items-center gap-2.5 text-left" aria-label="Кофейня: Покровка, 12, открыто до 22:00">
        <img className="block size-10 rounded-[13px] shadow-card" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
        <div>
          <div className="flex items-center gap-[5px] text-[15px] font-bold tracking-[-0.01em]">
            Покровка, 12
            <ChevronDownIcon className="text-muted" />
          </div>
          <div className="mt-px flex items-center gap-1.5 text-[12px] text-muted">
            <span className={openDot} aria-hidden="true" />
            открыто до 22:00
          </div>
        </div>
      </button>
      <div className="flex gap-2">
        <button className={roundBtn} onClick={toggleTheme} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}>
          <ThemeIcon dark={theme === 'dark'} />
        </button>
        <button className={roundBtn} onClick={() => go('/profile')} aria-label={profile ? `Профиль${gifts ? `, подарков: ${gifts}` : ''}` : 'Войти'}>
          {profile ? (
            <span className={avatar(true)} aria-hidden="true">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <PersonIcon />
          )}
          {gifts > 0 && (
            <span
              className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-surface text-[11px] shadow-card animate-[pop_0.35s_var(--ease-soft)]"
              aria-hidden="true"
            >
              🎁
            </span>
          )}
        </button>
        <button className={roundBtn} onClick={() => go('/cart')} aria-label={`Корзина, товаров: ${cartCount}`} data-cart-target="header">
          <BagIcon />
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="absolute -top-[3px] -right-[3px] grid h-5 min-w-5 place-items-center rounded-[10px] border-2 border-bg bg-accent px-[5px] text-[11px] font-extrabold text-accent-ink animate-[pop_0.35s_var(--ease-soft)]"
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

/** Sun in dark mode, moon in light; spins in on every switch. */
function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg key={String(dark)} className="animate-spin-in" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
