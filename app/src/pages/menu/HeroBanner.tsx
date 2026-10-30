import type { CSSProperties } from 'react'
import { ItemArt } from '../../components/ItemArt'
import { minPrice, type MenuItem } from '../../data/menu'
import { formatPrice } from '../../utils/format'

/** Big recommendation card for the category currently in view. */
export function HeroBanner({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  return (
    <button
      className="tinted relative mx-2.5 sm:mx-3 mt-1 block w-[calc(100%-20px)] sm:w-[calc(100%-24px)] overflow-hidden rounded-[26px] sm:rounded-[32px] text-left text-ink shadow-card [background:radial-gradient(120%_90%_at_70%_35%,var(--glow)_0%,transparent_55%),var(--tinted)]"
      style={{ '--tint': item.art.bg } as CSSProperties}
      onClick={onOpen}
    >
      <div className="grid min-h-[210px] sm:min-h-[236px] wide:min-h-[320px] grid-cols-2 items-center animate-[fade-in_0.45s_var(--ease-soft)]" key={item.id}>
        <ItemArt art={item.art} className="block h-auto w-full animate-[float_5s_ease-in-out_infinite] wide:h-[300px] wide:w-auto wide:justify-self-center" />
        <div className="-order-1 py-3.5 sm:py-[22px] pl-3.5 sm:pl-5 pr-1">
          <div className="inline-block rounded-full bg-glass-strong px-2 py-0.5 sm:px-[9px] sm:py-1 text-[10px] sm:text-[11px] font-bold tracking-[0.04em] text-accent-soft uppercase">
            {item.badge ?? 'Рекомендуем'}
          </div>
          <div className="mt-1.5 sm:mt-2.5 text-[20px] xs:text-[22px] sm:text-[26px] leading-[1.08] font-extrabold tracking-[-0.035em]">{item.name}</div>
          <div className="mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-3 text-[12px] sm:text-[13px] leading-[1.3] text-ink-2">{item.description}</div>
          <span className="mt-2.5 sm:mt-3.5 inline-block rounded-full bg-inverse px-3 sm:px-3.5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] font-bold text-inverse-ink">
            от {formatPrice(minPrice(item))}
          </span>
        </div>
      </div>
    </button>
  )
}
