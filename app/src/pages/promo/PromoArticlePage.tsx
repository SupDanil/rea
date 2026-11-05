import { useState, useRef, type CSSProperties } from 'react'
import { Navigate, useParams } from 'react-router'
import { CloseIcon, PlusIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { Modal } from '../../components/Modal'
import { isSoldOut, minPrice, type MenuItem, itemImage } from '../../domain'
import { useCatalog, useCatalogQuery } from '../../queries/useCatalog'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { bounce, flyTo } from '../../utils/motion'
import { artProps } from '../../utils/morph'

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

function PromoArticleView({ promo }: { promo: any }) {
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
      className="tinted mesh-grain text-ink bg-surface"
      style={{
        '--tint': promo.bgColor || '#E88B4C',
        background: `radial-gradient(ellipse 90% 45% at 50% 15%, color-mix(in srgb, var(--tint, #E88B4C) 18%, transparent) 0%, transparent 75%),
                     var(--surface)`,
      } as CSSProperties}
    >
        {/* Header */}
        <header className="flex-none z-30 flex items-center justify-between px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3 bg-transparent wide:px-6 wide:pt-4 border-b border-line/40">
          <button
            className="size-10 grid place-items-center rounded-full bg-surface border border-line hover:bg-surface-2 text-ink transition-all active:scale-95 cursor-pointer shadow-xs"
            onClick={back}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>

          <span className="font-display text-[13px] font-bold text-muted uppercase tracking-wider">
            Акция & Спешл
          </span>

          <div className="size-10" />
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-12 wide:px-6 space-y-5">
          {/* Hero Cover Image or Graphic */}
          {promo.imageUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] border border-line shadow-card">
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
              {promo.badge && (
                <span className="absolute top-3 left-3 rounded-full bg-accent text-accent-ink font-display font-bold px-3 py-1 text-[11px] uppercase tracking-wider shadow-sm">
                  {promo.badge}
                </span>
              )}
            </div>
          ) : (
            <div
              className="relative p-6 rounded-[24px] border border-line/50 overflow-hidden shadow-card"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, var(--tint) 25%, var(--surface)) 0%, var(--surface) 100%)`,
              }}
            >
              {promo.badge && (
                <span className="inline-block rounded-full bg-accent text-accent-ink font-display font-bold px-3 py-1 text-[11px] uppercase tracking-wider mb-2 shadow-sm">
                  {promo.badge}
                </span>
              )}
              <h2 className="font-display text-[22px] font-bold text-ink tracking-tight">
                {promo.title}
              </h2>
            </div>
          )}

          {/* Title & Tagline */}
          <div className="space-y-1.5">
            <h1 className="font-display text-[24px] xs:text-[26px] sm:text-[30px] font-bold text-ink tracking-tight leading-[1.12]">
              {promo.title}
            </h1>
            {promo.subtitle && (
              <p className="font-serif text-[17px] sm:text-[19px] italic text-ink-2/90 leading-tight">
                {promo.subtitle}
              </p>
            )}
          </div>

          {/* Formatted Text Content */}
          {promo.content && (
            <div className="text-[14px] sm:text-[15px] leading-relaxed text-muted whitespace-pre-line border-t border-line/40 pt-4">
              {promo.content}
            </div>
          )}

          {/* Linked Products Section */}
          {linkedItems.length > 0 && (
            <div className="border-t border-line/40 pt-5 space-y-3">
              <h3 className="font-display text-[16px] sm:text-[18px] font-bold text-ink tracking-tight">
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
        'group relative flex items-center justify-between p-3 rounded-[20px] border border-line bg-surface-2/60 hover:bg-surface-2 transition-all cursor-pointer',
        soldOut && 'opacity-60 grayscale-50',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className="size-14 rounded-2xl flex-none grid place-items-center overflow-hidden border border-line/50"
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
          <div className="font-display text-[15px] font-bold text-ink truncate">
            {item.name}
          </div>
          <div className="text-[12px] text-muted line-clamp-1 mt-0.5">
            {item.description}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-none">
        <span className="font-display text-[14px] font-bold text-ink">
          {soldOut ? 'Закончилось' : `от ${formatPrice(minPrice(item))}`}
        </span>

        {!soldOut && (
          <button
            onClick={handleAdd}
            className={cx(
              'size-8 rounded-full grid place-items-center transition-all cursor-pointer active:scale-90',
              justAdded
                ? 'bg-accent text-accent-ink shadow-sm'
                : 'bg-surface border border-line hover:bg-accent hover:text-accent-ink text-ink shadow-xs',
            )}
            aria-label={`Добавить ${item.name} в корзину`}
          >
            {justAdded ? (
              <svg key="done" className="animate-pop" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
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
