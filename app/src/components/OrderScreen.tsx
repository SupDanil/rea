import { useState } from 'react'
import { formatPrice } from '../data/menu'
import { canCancel, clockTime, makingProgress, resolveLines, statusOf, useNow, type Order, type OrderStatus } from '../store'
import {
  block,
  blockTitle,
  btn,
  buttonRow,
  confirmBox,
  confirmTitle,
  cx,
  hint,
  iconBtn,
  openDot,
  panel,
  sheet,
  sheetBody,
  sheetHead,
  sheetTitle,
  summary,
  summaryDiscount,
  summaryRow,
  summaryTotal,
  textBtn,
} from '../ui'
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

// Accent-tinted card while in progress, green once ready, plain when cancelled.
const inProgressBg = '[background:radial-gradient(120%_80%_at_50%_0%,var(--glow),transparent_60%),color-mix(in_oklab,var(--accent)_16%,var(--surface))]'
const statusBg: Record<OrderStatus, string> = {
  paying: inProgressBg,
  accepted: inProgressBg,
  making: inProgressBg,
  ready: '[background:radial-gradient(120%_80%_at_50%_0%,var(--glow),transparent_60%),color-mix(in_oklab,#3fa66b_26%,var(--surface))]',
  cancelled: 'bg-surface',
}

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
    <div className={sheet} role="dialog" aria-modal="true" aria-label={`Заказ № ${order.number}`}>
      <header className={sheetHead}>
        <button className={iconBtn('left')} onClick={onClose} aria-label="В меню">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={sheetTitle}>Заказ</h1>
      </header>

      <div className={sheetBody}>
        <section className={cx('mt-1 rounded-[28px] px-5 pt-[22px] pb-5 text-center shadow-card', statusBg[status])} aria-live="polite">
          <div className={cx('text-[64px] leading-none font-extrabold tracking-[-0.05em]', status === 'cancelled' && 'text-faint line-through decoration-[3px]')}>
            <span className="mr-1 align-[0.6em] text-[28px] font-bold text-muted">№</span>
            {order.number}
          </div>
          <div className="mt-1 text-[15px] font-semibold text-ink-2">{order.name}</div>
          <h2 className="mt-[18px] text-[24px]">{titles[status]}</h2>
          <p className={cx('mt-1.5 min-h-5 text-[14px] text-ink-2', status === 'making' && 'first-letter:uppercase')}>{subtitle}</p>

          {status !== 'cancelled' && (
            <ol className="mt-5 grid grid-cols-3 gap-1.5" aria-label="Этапы заказа">
              {['Принят', 'Готовим', 'Готово'].map((label, i) => (
                <li key={label} className="flex flex-col gap-1.5" aria-current={step === i + 1 ? 'step' : undefined}>
                  <span className="h-1.5 overflow-hidden rounded-[3px] bg-line">
                    <span
                      className="block h-full origin-left bg-accent-soft transition-transform duration-1000 ease-linear"
                      style={{ transform: `scaleX(${step > i + 1 || (step === i + 1 && i !== 1) ? 1 : step === i + 1 ? makingProgress(order, now) : 0})` }}
                    />
                  </span>
                  <span className={cx('text-[12px] font-semibold', step >= i + 1 ? 'text-ink' : 'text-muted')}>{label}</span>
                </li>
              ))}
            </ol>
          )}

          {status === 'ready' && !order.rating && (
            <div className={cx(buttonRow, 'mt-[18px]')}>
              <button className={btn('secondary')} onClick={() => onRate('good')}>
                👍 Да
              </button>
              <button className={btn('secondary')} onClick={() => onRate('bad')}>
                👎 Нет
              </button>
            </div>
          )}
        </section>

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

        <section className={block}>
          <h2 className={blockTitle}>Состав</h2>
          <ul className={cx('divide-y divide-line rounded-[20px] px-3 py-1.5', panel)}>
            {lines.map((l) => (
              <li key={l.key} className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-2.5 py-2 text-[14px]">
                <span>
                  <ItemArt art={l.item.art} className="block h-11 w-10" />
                </span>
                <span className="font-semibold">
                  {l.item.name}
                  {l.variant.size !== 'ONE' && <span className="font-medium text-muted"> {l.variant.size}</span>}
                  {l.ingredients.length > 0 && <span className="mt-0.5 block text-[12px] font-medium text-muted">{l.ingredients.map((i) => `+ ${i.name}`).join(', ')}</span>}
                </span>
                <span className="text-muted">×{l.qty}</span>
                <span className="font-bold">{formatPrice(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className={summary}>
            {discountRows(order).map(([label, amount]) => (
              <div key={label} className={summaryRow}>
                <dt>{label}</dt>
                <dd className={summaryDiscount}>−{formatPrice(amount)}</dd>
              </div>
            ))}
            <div className={summaryTotal}>
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
          <div className="mt-[22px] text-center">
            {confirming ? (
              <div className={confirmBox} role="alertdialog" aria-label="Отменить заказ?">
                <p className={confirmTitle}>Точно отменить?</p>
                <p className={hint()}>{order.payment === 'card' ? 'Вернём деньги на карту — обычно это 1–3 рабочих дня.' : 'Заказ не начнут готовить.'}</p>
                <div className={cx(buttonRow, 'mt-3.5')}>
                  <button className={btn('danger')} onClick={onCancel}>
                    Отменить
                  </button>
                  <button className={btn('secondary')} onClick={() => setConfirming(false)}>
                    Не отменять
                  </button>
                </div>
              </div>
            ) : (
              <button className={textBtn(true)} onClick={() => setConfirming(true)}>
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
