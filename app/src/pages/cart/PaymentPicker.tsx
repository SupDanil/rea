import { block, blockTitle, option, optionSub, optionTitle, radio } from '../../components/ui'
import type { PaymentMethod } from '../../state/orders'

const methods = [
  ['card', 'Картой онлайн', 'Демо: деньги не списываются'],
  ['cash', 'При получении', 'Картой или наличными на кассе'],
] as const

export function PaymentPicker({ value, onChange }: { value: PaymentMethod; onChange: (method: PaymentMethod) => void }) {
  return (
    <section className={block}>
      <h2 className={blockTitle}>Оплата</h2>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Способ оплаты">
        {methods.map(([id, title, sub]) => (
          <button key={id} role="radio" aria-checked={value === id} className={option} onClick={() => onChange(id)}>
            <span className={radio} aria-hidden="true" />
            <span>
              <span className={optionTitle}>{title}</span>
              <span className={optionSub}>{sub}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
