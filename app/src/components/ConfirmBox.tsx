import { useRef,useState } from 'react'

import { useEscape } from '../hooks/useEscape'
import { cx } from '../utils/cx'
import { Button } from './Button'
import { buttonRow, hint } from './ui'

type Props = {
  title: string
  text: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  modal?: boolean
}

/**
 * 2026 Liquid Glass ConfirmBox:
 * Compact glass popover card with subtle inner glow, destructive hold-to-fill or click feedback,
 * tactile vibration, and quick cancel option.
 * When `modal` is true, renders centered in a full-screen blurred backdrop overlay.
 */
export function ConfirmBox({ title, text, confirmLabel, cancelLabel, onConfirm, onCancel, modal = false }: Props) {
  const [holding, setHolding] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEscape(onCancel, modal)

  const startHold = () => {
    setHolding(true)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(20)
      } catch {}
    }
    holdTimer.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.([30, 50, 40])
        } catch {}
      }
      onConfirm()
    }, 600)
  }

  const cancelHold = () => {
    setHolding(false)
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  const box = (
    <div
      className={cx(
        'relative overflow-hidden rounded-panel p-5 text-left',
        'bg-surface',
        'border-(length:--stroke-width) border-glass-border shadow-lift',
        'animate-[sheet-up_0.25s_var(--ease-soft)_both]',
      )}
      role="alertdialog"
      aria-label={title}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="size-2 rounded-pill bg-danger animate-pulse" aria-hidden="true" />
        <p className="font-display text-body-lg font-bold text-ink">{title}</p>
      </div>

      <p className={cx(hint(), 'mt-1 text-compact text-muted leading-relaxed')}>{text}</p>

      <div className={cx(buttonRow, 'mt-4')}>
        <Button
          className={cx('relative overflow-hidden transition-all',
            holding && 'scale-98',
          )} variant="danger" size="md"
          onClick={onConfirm}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
        >
          {holding && (
            <span
              className="absolute inset-0 bg-white/20 transition-all duration-600 ease-linear"
              style={{ width: '100%' }}
              aria-hidden="true"
            />
          )}
          <span className="relative z-10">{confirmLabel}</span>
        </Button>

        <Button  variant="secondary" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  )

  if (modal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel()
        }}
      >
        <div className="w-full max-w-(--layout-dialog-sm)">
          {box}
        </div>
      </div>
    )
  }

  return box
}
