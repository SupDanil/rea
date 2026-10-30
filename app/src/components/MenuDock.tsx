import { formatPrice } from '../data/menu'
import { statusOf, useNow, type Order } from '../store'

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
    <div className="menu-dock">
      {activeOrder && status && (
        <button className={`order-pill is-${status}`} onClick={() => onOpenOrder(activeOrder)} aria-label={`Заказ № ${activeOrder.number}: ${short[status]}`}>
          <span className="order-pill-dot" aria-hidden="true" />
          <span className="order-pill-text">
            <b>№ {activeOrder.number}</b> {short[status]}
          </span>
        </button>
      )}
      {count > 0 && (
        <button className="cart-bar" onClick={onOpenCart}>
          <span className="cart-bar-count">{count}</span>
          <span className="cart-bar-label">Корзина</span>
          <span className="cart-bar-total" key={total}>
            {formatPrice(total)}
          </span>
        </button>
      )}
    </div>
  )
}
