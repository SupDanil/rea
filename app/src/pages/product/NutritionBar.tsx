import { useState } from 'react'
import { RollingNumber } from '../../components/RollingNumber'
import type { Nutrition } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatAmount } from '../../utils/format'

/** Calories and macros: digits roll like an odometer and the change floats up above. */
export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div className="mx-2 sm:mx-4 mt-1.5 sm:mt-2 grid grid-cols-4 px-0.5 sm:px-1 text-center" aria-live="polite">
      <Cell label="энергия" value={Math.round(nutrition.kcal)} unit="ккал" />
      <Cell label="жиры" value={round1(nutrition.fat)} unit="г" />
      <Cell label="углеводы" value={round1(nutrition.carbs)} unit="г" />
      <Cell label="белки" value={round1(nutrition.protein)} unit="г" />
    </div>
  )
}

const round1 = (v: number) => Math.round(v * 10) / 10

function Cell({ label, value, unit }: { label: string; value: number; unit: string }) {
  // Remember the last change so it can float up as "+40" / "−1,2".
  const [last, setLast] = useState(value)
  const [delta, setDelta] = useState<{ amount: number; id: number } | null>(null)
  if (last !== value) {
    setDelta({ amount: round1(value - last), id: (delta?.id ?? 0) + 1 })
    setLast(value)
  }

  return (
    <div className="relative flex flex-col items-center">
      {delta && delta.amount !== 0 && (
        <span
          key={delta.id}
          className={cx(
            'pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold leading-[16px] tabular-nums animate-[delta-float_1.1s_var(--ease-soft)_both]',
            delta.amount > 0 ? 'bg-[#c5c7d7] text-[#362452]' : 'bg-pd-glass text-pd-ink',
          )}
          aria-hidden="true"
        >
          {delta.amount > 0 ? '+' : '−'}
          {formatAmount(Math.abs(delta.amount))}
        </span>
      )}
      <span className="text-[14px] xs:text-[15px] sm:text-[16px] font-bold tracking-tight text-pd-ink tabular-nums whitespace-nowrap">
        <RollingNumber text={formatAmount(value)} />
        &nbsp;{unit}
      </span>
      <span className="text-[11px] sm:text-[12px] font-normal text-pd-muted">{label}</span>
    </div>
  )
}
