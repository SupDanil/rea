import { type CSSProperties,memo, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { Button } from '../../components/Button'
import { ItemArt } from '../../components/ItemArt'
import { QuickAddButton } from '../../components/QuickAddButton'
import { isDrink, isSoldOut, itemImage, type MenuItem,minPrice } from '../../domain'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { artProps } from '../../utils/morph'
import { bounce, flyTo } from '../../utils/motion'

/** Where a product sits in the menu feed, as opposed to a promo of the same product. */
export const CARD_SLOT = 'card'

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
  onOpen: (id: string) => void
  isWide?: boolean
}

/**
 * 2026 Bento ProductCard:
 * Hits and featured items expand to 2 bento cells with horizontal layout.
 * Standard cards feature soft tinted drink spots, Unbounded typography, and a liquid glass quick-add "+".
 * Supports hot/cold switching and photo swapping based on user choice.
 */
export const ProductCard = memo(function ProductCard({ item, onOpen }: ProductCardProps) {
  const { cart } = useApp()
  const soldOut = isSoldOut(item)
  const artRef = useRef<SVGSVGElement>(null)
  const [justAdded, setJustAdded] = useState(false)

  const isDrinkItem = isDrink(item)
  const isOnlyCold = item.temperatureMode === 'cold'

  const activeImageUrl = itemImage(item)

  const activeArt = useMemo(() => {
    if (isOnlyCold && item.art.kind === 'cup' && !activeImageUrl) {
      return { ...item.art, kind: 'iced' as const }
    }
    return item.art
  }, [isOnlyCold, item.art, activeImageUrl])

  const quickAdd = () => {
    const variant = item.variants.find((v) => !v.stopped)
    if (!variant) return
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1100)

    // При нажатии на +: если напиток имеет хол/гор или только гор — летит 'hot', если только холодный — 'cold'
    const chosenTemp = isDrinkItem ? (isOnlyCold ? 'cold' : 'hot') : undefined
    const isFirstItem = cart.lines.length === 0
    if (isFirstItem) {
      flushSync(() => {
        cart.add(item.id, variant.id, [], 1, chosenTemp)
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
        cart.add(item.id, variant.id, [], 1, chosenTemp)
        bounce(document.querySelector('[data-cart-target="dock"]'), 0.5)
      }
      if (artRef.current && target) {
        void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 }).then(land)
      } else {
        land()
      }
    }
  }

  // Все товары на главном экране отображаются как стандартные 1-колоночные карточки (широкие только промики из админки)
  return (
    <div
      className={cx(
        'group relative flex flex-col rounded-panel sm:rounded-panel p-2.5 pb-3.5 text-left transition-all duration-200 has-[[data-open]:active]:scale-97 hover:shadow-lift isolate',
        soldOut
          ? 'bg-surface/50 border-(length:--stroke-width) border-line/40 opacity-60'
          : 'bg-surface/90 border-(length:--stroke-width) border-line shadow-card hover:border-line-strong',
      )}
    >
      <Button
        data-open
        className="absolute inset-0 rounded-panel sm:rounded-panel cursor-pointer"
        onClick={() => onOpen(item.id)}
        aria-label={`${item.name}, от ${formatPrice(minPrice(item))}${soldOut ? ', закончилось' : ''}`}
      />

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
          className="relative z-1 h-[84%] w-auto aspect-[200/220] transition-transform duration-300 ease-soft group-hover:-translate-y-1 group-hover:scale-105"
          {...artProps(item.id, CARD_SLOT)}
        />
        {item.badge && (
          <span className="absolute top-2 left-2 rounded-pill bg-accent px-2 py-0.5 text-micro font-display font-bold tracking-wider text-accent-ink uppercase shadow-sm z-2">
            {item.badge}
          </span>
        )}
        {isOnlyCold && (
          <span className="absolute top-2 right-2 rounded-pill bg-cold/80 backdrop-blur-xs px-1.5 py-0.5 text-micro font-bold text-white shadow-xs z-2">
            ❄️ Лёд
          </span>
        )}
      </div>

      <div className={cx('pointer-events-none mx-1.5 mt-2.5 font-display text-control sm:text-body-lg leading-(--leading-title) font-bold text-ink truncate', soldOut && 'opacity-60')}>
        {item.name}
      </div>

      <div className={cx('pointer-events-none mx-1.5 mt-1 line-clamp-2 flex-1 text-caption sm:text-compact leading-(--leading-copy) text-muted', soldOut && 'opacity-60')}>
        {item.description}
      </div>

      <div className="mt-2.5 mr-1 ml-1.5 flex items-center justify-between">
        <span className={cx('pointer-events-none font-display text-body sm:text-control font-bold text-ink', soldOut && 'text-caption font-normal text-muted')}>
          {soldOut ? 'Закончилось' : `${item.variants.length > 1 ? 'от ' : ''}${formatPrice(minPrice(item))}`}
        </span>
        {!soldOut && (
          <QuickAddButton added={justAdded} onClick={quickAdd} aria-label={`Добавить «${item.name}» в корзину`} />
        )}
      </div>
    </div>
  )
})
