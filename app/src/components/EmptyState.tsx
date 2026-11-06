import type { ReactNode } from 'react'

import { Button } from './Button'

type Props = { art?: ReactNode; title: string; text: string; actionLabel: string; onAction: () => void }

/**
 * 2026 EmptyState:
 * Bold Unbounded typography, warm soft glow around rabbit/cup art, and crisp primary action.
 */
export function EmptyState({ art, title, text, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      {art && (
        <div className="relative mb-2 flex items-center justify-center">
          <div className="absolute size-32 rounded-pill bg-crema/15 dark:bg-crema/10 blur-xl pointer-events-none" />
          <div className="relative z-10 animate-[empty-art_0.6s_var(--spring)_both]">{art}</div>
        </div>
      )}
      <h2 className="mt-2 font-display text-title font-bold text-ink tracking-tight animate-[fade-in_0.4s_var(--ease-soft)_0.12s_both]">
        {title}
      </h2>
      <p className="mb-4 max-w-(--layout-dialog-sm) text-body leading-relaxed text-muted animate-[fade-in_0.4s_var(--ease-soft)_0.2s_both]">
        {text}
      </p>
      <Button className={`${''} animate-[fade-in_0.4s_var(--ease-soft)_0.28s_both]`} variant="primary" size="md" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
