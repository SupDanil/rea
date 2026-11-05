import { useRef,useState } from 'react'

import { useEscape } from '../hooks/useEscape'
import { cx } from '../utils/cx'
import { btn, buttonRow, hint } from './ui'

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
        'relative overflow-hidden rounded-[24px] p-5 text-left',
        'bg-surface',
        'border border-glass-border shadow-lift',
        'animate-[sheet-up_0.25s_var(--ease-soft)_both]',
      )}
      role="alertdialog"
      aria-label={title}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="size-2 rounded-full bg-danger animate-pulse" aria-hidden="true" />
        <p className="font-display text-[17px] font-bold text-ink">{title}</p>
      </div>

      <p className={cx(hint(), 'mt-1 text-[13px] text-muted leading-relaxed')}>{text}</p>

      <div className={cx(buttonRow, 'mt-4')}>
        <button
          className={cx(
            btn('danger'),
            'relative overflow-hidden transition-all',
            holding && 'scale-98',
          )}
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
        </button>

        <button className={btn('secondary')} onClick={onCancel}>
          {cancelLabel}
        </button>
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
        <div className="w-full max-w-[360px]">
          {box}
        </div>
      </div>
    )
  }

  return box
}
