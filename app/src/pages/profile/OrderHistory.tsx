import { block, blockTitle, btn, hint, panel } from '../../components/ui'
import { useNow } from '../../hooks/useNow'
import { resolveLines } from '../../state/cart'
import { statusOf, type Order } from '../../state/orders'
import { cx } from '../../utils/cx'
import { dateTime, formatPrice } from '../../utils/format'

const statusText = { paying: 'Оплата', accepted: 'Принят', making: 'Готовится', ready: 'Выдан', cancelled: 'Отменён' } as const
const statusColor = {
  paying: 'text-[#b8862c]',
  accepted: 'text-[#b8862c]',
  making: 'text-[#b8862c]',
  ready: 'text-[#3f9a64]',
  cancelled: 'text-danger',
} as const

type Props = { orders: Order[]; onOpen: (order: Order) => void; onRepeat: (order: Order) => void }

export function OrderHistory({ orders, onOpen, onRepeat }: Props) {
  const now = useNow(5000)
  return (
    <section className={block}>
      <h2 className={blockTitle}>История заказов</h2>
      {orders.length === 0 ? (
        <p className={hint()}>Здесь появятся ваши заказы</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => {
            const lines = resolveLines(o.lines)
            const status = statusOf(o, now)
            return (
              <li key={o.id} className={cx('flex items-center gap-2.5 rounded-[20px] py-3 pr-3 pl-4', panel)}>
                <button className="flex min-w-0 flex-1 flex-col gap-[3px] text-left" onClick={() => onOpen(o)}>
                  <span className="flex items-center gap-2 text-[15px]">
                    <b>№ {o.number}</b>
                    <span className={cx('rounded-full bg-surface-2 px-2 py-[3px] text-[11px] font-bold', statusColor[status])}>{statusText[status]}</span>
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
