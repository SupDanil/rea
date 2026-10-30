import { useState } from 'react'
import { formatPrice } from '../data/menu'
import { canCancel, clockTime, makingProgress, resolveLines, statusOf, useNow, type Order, type OrderStatus } from '../store'
import { ItemArt } from './ItemArt'

type Props = {
  order: Order
  onCancel: () => void
  onRate: (rating: 'good' | 'bad') => void
  onClose: () => void
}

const titles: Record<OrderStatus, string> = {
  paying: 'Проводим оплату',
  accepted: 'Приняли заказ',
  making: 'Готовим',
  ready: 'Заказ готов',
  cancelled: 'Заказ отменён',
}

// Same sub-steps Drinkit narrates while an order is being made.
const makingSteps = ['заказ в очереди', 'изучаем рецепт', 'готовим ингредиенты', 'взбиваем и смешиваем', 'последние штрихи', 'аккуратно упаковываем']

const stepIndex: Record<OrderStatus, number> = { paying: 0, accepted: 1, making: 2, ready: 3, cancelled: -1 }

export function OrderScreen({ order, onCancel, onRate, onClose }: Props) {
  const now = useNow(1000)
  const status = statusOf(order, now)
  const [confirming, setConfirming] = useState(false)
  const lines = resolveLines(order.lines)
  const step = stepIndex[status]

  const subtitle = (() => {
    switch (status) {
      case 'paying':
        return order.payment === 'card' ? 'Секунду, подтверждаем платёж' : 'Секунду, отправляем на кухню'
      case 'accepted':
        return order.pickup.kind === 'asap' ? 'Скоро начнём готовить' : `Приготовим к ${clockTime(order.readyAt)}`
      case 'making': {
        const p = makingProgress(order, now)
        const left = Math.max(1, Math.ceil((order.readyAt - now) / 60_000))
        return `${makingSteps[Math.min(makingSteps.length - 1, Math.floor(p * makingSteps.length))]} · ${p > 0.8 ? 'пара минут' : `~${left} мин`}`
      }
      case 'ready':
        return order.rating ? 'Спасибо за оценку!' : 'Заберите на стойке выдачи. Всё хорошо?'
      case 'cancelled':
        return order.payment === 'card' ? 'Деньги вернутся на карту в течение 3 дней' : 'Будем ждать вас снова'
    }
  })()

  return (
    <div className="sheet order" role="dialog" aria-modal="true" aria-label={`Заказ № ${order.number}`}>
      <header className="sheet-head">
        <button className="icon-btn icon-btn-left" onClick={onClose} aria-label="В меню">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>Заказ</h1>
      </header>

      <div className="sheet-body">
        <section className={`status-card is-${status}`} aria-live="polite">
          <div className="order-number">
            <span>№</span>
            {order.number}
          </div>
          <div className="order-name">{order.name}</div>
          <h2 className="status-title">{titles[status]}</h2>
          <p className="status-sub">{subtitle}</p>

          {status !== 'cancelled' && (
            <ol className="steps" aria-label="Этапы заказа">
              {['Принят', 'Готовим', 'Готово'].map((label, i) => (
                <li key={label} className={step > i ? 'is-done' : step === i + 1 ? 'is-current' : ''} aria-current={step === i + 1 ? 'step' : undefined}>
                  <span className="step-bar">
                    <span
                      className="step-fill"
                      style={{ transform: `scaleX(${step > i + 1 || (step === i + 1 && i !== 1) ? 1 : step === i + 1 ? makingProgress(order, now) : 0})` }}
                    />
                  </span>
                  <span className="step-label">{label}</span>
                </li>
              ))}
            </ol>
          )}

          {status === 'ready' && !order.rating && (
            <div className="rate">
              <button className="secondary-btn" onClick={() => onRate('good')}>
                👍 Да
              </button>
              <button className="secondary-btn" onClick={() => onRate('bad')}>
                👎 Нет
              </button>
            </div>
          )}
        </section>

        <section className="block">
          <h2 className="block-title">Забрать</h2>
          <div className="info-row">
            <span className="open-dot" aria-hidden="true" />
            <div>
              <div className="info-main">Покровка, 12</div>
              <div className="info-sub">
                {order.pickup.kind === 'asap' ? 'Как можно скорее' : `К ${clockTime(order.readyAt)}`} · заказ от {clockTime(order.createdAt)}
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <h2 className="block-title">Состав</h2>
          <ul className="order-lines">
            {lines.map((l) => (
              <li key={l.key}>
                <span className="order-line-art">
                  <ItemArt art={l.item.art} />
                </span>
                <span className="order-line-name">
                  {l.item.name}
                  {l.variant.size !== 'ONE' && <span className="muted"> {l.variant.size}</span>}
                  {l.ingredients.length > 0 && <span className="order-line-meta">{l.ingredients.map((i) => `+ ${i.name}`).join(', ')}</span>}
                </span>
                <span className="order-line-qty">×{l.qty}</span>
                <span className="order-line-price">{formatPrice(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary">
            {discountRows(order).map(([label, amount]) => (
              <div key={label} className="is-discount">
                <dt>{label}</dt>
                <dd>−{formatPrice(amount)}</dd>
              </div>
            ))}
            <div className="summary-total">
              <dt>
                {status === 'cancelled'
                  ? order.payment === 'card'
                    ? 'Вернём на карту'
                    : 'Не оплачен'
                  : order.payment === 'card'
                    ? 'Оплачено картой'
                    : 'К оплате при получении'}
              </dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {canCancel(order, now) && (
          <div className="cancel-zone">
            {confirming ? (
              <div className="confirm" role="alertdialog" aria-label="Отменить заказ?">
                <p className="confirm-title">Точно отменить?</p>
                <p className="hint">{order.payment === 'card' ? 'Вернём деньги на карту — обычно это 1–3 рабочих дня.' : 'Заказ не начнут готовить.'}</p>
                <div className="rate">
                  <button className="danger-btn" onClick={onCancel}>
                    Отменить
                  </button>
                  <button className="secondary-btn" onClick={() => setConfirming(false)}>
                    Не отменять
                  </button>
                </div>
              </div>
            ) : (
              <button className="text-btn danger" onClick={() => setConfirming(true)}>
                Отменить заказ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Older orders only stored a single total discount, so fall back to it. */
function discountRows(order: Order): [string, number][] {
  const rows: [string, number][] = [
    ['Напиток в подарок', order.rewardDiscount ?? 0],
    ['Скидка уровня', order.levelDiscount ?? 0],
    ['Промокод', order.promoDiscount ?? 0],
  ]
  const known = rows.filter(([, amount]) => amount > 0)
  if (known.length) return known
  return order.discount > 0 ? [['Скидка', order.discount]] : []
}
