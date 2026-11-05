import type { ReactNode, Ref } from 'react'

import { cx } from '../utils/cx'
import { BackIcon, CloseIcon } from './icons'
import { Modal } from './Modal'
import { iconBtn, sheetBody, sheetDock, sheetTitle } from './ui'

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

/** A titled bottom sheet: the app's standard modal, on phones and as a floating card on wide screens. */
export function Sheet({ label, title, onBack, backLabel = 'Назад', locked = false, action, maxWidth, className, children }: Props) {
  return (
    <Modal label={label} onClose={onBack} locked={locked} className={cx(maxWidth ?? 'wide:max-w-[560px]', className)}>
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
    </Modal>
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
    <footer ref={ref} className={cx(sheetDock, 'flex-none border-t border-line/60 bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.04)]', className)}>
      {children}
    </footer>
  )
}
