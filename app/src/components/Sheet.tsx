import type { ReactNode, Ref } from 'react'
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

/** Full-screen layer over the menu on mobile, centered rounded card modal on desktop; Escape or backdrop click goes back. */
export function Sheet({ label, title, onBack, backLabel = 'Назад', locked = false, action, maxWidth, className, children }: Props) {
  useEscape(onBack, !locked)
  return (
    <div
      className="fixed inset-0 z-20 flex flex-col items-center justify-center overscroll-contain wide:bg-black/50 wide:backdrop-blur-xs wide:p-4 md:wide:p-6"
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
        className={cx(
          // Mobile: full-screen sheet
          'relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-bg',
          // Desktop: beautiful centered floating card
          maxWidth ?? 'wide:max-w-[540px]',
          'wide:h-[min(90dvh,780px)] wide:max-h-[min(90dvh,840px)] wide:rounded-[28px] wide:border wide:border-line wide:shadow-[0_24px_64px_rgba(0,0,0,0.35)]',
          'animate-[sheet-up_0.38s_var(--ease-soft)_both]',
          className,
        )}
      >
        <header
          className={cx(
            'flex-none min-h-14 items-center px-3 sm:px-6 pt-[calc(8px+env(safe-area-inset-top))] pb-1',
            // Mobile: 3-column grid (Back arrow on left, Title in middle, Action on right)
            'grid grid-cols-[44px_1fr_auto] gap-2',
            // Desktop: clean flex row (Title on left, Action + Close cross on right)
            'wide:flex wide:items-center wide:justify-between wide:gap-3 wide:pt-5 wide:pb-3',
          )}
        >
          {/* Mobile Back Button (chevron) */}
          <button className={cx(iconBtn('left'), 'wide:hidden')} onClick={onBack} aria-label={backLabel} disabled={locked}>
            <BackIcon />
          </button>

          {/* Title (centered on mobile, left-aligned on desktop) */}
          {title ? (
            <h1 className={cx(sheetTitle, 'truncate')}>
              {title}
            </h1>
          ) : (
            <h1 className={cx(sheetTitle, 'hidden wide:block truncate')}>
              {label}
            </h1>
          )}

          {/* Right Action (e.g. "Очистить" in Cart) + Desktop Close Cross (крестик) */}
          <div className="col-start-3 flex items-center justify-end gap-2.5">
            {action}
            <button
              type="button"
              className={cx(
                'hidden wide:grid size-10 place-items-center rounded-full',
                'bg-surface-2 hover:bg-surface-2/80 text-muted hover:text-ink',
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
    <footer ref={ref} className={cx(sheetDock, 'flex-none border-t border-line/30 bg-bg/95 backdrop-blur-md', className)}>
      {children}
    </footer>
  )
}
