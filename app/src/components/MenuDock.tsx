import { formatPrice } from '../data/menu'
import { statusOf, useNow, type Order } from '../store'
import { cx } from '../ui'

type Props = {
  count: number
  total: number
  activeOrder?: Order
  onOpenCart: () => void
  onOpenOrder: (order: Order) => void
}

const short = { paying: 'оплата', accepted: 'принят', making: 'готовим', ready: 'готов!', cancelled: 'отменён' } as const

/** Floating bar over the menu: the live order (if any) and the cart preview. */
export function MenuDock({ count, total, activeOrder, onOpenCart, onOpenOrder }: Props) {
  const now = useNow(2000)
  if (!count && !activeOrder) return null
  const status = activeOrder && statusOf(activeOrder, now)

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-10 mx-auto flex max-w-[480px] gap-2 px-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] *:pointer-events-auto *:animate-rise">
      {activeOrder && status && (
        <button
          className="flex h-15 items-center gap-2.5 rounded-full bg-dock px-[18px] text-[14px] whitespace-nowrap text-white shadow-lift backdrop-blur-[12px] only:ml-auto"
          onClick={() => onOpenOrder(activeOrder)}
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
          className="flex h-15 flex-1 items-center gap-3 rounded-full bg-linear-to-b from-accent-2 to-accent px-2 text-accent-ink shadow-lift"
          onClick={onOpenCart}
        >
          <span className="grid size-11 place-items-center rounded-full bg-white/18 font-extrabold">{count}</span>
          <span className="flex-1 text-left text-[16px] font-bold">Корзина</span>
          <span className="pr-3.5 text-[17px] font-extrabold animate-pop" key={total}>
            {formatPrice(total)}
          </span>
        </button>
      )}
    </div>
  )
}
