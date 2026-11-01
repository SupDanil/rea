import type { CSSProperties } from 'react'
import { ItemArt } from '../../components/ItemArt'
import { minPrice, type MenuItem } from '../../domain'
import { formatPrice } from '../../utils/format'
import { ART_ATTR } from '../../utils/morph'

/**
 * 2026 Liquid Glass HeroBanner:
 * Mesh gradient with subtle noise grain overlay, kinetic Unbounded typography,
 * Cormorant Garamond Italic subtitle, and gentle floating art.
 */
export function HeroBanner({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  return (
    <button
      className="tinted mesh-grain relative mx-2.5 sm:mx-3 mt-1 block w-[calc(100%-20px)] sm:w-[calc(100%-24px)] overflow-hidden rounded-[28px] sm:rounded-[32px] text-left text-ink border border-white/20 shadow-lift transition-transform active:scale-[0.99] cursor-pointer [background:radial-gradient(110%_90%_at_75%_35%,var(--glow)_0%,transparent_60%),radial-gradient(80%_60%_at_20%_80%,rgba(196,91,36,0.1)_0%,transparent_60%),var(--tinted)]"
      style={{ '--tint': item.art.bg } as CSSProperties}
      onClick={onOpen}
    >
      <div
        className="grid min-h-[210px] sm:min-h-[240px] wide:min-h-[320px] grid-cols-2 items-center px-4 sm:px-6 py-4 animate-[fade-in_0.4s_var(--ease-soft)]"
        key={item.id}
      >
        <ItemArt
          art={item.art}
          className="block h-auto w-full animate-[float_6s_ease-in-out_infinite] wide:h-[300px] wide:w-auto wide:justify-self-center drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)]"
          {...{ [ART_ATTR]: item.id }}
        />

        <div className="-order-1 py-2 pr-2">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-display font-bold tracking-wider text-accent uppercase border border-white/30">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            {item.badge ?? 'Рекомендуем'}
          </div>

          {/* Kinetic Unbounded Title */}
          <div className="mt-2.5 font-display text-[21px] xs:text-[23px] sm:text-[27px] leading-[1.08] font-bold tracking-tight text-ink animate-[title-breathe_0.5s_var(--spring)]">
            {item.name}
          </div>

          {/* Cormorant Garamond Italic accent */}
          <div className="mt-1 font-serif text-[15px] sm:text-[17px] italic text-ink-2/90 leading-tight">
            шелковистая текстура & чистый вкус
          </div>

          {/* Description */}
          <div className="mt-1.5 line-clamp-2 text-[12px] sm:text-[13px] leading-[1.4] text-muted">
            {item.description}
          </div>

          {/* Cobalt Price Capsule */}
          <span className="mt-3.5 inline-block rounded-full bg-accent text-accent-ink font-display font-bold px-4 py-1.5 text-[13px] sm:text-[14px] shadow-sm">
            от {formatPrice(minPrice(item))}
          </span>
        </div>
      </div>
    </button>
  )
}
