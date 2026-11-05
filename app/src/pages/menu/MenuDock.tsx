import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useCatalog } from '../../queries/useCatalog'
import { useApp } from '../../state/AppContext'
import { countOf, subtotalOf } from '../../state/cart'
import { isActive, type OrderStatus,statusOf } from '../../state/orders'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

const short: Record<OrderStatus, string> = {
  paying: 'оплата',
  accepted: 'принят',
  making: 'готовим',
  ready: 'готов!',
  completed: 'выдан',
  cancelled: 'отменён',
}

/**
 * 2026 Liquid Glass MenuDock:
 * Floating glass capsule with status-colored badge, bubble-popping droplet count badge,
 * and adaptive scroll compression.
 */
export function MenuDock() {
  const { cart, orders } = useApp()
  const { go } = useAppNavigate()
  const now = useNow(2000)
  const catalog = useCatalog()
  const count = countOf(cart.lines)
  const total = subtotalOf(cart.lines, catalog)
  const activeOrder = orders.orders.find((o) => isActive(o, now))

  if (!count && !activeOrder) return null
  const status = activeOrder && statusOf(activeOrder, now)
  const hasActiveOrder = Boolean(activeOrder && status)

  return (
    <div
      className={cx(
        'pointer-events-none fixed z-20 flex gap-2.5 sm:gap-3 items-center *:pointer-events-auto',
        hasActiveOrder ? 'justify-center' : '',
        // Mobile: centered floating dock separated from screen edges
        'right-0 bottom-0 left-0 mx-auto max-w-[460px] px-3 sm:px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]',
        // Desktop: bottom-right corner with elegant float
        'wide:right-8 wide:bottom-8 wide:left-auto wide:mx-0 wide:max-w-none wide:w-auto wide:p-0',
        'transition-transform duration-300 ease-soft',
      )}
    >
      {/* Active Order Button */}
      {activeOrder && status && (
        <button
          className={cx(
            'flex h-14 sm:h-15 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-5 sm:px-6 whitespace-nowrap text-[14px] sm:text-[15px] shadow-lift backdrop-blur-2xl cursor-pointer transition-transform duration-200 active:scale-96 shrink-0',
            status === 'ready'
              ? 'bg-[#15291C]/92 border border-open/50 text-white ready-glow'
              : status === 'cancelled'
                ? 'bg-danger/20 border border-danger/40 text-white'
                : 'bg-[#261A13]/92 dark:bg-[#20140D]/92 border border-pending/50 text-white shadow-[0_8px_24px_rgba(212,147,42,0.2)]',
          )}
          onClick={() => go(`/order/${activeOrder.id}`)}
          aria-label={`Заказ № ${activeOrder.number}: ${short[status]}`}
        >
          <b className="font-display font-bold text-white">№ {activeOrder.number}</b>
          <span className={status === 'ready' ? 'text-white/90 font-medium' : 'text-white/80 font-medium'}>
            {short[status]}
          </span>
        </button>
      )}

      {/* Cart Button */}
      {count > 0 && (
        <button
          data-cart-target="dock"
          onClick={() => go('/cart')}
          className={cx(
            'flex h-14 sm:h-15 items-center gap-2.5 sm:gap-3 rounded-full pl-2',
            hasActiveOrder
              ? 'shrink-0 pr-4 sm:pr-5'
              : 'flex-1 wide:flex-none wide:min-w-[270px] pr-5 sm:pr-6',
            'bg-accent text-accent-ink hover:bg-accent-2 shadow-[0_8px_28px_rgba(196,91,36,0.32)] dark:shadow-[0_8px_28px_rgba(224,125,62,0.28)]',
            'border border-white/25 backdrop-blur-2xl transition-transform duration-200 active:scale-96 cursor-pointer',
          )}
        >
          {/* Bubbling Droplet Count Badge with high-contrast dark espresso text */}
          <span
            key={count}
            data-cart-badge
            className="grid size-10 sm:size-11 shrink-0 place-items-center rounded-full bg-white text-[#1C140F] font-display font-black text-[15px] shadow-sm animate-[pop_0.4s_var(--spring)_both]"
          >
            {count}
          </span>

          <span
            className={cx(
              'font-display font-semibold text-[15px] tracking-tight whitespace-nowrap',
              hasActiveOrder ? 'pr-0.5' : 'flex-1 text-left truncate min-w-0',
            )}
          >
            Корзина
          </span>

          {!hasActiveOrder && (
            <span className="font-display font-bold text-[16px] tracking-tight text-right whitespace-nowrap shrink-0 animate-pop" key={total}>
              {formatPrice(total)}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
