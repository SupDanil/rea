import { btn, buttonRow } from '../../components/ui'
import { makingProgress, type Order, type OrderStatus } from '../../state/orders'
import { cx } from '../../utils/cx'
import { statusSubtitle, statusTitles } from './orderCopy'

// Clean lavender-glow card while in progress, fresh green once ready, plain when cancelled.
const inProgressBg =
  'bg-surface border border-line [background-image:radial-gradient(120%_85%_at_50%_0%,var(--glow),transparent_65%)]'
const statusBg: Record<OrderStatus, string> = {
  paying: inProgressBg,
  accepted: inProgressBg,
  making: inProgressBg,
  ready:
    'bg-surface border border-[#3fa66b]/35 [background-image:radial-gradient(120%_85%_at_50%_0%,rgba(63,166,107,0.2),transparent_65%)]',
  cancelled: 'bg-surface border border-line',
}
const stepIndex: Record<OrderStatus, number> = { paying: 0, accepted: 1, making: 2, ready: 3, cancelled: -1 }

type Props = { order: Order; status: OrderStatus; now: number; onRate: (rating: 'good' | 'bad') => void }

/** Big order number, live status and the three-step progress bar. */
export function OrderStatusCard({ order, status, now, onRate }: Props) {
  const step = stepIndex[status]
  return (
    <section className={cx('mt-1 rounded-[28px] px-5 pt-[22px] pb-5 text-center shadow-card', statusBg[status])} aria-live="polite">
      <div className={cx('text-[64px] leading-none font-extrabold tracking-[-0.05em] text-ink', status === 'cancelled' && 'text-faint line-through decoration-[3px]')}>
        <span className="mr-1 align-[0.6em] text-[28px] font-bold text-muted">№</span>
        {order.number}
      </div>
      <div className="mt-1 text-[15px] font-semibold text-ink-2">{order.name}</div>
      <h2 className="mt-[18px] text-[24px] font-bold text-ink">{statusTitles[status]}</h2>
      <p className={cx('mt-1.5 min-h-5 text-[14px] text-muted', status === 'making' && 'first-letter:uppercase')}>{statusSubtitle(order, status, now)}</p>

      {status !== 'cancelled' && (
        <ol className="mt-5 grid grid-cols-3 gap-1.5" aria-label="Этапы заказа">
          {['Принят', 'Готовим', 'Готово'].map((label, i) => {
            // "Готовим" fills with real progress; the other steps fill at once.
            const fill = step > i + 1 || (step === i + 1 && i !== 1) ? 1 : step === i + 1 ? makingProgress(order, now) : 0
            return (
              <li key={label} className="flex flex-col gap-1.5" aria-current={step === i + 1 ? 'step' : undefined}>
                <span className="h-1.5 overflow-hidden rounded-[3px] bg-surface-2 border border-line/40">
                  <span className="block h-full origin-left bg-accent-soft transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${fill})` }} />
                </span>
                <span className={cx('text-[12px] font-semibold', step >= i + 1 ? 'text-ink' : 'text-muted')}>{label}</span>
              </li>
            )
          })}
        </ol>
      )}

      {status === 'ready' && !order.rating && (
        <div className={cx(buttonRow, 'mt-[18px]')}>
          <button className={cx(btn('secondary'), 'bg-surface-2 hover:bg-surface-2/80 border border-line')} onClick={() => onRate('good')}>
            👍 Да
          </button>
          <button className={cx(btn('secondary'), 'bg-surface-2 hover:bg-surface-2/80 border border-line')} onClick={() => onRate('bad')}>
            👎 Нет
          </button>
        </div>
      )}
    </section>
  )
}
