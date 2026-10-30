import type { Nutrition } from '../../data/menu'
import { formatAmount } from '../../utils/format'

export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  const cells = [
    ['энергия', `${formatAmount(Math.round(nutrition.kcal))} ккал`],
    ['жиры', `${formatAmount(nutrition.fat)} г`],
    ['углеводы', `${formatAmount(nutrition.carbs)} г`],
    ['белки', `${formatAmount(nutrition.protein)} г`],
  ] as const
  return (
    <dl className="mx-4 mt-3 grid grid-cols-4 divide-x divide-line rounded-[18px] bg-glass px-1 py-2.5 text-center" aria-live="polite">
      {cells.map(([label, value]) => (
        <div key={label} className="flex flex-col-reverse">
          <dt className="mt-px text-[11px] text-muted">{label}</dt>
          <dd className="text-[15px] font-bold tracking-[-0.01em]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
