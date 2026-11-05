import { useState, useRef, type CSSProperties } from 'react'
import { PlusIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { isSoldOut, itemImage, minPrice, type MenuItem, type Promotion } from '../../domain'
import { useAmbientWhileVisible } from '../../hooks/useAmbientWhileVisible'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { bounce, flyTo } from '../../utils/motion'
import { artProps } from '../../utils/morph'

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
  const tint = isProduct && product ? product.art.bg : promo.bgColor || '#E88B4C'
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

  return (
    <div
      ref={rootRef}
      onClick={onOpen}
      className={cx(
        'tinted mesh-grain group relative flex flex-col justify-center overflow-hidden rounded-[28px] sm:rounded-[32px] text-left text-ink border border-white/20 shadow-lift transition-transform active:scale-[0.99] cursor-pointer',
        '[background:radial-gradient(110%_90%_at_75%_35%,var(--glow)_0%,transparent_60%),radial-gradient(80%_60%_at_20%_80%,rgba(196,91,36,0.1)_0%,transparent_60%),var(--tinted)]',
        isHero
          ? 'mx-2.5 sm:mx-3 mt-1 w-[calc(100%-20px)] sm:w-[calc(100%-24px)] wide:max-w-[1240px] wide:mx-auto'
          : 'col-span-2 h-full w-full',
      )}
      style={{ '--tint': tint } as CSSProperties}
      data-promo-id={promo.id}
    >
      <div
        className={cx(
          'grid h-full items-center px-4 sm:px-6 wide:px-7 lg:px-8 py-4 sm:py-5 wide:py-6 animate-[fade-in_0.4s_var(--ease-soft)]',
          isHero
            ? 'min-h-[220px] sm:min-h-[260px] wide:min-h-[300px] lg:min-h-[340px] grid-cols-2'
            : 'min-h-[200px] sm:min-h-[230px] wide:min-h-full grid-cols-2',
        )}
      >
        {/* Right Art or Photo */}
        <div className="relative flex h-full justify-center items-center py-2">
          {isProduct && product ? (
            <div data-ambient className="flex h-full w-full items-center justify-center animate-[float_6s_ease-in-out_2]">
              <ItemArt
                ref={artRef}
                art={product.art}
                imageUrl={itemImage(product)}
                className={cx(
                  'block h-full w-auto drop-shadow-[0_16px_32px_rgba(0,0,0,0.18)] object-contain transition-transform duration-300 ease-soft group-hover:scale-105',
                  isHero
                    ? 'max-h-[170px] sm:max-h-[210px] wide:max-h-[270px] lg:max-h-[320px]'
                    : 'max-h-[160px] sm:max-h-[200px] wide:max-h-[260px] lg:max-h-[300px]',
                )}
                {...artProps(product.id, promo.id)}
              />
            </div>
          ) : promo.imageUrl ? (
            <div data-ambient className="relative aspect-[4/3] w-full max-w-[200px] sm:max-w-[260px] wide:max-w-[300px] lg:max-w-[340px] rounded-[22px] overflow-hidden border border-white/30 shadow-card animate-[float_6s_ease-in-out_2]">
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div data-ambient className="size-28 sm:size-36 wide:size-44 lg:size-48 rounded-full bg-white/20 border border-white/30 flex items-center justify-center animate-[float_6s_ease-in-out_2]">
              <span className="text-[36px] sm:text-[44px] lg:text-[56px]">✨</span>
            </div>
          )}
        </div>

        {/* Left Copy & Actions */}
        <div className="-order-1 flex flex-col justify-center h-full py-2 pr-3 sm:pr-4 wide:pr-6">
          {/* Badge */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-black/40 px-3 py-1 text-[11px] sm:text-[12px] font-display font-bold tracking-wider text-accent uppercase border border-white/30 shadow-xs">
              <span data-ambient className="size-1.5 rounded-full bg-accent animate-[pulse_2s_ease-in-out_3]" />
              {badgeText}
            </div>
          </div>

          {/* Title */}
          <div
            className={cx(
              'mt-2.5 font-display leading-[1.1] font-bold tracking-tight text-ink animate-[title-breathe_0.5s_var(--spring)]',
              isHero
                ? 'text-[20px] xs:text-[22px] sm:text-[28px] wide:text-[34px] lg:text-[38px]'
                : 'text-[19px] xs:text-[21px] sm:text-[24px] wide:text-[26px] lg:text-[28px]',
            )}
          >
            {promo.title}
          </div>

          {/* Subtitle / Tagline */}
          {promo.subtitle && (
            <div className="mt-1.5 font-serif text-[14px] sm:text-[16px] wide:text-[17px] italic text-ink-2/90 leading-tight line-clamp-1">
              {promo.subtitle}
            </div>
          )}

          {/* Description (from promo content or product) */}
          <div className="mt-1.5 line-clamp-2 text-[12px] sm:text-[13px] wide:text-[14px] leading-[1.4] text-muted">
            {isProduct && product ? product.description : promo.content || ''}
          </div>

          {/* Action Row */}
          <div className="mt-4 flex items-center gap-2.5">
            {isProduct && product ? (
              <>
                <span className="inline-block rounded-full bg-accent text-accent-ink font-display font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-[14px] wide:text-[15px] shadow-sm">
                  от {formatPrice(minPrice(product))}
                </span>

                {!soldOut && (
                  <button
                    onClick={quickAdd}
                    className={cx(
                      'size-8 sm:size-9 wide:size-10 rounded-full grid place-items-center transition-all cursor-pointer active:scale-90 shadow-sm',
                      justAdded
                        ? 'bg-accent text-accent-ink'
                        : 'bg-white/80 dark:bg-black/40 border border-white/30 text-ink hover:bg-accent hover:text-accent-ink hover:border-transparent',
                    )}
                    aria-label={`Быстро добавить «${product.name}» в корзину`}
                  >
                    {justAdded ? (
                      <svg key="done" className="animate-pop" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <PlusIcon />
                    )}
                  </button>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-ink font-display font-bold px-4 sm:px-5 py-1.5 sm:py-2 text-[12px] sm:text-[13px] wide:text-[14px] shadow-sm">
                <span>Подробнее</span>
                <span className="text-[14px] leading-none">→</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
