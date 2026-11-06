import { Button } from '../../components/Button'
import { block, blockTitle, radio } from '../../components/ui'
import type { PaymentMethod } from '../../state/orders'

const methods = [
  ['card', 'Картой онлайн', 'Демо: деньги не списываются'],
  ['cash', 'При получении', 'Картой или наличными на кассе'],
] as const

/**
 * 2026 Liquid Glass PaymentPicker:
 * Interactive payment stack where selected payment card slides forward with subtle glow.
 */
export function PaymentPicker({ value, onChange }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <section className={block}>
      <h2 className={blockTitle}>Оплата</h2>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Способ оплаты">
        {methods.map(([id, title, sub]) => {
          const selected = value === id
          return (
            <Button
              key={id}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={`group flex items-center gap-3.5 rounded-card p-4 text-left transition-all duration-200 cursor-pointer ${
                selected
                  ? 'bg-surface/95 border-(length:--stroke-width-strong) border-accent shadow-lift scale-[1.01]'
                  : 'bg-surface/75 border-(length:--stroke-width) border-line hover:border-line-strong'
              }`}
            >
              <span className={radio} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="block font-display text-control font-bold text-ink">{title}</span>
                <span className="mt-0.5 block text-caption text-muted font-medium">{sub}</span>
              </div>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
