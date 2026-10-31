import type { ReactNode, Ref } from 'react'
import { useEscape } from '../hooks/useEscape'
import { BackIcon } from './icons'
import { iconBtn, sheetBody, sheetDock, sheetHead, sheetTitle } from './ui'
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
          'relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto overscroll-contain bg-bg',
          // Desktop: beautiful centered floating card
          maxWidth ?? 'wide:max-w-[640px]',
          'wide:h-auto wide:max-h-[min(90dvh,840px)] wide:rounded-[28px] wide:border wide:border-line wide:shadow-[0_24px_64px_rgba(0,0,0,0.35)]',
          'animate-[sheet-up_0.38s_var(--ease-soft)_both]',
          className,
        )}
      >
        <header className={sheetHead}>
          <button className={iconBtn('left')} onClick={onBack} aria-label={backLabel} disabled={locked}>
            <BackIcon />
          </button>
          {title && <h1 className={sheetTitle}>{title}</h1>}
          {action}
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
    <footer ref={ref} className={className ? `${sheetDock} ${className}` : sheetDock}>
      {children}
    </footer>
  )
}
