import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useApp } from '../../state/AppContext'
import { countOf, subtotalOf } from '../../state/cart'
import { isActive, statusOf } from '../../state/orders'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

const short = { paying: 'оплата', accepted: 'принят', making: 'готовим', ready: 'готов!', cancelled: 'отменён' } as const

/** Floating bar over the menu: the live order (if any) and the cart preview. */
export function MenuDock() {
  const { cart, orders } = useApp()
  const { go } = useAppNavigate()
  const now = useNow(2000)
  const count = countOf(cart.lines)
  const total = subtotalOf(cart.lines)
  const activeOrder = orders.orders.find((o) => isActive(o, now))
  if (!count && !activeOrder) return null
  const status = activeOrder && statusOf(activeOrder, now)

  return (
    <div
      className={cx(
        'pointer-events-none fixed z-10 flex gap-2.5 *:pointer-events-auto *:animate-rise',
        // Mobile: full-width bottom bar centered
        'right-0 bottom-0 left-0 mx-auto max-w-[480px] px-2 sm:px-2.5 pb-[calc(10px+env(safe-area-inset-bottom))]',
        // Desktop: pinned to bottom-right corner!
        'wide:right-6 wide:bottom-6 wide:left-auto wide:mx-0 wide:max-w-none wide:w-auto wide:p-0 wide:items-center',
      )}
    >
      {activeOrder && status && (
        <button
          className={cx(
            'flex h-14 sm:h-15 items-center gap-2.5 rounded-full px-5 text-[14px] whitespace-nowrap text-white shadow-lift backdrop-blur-[14px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 active:scale-97',
            status === 'ready'
              ? 'bg-[#182d20]/90 hover:bg-[#182d20] border border-open/40 shadow-[0_8px_24px_rgba(63,166,107,0.3)]'
              : 'bg-dock/90 hover:bg-dock border border-white/10 shadow-lift',
          )}
          onClick={() => go(`/order/${activeOrder.id}`)}
          aria-label={`Заказ № ${activeOrder.number}: ${short[status]}`}
        >
          <span
            className={cx(
              'size-2.5 rounded-full animate-pulse-dot',
              status === 'ready' ? 'bg-open shadow-[0_0_8px_#3fa66b]' : 'bg-pending shadow-[0_0_8px_#e6b450]',
            )}
            aria-hidden="true"
          />
          <span className="font-medium">
            <b className="font-bold text-white">№ {activeOrder.number}</b> {short[status]}
          </span>
        </button>
      )}
      {count > 0 && (
        <button
          className="flex h-14 sm:h-15 flex-1 wide:flex-none wide:min-w-[260px] items-center gap-3 rounded-full bg-[#3d2c55] hover:bg-[#493466] px-2.5 pr-5 text-white shadow-[0_8px_24px_rgba(61,44,85,0.45)] border border-white/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 active:scale-98 cursor-pointer"
          onClick={() => go('/cart')}
          data-cart-target="dock"
        >
          <span
            key={count}
            data-cart-badge
            className="grid size-10 sm:size-11 place-items-center rounded-full bg-[#c5c7d7] text-[#362452] font-black animate-[pop_0.4s_var(--ease-soft)_both] shadow-sm"
          >
            {count}
          </span>
          <span className="flex-1 text-left text-[15px] sm:text-[16px] font-bold tracking-tight">Корзина</span>
          <span className="text-[16px] sm:text-[17px] font-extrabold animate-pop" key={total}>
            {formatPrice(total)}
          </span>
        </button>
      )}
    </div>
  )
}
