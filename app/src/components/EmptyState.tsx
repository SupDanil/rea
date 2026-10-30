import type { ReactNode } from 'react'
import { btn } from './ui'

type Props = { art?: ReactNode; title: string; text: string; actionLabel: string; onAction: () => void }

export function EmptyState({ art, title, text, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      {art}
      <h2 className="mt-2 text-[22px]">{title}</h2>
      <p className="mb-3 max-w-[260px] text-[14px] leading-[1.4] text-muted">{text}</p>
      <button className={btn('primary')} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
