import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { api } from '../../api'
import { Button } from '../../components/Button'
import { ConfirmBox } from '../../components/ConfirmBox'
import { EmptyState } from '../../components/EmptyState'
import { Sheet, SheetBody } from '../../components/Sheet'
import { Surface } from '../../components/Surface'
import { block, blockTitle, openDot, textBtn } from '../../components/ui'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useShop } from '../../queries/useShop'
import { useApp } from '../../state/AppContext'
import type { Profile } from '../../state/loyalty'
import { canCancel, type Order,statusOf } from '../../state/orders'
import { cx } from '../../utils/cx'
import { clockTime } from '../../utils/format'
import { LoginPage } from '../login/LoginPage'
import { OrderLines } from './OrderLines'
import { OrderNotificationPrompt } from './OrderNotificationPrompt'
import { OrderStatusCard } from './OrderStatusCard'

export function OrderPage() {
  const { profile, isAuthLoading } = useApp()
  if (isAuthLoading) {
    return <OrderLoadingSkeleton />
  }
  return profile ? <OrderPageView profile={profile} /> : <LoginPage />
}

function OrderLoadingSkeleton() {
  const { back } = useAppNavigate()
  return (
    <Sheet label="Заказ" title="Заказ" onBack={back} backLabel="Назад">
      <SheetBody>
        <div className="space-y-4 pt-1" role="status" aria-label="Загружаем заказ">
          <div className="h-32 rounded-card bg-surface-2 animate-pulse" />
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-media bg-surface-2 animate-pulse" />
            ))}
          </div>
        </div>
      </SheetBody>
    </Sheet>
  )
}

function OrderPageView({ profile }: { profile: Profile }) {
  const { id } = useParams()
  const { orders } = useApp()
  const { back } = useAppNavigate()
  // Result of asking the server for this id; anything not for the current id means "still loading".
  const [lookup, setLookup] = useState<{ id: string; result: 'missing' | 'error' } | null>(null)
  const order = orders.orders.find((o) => o.id === id)
  const { upsert } = orders

  // Opened by link or before the list arrived: ask the server for this one order.
  useEffect(() => {
    if (order || !id) return
    let cancelled = false
    api
      .getOrder(id)
      .then((remote) => {
        if (cancelled) return
        if (remote) upsert(remote)
        else setLookup({ id, result: 'missing' })
      })
      .catch(() => !cancelled && setLookup({ id, result: 'error' }))
    return () => {
      cancelled = true
    }
  }, [id, order, upsert])

  const failed = lookup && lookup.id === id ? lookup.result : null

  if (!order) {
    if (!failed) {
      return (
        <Sheet label="Заказ" onBack={back} backLabel="В меню">
          <div className="p-8 text-center text-muted" role="status">
            Загружаем заказ…
          </div>
        </Sheet>
      )
    }
    return (
      <Sheet label="Заказ не найден" onBack={back} backLabel="В меню">
        {failed === 'error' ? (
          <EmptyState title="Не удалось загрузить заказ" text="Проверьте интернет и откройте заказ ещё раз" actionLabel="В меню" onAction={back} />
        ) : (
          <EmptyState title="Заказ не найден" text="Возможно, он был сделан на другом устройстве" actionLabel="В меню" onAction={back} />
        )}
      </Sheet>
    )
  }
  if (order.phone && order.phone !== profile.phone) {
    return (
      <Sheet label="Заказ не найден" onBack={back} backLabel="В меню">
        <EmptyState title="Заказ не найден" text="Этот заказ был сделан другим пользователем" actionLabel="В меню" onAction={back} />
      </Sheet>
    )
  }
  return <OrderView key={order.id} order={order} />
}

const POLL_MS = 3000

function OrderView({ order }: { order: Order }) {
  const { orders, showToast } = useApp()
  const { back } = useAppNavigate()
  const now = useNow(1000)
  const status = statusOf(order, now)
  const [confirming, setConfirming] = useState(false)
  const { merge, update } = orders
  const shop = useShop(order.shopId)
  const finished = status === 'cancelled' || !!order.rating

  // Live status from the barista's KDS: SSE push, with polling if the stream is unavailable.
  useEffect(() => {
    if (finished) return
    let active = true
    let poll: number | undefined
    const startPolling = () => {
      if (poll !== undefined) return
      poll = window.setInterval(async () => {
        try {
          const remote = await api.getOrder(order.id)
          if (active && remote) merge(order.id, remote)
        } catch {
          // Try again on the next tick.
        }
      }, POLL_MS)
    }

    let es: EventSource | null = null
    if (typeof EventSource !== 'undefined') {
      es = new EventSource(api.orderEventsUrl(order.id))
      es.onmessage = (event) => {
        if (!active) return
        try {
          const data = JSON.parse(event.data) as Partial<Order>
          if (data?.status) merge(order.id, data)
        } catch {
          // Ignore a malformed frame.
        }
      }
      es.onerror = startPolling
    } else {
      startPolling()
    }

    return () => {
      active = false
      if (poll !== undefined) window.clearInterval(poll)
      es?.close()
    }
  }, [order.id, finished, merge])

  const act = (patch: Parameters<typeof update>[1], failText: string) => {
    update(order.id, patch).catch(() => showToast({ text: failText }))
  }

  return (
    <Sheet label={`Заказ № ${order.number}`} title="Заказ" onBack={back} backLabel="В меню">
      {/* Fixed top status card: does not scroll with the lines below */}
      <div className="flex-none px-3 sm:px-6 pb-2">
        <OrderStatusCard
          order={order}
          status={status}
          now={now}
          onRate={(rating) => act({ rating }, 'Не удалось отправить оценку')}
        />
      </div>

      {/* Scrollable details: only content beneath the card scrolls */}
      <SheetBody className="pt-1">
        <div className="mb-4">
          <OrderNotificationPrompt orderId={order.id} status={status} />
        </div>
        <section className={block}>
          <h2 className={blockTitle}>Забрать</h2>
          <Surface className={cx('flex items-center gap-3 rounded-media px-4 py-3.5')}>
            <span className={openDot} aria-hidden="true" />
            <div>
              <div className="text-control font-semibold">{shop ? `${shop.name} · ${shop.address}` : 'shit кофе'}</div>
              <div className="mt-0.5 text-caption text-muted">
                {order.pickup.kind === 'asap' ? 'Как можно скорее' : `К ${clockTime(order.readyAt)}`} · заказ от {clockTime(order.createdAt)}
              </div>
            </div>
          </Surface>
        </section>

        <OrderLines order={order} status={status} />

        {canCancel(order, now) && (
          <div className="mt-5.5 text-center">
            {confirming ? (
              <ConfirmBox
                title="Точно отменить?"
                text={order.payment === 'card' ? 'Вернём деньги на карту — обычно это 1–3 рабочих дня.' : 'Заказ не начнут готовить.'}
                confirmLabel="Отменить"
                cancelLabel="Не отменять"
                onConfirm={() => {
                  setConfirming(false)
                  act({ cancelledAt: Date.now() }, 'Заказ уже готовят — отменить не получилось')
                }}
                onCancel={() => setConfirming(false)}
              />
            ) : (
              <Button className={textBtn(true)} onClick={() => setConfirming(true)}>
                Отменить заказ
              </Button>
            )}
          </div>
        )}
      </SheetBody>
    </Sheet>
  )
}
