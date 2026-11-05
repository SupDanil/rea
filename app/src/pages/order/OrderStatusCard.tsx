import { useEffect, useState } from 'react'

import { QrCodeView } from '../../components/QrCodeView'
import type { Order, OrderStatus } from '../../state/orders'
import { cx } from '../../utils/cx'
import { statusSubtitle, statusTitles } from './orderCopy'

const inProgressBg =
  'bg-surface/90 border border-line shadow-card [background-image:radial-gradient(120%_85%_at_50%_0%,var(--glow),transparent_70%)]'

const readyBg =
  'bg-surface/95 border-2 border-open/70 shadow-[0_8px_32px_-4px_rgba(45,158,94,0.3)] dark:shadow-[0_8px_36px_-4px_rgba(63,191,127,0.35)] ring-1 ring-open/40 ready-glow [background-image:radial-gradient(120%_90%_at_50%_0%,rgba(45,158,94,0.2)_0%,rgba(45,158,94,0.05)_55%,transparent_80%)]'

const completedBg =
  'bg-surface/90 border-2 border-open/40 shadow-card [background-image:radial-gradient(120%_90%_at_50%_0%,rgba(45,158,94,0.12)_0%,transparent_70%)]'

const cancelledBg = 'bg-surface/70 border border-line opacity-85'

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

/**
 * Ready orders keep an unobstructed QR beside the order identity, with a larger
 * view for scanning. Other states show the progress track.
 */
export function OrderStatusCard({ order, status, now, onRate }: Props) {
  const [zoomQr, setZoomQr] = useState(false)
  const step = stepIndex[status]
  const isReady = status === 'ready'
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'

  useEffect(() => {
    if (isReady && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.([40, 70, 40])
      } catch {}
    }
  }, [isReady])

  // Ready State: Compact horizontal layout to leave maximum room for scrolling below
  if (isReady) {
    return (
      <>
        <section
          className={cx(
            'mt-1 rounded-[26px] p-3.5 xs:p-4 transition-all duration-300',
            readyBg,
          )}
          aria-live="polite"
        >
          <div className="flex items-center gap-3 xs:gap-3.5 max-[380px]:flex-col-reverse max-[380px]:gap-4">
            {/* Left: Compact QR Code Platter with tap to expand */}
            <div className="shrink-0 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setZoomQr(true)}
                className="cursor-pointer rounded-[16px] overflow-hidden bg-white shadow-sm ring-1 ring-black/10 hover:ring-open/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-open"
                title="Нажмите, чтобы увеличить QR-код"
                aria-label="Увеличить QR-код"
              >
                <QrCodeView
                  value={`ORD:${order.id}`}
                  size={160}
                />
              </button>
              <span className="mt-2 text-[11px] font-medium text-open select-none">
                Нажмите для увеличения
              </span>
            </div>

            {/* Right: Order Identity & Status */}
            <div className="flex-1 min-w-0 flex flex-col justify-center max-[380px]:w-full max-[380px]:items-center max-[380px]:text-center">
              {/* Top row: Number and name */}
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-display text-[18px] font-bold text-open/80">№</span>
                <span className="font-display text-[38px] xs:text-[42px] leading-none font-black tracking-tight text-open">
                  {order.number}
                </span>
                {order.name && (
                  <span className="ml-1 text-[13.5px] font-bold text-ink-2 truncate max-w-full">
                    · {order.name}
                  </span>
                )}
              </div>

              {/* Ready Status badge with pulsating dot */}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="relative flex size-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-open opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-open" />
                </span>
                <h1 className="font-display text-[16px] xs:text-[17px] font-extrabold tracking-tight text-open leading-none">
                  {statusTitles[status]}
                </h1>
              </div>

              <p className="mt-1 text-[12px] text-open/90 font-medium leading-tight">
                {statusSubtitle(order, status, now)}
              </p>

              {/* Counter scanner instructions */}
              <div className="mt-2 text-[11px] text-muted leading-tight">
                <span>Покажите QR-код сканеру на стойке</span>
                <span className="block mt-0.5 text-[10.5px] text-faint">
                  или назовите номер заказа
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Zoom QR Modal */}
        {zoomQr && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-[fade-only_0.2s_ease_both]"
            onClick={() => setZoomQr(false)}
            role="dialog"
            aria-label="Увеличенный QR-код"
          >
            <div
              className="flex flex-col items-center p-5 sm:p-6 rounded-[28px] bg-surface text-ink shadow-lift max-w-[360px] w-full max-h-[calc(100dvh-32px)] overflow-y-auto text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-display text-[26px] font-black text-open mb-0.5">
                № {order.number}
              </div>
              <div className="text-[13px] font-bold text-ink-2 mb-3.5">
                {order.name ? `${order.name} · ` : ''}Покажите сканеру
              </div>
              <div className="w-full max-w-[280px] shrink-0 overflow-hidden rounded-[16px] bg-white">
                <QrCodeView value={`ORD:${order.id}`} size={280} />
              </div>
              <button
                type="button"
                onClick={() => setZoomQr(false)}
                className="mt-5 w-full h-11 rounded-full bg-surface-2 hover:bg-surface-3 text-[14px] font-bold text-ink transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <section className={cx('mt-1 rounded-[26px] p-4 sm:p-5 text-center transition-all duration-300', statusBg[status])} aria-live="polite">
      {/* Big Unbounded Order Number */}
      <div
        className={cx(
          'font-display text-[52px] sm:text-[60px] leading-none font-black tracking-tight transition-colors',
          isCompleted
            ? 'text-open'
            : isCancelled
              ? 'text-faint line-through decoration-[3px]'
              : 'text-ink',
        )}
      >
        <span
          className={cx(
            'mr-1 align-[0.55em] font-display text-[22px] sm:text-[26px] font-bold transition-colors',
            isCompleted ? 'text-open/80' : 'text-muted',
          )}
        >
          №
        </span>
        {order.number}
      </div>

      {order.name && (
        <div className="mt-1 font-display text-[14px] font-bold text-ink-2">
          {order.name}
        </div>
      )}

      {/* Main Title Badge */}
      <div className="mt-2.5 flex items-center justify-center gap-2">
        <h1
          className={cx(
            'font-display text-[20px] font-extrabold tracking-tight transition-colors',
            isCompleted
              ? 'text-open'
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
          'mt-1 text-[13px] leading-relaxed transition-colors',
          isCompleted ? 'text-open/90 font-medium' : 'text-muted',
        )}
      >
        {statusSubtitle(order, status, now)}
      </p>

      {/* 3-Step Progress Bar: Готовим -> Готов -> Выдан */}
      {!isCancelled && (
        <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Этапы заказа">
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
                    isCompleted
                      ? 'bg-open/20 border border-open/30'
                      : 'bg-surface-2 border border-line/60',
                  )}
                >
                  <span
                    className={cx(
                      'block h-full origin-left transition-transform duration-1000 ease-linear',
                      isCompleted
                        ? 'bg-open shadow-[0_0_10px_rgba(45,158,94,0.6)]'
                        : isCurrent
                          ? 'bg-accent shadow-[0_0_8px_rgba(196,91,36,0.5)]'
                          : isFinished
                            ? 'bg-accent/80'
                            : 'bg-transparent',
                    )}
                    style={{ transform: `scaleX(${fill})` }}
                  />
                </span>
                <span
                  className={cx(
                    'text-[12px] font-semibold transition-colors',
                    isCompleted
                      ? isFinished || isCurrent
                        ? 'text-open font-extrabold'
                        : 'text-muted'
                      : isCurrent
                        ? 'text-accent font-bold'
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

      {/* Completed state badge and rating */}
      {isCompleted && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-open/15 border border-open/25 text-open text-[14px] font-bold">
            <span>☕ Заказ выдан. Приятного кофепития!</span>
          </div>

          {!order.rating && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[13px] text-muted mr-1">Как всё прошло?</span>
              <button
                type="button"
                onClick={() => onRate('good')}
                className="px-3.5 py-1.5 rounded-xl bg-surface border border-line text-[13px] font-bold hover:bg-accent/10 active:scale-95 transition-all cursor-pointer"
              >
                👍 Отлично
              </button>
              <button
                type="button"
                onClick={() => onRate('bad')}
                className="px-3.5 py-1.5 rounded-xl bg-surface border border-line text-[13px] font-bold hover:bg-danger/10 active:scale-95 transition-all cursor-pointer"
              >
                👎 Есть вопрос
              </button>
            </div>
          )}
          {order.rating && (
            <span className="text-[12px] text-muted font-medium">Спасибо за вашу оценку!</span>
          )}
        </div>
      )}
    </section>
  )
}
