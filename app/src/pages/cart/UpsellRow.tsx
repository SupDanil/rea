import type { CSSProperties } from 'react'

import { ItemArt } from '../../components/ItemArt'
import { block, blockTitle } from '../../components/ui'
import type { MenuItem } from '../../domain'
import { formatPrice } from '../../utils/format'

/**
 * 2026 Bento UpsellRow:
 * Compact horizontal bento row showcasing warm treats and bakeries.
 */
export function UpsellRow({ items, disabled, onAdd }: { items: MenuItem[]; disabled: boolean; onAdd: (item: MenuItem) => void }) {
  if (!items.length) return null
  return (
    <section className={block}>
      <h2 className={blockTitle}>Добавить к заказу</h2>
      <div className="no-scrollbar -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1">
        {items.map((item) => (
          <button
            key={item.id}
            className="flex flex-[0_0_120px] flex-col gap-1 rounded-[22px] p-2 text-left bg-surface/90 border border-line shadow-card hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
            onClick={() => onAdd(item)}
            disabled={disabled}
          >
            <span
              className="art-glow mesh-grain grid aspect-square place-items-center rounded-[16px] overflow-hidden"
              style={{ '--tint': item.art.bg } as CSSProperties}
            >
              <ItemArt art={item.art} className="relative z-10 size-[84%]" />
            </span>
            <span className="mx-1 mt-1 min-h-[30px] font-display text-[12px] leading-[1.2] font-bold text-ink line-clamp-2">
              {item.name}
            </span>
            <span className="mx-1 font-display text-[12px] font-bold text-accent">
              + {formatPrice(item.variants[0].price)}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
