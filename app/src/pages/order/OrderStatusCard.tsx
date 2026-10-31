import { QrCodeView } from '../../components/QrCodeView'
import type { Order, OrderStatus } from '../../state/orders'
import { cx } from '../../utils/cx'
import { statusSubtitle, statusTitles } from './orderCopy'

// Clean lavender-glow card while in progress, radiant emerald once ready, calm emerald once completed, plain when cancelled.
const inProgressBg =
  'bg-surface border border-accent/20 dark:border-accent/30 shadow-card [background-image:radial-gradient(120%_85%_at_50%_0%,var(--glow),transparent_70%)]'

const readyBg =
  'bg-surface border-2 border-emerald-500/70 dark:border-emerald-400/80 shadow-[0_8px_32px_-4px_rgba(16,185,129,0.22)] dark:shadow-[0_8px_36px_-4px_rgba(52,211,153,0.32)] ring-1 ring-emerald-500/30 dark:ring-emerald-400/40 [background-image:radial-gradient(120%_90%_at_50%_0%,rgba(16,185,129,0.18)_0%,rgba(16,185,129,0.05)_55%,transparent_80%)] dark:[background-image:radial-gradient(120%_90%_at_50%_0%,rgba(16,185,129,0.32)_0%,rgba(16,185,129,0.1)_55%,transparent_85%)]'

const completedBg =
  'bg-surface border-2 border-emerald-500/50 dark:border-emerald-400/50 shadow-card [background-image:radial-gradient(120%_90%_at_50%_0%,rgba(16,185,129,0.12)_0%,transparent_70%)]'

const cancelledBg = 'bg-surface border border-line opacity-90'

const statusBg: Record<OrderStatus, string> = {
  paying: inProgressBg,
  accepted: inProgressBg,
  making: inProgressBg,
  ready: readyBg,
  completed: completedBg,
  cancelled: cancelledBg,
}

const stepIndex: Record<OrderStatus, number> = { paying: 0, accepted: 1, making: 1, ready: 2, completed: 3, cancelled: -1 }

type Props = {
  order: Order
  status: OrderStatus
  now: number
  onRate: (rating: 'good' | 'bad') => void
}

/** Big order number, live status, pickup QR and the three-step progress bar. */
export function OrderStatusCard({ order, status, now, onRate }: Props) {
  const step = stepIndex[status]
  const isReady = status === 'ready'
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'

  return (
    <section className={cx('mt-1 rounded-[28px] px-5 pt-[22px] pb-5 text-center transition-colors duration-300', statusBg[status])} aria-live="polite">
      {/* Big Order Number */}
      <div
        className={cx(
          'text-[64px] leading-none font-extrabold tracking-[-0.05em] transition-colors',
          isReady || isCompleted
            ? 'text-emerald-950 dark:text-emerald-50'
            : isCancelled
              ? 'text-faint line-through decoration-[3px]'
              : 'text-ink',
        )}
      >
        <span
          className={cx(
            'mr-1 align-[0.6em] text-[28px] font-bold transition-colors',
            isReady || isCompleted ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-muted',
          )}
        >
          №
        </span>
        {order.number}
      </div>

      {order.name && <div className="mt-1 text-[15px] font-semibold text-ink-2">{order.name}</div>}

      {/* Main Title Badge */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {isReady && (
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
          </span>
        )}
        <h1
          className={cx(
            'text-[21px] font-extrabold tracking-[-0.02em] transition-colors',
            isReady || isCompleted
              ? 'text-emerald-900 dark:text-emerald-200'
              : isCancelled
                ? 'text-muted font-bold'
                : 'text-ink',
          )}
        >
          {statusTitles[status]}
        </h1>
      </div>

      <p
        className={cx(
          'mt-1 text-[13px] transition-colors',
          isReady || isCompleted ? 'text-emerald-800/90 dark:text-emerald-300/90 font-medium' : 'text-muted',
        )}
      >
        {statusSubtitle(order, status, now)}
      </p>

      {/* 3-Step Progress Bar: Готовим -> Готов -> Выдан */}
      {!isCancelled && (
        <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Этапы заказа">
          {['Готовим', 'Готов', 'Выдан'].map((label, i) => {
            const stepNum = i + 1
            const isFinished = (i === 0 && step >= 2) || (i === 1 && step >= 3) || (i === 2 && step >= 3)
            const isCurrent = step === stepNum

            const fill = isFinished
              ? 1
              : isCurrent && i === 0
                ? Math.max(0.15, Math.min(0.95, (now - order.createdAt) / Math.max(1000, order.readyAt - order.createdAt)))
                : isCurrent
                  ? 1
                  : 0

            return (
              <li key={label} className="flex flex-col gap-1.5" aria-current={isCurrent ? 'step' : undefined}>
                <span
                  className={cx(
                    'h-2 overflow-hidden rounded-full transition-colors',
                    isReady || isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 dark:border-emerald-400/30'
                      : 'bg-surface-2 border border-line/50',
                  )}
                >
                  <span
                    className={cx(
                      'block h-full origin-left transition-transform duration-1000 ease-linear',
                      isReady || isCompleted
                        ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.55)]'
                        : isCurrent
                          ? 'bg-gradient-to-r from-accent to-accent-soft dark:from-accent-soft dark:to-accent-2 shadow-[0_0_8px_rgba(142,119,184,0.45)]'
                          : isFinished
                            ? 'bg-accent-soft dark:bg-accent-soft'
                            : 'bg-transparent',
                    )}
                    style={{ transform: `scaleX(${fill})` }}
                  />
                </span>
                <span
                  className={cx(
                    'text-[12px] font-semibold transition-colors',
                    isReady || isCompleted
                      ? isFinished || isCurrent
                        ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                        : 'text-muted'
                      : isCurrent
                        ? 'text-accent dark:text-accent-soft font-bold'
                        : isFinished
                          ? 'text-ink font-semibold'
                          : 'text-muted',
                  )}
                >
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {/* Luckin Coffee Smart Pickup QR Code once order is ready */}
      {isReady && (
        <div className="mt-5 flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20">
          <QrCodeView value={`ORD:${order.id}`} size={160} />
          <div className="text-center">
            <div className="text-[13px] font-bold text-emerald-900 dark:text-emerald-100">
              Покажите QR-код сканеру на стойке
            </div>
            <div className="text-[11.5px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Или назовите номер заказа <span className="font-extrabold text-emerald-900 dark:text-emerald-100">№ {order.number}</span>
            </div>
          </div>
        </div>
      )}

      {/* Completed state badge and rating */}
      {isCompleted && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/15 dark:bg-emerald-400/20 border border-emerald-500/25 text-emerald-900 dark:text-emerald-100 text-[14px] font-bold">
            <span>☕ Заказ выдан. Приятного кофепития!</span>
          </div>

          {!order.rating && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] text-muted mr-1">Как всё прошло?</span>
              <button
                type="button"
                onClick={() => onRate('good')}
                className="px-3 py-1.5 rounded-xl bg-surface border border-line text-[13px] font-bold hover:bg-accent/10 transition-colors cursor-pointer"
              >
                👍 Отлично
              </button>
              <button
                type="button"
                onClick={() => onRate('bad')}
                className="px-3 py-1.5 rounded-xl bg-surface border border-line text-[13px] font-bold hover:bg-danger/10 transition-colors cursor-pointer"
              >
                👎 Есть вопрос
              </button>
            </div>
          )}
          {order.rating && (
            <span className="text-[12px] text-muted">Спасибо за вашу оценку!</span>
          )}
        </div>
      )}
    </section>
  )
}
