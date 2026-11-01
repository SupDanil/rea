import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { PlusIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { isSoldOut, minPrice, type MenuItem } from '../../domain'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { ART_ATTR } from '../../utils/morph'
import { formatPrice } from '../../utils/format'
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

interface ProductCardProps {
  item: MenuItem
  onOpen: () => void
  isWide?: boolean
}

/**
 * 2026 Bento ProductCard:
 * Hits and featured items expand to 2 bento cells with horizontal layout.
 * Standard cards feature soft tinted drink spots, Unbounded typography, and a liquid glass quick-add "+".
 */
export function ProductCard({ item, onOpen, isWide = false }: ProductCardProps) {
  const { cart } = useApp()
  const soldOut = isSoldOut(item)
  const artRef = useRef<SVGSVGElement>(null)
  const [justAdded, setJustAdded] = useState(false)

  const quickAdd = () => {
    const variant = item.variants.find((v) => !v.stopped)
    if (!variant) return
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1100)

    const isFirstItem = cart.lines.length === 0
    if (isFirstItem) {
      flushSync(() => {
        cart.add(item.id, variant.id, [])
      })
      const target = getCartTarget()
      if (artRef.current && target) {
        void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 }).then(() =>
          bounce(document.querySelector('[data-cart-target="dock"]'), 0.5),
        )
      }
    } else {
      const target = getCartTarget()
      const land = () => {
        cart.add(item.id, variant.id, [])
        bounce(document.querySelector('[data-cart-target="dock"]'), 0.5)
      }
      if (artRef.current && target) {
        void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 }).then(land)
      } else {
        land()
      }
    }
  }

  // Bento: 2-column wide card
  if (isWide) {
    return (
      <div
        className={cx(
          'group relative col-span-2 flex items-center justify-between overflow-hidden rounded-[26px] p-4 text-left transition-all duration-200',
          'bg-surface/90 border border-line shadow-card hover:shadow-lift has-[[data-open]:active]:scale-98',
          soldOut && 'opacity-60 grayscale-50',
        )}
      >
        <button
          data-open
          className="absolute inset-0 rounded-[26px] cursor-pointer"
          onClick={onOpen}
          aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
        />

        <div className="pointer-events-none flex-1 pr-3 z-1 min-w-0">
          {item.badge && (
            <span className="inline-block rounded-full bg-accent/10 border border-accent/30 px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wider text-accent uppercase mb-1.5">
              {item.badge}
            </span>
          )}
          <div className="font-display text-[17px] sm:text-[18px] font-bold text-ink truncate">
            {item.name}
          </div>
          <div className="line-clamp-2 text-[12px] sm:text-[13px] text-muted mt-1 leading-relaxed">
            {item.description}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-[15px] sm:text-[16px] font-bold text-ink">
              {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
            </span>
            {!soldOut && (
              <button
                className={cx(
                  'pointer-events-auto relative z-2 grid size-8 sm:size-9 place-items-center rounded-full cursor-pointer shadow-sm transition-all duration-150 active:scale-90',
                  justAdded
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface border border-glass-border text-ink hover:bg-accent hover:text-accent-ink hover:border-transparent',
                )}
                onClick={quickAdd}
                aria-label={`Добавить «${item.name}» в корзину`}
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
          </div>
        </div>

        <div
          className="art-glow pointer-events-none relative grid size-28 sm:size-32 flex-none place-items-center overflow-hidden rounded-[20px]"
          style={{ '--tint': item.art.bg } as CSSProperties}
        >
          <ItemArt
            ref={artRef}
            art={item.art}
            className="h-[88%] w-auto transition-transform duration-300 ease-soft group-hover:scale-105"
            {...{ [ART_ATTR]: item.id }}
          />
        </div>
      </div>
    )
  }

  // Bento: 1-column standard card
  return (
    <div
      className={cx(
        'group relative flex flex-col rounded-[24px] sm:rounded-[26px] p-2.5 pb-3.5 text-left transition-all duration-200 has-[[data-open]:active]:scale-97 hover:shadow-lift',
        soldOut
          ? 'bg-surface/50 border border-line/40 opacity-60'
          : 'bg-surface/90 border border-line shadow-card hover:border-line-strong',
      )}
    >
      <button
        data-open
        className="absolute inset-0 rounded-[24px] sm:rounded-[26px] cursor-pointer"
        onClick={onOpen}
        aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
      />

      <div
        className={cx(
          'art-glow pointer-events-none relative grid aspect-square place-items-center overflow-hidden rounded-[18px] sm:rounded-[20px]',
          soldOut && 'opacity-60 grayscale-50',
        )}
        style={{ '--tint': item.art.bg } as CSSProperties}
      >
        <ItemArt
          ref={artRef}
          art={item.art}
          className="h-[84%] w-auto aspect-[200/220] transition-transform duration-300 ease-soft group-hover:-translate-y-1 group-hover:scale-105"
          {...{ [ART_ATTR]: item.id }}
        />
        {item.badge && (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-display font-bold tracking-wider text-accent-ink uppercase shadow-sm">
            {item.badge}
          </span>
        )}
      </div>

      <div className={cx('pointer-events-none mx-1.5 mt-2.5 font-display text-[15px] sm:text-[16px] leading-[1.2] font-bold text-ink truncate', soldOut && 'opacity-60')}>
        {item.name}
      </div>

      <div className={cx('pointer-events-none mx-1.5 mt-1 line-clamp-2 flex-1 text-[12px] sm:text-[13px] leading-[1.4] text-muted', soldOut && 'opacity-60')}>
        {item.description}
      </div>

      <div className="mt-2.5 mr-1 ml-1.5 flex items-center justify-between">
        <span className={cx('pointer-events-none font-display text-[14px] sm:text-[15px] font-bold text-ink', soldOut && 'text-[12px] font-normal text-muted')}>
          {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
        </span>
        {!soldOut && (
          <button
            className={cx(
              'relative z-1 grid size-8 sm:size-9 place-items-center rounded-full cursor-pointer shadow-sm transition-all duration-150 active:scale-90',
              justAdded
                ? 'bg-accent text-accent-ink'
                : 'bg-surface border border-glass-border text-ink hover:bg-accent hover:text-accent-ink hover:border-transparent',
            )}
            onClick={quickAdd}
            aria-label={`Добавить «${item.name}» в корзину`}
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
      </div>
    </div>
  )
}
