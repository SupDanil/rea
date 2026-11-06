import { RollingNumber } from '../../components/RollingNumber'
import type { Nutrition } from '../../domain'
import { formatAmount } from '../../utils/format'

/** Values for the configured portion, shared with the product price calculation. */
export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  return (
    <section className="my-4 border-y-(length:--stroke-width) border-pd-line py-3" aria-label="Пищевая ценность" aria-live="polite" aria-atomic="true">
      <h2 className="font-bold text-pd-ink">Пищевая ценность</h2>
      <p className="mb-3 text-caption text-pd-muted">На порцию с учётом размера и добавок</p>
      <dl className="grid grid-cols-4 gap-1 text-center">
        <Cell label="энергия" value={Math.round(nutrition.kcal)} unit="ккал" />
        <Cell label="белки" value={round1(nutrition.protein)} unit="г" />
        <Cell label="жиры" value={round1(nutrition.fat)} unit="г" />
        <Cell label="углеводы" value={round1(nutrition.carbs)} unit="г" />
      </dl>
    </section>
  )
}

const round1 = (v: number) => Math.round(v * 10) / 10

function Cell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <dt className="order-1 text-caption text-pd-muted">{label}</dt>
      <dd className="text-compact xs:text-body font-bold tracking-tight text-pd-ink tabular-nums whitespace-nowrap" aria-label={`${label}: ${formatAmount(value)} ${unit}`}>
        <RollingNumber text={formatAmount(value)} />&nbsp;{unit}
      </dd>
    </div>
  )
}
