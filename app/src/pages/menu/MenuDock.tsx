import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useCatalog } from '../../queries/useCatalog'
import { useApp } from '../../state/AppContext'
import { countOf, subtotalOf } from '../../state/cart'
import { isActive, statusOf, type OrderStatus } from '../../state/orders'
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
 * Floating glass capsule with glowing status indicator, bubble-popping droplet count badge,
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

  return (
    <div
      className={cx(
        'pointer-events-none fixed z-20 flex gap-3 items-center *:pointer-events-auto',
        // Mobile: centered floating dock separated from screen edges
        'right-0 bottom-0 left-0 mx-auto max-w-[460px] px-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]',
        // Desktop: bottom-right corner with elegant float
        'wide:right-8 wide:bottom-8 wide:left-auto wide:mx-0 wide:max-w-none wide:w-auto wide:p-0',
        'transition-transform duration-300 ease-soft',
      )}
    >
      {/* Active Order Button */}
      {activeOrder && status && (
        <button
          className={cx(
            'flex h-14 sm:h-15 items-center gap-2.5 rounded-full pl-2 pr-4 sm:pr-5 whitespace-nowrap text-white text-[14px] shadow-lift backdrop-blur-2xl cursor-pointer transition-transform duration-200 active:scale-96 shrink-0',
            status === 'ready'
              ? 'bg-[#15291C]/92 border border-open/50 animate-[ready-neon-pulse_2s_infinite]'
              : 'bg-ink/90 dark:bg-surface-2/90 border border-white/15',
          )}
          onClick={() => go(`/order/${activeOrder.id}`)}
          aria-label={`Заказ № ${activeOrder.number}: ${short[status]}`}
        >
          {/* Symmetrical round badge with glowing status dot */}
          <span
            className={cx(
              'grid size-10 sm:size-11 shrink-0 place-items-center rounded-full shadow-sm',
              status === 'ready'
                ? 'bg-open/25 border border-open/40'
                : 'bg-white/10 dark:bg-white/15 border border-white/10',
            )}
          >
            <span
              className={cx(
                'size-3 rounded-full',
                status === 'ready'
                  ? 'bg-open shadow-[0_0_10px_#3fbf7f] animate-pulse'
                  : 'bg-pending shadow-[0_0_8px_#e6b450] animate-pulse-dot',
              )}
              aria-hidden="true"
            />
          </span>

          <span className="font-medium text-[14px] flex items-center gap-1.5 pr-0.5">
            <b className="font-display font-bold text-white">№ {activeOrder.number}</b>
            <span className="text-white/80">{short[status]}</span>
          </span>
        </button>
      )}

      {/* Cart Button */}
      {count > 0 && (
        <button
          data-cart-target="dock"
          onClick={() => go('/cart')}
          className={cx(
            'flex flex-1 wide:flex-none wide:min-w-[270px] h-14 sm:h-15 items-center gap-3 rounded-full pl-2 pr-5 sm:pr-6',
            'bg-accent text-accent-ink hover:bg-accent-2 shadow-[0_8px_28px_rgba(196,91,36,0.32)] dark:shadow-[0_8px_28px_rgba(224,125,62,0.28)]',
            'border border-white/25 backdrop-blur-2xl transition-transform duration-200 active:scale-96 cursor-pointer shrink-0',
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

          <span className="flex-1 text-left font-display font-semibold text-[15px] tracking-tight whitespace-nowrap">
            Корзина
          </span>

          <span className="font-display font-bold text-[16px] tracking-tight text-right whitespace-nowrap shrink-0 animate-pop" key={total}>
            {formatPrice(total)}
          </span>
        </button>
      )}
    </div>
  )
}
