import { Button } from '../../components/Button'
import { SegmentedControl } from '../../components/SegmentedControl'
import { block, blockTitle, hint } from '../../components/ui'
import { prepRange, type Shop } from '../../domain'
import type { Pickup } from '../../state/orders'

const options: Pickup[] = [{ kind: 'asap' }, { kind: 'in', minutes: 15 }, { kind: 'in', minutes: 30 }, { kind: 'in', minutes: 45 }]
const keyOf = (p: Pickup) => (p.kind === 'asap' ? 'asap' : String(p.minutes))

/**
 * 2026 Liquid Glass PickupPicker:
 * Horizontal segmented timeline with a sliding liquid capsule indicator.
 */
export function PickupPicker({
  shop,
  value,
  onChange,
  onChangeShop,
}: {
  shop?: Shop
  value: Pickup
  onChange: (pickup: Pickup) => void
  onChangeShop?: () => void
}) {

  return (
    <section className={block}>
      <h2 className={blockTitle}>Когда забрать</h2>
      <SegmentedControl label="Когда забрать" value={keyOf(value)} stretch
        onChange={(key) => { const pickup = options.find((option) => keyOf(option) === key); if (pickup) onChange(pickup) }}
        options={options.map((pickup) => ({ value: keyOf(pickup), label: pickup.kind === 'asap' ? 'Сразу' : `${pickup.minutes} мин` }))} />

      {shop && (
        <p className={hint()}>
          <span>{shop.address} · {value.kind === 'asap' ? `приготовим за ${prepRange(shop)} минут` : 'приготовим к нужному времени'}</span>
          {onChangeShop && (
            <Button
              type="button"
              onClick={onChangeShop}
              className="ml-2 font-bold text-accent underline cursor-pointer hover:opacity-80"
            >
              Сменить
            </Button>
          )}
        </p>
      )}
    </section>
  )
}
