import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { PlusIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { isSoldOut, minPrice, type MenuItem } from '../../data/menu'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { ART_ATTR } from '../../utils/morph'
import { formatPrice } from '../../utils/format'
import { bounce, flyTo } from '../../utils/motion'

/** Where a quick-added item lands: always the bottom cart dock's badge. */
function getCartTarget(): Element | DOMRect {
  const badge = document.querySelector('[data-cart-badge]')
  if (badge) return badge
  const dock = document.querySelector('[data-cart-target="dock"]')
  if (dock) return dock
  // Fallback to the bottom position where the dock appears, never the top header
  const maxW = Math.min(typeof window !== 'undefined' ? window.innerWidth : 480, 480)
  const left = ((typeof window !== 'undefined' ? window.innerWidth : 480) - maxW) / 2 + 16
  const top = (typeof window !== 'undefined' ? window.innerHeight : 800) - 68
  return new DOMRect(left, top, 44, 44)
}

export function ProductCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const { cart } = useApp()
  const soldOut = isSoldOut(item)
  const artRef = useRef<SVGSVGElement>(null)
  const [justAdded, setJustAdded] = useState(false)

  // "+" adds the default size with no add-ons; the card itself opens the full configurator.
  const quickAdd = () => {
    const variant = item.variants.find((v) => !v.stopped)
    if (!variant) return
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1100)

    const isFirstItem = cart.lines.length === 0
    if (isFirstItem) {
      // First item: mount the bottom dock immediately so it rises up to meet the incoming cup,
      // and the cup flies down into the newly revealed bottom dock.
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
      // Subsequent items: dock is already up at the bottom, fly down to the badge and bump count on impact.
      const target = getCartTarget()
      const land = () => {
        cart.add(item.id, variant.id, [])
        // The badge remounts on the new count (and pops itself); nudge the whole bar.
        bounce(document.querySelector('[data-cart-target="dock"]'), 0.5)
      }
      if (artRef.current && target) {
        void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 }).then(land)
      } else {
        land()
      }
    }
  }

  return (
    <div
      className={cx(
        'group relative flex flex-col rounded-[24px] px-1.5 pt-1.5 pb-3 text-left [transition:transform_0.18s_var(--ease-soft),scale_0.18s_var(--ease-soft),box-shadow_0.18s,background-color_0.3s_ease] has-[[data-open]:active]:scale-97',
        soldOut ? 'bg-[color-mix(in_oklab,var(--surface)_55%,transparent)]' : 'bg-surface shadow-card hover:shadow-lift',
      )}
    >
      {/* The whole card opens the product; the "+" sits above this layer. */}
      <button
        data-open
        className="absolute inset-0 rounded-[24px]"
        onClick={onOpen}
        aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
      />
      <div
        className={cx('art-glow pointer-events-none relative grid aspect-square place-items-center overflow-hidden rounded-[19px]', soldOut && 'opacity-55 grayscale-70')}
        style={{ '--tint': item.art.bg } as CSSProperties}
      >
        <ItemArt
          ref={artRef}
          art={item.art}
          className="h-[84%] w-auto aspect-[200/220] transition-transform duration-300 ease-soft group-hover:-translate-y-[3px] group-hover:scale-103"
          {...{ [ART_ATTR]: item.id }}
        />
        {item.badge && (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-1 text-[10px] font-extrabold tracking-[0.04em] text-accent-ink uppercase">
            {item.badge}
          </span>
        )}
      </div>
      <div className={cx('pointer-events-none mx-2 mt-2.5 text-[15px] leading-[1.2] font-bold tracking-[-0.015em]', soldOut && 'opacity-55')}>{item.name}</div>
      <div className={cx('pointer-events-none mx-2 mt-1 line-clamp-2 flex-1 text-[12px] leading-[1.35] text-muted', soldOut && 'opacity-55')}>
        {item.description}
      </div>
      <div className="mt-2 sm:mt-2.5 mr-1 ml-1.5 sm:ml-2 flex items-center justify-between">
        <span className={cx('pointer-events-none text-[14px] sm:text-[15px] font-bold', soldOut && 'text-[12px] sm:text-[13px] font-semibold text-muted')}>
          {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
        </span>
        {!soldOut && (
          <button
            className={cx(
              'relative z-1 grid size-7 sm:size-8 place-items-center rounded-full transition-[background,color,scale] duration-200 ease-[ease] active:scale-88',
              justAdded ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink hover:bg-accent hover:text-accent-ink',
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
