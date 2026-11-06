import { type CSSProperties,useRef, useState } from 'react'

import { Button } from '../../components/Button'
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

/** Shared promotional surface; artwork and tint come from the catalog. */
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
  const hasArtwork = Boolean(product || promo.imageUrl)
  const artHeight = isHero ? 'max-h-42.5 sm:max-h-52.5 wide:max-h-67.5 lg:max-h-80' : 'max-h-40 sm:max-h-50 wide:max-h-65 lg:max-h-75'

  return (
    <div
      ref={rootRef}
      className={cx(
        'tinted mesh-grain group relative flex flex-col justify-center overflow-hidden rounded-dialog sm:rounded-dialog text-left text-ink shadow-card transition-transform active:scale-[0.99] cursor-pointer isolate',
        'brand-promo [background:var(--background-promo)]',
        isHero
          ? 'mx-2.5 sm:mx-3 mt-1 w-[calc(100%-calc(var(--space-unit)*5))] sm:w-[calc(100%-calc(var(--space-unit)*6))] wide:max-w-(--layout-hero) wide:mx-auto'
          : 'col-span-2 h-full w-full',
      )}
      style={{ '--tint': tint } as CSSProperties}
      data-promo-id={promo.id}
    >
      <Button onClick={onOpen} aria-label={`Подробнее: ${promo.title}`} className="ui-promo-open absolute inset-0 z-10 rounded-dialog" />
      <div
        className={cx(
          'pointer-events-none grid h-full items-center px-4 sm:px-6 wide:px-7 lg:px-8 py-4 sm:py-5 wide:py-6 animate-[fade-in_0.4s_var(--ease-soft)]',
          isHero
            ? 'min-h-52 sm:min-h-60 wide:min-h-75 lg:min-h-85'
            : 'min-h-50 sm:min-h-57.5 wide:min-h-full',
          hasArtwork ? (isHero ? 'grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]') : 'grid-cols-1',
        )}
      >
        {/* Right Art or Photo */}
        {hasArtwork && <div className="relative flex h-full justify-center items-center py-2">
          {product && (isProduct || !promo.imageUrl) ? (
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
            <div data-ambient className="relative aspect-[4/3] w-full max-w-50 sm:max-w-65 wide:max-w-75 lg:max-w-(--layout-dialog-sm) rounded-card overflow-hidden animate-[float_6s_ease-in-out_2]">
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>}

        {/* Left Copy & Actions */}
        <div className="-order-1 flex flex-col justify-center h-full py-2 pr-3 sm:pr-4 wide:pr-6">
          {/* Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 text-caption font-semibold tracking-wide text-accent uppercase">
              <span className="size-1.5 rounded-pill bg-accent" />
              {badgeText}
            </div>
          </div>

          {/* Title */}
          <div
            className={cx(
              'mt-2.5 font-display leading-(--leading-title) font-bold tracking-tight text-balance text-ink animate-[title-breathe_0.5s_var(--spring)]',
              isHero
                ? 'text-body-lg xs:text-title-sm sm:text-heading wide:text-display lg:text-hero'
                : 'text-body xs:text-body-lg sm:text-title wide:text-heading lg:text-heading',
            )}
          >
            {promo.title}
          </div>

          {/* One concise preview; full admin copy remains in the product/article. */}
          {(promo.subtitle || product?.description || promo.content) && (
            <p className="mt-2 line-clamp-2 text-compact sm:text-body wide:text-body-lg text-ink-2 leading-(--leading-copy)">
              {promo.subtitle || (isProduct && product ? product.description : promo.content)}
            </p>
          )}

          {/* Action Row */}
          <div className="mt-4 flex items-center gap-2.5">
            {isProduct && product ? (
              <>
                <span className="inline-block font-display font-bold text-ink text-body sm:text-control wide:text-lead">
                  от {formatPrice(minPrice(product))}
                </span>

                {!soldOut && (
                  <QuickAddButton className="pointer-events-auto relative z-20" added={justAdded} onClick={quickAdd} aria-label={`Быстро добавить «${product.name}» в корзину`} />
                )}
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={onOpen} className="pointer-events-auto relative z-20 inline-flex items-center gap-2">
                <span>Подробнее</span>
                <span aria-hidden="true" className="text-body leading-none">→</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
