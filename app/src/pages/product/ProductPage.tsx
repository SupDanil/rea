import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useParams } from 'react-router'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { sheetEnter } from '../../components/ui'
import { itemById, type Ingredient, type IngredientGroup, type MenuItem } from '../../data/menu'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useEscape } from '../../hooks/useEscape'
import { useExitTransition } from '../../hooks/useExitTransition'
import { PRODUCT_ART } from '../../hooks/useSharedArt'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { bounce } from '../../utils/motion'
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
  const item = itemById.get(id)
  if (!item) return <Navigate to="/" replace />
  return <ProductView item={item} />
}

function ProductView({ item }: { item: MenuItem }) {
  const { cart, setFlightId } = useApp()
  const { back, replace } = useAppNavigate()
  const config = useProductConfig(item)
  const { variant, openGroupId, setOpenGroupId } = config
  const [showDetails, setShowDetails] = useState(false)
  const [added, setAdded] = useState(false)
  const [openedWith] = useState(item.id)
  const cupRef = useRef<HTMLDivElement>(null)
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

  const add = () => {
    cart.add(item.id, variant.id, config.chosen.map((i) => i.id))
    setAdded(true)
    window.setTimeout(() => {
      // Name the cart badge as the art's destination before the transition snapshots.
      flushSync(() => setFlightId(item.id))
      // Switches the cup's view transition to its flight timing (see index.css).
      document.documentElement.dataset.flight = ''
      back()
      window.setTimeout(() => {
        setFlightId(null)
        delete document.documentElement.dataset.flight
      }, 900)
    }, CONFIRM_MS)
  }

  return (
    <div
      className={cx(
        // Phone: one column (header, details, cup, controls). Unfolded: cup on the left,
        // everything else in a right column; the rest of the screen is dimmed around it.
        'tinted fixed inset-0 z-20 mx-auto grid max-w-[480px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-x-hidden overflow-y-auto overscroll-contain text-pd-ink [view-transition-name:sheet]',
        'wide:max-w-[1040px] wide:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] wide:shadow-[0_0_0_100vmax_rgba(0,0,0,0.55)]',
        sheetEnter && 'animate-[sheet-in_0.36s_var(--ease-soft)]',
      )}
      style={{
        '--tint': item.art.bg,
        // Studio light around the cup, tinted by the drink; light/dark comes from the --pd-* tokens.
        background: `radial-gradient(ellipse 80% 55% at 50% 42%, color-mix(in srgb, var(--tint, #c5c7d7) var(--pd-spot-mix), var(--pd-spot-base)) 0%, transparent 80%),
                     linear-gradient(180deg, var(--pd-bg-from) 0%, var(--pd-bg-to) 100%)`,
      } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      {/* Above the add-on backdrop: the macros stay readable while add-ons are picked. */}
      <div ref={topRef} className="relative z-[31] wide:col-start-2 wide:row-start-1">
      <header className="grid grid-cols-[40px_1fr_40px] items-center px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5">
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
      </div>
      <div className="wide:col-start-2 wide:row-start-2">
        <ProductDetails item={item} open={showDetails} onToggle={() => setShowDetails((v) => !v)} hidden={!!openGroupId} />
      </div>

      <div
        className="relative grid min-h-0 place-items-center py-1 sm:py-2 wide:col-start-1 wide:row-span-4 wide:row-start-1 wide:py-8"
        onClick={() => {
          setOpenGroupId(null)
          setShowDetails(false)
        }}
      >
        <div
          className="relative grid h-full max-h-[300px] sm:max-h-[360px] wide:max-h-[min(72dvh,600px)] place-items-center transition-transform duration-[420ms] ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}
        >
          <div ref={cupRef} className="grid h-full origin-bottom place-items-center animate-[float-soft_6s_ease-in-out_0.5s_infinite]">
            <ItemArt
              key={item.id}
              art={item.art}
              className={cx(
                'h-full max-h-[260px] sm:max-h-[320px] wide:max-h-[min(64dvh,540px)] w-auto aspect-[200/220] select-none pointer-events-none drop-shadow-[0_16px_28px_var(--pd-cup-shadow)]',
                // Hot ↔ iced swap without View Transitions (which morph the cup themselves);
                // never on open, where the cup already morphs in from the card.
                sheetEnter && item.id !== openedWith && 'animate-[swap-in_0.4s_var(--ease-soft)_both]',
              )}
              style={{ viewTransitionName: PRODUCT_ART }}
            />
          </div>
        </div>
      </div>

      <div ref={bottomRef} className="relative z-30 wide:col-start-2 wide:row-start-4">
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
        <footer className="relative z-[25] mx-2.5 sm:mx-4 mb-[calc(12px+env(safe-area-inset-bottom))] flex items-center gap-2 sm:gap-2.5">
          {variant.size !== 'ONE' && <SizePicker variants={item.variants} selected={config.variantIdx} onSelect={config.setVariantIdx} />}
          <AddToCartButton price={config.price} soldOut={config.soldOut} added={added} onAdd={add} />
        </footer>
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
