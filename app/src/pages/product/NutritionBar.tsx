import type { Nutrition } from '../../data/menu'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { formatAmount } from '../../utils/format'

/** Calories and macros; each value counts up/down to its new total like Drinkit's. */
export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  return (
    <dl className="mx-4 mt-3 grid grid-cols-4 divide-x divide-line rounded-[18px] bg-glass px-1 py-2.5 text-center" aria-live="polite">
      <Cell label="энергия" value={nutrition.kcal} unit="ккал" round />
      <Cell label="жиры" value={nutrition.fat} unit="г" />
      <Cell label="углеводы" value={nutrition.carbs} unit="г" />
      <Cell label="белки" value={nutrition.protein} unit="г" />
    </dl>
  )
}

function Cell({ label, value, unit, round = false }: { label: string; value: number; unit: string; round?: boolean }) {
  const shown = useAnimatedNumber(value, 650)
  const text = round ? formatAmount(Math.round(shown)) : formatAmount(Math.round(shown * 10) / 10)
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-px text-[11px] text-muted">{label}</dt>
      <dd className="text-[15px] font-bold tracking-[-0.01em] tabular-nums">
        {text} {unit}
      </dd>
    </div>
  )
}
