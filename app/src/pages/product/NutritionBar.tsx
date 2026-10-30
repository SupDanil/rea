import type { Nutrition } from '../../data/menu'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { formatAmount } from '../../utils/format'

/** Calories and macros; clean floating columns directly matching Drinkit's NutritionBlock. */
export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div className="mx-4 mt-2 grid grid-cols-4 px-1 text-center" aria-live="polite">
      <Cell label="энергия" value={nutrition.kcal} unit="ккал" round />
      <Cell label="жиры" value={nutrition.fat} unit="г" />
      <Cell label="углеводы" value={nutrition.carbs} unit="г" />
      <Cell label="белки" value={nutrition.protein} unit="г" />
    </div>
  )
}

function Cell({ label, value, unit, round = false }: { label: string; value: number; unit: string; round?: boolean }) {
  const shown = useAnimatedNumber(value, 650)
  const text = round ? formatAmount(Math.round(shown)) : formatAmount(Math.round(shown * 10) / 10)
  return (
    <div className="flex flex-col items-center">
      <span className="text-[16px] font-bold tracking-tight text-white tabular-nums">
        {text}&nbsp;{unit}
      </span>
      <span className="text-[12px] font-normal text-white/60">
        {label}
      </span>
    </div>
  )
}
