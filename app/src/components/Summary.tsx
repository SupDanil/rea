import type { ReactNode } from 'react'

import { formatPrice } from '../utils/format'
import { Surface } from './Surface'
import { summaryDiscount, summaryRow, summaryTotal } from './ui'

/** Price breakdown card: plain rows, discount rows, then the total. */
export function Summary({ children }: { children: ReactNode }) {
  return <Surface as="dl" padding="md" className="mt-5.5">{children}</Surface>
}

export function SummaryRow({ label, amount, discount = false }: { label: ReactNode; amount: number; discount?: boolean }) {
  return (
    <div className={summaryRow}>
      <dt className="text-muted">{label}</dt>
      <dd className={discount ? summaryDiscount : 'text-ink font-medium'}>
        {discount ? `−${formatPrice(amount)}` : formatPrice(amount)}
      </dd>
    </div>
  )
}

export function SummaryTotal({ label, amount }: { label: ReactNode; amount: number }) {
  return (
    <div className={summaryTotal}>
      <dt>{label}</dt>
      <dd className="font-display font-bold text-title-sm text-ink">{formatPrice(amount)}</dd>
    </div>
  )
}
