import type { CSSProperties } from 'react'
import { PlusIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { isSoldOut, minPrice, type MenuItem } from '../../data/menu'
import { useSharedArt } from '../../hooks/useSharedArt'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

export function ProductCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const soldOut = isSoldOut(item)
  const sharedArt = useSharedArt(item.id, (path) => path === '/' || path === '/menu')
  return (
    <button
      className={cx(
        'group flex flex-col rounded-[24px] px-1.5 pt-1.5 pb-3 text-left [transition:transform_0.18s_var(--ease-soft),scale_0.18s_var(--ease-soft),box-shadow_0.18s,background-color_0.3s_ease] active:scale-97',
        soldOut ? 'bg-[color-mix(in_oklab,var(--surface)_55%,transparent)]' : 'bg-surface shadow-card hover:shadow-lift',
      )}
      onClick={onOpen}
      aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
    >
      <div
        className={cx('art-glow relative grid aspect-square place-items-center overflow-hidden rounded-[19px]', soldOut && 'opacity-55 grayscale-70')}
        style={{ '--tint': item.art.bg } as CSSProperties}
      >
        <ItemArt
          art={item.art}
          className="size-[84%] transition-transform duration-300 ease-soft group-hover:-translate-y-[3px] group-hover:scale-103"
          style={sharedArt}
        />
        {item.badge && (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-1 text-[10px] font-extrabold tracking-[0.04em] text-accent-ink uppercase">
            {item.badge}
          </span>
        )}
      </div>
      <div className={cx('mx-2 mt-2.5 text-[15px] leading-[1.2] font-bold tracking-[-0.015em]', soldOut && 'opacity-55')}>{item.name}</div>
      <div className={cx('mx-2 mt-1 line-clamp-2 flex-1 text-[12px] leading-[1.35] text-muted', soldOut && 'opacity-55')}>{item.description}</div>
      <div className="mt-2.5 mr-1 ml-2 flex items-center justify-between">
        <span className={soldOut ? 'text-[13px] font-semibold text-muted' : 'text-[15px] font-bold'}>
          {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
        </span>
        {!soldOut && (
          <span
            className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink transition-[background,color] duration-200 ease-[ease] group-hover:bg-accent group-hover:text-accent-ink"
            aria-hidden="true"
          >
            <PlusIcon />
          </span>
        )}
      </div>
    </button>
  )
}
