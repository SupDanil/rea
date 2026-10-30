import type { ReactNode } from 'react'
import { formatPrice } from '../utils/format'
import { summary, summaryDiscount, summaryRow, summaryTotal } from './ui'

/** Price breakdown card: plain rows, discount rows, then the total. */
export function Summary({ children }: { children: ReactNode }) {
  return <dl className={summary}>{children}</dl>
}

export function SummaryRow({ label, amount, discount = false }: { label: ReactNode; amount: number; discount?: boolean }) {
  return (
    <div className={summaryRow}>
      <dt>{label}</dt>
      <dd className={discount ? summaryDiscount : undefined}>{discount ? `−${formatPrice(amount)}` : formatPrice(amount)}</dd>
    </div>
  )
}

export function SummaryTotal({ label, amount }: { label: ReactNode; amount: number }) {
  return (
    <div className={summaryTotal}>
      <dt>{label}</dt>
      <dd>{formatPrice(amount)}</dd>
    </div>
  )
}
