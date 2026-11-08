import { useState } from 'react'

import { Button } from '../../components/Button'
import { ChevronDownIcon } from '../../components/icons'
import { Surface } from '../../components/Surface'
import { block, blockTitle, hint } from '../../components/ui'
import { useNow } from '../../hooks/useNow'
import { useCatalog } from '../../queries/useCatalog'
import { resolveLines } from '../../state/cart'
import { type Order, type OrderStatus, statusOf } from '../../state/orders'
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
  paying: 'text-pending dark:text-pending bg-pending/15 border-(length:--stroke-width) border-pending/30',
  accepted: 'text-pending dark:text-pending bg-pending/15 border-(length:--stroke-width) border-pending/30',
  making: 'text-pending dark:text-pending bg-pending/15 border-(length:--stroke-width) border-pending/30',
  ready: 'text-open dark:text-open bg-open/15 border-(length:--stroke-width) border-open/30 dark:border-open/35',
  completed: 'text-open dark:text-open bg-open/15 border-(length:--stroke-width) border-open/30 dark:border-open/35',
  cancelled: 'text-danger bg-danger/10 border-(length:--stroke-width) border-danger/25',
}

const INITIAL_VISIBLE = 3

type Props = { orders: Order[]; onOpen: (order: Order) => void; onRepeat: (order: Order) => void }

export function OrderHistory({ orders, onOpen, onRepeat }: Props) {
  const [showAll, setShowAll] = useState(false)
  const now = useNow(5000)
  const catalog = useCatalog()

  const visibleOrders = showAll ? orders : orders.slice(0, INITIAL_VISIBLE)
  const hasMore = orders.length > INITIAL_VISIBLE

  return (
    <section className={block} aria-label="История заказов">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h2 className={blockTitle}>История заказов</h2>
        {orders.length > 0 && (
          <span className="text-caption text-muted font-medium">
            {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
          </span>
        )}
      </div>
      {orders.length === 0 ? (
        <p className={hint()}>Здесь появятся ваши заказы</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visibleOrders.map((o) => {
              const lines = resolveLines(o.lines, catalog)
              const status = statusOf(o, now)
              return (
                <Surface
                  as="li"
                  key={o.id}
                  className={cx(
                    'flex items-center gap-3 rounded-card py-3 pr-3 pl-4 w-full min-w-0 overflow-hidden',
                  )}
                >
                  <Button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col gap-1 text-left cursor-pointer"
                    onClick={() => onOpen(o)}
                  >
                    <div className="flex items-center gap-2 flex-wrap text-control font-display">
                      <b>№ {o.number}</b>
                      <span
                        className={cx(
                          'rounded-pill px-2.5 py-0.75 text-micro font-bold transition-colors',
                          statusColor[status],
                        )}
                      >
                        {statusText[status]}
                      </span>
                      <span className="text-caption text-muted ml-auto sm:ml-0 font-sans">
                        {dateTime(o.createdAt)}
                      </span>
                    </div>
                    <span className="text-compact leading-snug text-ink-2 break-words">
                      {lines
                        .map((l) => {
                          const sizeBadge = l.variant && l.variant.size !== 'ONE' ? ` (${l.variant.size})` : ''
                          return l.qty > 1 ? `${l.item.name}${sizeBadge} ×${l.qty}` : `${l.item.name}${sizeBadge}`
                        })
                        .join(', ')}
                    </span>
                    <span className="text-caption font-semibold text-ink">
                      {formatPrice(o.total)}
                    </span>
                  </Button>
                  {lines.length > 0 && (
                    <Button
                      type="button"
                      className="shrink-0 self-center"
                      variant="secondary"
                      size="sm"
                      onClick={() => onRepeat(o)}
                    >
                      Повторить
                    </Button>
                  )}
                </Surface>
              )
            })}
          </ul>

          {hasMore && (
            <div className="mt-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-control font-medium"
                onClick={() => setShowAll((prev) => !prev)}
              >
                <span>{showAll ? 'Свернуть' : `Показать ещё (всего ${orders.length})`}</span>
                <ChevronDownIcon className={cx('size-3 transition-transform', showAll && 'rotate-180')} />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
