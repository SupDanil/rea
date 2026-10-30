import type { ReactNode } from 'react'
import { useEscape } from '../hooks/useEscape'
import { BackIcon } from './icons'
import { iconBtn, sheet, sheetBody, sheetDock, sheetHead, sheetTitle } from './ui'

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
  children: ReactNode
}

/** Full-screen layer over the menu with a back button; Escape goes back too. */
export function Sheet({ label, title, onBack, backLabel = 'Назад', locked = false, action, children }: Props) {
  useEscape(onBack, !locked)
  return (
    <div className={sheet} role="dialog" aria-modal="true" aria-label={label}>
      <header className={sheetHead}>
        <button className={iconBtn('left')} onClick={onBack} aria-label={backLabel} disabled={locked}>
          <BackIcon />
        </button>
        {title && <h1 className={sheetTitle}>{title}</h1>}
        {action}
      </header>
      {children}
    </div>
  )
}

export function SheetBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className ? `${sheetBody} ${className}` : sheetBody}>{children}</div>
}

export function SheetDock({ children }: { children: ReactNode }) {
  return <footer className={sheetDock}>{children}</footer>
}
