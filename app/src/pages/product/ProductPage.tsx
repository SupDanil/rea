import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useParams } from 'react-router'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { sheetEnter } from '../../components/ui'
import { itemById, type Ingredient, type IngredientGroup, type MenuItem } from '../../data/menu'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useEscape } from '../../hooks/useEscape'
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
  const cupRef = useRef<HTMLDivElement>(null)
  const openGroup = config.groups.find((g) => g.id === openGroupId)

  useEscape(() => (openGroupId ? setOpenGroupId(null) : back()))

  const pick = (group: IngredientGroup, ingredient: Ingredient) => {
    const landed = group.counter ? config.addOne(group, ingredient) : config.toggle(group, ingredient.id)
    if (landed && cupRef.current) {
      bounce(cupRef.current, 0.35)
    }
  }

  const add = () => {
    cart.add(item.id, variant.id, config.chosen.map((i) => i.id))
    setAdded(true)
    window.setTimeout(() => {
      // Name the cart badge as the art's destination before the transition snapshots.
      flushSync(() => setFlightId(item.id))
      back()
      window.setTimeout(() => setFlightId(null), 900)
    }, CONFIRM_MS)
  }

  return (
    <div
      className={cx(
        'tinted fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col overflow-hidden text-white [view-transition-name:sheet]',
        sheetEnter && 'animate-[sheet-in_0.36s_var(--ease-soft)]',
      )}
      style={{
        '--tint': item.art.bg,
        background: `radial-gradient(ellipse 75% 55% at 50% 46%, color-mix(in srgb, var(--tint, #c38b71) 35%, #a75b3f) 0%, color-mix(in srgb, var(--tint, #703722) 20%, #4a271c) 50%, transparent 80%),
                     linear-gradient(180deg, color-mix(in srgb, var(--tint, #534840) 15%, #382f2a) 0%, #2f1d18 55%, #180d0a 100%)`,
      } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <header className="grid grid-cols-[40px_1fr_40px] sm:grid-cols-[44px_1fr_44px] items-center px-3 sm:px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5">
        <h1 key={item.id} className="col-start-2 text-center text-[19px] xs:text-[20px] sm:text-[22px] font-bold text-white tracking-tight truncate px-1 animate-fade-in">
          {item.name}
        </h1>
        <button
          className="col-start-3 size-9 sm:size-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 text-white backdrop-blur-md border border-white/10 transition-colors active:scale-95"
          onClick={back}
          aria-label="Закрыть"
        >
          <CloseIcon />
        </button>
      </header>

      <NutritionBar nutrition={config.nutrition} />
      <ProductDetails item={item} open={showDetails} onToggle={() => setShowDetails((v) => !v)} hidden={!!openGroupId} />

      <div
        className="relative grid min-h-0 flex-1 place-items-center py-1 sm:py-2"
        onClick={() => {
          setOpenGroupId(null)
          setShowDetails(false)
        }}
      >
        <div
          className="relative grid h-full max-h-[300px] sm:max-h-[360px] place-items-center transition-transform duration-300 ease-soft"
          style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}
        >
          <div ref={cupRef} className="grid h-full origin-bottom place-items-center">
            <ItemArt
              key={item.id}
              art={item.art}
              className="h-full max-h-[260px] sm:max-h-[320px] w-auto aspect-[200/220] select-none pointer-events-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
              style={{ viewTransitionName: PRODUCT_ART }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-30">
        {openGroup && (
          <AddonPanel
            group={openGroup}
            groupIndex={config.groups.indexOf(openGroup)}
            qtyOf={(id) => config.qtyOf(openGroup, id)}
            total={config.totalOf(openGroup)}
            canAdd={(ing) => config.canAdd(openGroup, ing)}
            onPick={(ing) => pick(openGroup, ing)}
            onRemove={(ing) => config.removeOne(openGroup, ing.id)}
            onClose={() => setOpenGroupId(null)}
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
        <footer className="mx-2.5 sm:mx-4 mb-[calc(12px+env(safe-area-inset-bottom))] flex items-center gap-2 sm:gap-2.5">
          {variant.size !== 'ONE' && <SizePicker variants={item.variants} selected={config.variantIdx} onSelect={config.setVariantIdx} />}
          <AddToCartButton price={config.price} soldOut={config.soldOut} added={added} onAdd={add} />
        </footer>
      </div>
    </div>
  )
}
