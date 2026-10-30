import type { CSSProperties } from 'react'
import { ItemArt } from '../../components/ItemArt'
import { block, blockTitle, panel } from '../../components/ui'
import type { MenuItem } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

/** "Add to your order": food the guest has not picked yet, like Drinkit's cart upsell. */
export function UpsellRow({ items, disabled, onAdd }: { items: MenuItem[]; disabled: boolean; onAdd: (item: MenuItem) => void }) {
  if (!items.length) return null
  return (
    <section className={block}>
      <h2 className={blockTitle}>Добавить к заказу</h2>
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            className={cx('flex flex-[0_0_116px] flex-col gap-1 rounded-[20px] px-1.5 pt-1.5 pb-2.5 text-left', panel)}
            onClick={() => onAdd(item)}
            disabled={disabled}
          >
            <span className="tinted grid aspect-square place-items-center rounded-[15px] bg-(--tinted)" style={{ '--tint': item.art.bg } as CSSProperties}>
              <ItemArt art={item.art} className="size-[82%]" />
            </span>
            <span className="mx-1 mt-1 min-h-[29px] text-[12px] leading-[1.2] font-semibold">{item.name}</span>
            <span className="mx-1 text-[12px] font-bold text-accent-soft">+ {formatPrice(item.variants[0].price)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
