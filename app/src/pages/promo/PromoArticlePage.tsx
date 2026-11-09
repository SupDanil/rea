import { type CSSProperties,useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router'

import { IconButton } from '../../components/Button'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { Modal } from '../../components/Modal'
import { QuickAddButton } from '../../components/QuickAddButton'
import { isSoldOut, itemImage,type MenuItem, minPrice, type Promotion } from '../../domain'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useCatalog, useCatalogQuery } from '../../queries/useCatalog'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { artProps } from '../../utils/morph'
import { bounce, flyTo } from '../../utils/motion'

const ARTICLE_SLOT = 'article'

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

export function PromoArticlePage() {
  const { id = '' } = useParams()
  const { isPending } = useCatalogQuery()
  const catalog = useCatalog()
  const promo = catalog.promoById.get(id)

  if (!promo && isPending) {
    return <div className="min-h-dvh" role="status" aria-label="Загружаем акцию" />
  }
  if (!promo) {
    return <Navigate to="/" replace />
  }

  return <PromoArticleView promo={promo} />
}

function PromoArticleView({ promo }: { promo: Promotion }) {
  const { back, go } = useAppNavigate()
  const { cart } = useApp()
  const catalog = useCatalog()

  const linkedItems: MenuItem[] = (promo.productIds || [])
    .map((pid: string) => catalog.itemById.get(pid))
    .filter((item: MenuItem | undefined): item is MenuItem => Boolean(item))

  return (
    <Modal
      label={promo.title}
      onClose={back}
      kind="screen"
      className="brand-article tinted mesh-grain text-ink bg-surface"
      style={{
        '--tint': promo.bgColor || 'var(--promo-fallback)',
        background: 'var(--background-article)',
      } as CSSProperties}
    >
        {/* Header */}
        <header className="flex-none z-30 flex items-center justify-between px-4 pt-[calc(calc(var(--space-unit)*3)+env(safe-area-inset-top))] pb-3 bg-transparent wide:px-6 wide:pt-4 border-b-(length:--stroke-width) border-line/40">
          <IconButton
            className="grid border-(length:--stroke-width) hover:bg-surface-2 text-ink transition-all"
            onClick={back}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </IconButton>

          <span className="font-display text-compact font-bold text-muted uppercase tracking-wider">
            Акция & Спешл
          </span>

          <div className="size-10" />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-12 wide:px-6 space-y-5">
          {/* Hero Cover Image or Graphic */}
          {promo.imageUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-panel border-(length:--stroke-width) border-line shadow-card">
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
              {promo.badge && (
                <span className="absolute top-3 left-3 rounded-pill bg-accent text-accent-ink font-display font-bold px-3 py-1 text-micro uppercase tracking-wider shadow-sm">
                  {promo.badge}
                </span>
              )}
            </div>
          ) : (
            <div
              className="brand-promo-placeholder relative p-6 rounded-panel border-(length:--stroke-width) border-line/50 overflow-hidden shadow-card"
              style={{
                background: 'var(--background-promo-placeholder)',
              }}
            >
              {promo.badge && (
                <span className="inline-block rounded-pill bg-accent text-accent-ink font-display font-bold px-3 py-1 text-micro uppercase tracking-wider mb-2 shadow-sm">
                  {promo.badge}
                </span>
              )}
              <h2 className="font-display text-title font-bold text-ink tracking-tight">
                {promo.title}
              </h2>
            </div>
          )}

          {/* Title & Tagline */}
          <div className="space-y-1.5">
            <h1 className="font-display text-title xs:text-heading sm:text-display font-bold text-ink tracking-tight leading-(--leading-title)">
              {promo.title}
            </h1>
            {promo.subtitle && (
              <p className="font-serif text-body-lg sm:text-lead italic text-ink-2/90 leading-tight">
                {promo.subtitle}
              </p>
            )}
          </div>

          {/* Formatted Text Content */}
          {promo.content && (
            <div className="text-body sm:text-control leading-relaxed text-muted whitespace-pre-line border-t-(length:--stroke-width) border-line/40 pt-4">
              {promo.content}
            </div>
          )}

          {/* Linked Products Section */}
          {linkedItems.length > 0 && (
            <div className="border-t-(length:--stroke-width) border-line/40 pt-5 space-y-3">
              <h3 className="font-display text-body-lg sm:text-lead font-bold text-ink tracking-tight">
                Товары из акции
              </h3>
              <div className="space-y-2.5">
                {linkedItems.map((item) => (
                  <PromoLinkedProductRow
                    key={item.id}
                    item={item}
                    onOpen={() => go(`/product/${item.id}`, { artSlot: ARTICLE_SLOT })}
                    onQuickAdd={() => {
                      const variant = item.variants.find((v) => !v.stopped)
                      if (!variant) return
                      cart.add(item.id, variant.id, [])
                      bounce(document.querySelector('[data-cart-target="dock"]'), 0.5)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
    </Modal>
  )
}

function PromoLinkedProductRow({
  item,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem
  onOpen: () => void
  onQuickAdd: () => void
}) {
  const soldOut = isSoldOut(item)
  const [justAdded, setJustAdded] = useState(false)
  const artRef = useRef<SVGSVGElement>(null)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (soldOut) return
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1000)
    onQuickAdd()

    const target = getCartTarget()
    if (artRef.current && target) {
      void flyTo(artRef.current, target, { duration: 520, endScale: 0.2 })
    }
  }

  return (
    <div
      onClick={onOpen}
      className={cx(
        'group relative flex items-center justify-between p-3 rounded-card border-(length:--stroke-width) border-line bg-surface-2/60 hover:bg-surface-2 transition-all cursor-pointer',
        soldOut && 'opacity-60 grayscale-50',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className="size-14 rounded-2xl flex-none grid place-items-center overflow-hidden border-(length:--stroke-width) border-line/50"
          style={{ '--tint': item.art.bg } as CSSProperties}
        >
          <ItemArt
            ref={artRef}
            art={item.art}
            imageUrl={itemImage(item)}
            className="h-[80%] w-auto"
            {...artProps(item.id, ARTICLE_SLOT)}
          />
        </div>

        <div className="min-w-0">
          <div className="font-display text-control font-bold text-ink truncate">
            {item.name}
          </div>
          <div className="text-caption text-muted line-clamp-1 mt-0.5">
            {item.description}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-none">
        <span className="font-display text-body font-bold text-ink">
          {soldOut ? 'Закончилось' : `от ${formatPrice(minPrice(item))}`}
        </span>

        {!soldOut && (
          <QuickAddButton added={justAdded} onClick={handleAdd} aria-label={`Добавить ${item.name} в корзину`} />
        )}
      </div>
    </div>
  )
}
