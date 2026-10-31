import { block, blockTitle, btn, hint, panel } from '../../components/ui'
import { useNow } from '../../hooks/useNow'
import { useCatalog } from '../../queries/useCatalog'
import { resolveLines } from '../../state/cart'
import { statusOf, type Order, type OrderStatus } from '../../state/orders'
import { cx } from '../../utils/cx'
import { dateTime, formatPrice } from '../../utils/format'

const statusText: Record<OrderStatus, string> = {
  paying: 'Оплата',
  accepted: 'Принят',
  making: 'Готовится',
  ready: 'Готов',
  completed: 'Выдан',
  cancelled: 'Отменён',
}
const statusColor: Record<OrderStatus, string> = {
  paying: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30',
  accepted: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30',
  making: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30',
  ready: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-400/35',
  completed: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-400/35',
  cancelled: 'text-danger bg-danger/10 border border-danger/25',
}

type Props = { orders: Order[]; onOpen: (order: Order) => void; onRepeat: (order: Order) => void }

export function OrderHistory({ orders, onOpen, onRepeat }: Props) {
  const now = useNow(5000)
  const catalog = useCatalog()
  return (
    <section className={block}>
      <h2 className={blockTitle}>История заказов</h2>
      {orders.length === 0 ? (
        <p className={hint()}>Здесь появятся ваши заказы</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => {
            const lines = resolveLines(o.lines, catalog)
            const status = statusOf(o, now)
            return (
              <li key={o.id} className={cx('flex items-center gap-2.5 rounded-[20px] py-3 pr-3 pl-4', panel)}>
                <button className="flex min-w-0 flex-1 flex-col gap-[3px] text-left" onClick={() => onOpen(o)}>
                  <span className="flex items-center gap-2 text-[15px]">
                    <b>№ {o.number}</b>
                    <span className={cx('rounded-full px-2.5 py-[3px] text-[11px] font-bold transition-colors', statusColor[status])}>{statusText[status]}</span>
                  </span>
                  <span className="truncate text-[13px] text-ink-2">{lines.map((l) => (l.qty > 1 ? `${l.item.name} ×${l.qty}` : l.item.name)).join(', ')}</span>
                  <span className="text-[12px] text-muted">
                    {dateTime(o.createdAt)} · {formatPrice(o.total)}
                  </span>
                </button>
                {lines.length > 0 && (
                  <button className={btn('secondary', 'sm')} onClick={() => onRepeat(o)}>
                    Повторить
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
