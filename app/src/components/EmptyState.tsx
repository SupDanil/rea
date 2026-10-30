import type { ReactNode } from 'react'
import { btn } from './ui'

type Props = { art?: ReactNode; title: string; text: string; actionLabel: string; onAction: () => void }

export function EmptyState({ art, title, text, actionLabel, onAction }: Props) {
  return (
    // Art springs in, then title, text and button follow one after another.
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      {art && <div className="animate-[empty-art_0.7s_cubic-bezier(0.34,1.56,0.64,1)_both]">{art}</div>}
      <h2 className="mt-2 text-[22px] animate-[fade-in_0.4s_var(--ease-soft)_0.18s_both]">{title}</h2>
      <p className="mb-3 max-w-[260px] text-[14px] leading-[1.4] text-muted animate-[fade-in_0.4s_var(--ease-soft)_0.26s_both]">{text}</p>
      <button className={`${btn('primary')} animate-[fade-in_0.4s_var(--ease-soft)_0.34s_both]`} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
