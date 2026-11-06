import { type CSSProperties,useRef, useState } from 'react'

import { ArtGlow, ItemArt } from '../../components/ItemArt'
import { QuickAddButton } from '../../components/QuickAddButton'
import { isSoldOut, itemImage, type MenuItem, minPrice, type Promotion } from '../../domain'
import { useAmbientWhileVisible } from '../../hooks/useAmbientWhileVisible'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { artProps } from '../../utils/morph'
import { bounce, flyTo } from '../../utils/motion'

function getCartTarget(): Element | DOMRect {
  const badge = document.querySelector('[data-cart-badge]')
  if (badge) return badge
  const dock = document.querySelector('[data-cart-target="dock"]')
  if (dock) return dock
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 600
  if (isDesktop) {
    const left = (typeof window !== 'undefined' ? window.innerWidth : 1000) - 240
    const top = (typeof window !== 'undefined' ? window.innerHeight : 800) - 68
    return new DOMRect(left, top, 44, 44)
  }
  const maxW = Math.min(typeof window !== 'undefined' ? window.innerWidth : 480, 480)
  const left = ((typeof window !== 'undefined' ? window.innerWidth : 480) - maxW) / 2 + 16
  const top = (typeof window !== 'undefined' ? window.innerHeight : 800) - 68
  return new DOMRect(left, top, 44, 44)
}

interface PromoBannerProps {
  promo: Promotion
  product?: MenuItem
  onOpen: () => void
  variant?: 'hero' | 'category'
}

/**
 * 2026 Liquid Glass Bento PromoBanner:
 * Unified design system for both main hero and category promo cards.
 * Supports:
 * 1) Target === 'product': Product art, auto background tint, price, and interactive '+' quick-buy.
 * 2) Target === 'article': Uploaded photo / brand tint, teaser text, and 'Подробнее →' action.
 */
export function PromoBanner({
  promo,
  product,
  onOpen,
  variant = 'hero',
}: PromoBannerProps) {
  const { cart } = useApp()
  const isProduct = promo.targetType === 'product' && Boolean(product)
  const [justAdded, setJustAdded] = useState(false)
  const artRef = useRef<SVGSVGElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useAmbientWhileVisible(rootRef)

  const soldOut = isProduct && product ? isSoldOut(product) : false
  const tint = isProduct && product ? product.art.bg : promo.bgColor || 'var(--promo-fallback)'
  const badgeText = promo.badge ?? (isProduct && product?.badge ? product.badge : 'Рекомендуем')

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!product || soldOut) return

    const selectedVariant = product.variants.find((v) => !v.stopped)
    if (!selectedVariant) return

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1100)

    cart.add(product.id, selectedVariant.id, [])
    bounce(document.querySelector('[data-cart-target="dock"]'), 0.5)

    const target = getCartTarget()
    if (artRef.current && target) {
      void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 })
    }
  }

  const isHero = variant === 'hero'
  const artHeight = isHero ? 'max-h-42.5 sm:max-h-52.5 wide:max-h-67.5 lg:max-h-80' : 'max-h-40 sm:max-h-50 wide:max-h-65 lg:max-h-75'

  return (
    <div
      ref={rootRef}
      onClick={onOpen}
      className={cx(
        'tinted mesh-grain group relative flex flex-col justify-center overflow-hidden rounded-dialog sm:rounded-dialog text-left text-ink border-(length:--stroke-width) border-white/20 shadow-lift transition-transform active:scale-[0.99] cursor-pointer isolate',
        'brand-promo [background:var(--background-promo)]',
        isHero
          ? 'mx-2.5 sm:mx-3 mt-1 w-[calc(100%-calc(var(--space-unit)*5))] sm:w-[calc(100%-calc(var(--space-unit)*6))] wide:max-w-(--layout-hero) wide:mx-auto'
          : 'col-span-2 h-full w-full',
      )}
      style={{ '--tint': tint } as CSSProperties}
      data-promo-id={promo.id}
    >
      <div
        className={cx(
          'grid h-full items-center px-4 sm:px-6 wide:px-7 lg:px-8 py-4 sm:py-5 wide:py-6 animate-[fade-in_0.4s_var(--ease-soft)]',
          isHero
            ? 'min-h-55 sm:min-h-65 wide:min-h-75 lg:min-h-85 grid-cols-2'
            : 'min-h-50 sm:min-h-57.5 wide:min-h-full grid-cols-2',
        )}
      >
        {/* Right Art or Photo */}
        <div className="relative flex h-full justify-center items-center py-2">
          {isProduct && product ? (
            <div data-ambient className="relative flex h-full w-full items-center justify-center animate-[float_6s_ease-in-out_2]">
              {/* Stays while the art is away, so it is already there when the cup flies back. */}
              <ArtGlow color="var(--art-glow)" className={cx('left-1/2 top-[56%] -translate-1/2 aspect-square h-full', artHeight)} />
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
            <div data-ambient className="relative aspect-[4/3] w-full max-w-50 sm:max-w-65 wide:max-w-75 lg:max-w-(--layout-dialog-sm) rounded-card overflow-hidden border-(length:--stroke-width) border-white/30 shadow-card animate-[float_6s_ease-in-out_2]">
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div data-ambient className="size-28 sm:size-36 wide:size-44 lg:size-48 rounded-pill bg-white/20 border-(length:--stroke-width) border-white/30 flex items-center justify-center animate-[float_6s_ease-in-out_2]">
              <span className="text-display sm:text-hero lg:text-showcase">✨</span>
            </div>
          )}
        </div>

        {/* Left Copy & Actions */}
        <div className="-order-1 flex flex-col justify-center h-full py-2 pr-3 sm:pr-4 wide:pr-6">
          {/* Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-white/70 dark:bg-black/40 px-3 py-1 text-micro sm:text-caption font-display font-bold tracking-wider text-accent uppercase border-(length:--stroke-width) border-white/30 shadow-xs">
              <span data-ambient className="size-1.5 rounded-pill bg-accent animate-[pulse_2s_ease-in-out_3]" />
              {badgeText}
            </div>
          </div>

          {/* Title */}
          <div
            className={cx(
              'mt-2.5 font-display leading-(--leading-display) font-bold tracking-tight text-ink animate-[title-breathe_0.5s_var(--spring)]',
              isHero
                ? 'text-title-sm xs:text-title sm:text-heading wide:text-display lg:text-hero'
                : 'text-lead xs:text-title-sm sm:text-title wide:text-heading lg:text-heading',
            )}
          >
            {promo.title}
          </div>

          {/* Subtitle / Tagline */}
          {promo.subtitle && (
            <div className="mt-1.5 font-serif text-body sm:text-body-lg wide:text-body-lg italic text-ink-2/90 leading-tight line-clamp-1">
              {promo.subtitle}
            </div>
          )}

          {/* Description (from promo content or product) */}
          <div className="mt-1.5 line-clamp-2 text-caption sm:text-compact wide:text-body leading-(--leading-copy) text-muted">
            {isProduct && product ? product.description : promo.content || ''}
          </div>

          {/* Action Row */}
          <div className="mt-4 flex items-center gap-2.5">
            {isProduct && product ? (
              <>
                <span className="inline-block rounded-pill bg-accent text-accent-ink font-display font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 text-compact sm:text-body wide:text-control shadow-sm">
                  от {formatPrice(minPrice(product))}
                </span>

                {!soldOut && (
                  <QuickAddButton added={justAdded} onClick={quickAdd} aria-label={`Быстро добавить «${product.name}» в корзину`} />
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent text-accent-ink font-display font-bold px-4 sm:px-5 py-1.5 sm:py-2 text-caption sm:text-compact wide:text-body shadow-sm">
                <span>Подробнее</span>
                <span className="text-body leading-none">→</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
