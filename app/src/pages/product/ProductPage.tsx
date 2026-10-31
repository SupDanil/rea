import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Navigate, useParams } from 'react-router'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup, MenuItem } from '../../data/menu'
import { useCatalog } from '../../queries/useCatalog'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useEscape } from '../../hooks/useEscape'
import { useExitTransition } from '../../hooks/useExitTransition'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { bounce, pop } from '../../utils/motion'
import { ART_ATTR, findThumb, flyArt, MORPH, settledRect, TO_CART } from '../../utils/morph'
import { useIsLeaving } from '../../app/leaving'
import { AddonChips } from './AddonChips'
import { AddonPanel } from './AddonPanel'
import { AddToCartButton } from './AddToCartButton'
import { NutritionBar } from './NutritionBar'
import { ProductDetails } from './ProductDetails'
import { SizePicker } from './SizePicker'
import { useProductConfig } from './useProductConfig'

// The check stays on the button for a beat before the cup flies to the cart.
const CONFIRM_MS = 420

export function ProductPage() {
  const { id = '' } = useParams()
  const catalog = useCatalog()
  const item = catalog.itemById.get(id)
  if (!item) return <Navigate to="/" replace />
  return <ProductView item={item} />
}

function ProductView({ item }: { item: MenuItem }) {
  const { cart } = useApp()
  const { back, replace } = useAppNavigate()
  const config = useProductConfig(item)
  const { variant, openGroupId, setOpenGroupId } = config
  const [showDetails, setShowDetails] = useState(false)
  const [added, setAdded] = useState(false)
  const [openedWith] = useState(item.id)
  const cupRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<SVGSVGElement>(null)
  const toCart = useRef(false)
  const leaving = useIsLeaving()
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const panelMax = usePanelRoom(topRef, bottomRef)
  // The panel lingers for its exit animation after the group is closed.
  const { rendered: panelGroup, leaving: panelLeaving } = useExitTransition(config.groups.find((g) => g.id === openGroupId), 220)

  useEscape(() => (openGroupId ? setOpenGroupId(null) : back()))

  const pick = (group: IngredientGroup, ingredient: Ingredient) => {
    const landed = group.counter ? config.addOne(group, ingredient) : config.toggle(group, ingredient.id)
    if (landed && cupRef.current) {
      bounce(cupRef.current, 0.6)
    }
  }

  // Opening: the thumbnail you tapped (menu card, hero, cart line) flies into the cup's place.
  useLayoutEffect(() => {
    const art = artRef.current
    const sheet = sheetRef.current
    const thumb = findThumb(openedWith, sheet)
    if (!art || !sheet || !thumb) return
    art.style.visibility = 'hidden'
    void flyArt(thumb, settledRect(art, sheet), MORPH).then(() => (art.style.visibility = ''))
    // Only on first open; swapping hot ↔ iced animates the cup in place.
  }, [openedWith])

  // Closing (button, Escape or the system back gesture): the cup flies back to its
  // thumbnail — or, after "Add", down into the cart counter.
  useLayoutEffect(() => {
    const art = artRef.current
    if (!leaving || !art) return
    if (toCart.current) {
      const badge = document.querySelector('[data-cart-badge]')
      if (badge) void flyArt(art, badge, { ...TO_CART, landFade: true }).then(() => pop(badge))
      return
    }
    const thumb = findThumb(item.id, sheetRef.current) ?? findThumb(openedWith, sheetRef.current)
    if (thumb) void flyArt(art, thumb, MORPH)
  }, [leaving, item.id, openedWith])

  const add = () => {
    cart.add(item.id, variant.id, config.chosen.map((i) => i.id))
    setAdded(true)
    window.setTimeout(() => {
      toCart.current = true
      back()
    }, CONFIRM_MS)
  }

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col items-center justify-center overscroll-contain wide:bg-black/55 wide:backdrop-blur-sm wide:p-4 md:wide:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onClick={(e) => {
        if (e.target === e.currentTarget) back()
      }}
    >
      <div
        ref={sheetRef}
        className={cx(
          // Mobile: full-screen sheet
          'tinted relative flex h-full w-full max-w-[480px] flex-col overflow-x-hidden overflow-y-auto overscroll-contain text-pd-ink',
          // Desktop: 2-column studio modal
          'wide:h-auto wide:max-h-[min(90dvh,820px)] wide:max-w-[940px] lg:wide:max-w-[980px] wide:rounded-[32px] wide:border wide:border-pd-line wide:shadow-[0_24px_70px_rgba(0,0,0,0.5)] wide:grid wide:grid-cols-[1.1fr_1fr] wide:overflow-hidden',
          'animate-[sheet-up_0.38s_var(--ease-soft)_both]',
        )}
        style={{
          '--tint': item.art.bg,
          // Studio light around the cup, tinted by the drink; light/dark comes from the --pd-* tokens.
          background: `radial-gradient(ellipse 80% 55% at 50% 42%, color-mix(in srgb, var(--tint, #c5c7d7) var(--pd-spot-mix), var(--pd-spot-base)) 0%, transparent 80%),
                       linear-gradient(180deg, var(--pd-bg-from) 0%, var(--pd-bg-to) 100%)`,
        } as CSSProperties}
      >
        {/* Left Column on Desktop / Top Section on Mobile: Header, Macros, Details, Floating Cup */}
        <div className="wide:flex wide:flex-col wide:justify-between wide:p-6 wide:border-r wide:border-pd-line/40 wide:relative wide:min-h-[520px]">
          <div ref={topRef} className="relative z-[31]">
            <header className="grid grid-cols-[40px_1fr_40px] items-center px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5 wide:pt-0 wide:px-0">
              <h1 key={item.id} className="col-start-2 text-center text-[19px] xs:text-[20px] sm:text-[22px] font-bold text-pd-ink tracking-tight truncate px-1 animate-fade-in">
                {item.name}
              </h1>
              <button
                className="col-start-3 justify-self-end size-10 grid place-items-center [&>svg]:block rounded-full bg-pd-glass hover:bg-pd-glass-hover text-pd-ink backdrop-blur-md border border-pd-line transition-[background-color,color,border-color,scale] active:scale-95"
                onClick={back}
                aria-label="Закрыть"
              >
                <CloseIcon />
              </button>
            </header>

            <NutritionBar nutrition={config.nutrition} />
            <ProductDetails item={item} open={showDetails} onToggle={() => setShowDetails((v) => !v)} hidden={!!openGroupId} />
          </div>

          <div
            className="relative grid min-h-0 place-items-center py-2 sm:py-3 wide:my-auto"
            onClick={() => {
              setOpenGroupId(null)
              setShowDetails(false)
            }}
          >
            <div
              className="relative grid h-full max-h-[280px] sm:max-h-[340px] wide:max-h-[380px] place-items-center transition-transform duration-[420ms] ease-[cubic-bezier(0.34,1.4,0.64,1)]"
              style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}
            >
              <div
                ref={cupRef}
                className="grid h-full origin-bottom place-items-center drop-shadow-[0_16px_28px_var(--pd-cup-shadow)] animate-[float-soft_6s_ease-in-out_0.5s_infinite]"
              >
                <ItemArt
                  key={item.id}
                  art={item.art}
                  className={cx(
                    'h-full max-h-[240px] sm:max-h-[300px] wide:max-h-[340px] w-auto aspect-[200/220] select-none pointer-events-none',
                    item.id !== openedWith && 'animate-[swap-in_0.4s_var(--ease-soft)_both]',
                  )}
                  ref={artRef}
                  {...{ [ART_ATTR]: item.id }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column on Desktop / Bottom Section on Mobile: Addons, Size, Add to Cart */}
        <div ref={bottomRef} className="relative z-30 wide:flex wide:flex-col wide:justify-between wide:p-6 wide:bg-pd-panel/25 wide:backdrop-blur-md wide:overflow-y-auto">
          <div className="wide:space-y-4">
            <div className="hidden wide:block text-[16px] font-bold text-pd-ink mb-1">
              Настройка напитка
            </div>

            {panelGroup && (
              <AddonPanel
                group={panelGroup}
                groupIndex={config.groups.indexOf(panelGroup)}
                qtyOf={(id) => config.qtyOf(panelGroup, id)}
                total={config.totalOf(panelGroup)}
                canAdd={(ing) => config.canAdd(panelGroup, ing)}
                onPick={(ing) => pick(panelGroup, ing)}
                onRemove={(ing) => config.removeOne(panelGroup, ing.id)}
                onClose={() => setOpenGroupId(null)}
                leaving={panelLeaving}
                maxHeight={panelMax}
              />
            )}
            <AddonChips
              item={item}
              related={config.related}
              groups={config.groups}
              selection={config.selection}
              openGroupId={openGroupId}
              onOpenGroup={setOpenGroupId}
              onOpenRelated={(next) => replace(`/product/${next.id}`)}
            />
          </div>

          <footer className="relative z-[25] mx-2.5 sm:mx-4 wide:mx-0 mb-[calc(12px+env(safe-area-inset-bottom))] wide:mb-0 flex items-center gap-2 sm:gap-2.5 wide:mt-6">
            {variant.size !== 'ONE' && <SizePicker variants={item.variants} selected={config.variantIdx} onSelect={config.setVariantIdx} />}
            <AddToCartButton price={config.price} soldOut={config.soldOut} added={added} onAdd={add} />
          </footer>
        </div>
      </div>
    </div>
  )
}

/**
 * Height the add-on panel may take: the gap between the macros and the chips
 * row, minus breathing room — so on a short screen (Fold cover display, landscape)
 * the panel scrolls inside instead of covering the macros.
 */
function usePanelRoom(topRef: RefObject<HTMLElement | null>, bottomRef: RefObject<HTMLElement | null>) {
  const [room, setRoom] = useState<number>()
  useLayoutEffect(() => {
    const top = topRef.current
    const bottom = bottomRef.current
    if (!top || !bottom) return
    const measure = () => setRoom(Math.max(160, bottom.getBoundingClientRect().top - top.getBoundingClientRect().bottom - 18))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(top)
    ro.observe(bottom)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [topRef, bottomRef])
  return room
}
