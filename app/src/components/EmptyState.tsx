import type { ReactNode } from 'react'

import { Button } from './Button'

type Props = {
  art?: ReactNode
  title: string
  text: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

/**
 * EmptyState:
 * Bold Unbounded typography, warm soft glow around art, and crisp primary action.
 */
export function EmptyState({ art, title, text, actionLabel, onAction, children }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 sm:p-8 text-center">
      {art && (
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute size-36 rounded-pill bg-crema/20 dark:bg-crema/10 blur-xl pointer-events-none" />
          <div className="relative z-10 animate-[empty-art_0.6s_var(--spring)_both]">{art}</div>
        </div>
      )}
      <h2 className="mt-1 font-display text-title font-bold text-ink tracking-tight animate-[fade-in_0.4s_var(--ease-soft)_0.12s_both]">
        {title}
      </h2>
      <p className="mb-4 max-w-(--layout-dialog-sm) text-body leading-relaxed text-muted animate-[fade-in_0.4s_var(--ease-soft)_0.2s_both]">
        {text}
      </p>
      {actionLabel && onAction && (
        <div className="animate-[fade-in_0.4s_var(--ease-soft)_0.28s_both]">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
      {children && (
        <div className="w-full animate-[fade-in_0.4s_var(--ease-soft)_0.34s_both]">
          {children}
        </div>
      )}
    </div>
  )
}
