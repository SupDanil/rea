import { useState } from 'react'
import { useParams } from 'react-router'
import { ConfirmBox } from '../../components/ConfirmBox'
import { EmptyState } from '../../components/EmptyState'
import { Sheet, SheetBody } from '../../components/Sheet'
import { block, blockTitle, openDot, panel, textBtn } from '../../components/ui'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useApp } from '../../state/AppContext'
import { canCancel, statusOf, type Order } from '../../state/orders'
import { cx } from '../../utils/cx'
import { clockTime } from '../../utils/format'
import { OrderLines } from './OrderLines'
import { OrderStatusCard } from './OrderStatusCard'

export function OrderPage() {
  const { id } = useParams()
  const { orders } = useApp()
  const { back } = useAppNavigate()
  const order = orders.orders.find((o) => o.id === id)

  if (!order) {
    return (
      <Sheet label="Заказ не найден" onBack={back} backLabel="В меню">
        <EmptyState title="Заказ не найден" text="Возможно, он был сделан на другом устройстве" actionLabel="В меню" onAction={back} />
      </Sheet>
    )
  }
  return <OrderView key={order.id} order={order} />
}

function OrderView({ order }: { order: Order }) {
  const { orders } = useApp()
  const { back } = useAppNavigate()
  const now = useNow(1000)
  const status = statusOf(order, now)
  const [confirming, setConfirming] = useState(false)

  return (
    <Sheet label={`Заказ № ${order.number}`} title="Заказ" onBack={back} backLabel="В меню">
      <SheetBody>
        <OrderStatusCard order={order} status={status} now={now} onRate={(rating) => orders.update(order.id, { rating })} />

        <section className={block}>
          <h2 className={blockTitle}>Забрать</h2>
          <div className={cx('flex items-center gap-3 rounded-[18px] px-4 py-3.5', panel)}>
            <span className={openDot} aria-hidden="true" />
            <div>
              <div className="text-[15px] font-semibold">Покровка, 12</div>
              <div className="mt-0.5 text-[12px] text-muted">
                {order.pickup.kind === 'asap' ? 'Как можно скорее' : `К ${clockTime(order.readyAt)}`} · заказ от {clockTime(order.createdAt)}
              </div>
            </div>
          </div>
        </section>

        <OrderLines order={order} status={status} />

        {canCancel(order, now) && (
          <div className="mt-[22px] text-center">
            {confirming ? (
              <ConfirmBox
                title="Точно отменить?"
                text={order.payment === 'card' ? 'Вернём деньги на карту — обычно это 1–3 рабочих дня.' : 'Заказ не начнут готовить.'}
                confirmLabel="Отменить"
                cancelLabel="Не отменять"
                onConfirm={() => orders.update(order.id, { cancelledAt: Date.now() })}
                onCancel={() => setConfirming(false)}
              />
            ) : (
              <button className={textBtn(true)} onClick={() => setConfirming(true)}>
                Отменить заказ
              </button>
            )}
          </div>
        )}
      </SheetBody>
    </Sheet>
  )
}
