import { type CSSProperties, memo, useMemo, useRef } from 'react'

import { Button } from '../../components/Button'
import { ItemArt } from '../../components/ItemArt'
import { isSoldOut, itemImage, type MenuItem, minPrice } from '../../domain'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { artProps } from '../../utils/morph'

/** Where a product sits in the menu feed, as opposed to a promo of the same product. */
export const CARD_SLOT = 'card'

interface ProductCardProps {
  item: MenuItem
  onOpen: (id: string) => void
  isWide?: boolean
}

/** Menu product card with soft tinted drink spots, tight balanced typography and right-aligned price. */
export const ProductCard = memo(function ProductCard({ item, onOpen }: ProductCardProps) {
  const soldOut = isSoldOut(item)
  const artRef = useRef<SVGSVGElement>(null)

  const isOnlyCold = item.temperatureMode === 'cold'
  const activeImageUrl = itemImage(item)

  const activeArt = useMemo(() => {
    if (isOnlyCold && item.art.kind === 'cup' && !activeImageUrl) {
      return { ...item.art, kind: 'iced' as const }
    }
    return item.art
  }, [isOnlyCold, item.art, activeImageUrl])

  // Extract clean volume or size range info: e.g. "300 мл" or "200–400 мл"
  const volumeInfo = useMemo(() => {
    const volumes = item.variants.map((v) => v.volume).filter(Boolean) as string[]
    if (volumes.length === 0) return null
    if (volumes.length === 1) return volumes[0]
    const first = volumes[0]
    const last = volumes[volumes.length - 1]
    if (first && last && first !== last) {
      return `${first.replace(/\s*мл/i, '')}–${last}`
    }
    return `${item.variants.length} размера`
  }, [item.variants])

  return (
    <div
      className={cx(
        'group relative flex flex-col rounded-panel p-2 pb-2.5 sm:p-2.5 sm:pb-3 text-left transition-all duration-200 has-[[data-open]:active]:scale-97 isolate',
        soldOut
          ? 'bg-surface/50 border-(length:--stroke-width) border-line/40 opacity-60'
          : 'ui-product-card border-(length:--stroke-width) border-transparent',
      )}
    >
      <Button
        data-open
        className="absolute inset-0 rounded-panel cursor-pointer"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
      />

      {/* 1. Media Artwork Container */}
      <div
        className={cx(
          'art-glow mesh-grain pointer-events-none relative grid aspect-square place-items-center overflow-hidden rounded-media sm:rounded-card isolate',
          soldOut && 'opacity-60 grayscale-50',
        )}
        style={{
          '--tint': item.art.bg || 'var(--art-fallback)',
        } as CSSProperties}
      >
        <ItemArt
          ref={artRef}
          art={activeArt}
          imageUrl={activeImageUrl}
          className="relative z-1 h-[90%] w-auto aspect-[200/220] transition-transform duration-300 ease-soft group-hover:-translate-y-1 group-hover:scale-105"
          {...artProps(item.id, CARD_SLOT)}
        />
        {item.badge && (
          <span className="absolute top-2 left-2 rounded-pill bg-accent px-2 py-0.5 text-micro font-display font-bold tracking-wider text-accent-ink uppercase z-2">
            {item.badge}
          </span>
        )}
        {isOnlyCold && (
          <span className="absolute top-2 right-2 rounded-pill bg-cold px-1.5 py-0.5 text-micro font-bold text-white z-2">
            Лёд
          </span>
        )}
      </div>

      {/* 2. Title & Description */}
      <div className={cx('pointer-events-none mx-1 mt-2 font-display text-control sm:text-body-lg leading-(--leading-title) font-bold text-ink line-clamp-1 xs:line-clamp-2', soldOut && 'opacity-60')}>
        {item.name}
      </div>

      {item.description ? (
        <div className={cx('pointer-events-none mx-1 mt-0.5 line-clamp-2 flex-1 text-compact leading-(--leading-copy) text-muted', soldOut && 'opacity-60')}>
          {item.description}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* 3. Bottom Row: Volume on left (if any), Price on right */}
      <div className="mt-2 mx-1 flex items-baseline justify-between gap-1.5 pt-0.5">
        {volumeInfo ? (
          <span className="pointer-events-none text-caption font-medium text-muted truncate">
            {volumeInfo}
          </span>
        ) : (
          <span />
        )}
        <span
          className={cx(
            'pointer-events-none font-display whitespace-nowrap text-caption xs:text-body sm:text-control font-bold text-ink shrink-0 ml-auto',
            soldOut && 'text-caption font-normal text-muted',
          )}
        >
          {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
        </span>
      </div>
    </div>
  )
})
