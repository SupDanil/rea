import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useCartCatcher } from '../../hooks/useSharedArt'
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
  const catcher = useCartCatcher()
  const now = useNow(2000)
  const count = countOf(cart.lines)
  const total = subtotalOf(cart.lines)
  const activeOrder = orders.orders.find((o) => isActive(o, now))
  if (!count && !activeOrder) return null
  const status = activeOrder && statusOf(activeOrder, now)

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-10 mx-auto flex max-w-[480px] gap-2 px-2 sm:px-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] *:pointer-events-auto *:animate-rise">
      {activeOrder && status && (
        <button
          className="flex h-15 items-center gap-2.5 rounded-full bg-dock px-[18px] text-[14px] whitespace-nowrap text-white shadow-lift backdrop-blur-[12px] only:ml-auto"
          onClick={() => go(`/order/${activeOrder.id}`)}
          aria-label={`Заказ № ${activeOrder.number}: ${short[status]}`}
        >
          <span className={cx('size-2.5 rounded-full animate-pulse-dot', status === 'ready' ? 'bg-open' : 'bg-pending')} aria-hidden="true" />
          <span>
            <b>№ {activeOrder.number}</b> {short[status]}
          </span>
        </button>
      )}
      {count > 0 && (
        <button
          className="flex h-15 flex-1 items-center gap-3 rounded-full bg-[#3d2c55] hover:bg-[#322347] px-2.5 text-white shadow-[0_8px_24px_rgba(61,44,85,0.4)] border border-white/10 transition-[transform,background-color] duration-150 active:scale-98"
          onClick={() => go('/cart')}
          data-cart-target="dock"
        >
          <span
            key={count}
            data-cart-badge
            className="grid size-10 sm:size-11 place-items-center rounded-full bg-[#c5c7d7] text-[#362452] font-black animate-[pop_0.45s_var(--ease-soft)_0.25s_both] shadow-sm"
            style={catcher}
          >
            {count}
          </span>
          <span className="flex-1 text-left text-[16px] font-bold tracking-tight">Корзина</span>
          <span className="pr-3.5 text-[17px] font-extrabold animate-pop" key={total}>
            {formatPrice(total)}
          </span>
        </button>
      )}
    </div>
  )
}
