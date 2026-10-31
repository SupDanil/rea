import { block, blockTitle, hint } from '../../components/ui'
import { prepRange, type Shop } from '../../domain'
import type { Pickup } from '../../state/orders'

const options: Pickup[] = [{ kind: 'asap' }, { kind: 'in', minutes: 15 }, { kind: 'in', minutes: 30 }, { kind: 'in', minutes: 45 }]
const same = (a: Pickup, b: Pickup) => a.kind === b.kind && (a.kind === 'asap' || (b.kind === 'in' && a.minutes === b.minutes))

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
      <div
        className="grid grid-cols-4 gap-1 rounded-[18px] bg-surface p-1 shadow-card *:h-[40px] sm:*:h-[42px] *:rounded-[14px] *:text-[12px] sm:*:text-[14px] *:font-semibold *:text-ink-2 *:transition-[background,color] *:duration-200 *:ease-[ease] *:aria-checked:bg-inverse *:aria-checked:text-inverse-ink"
        role="radiogroup"
        aria-label="Когда забрать"
      >
        {options.map((p) => (
          <button key={p.kind === 'asap' ? 'asap' : p.minutes} role="radio" aria-checked={same(p, value)} onClick={() => onChange(p)}>
            {p.kind === 'asap' ? 'Сразу' : `${p.minutes} мин`}
          </button>
        ))}
      </div>
      {shop && (
        <p className={hint()}>
          <span>{shop.address} · {value.kind === 'asap' ? `приготовим за ${prepRange(shop)} минут` : 'приготовим к нужному времени'}</span>
          {onChangeShop && (
            <button
              type="button"
              onClick={onChangeShop}
              className="ml-2 font-bold text-accent underline cursor-pointer hover:opacity-80"
            >
              Сменить
            </button>
          )}
        </p>
      )}
    </section>
  )
}
