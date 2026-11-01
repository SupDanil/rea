import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { useEscape } from '../hooks/useEscape'
import { BackIcon, CloseIcon } from './icons'
import { iconBtn, sheetBody, sheetDock, sheetTitle } from './ui'
import { cx } from '../utils/cx'

type Props = {
  /** Accessible name of the dialog */
  label: string
  title?: string
  onBack: () => void
  backLabel?: string
  /** Blocks leaving, e.g. while a payment is in flight */
  locked?: boolean
  /** Extra control on the right of the header */
  action?: ReactNode
  maxWidth?: string
  className?: string
  children: ReactNode
}

/** 
 * 2026 Liquid Glass Sheet:
 * On mobile, a true iOS-style bottom sheet with drag handle, swipe-down gesture,
 * glass edge, and rubber-band elasticity. On desktop/wide, a floating glass panel with focus trap.
 */
export function Sheet({ label, title, onBack, backLabel = 'Назад', locked = false, action, maxWidth, className, children }: Props) {
  useEscape(onBack, !locked)

  // Focus trap & return focus on close
  const sheetRef = useRef<HTMLDivElement>(null)
  const prevActiveEl = useRef<HTMLElement | null>(null)

  useEffect(() => {
    prevActiveEl.current = document.activeElement as HTMLElement | null
    const timer = setTimeout(() => {
      // Find first focusable element inside sheet if not already focused
      if (sheetRef.current && !sheetRef.current.contains(document.activeElement)) {
        const focusable = sheetRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        focusable?.focus()
      }
    }, 50)
    return () => {
      clearTimeout(timer)
      prevActiveEl.current?.focus()
    }
  }, [])

  // Mobile swipe-to-dismiss gesture handling
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (locked) return
    touchStartY.current = e.touches[0].clientY
    currentY.current = touchStartY.current
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || locked) return
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - touchStartY.current
    if (diff > 0) {
      // Dragging down: direct feel with slight dampening
      setDragY(diff)
    } else {
      // Dragging up: rubber-band resistance
      setDragY(diff * 0.25)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || locked) return
    setIsDragging(false)
    const diff = currentY.current - touchStartY.current
    if (diff > 120) {
      // Dismiss threshold reached
      setDragY(400)
      setTimeout(onBack, 150)
    } else {
      // Snap back with spring
      setDragY(0)
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end wide:justify-center items-center overscroll-contain bg-black/40 backdrop-blur-sm transition-all duration-300 wide:p-4 md:wide:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget && !locked) {
          onBack()
        }
      }}
    >
      <div
        ref={sheetRef}
        style={{
          transform: dragY !== 0 ? `translateY(${Math.max(0, dragY)}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className={cx(
          // Mobile: Liquid Glass bottom sheet with rounded top corners
          'relative flex max-h-[94dvh] w-full max-w-[480px] flex-col overflow-hidden',
          'rounded-t-[32px] wide:rounded-[32px]',
          'bg-surface/95 dark:bg-surface/95 backdrop-blur-2xl',
          'border-t border-glass-border wide:border wide:border-glass-border',
          'shadow-lift shadow-black/25',
          // Desktop: floating centered card
          maxWidth ?? 'wide:max-w-[560px]',
          'wide:h-[min(90dvh,820px)] wide:max-h-[min(90dvh,840px)]',
          'animate-[sheet-up_0.34s_var(--spring)_both]',
          className,
        )}
      >
        {/* Mobile Grabber Bar */}
        <div
          className="wide:hidden flex flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        >
          <div className="w-11 h-1.5 rounded-full bg-ink/15 dark:bg-white/20 transition-transform active:scale-110" />
        </div>

        <header
          className={cx(
            'flex-none min-h-14 items-center px-4 sm:px-6 pt-1 pb-2',
            // Mobile: 3-column grid (Back chevron, Title, Action)
            'grid grid-cols-[44px_1fr_auto] gap-2',
            // Desktop: clean flex row
            'wide:flex wide:items-center wide:justify-between wide:gap-3 wide:pt-5 wide:pb-3',
          )}
        >
          {/* Mobile Back Button */}
          <button className={cx(iconBtn('left'), 'wide:hidden')} onClick={onBack} aria-label={backLabel} disabled={locked}>
            <BackIcon />
          </button>

          {/* Title */}
          {title ? (
            <h1 className={cx(sheetTitle, 'truncate')}>
              {title}
            </h1>
          ) : (
            <h1 className={cx(sheetTitle, 'hidden wide:block truncate')}>
              {label}
            </h1>
          )}

          {/* Right Action + Desktop Close button */}
          <div className="col-start-3 flex items-center justify-end gap-2.5">
            {action}
            <button
              type="button"
              className={cx(
                'hidden wide:grid size-10 place-items-center rounded-full',
                'bg-surface-2/80 hover:bg-surface-2 text-muted hover:text-ink',
                'border border-line shadow-xs transition-all active:scale-95 cursor-pointer',
              )}
              onClick={onBack}
              aria-label="Закрыть"
              disabled={locked}
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

export function SheetBody({ className, children, ref }: { className?: string; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={className ? `${sheetBody} ${className}` : sheetBody}>
      {children}
    </div>
  )
}

export function SheetDock({ className, children, ref }: { className?: string; children: ReactNode; ref?: Ref<HTMLElement> }) {
  return (
    <footer ref={ref} className={cx(sheetDock, 'flex-none border-t border-line/60 bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)]', className)}>
      {children}
    </footer>
  )
}
