import type { ReactNode } from 'react'
import { btn } from './ui'

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
          <div className="absolute size-32 rounded-full bg-crema/15 dark:bg-crema/10 blur-xl pointer-events-none" />
          <div className="relative z-10 animate-[empty-art_0.6s_var(--spring)_both]">{art}</div>
        </div>
      )}
      <h2 className="mt-2 font-display text-[22px] font-bold text-ink tracking-tight animate-[fade-in_0.4s_var(--ease-soft)_0.12s_both]">
        {title}
      </h2>
      <p className="mb-4 max-w-[280px] text-[14px] leading-relaxed text-muted animate-[fade-in_0.4s_var(--ease-soft)_0.2s_both]">
        {text}
      </p>
      <button className={`${btn('primary')} animate-[fade-in_0.4s_var(--ease-soft)_0.28s_both]`} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
