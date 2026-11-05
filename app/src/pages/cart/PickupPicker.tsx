import { useRef } from 'react'

import { block, blockTitle, hint } from '../../components/ui'
import { prepRange, type Shop } from '../../domain'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'
import type { Pickup } from '../../state/orders'

const options: Pickup[] = [{ kind: 'asap' }, { kind: 'in', minutes: 15 }, { kind: 'in', minutes: 30 }, { kind: 'in', minutes: 45 }]
const same = (a: Pickup, b: Pickup) => a.kind === b.kind && (a.kind === 'asap' || (b.kind === 'in' && a.minutes === b.minutes))
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
  const barRef = useRef<HTMLDivElement>(null)
  const pill = useSlidingIndicator(barRef, keyOf(value), '[aria-checked="true"]')

  return (
    <section className={block}>
      <h2 className={blockTitle}>Когда забрать</h2>
      <div
        ref={barRef}
        className="relative grid grid-cols-4 gap-1 rounded-[20px] bg-surface-2/70 p-1 border border-line shadow-inner"
        role="radiogroup"
        aria-label="Когда забрать"
      >
        <span
          ref={pill}
          className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-[16px] bg-surface border border-glass-border opacity-0 shadow-sm transition-[transform,scale,width] duration-[340ms] ease-soft"
          aria-hidden="true"
        />

        {options.map((p) => {
          const checked = same(p, value)
          return (
            <button
              key={keyOf(p)}
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(p)}
              className={`relative z-1 h-[42px] rounded-[16px] text-[13px] sm:text-[14px] font-semibold transition-colors duration-200 cursor-pointer ${
                checked ? 'font-bold text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {p.kind === 'asap' ? 'Сразу' : `${p.minutes} мин`}
            </button>
          )
        })}
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
