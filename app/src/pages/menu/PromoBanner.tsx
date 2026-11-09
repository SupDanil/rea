import { type CSSProperties, useMemo, useRef } from 'react'

import { Button } from '../../components/Button'
import { ArtGlow, ItemArt } from '../../components/ItemArt'
import { isSoldOut, itemImage, type MenuItem, minPrice, type Promotion } from '../../domain'
import { useAmbientWhileVisible } from '../../hooks/useAmbientWhileVisible'
import { cx } from '../../utils/cx'
import { formatPrice, plural } from '../../utils/format'
import { artProps } from '../../utils/morph'

interface PromoBannerProps {
  promo: Promotion
  product?: MenuItem
  onOpen: () => void
  variant?: 'hero' | 'category'
}

/** Shared promotional surface; artwork and tint come from the catalog. Pure transition navigation without quick-add. */
export function PromoBanner({
  promo,
  product,
  onOpen,
  variant = 'hero',
}: PromoBannerProps) {
  const isProduct = promo.targetType === 'product' && Boolean(product)
  const artRef = useRef<SVGSVGElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useAmbientWhileVisible(rootRef)

  const soldOut = isProduct && product ? isSoldOut(product) : false
  const tint = isProduct && product ? product.art.bg : promo.bgColor || 'var(--promo-fallback)'
  const badgeText = promo.badge ?? (isProduct && product?.badge ? product.badge : 'Рекомендуем')
  const isColdOnly = isProduct && product?.temperatureMode === 'cold'

  // Extract clean volume or size range info from product variants
  const volumeInfo = useMemo(() => {
    if (!product) return null
    const volumes = product.variants.map((v) => v.volume).filter(Boolean) as string[]
    if (volumes.length === 0) return null
    if (volumes.length === 1) return volumes[0]
    const first = volumes[0]
    const last = volumes[volumes.length - 1]
    if (first && last && first !== last) {
      return `${first.replace(/\s*мл/i, '')}–${last}`
    }
    return `${product.variants.length} размера`
  }, [product])

  const attachedCount = promo.productIds?.length ?? 0
  const isHero = variant === 'hero'
  const hasArtwork = Boolean(product || promo.imageUrl)
  const artHeight = isHero
    ? 'max-h-36 xs:max-h-42.5 sm:max-h-52.5 wide:max-h-67.5 lg:max-h-80'
    : 'max-h-32 xs:max-h-38 sm:max-h-48 wide:max-h-60 lg:max-h-70'

  return (
    <div
      ref={rootRef}
      className={cx(
        'tinted mesh-grain group relative flex flex-col justify-center overflow-hidden rounded-dialog text-left text-ink shadow-card transition-all active:scale-[0.99] cursor-pointer isolate',
        'brand-promo [background:var(--background-promo)]',
        isHero
          ? 'mx-2.5 sm:mx-3 mt-1 w-[calc(100%-calc(var(--space-unit)*5))] sm:w-[calc(100%-calc(var(--space-unit)*6))] wide:max-w-(--layout-hero) wide:mx-auto'
          : 'col-span-2 h-full w-full',
      )}
      style={{ '--tint': tint } as CSSProperties}
      data-promo-id={promo.id}
    >
      <Button
        onClick={onOpen}
        aria-label={`Подробнее: ${promo.title}`}
        className="ui-promo-open absolute inset-0 z-10 rounded-dialog cursor-pointer"
      />

      <div
        className={cx(
          'pointer-events-none grid h-full items-center animate-[fade-in_0.4s_var(--ease-soft)]',
          isHero
            ? 'min-h-48 xs:min-h-52 sm:min-h-60 wide:min-h-75 lg:min-h-85 px-3.5 xs:px-4 sm:px-6 wide:px-7 lg:px-8 py-3.5 xs:py-4 sm:py-5 wide:py-6'
            : 'min-h-44 xs:min-h-48 sm:min-h-54 wide:min-h-full px-3.5 xs:px-4 sm:px-5 py-3 xs:py-3.5 sm:py-4.5',
          hasArtwork
            ? isHero
              ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] wide:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'
              : 'grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
            : 'grid-cols-1',
        )}
      >
        {/* Left Copy & Actions */}
        <div className="flex flex-col justify-center h-full py-1 pr-2 xs:pr-3 sm:pr-4 wide:pr-6 z-1">
          {/* Badges & Meta Chips */}
          <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
            <span className="ui-promo-badge shrink-0">
              <span className="size-2 rounded-pill bg-accent flex-none animate-pulse" />
              <span>{badgeText}</span>
            </span>

            {isColdOnly && (
              <span className="ui-promo-chip ui-promo-chip--cold shrink-0">
                Лёд
              </span>
            )}

            {volumeInfo && (
              <span className="ui-promo-chip hidden sm:inline-flex">
                {volumeInfo}
              </span>
            )}

            {!isProduct && attachedCount > 0 && (
              <span className="ui-promo-chip hidden sm:inline-flex">
                {attachedCount} {plural(attachedCount, 'товар', 'товара', 'товаров')}
              </span>
            )}
          </div>

          {/* Title */}
          <div
            className={cx(
              'mt-2 xs:mt-2.5 font-display leading-(--leading-title) font-bold tracking-tight text-balance text-ink animate-[title-breathe_0.5s_var(--spring)]',
              isHero
                ? 'text-body-lg xs:text-title-sm sm:text-heading wide:text-display lg:text-hero'
                : 'text-body xs:text-body-lg sm:text-title wide:text-heading',
            )}
          >
            {promo.title}
          </div>

          {/* Subtitle / Description preview */}
          {(promo.subtitle || product?.description || promo.content) && (
            <p className="mt-1.5 xs:mt-2 line-clamp-2 text-compact sm:text-body wide:text-body-lg text-ink-2 leading-(--leading-copy)">
              {promo.subtitle || (isProduct && product ? product.description : promo.content)}
            </p>
          )}

          {/* Action Row - Pure Transition Navigation (NO + QuickAddButton!) */}
          <div className="mt-3 xs:mt-4 flex flex-wrap items-center gap-2 xs:gap-3">
            {isProduct && product ? (
              soldOut ? (
                <span className="inline-flex items-center rounded-pill bg-surface/60 border border-line/50 px-2.5 py-1 text-caption font-semibold text-muted">
                  Закончился
                </span>
              ) : (
                <>
                  <span className="font-display font-bold text-ink text-body xs:text-control wide:text-lead">
                    от {formatPrice(minPrice(product))}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpen}
                    className="pointer-events-auto relative z-20 inline-flex items-center gap-1 min-h-9 px-3.5 text-caption xs:text-compact font-bold shadow-xs transition-transform group-hover:scale-105"
                  >
                    <span>Выбрать</span>
                    <span aria-hidden="true" className="leading-none transition-transform group-hover:translate-x-0.5">→</span>
                  </Button>
                </>
              )
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpen}
                className="pointer-events-auto relative z-20 inline-flex items-center gap-1 min-h-9 px-3.5 text-caption xs:text-compact font-bold shadow-xs transition-transform group-hover:scale-105"
              >
                <span>Подробнее</span>
                <span aria-hidden="true" className="leading-none transition-transform group-hover:translate-x-0.5">→</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right Art or Photo */}
        {hasArtwork && (
          <div className="relative flex h-full justify-center items-center py-2">
            {product && (isProduct || !promo.imageUrl) ? (
              <div data-ambient className="relative flex h-full w-full items-center justify-center animate-[float_6s_ease-in-out_2]">
                <ArtGlow
                  color="var(--art-glow)"
                  className={cx('left-1/2 top-[56%] -translate-1/2 aspect-square h-full', artHeight)}
                />
                <ItemArt
                  ref={artRef}
                  art={product.art}
                  imageUrl={itemImage(product)}
                  className={cx(
                    'relative block h-full w-auto object-contain transition-transform duration-300 ease-soft group-hover:scale-105',
                    artHeight,
                  )}
                  {...artProps(product.id, promo.id)}
                />
              </div>
            ) : promo.imageUrl ? (
              <div
                data-ambient
                className="relative aspect-[4/3] w-full max-w-50 sm:max-w-65 wide:max-w-75 lg:max-w-(--layout-dialog-sm) rounded-card overflow-hidden shadow-xs border border-line/30 animate-[float_6s_ease-in-out_2]"
              >
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
