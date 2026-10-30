import { useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useParams } from 'react-router'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { iconBtn, sheetEnter } from '../../components/ui'
import { itemById, type Ingredient, type IngredientGroup, type MenuItem } from '../../data/menu'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useEscape } from '../../hooks/useEscape'
import { PRODUCT_ART } from '../../hooks/useSharedArt'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { bounce, flyTo } from '../../utils/motion'
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

  // The add-on drops into the top of the cup, then the cup squashes as it lands.
  const dropIntoCup = (art: Element | null) => {
    const cup = cupRef.current
    if (!art || !cup) return
    const r = cup.getBoundingClientRect()
    const mouth = new DOMRect(r.left + r.width / 2 - 12, r.top + r.height * 0.18, 24, 24)
    void flyTo(art, mouth).then(() => bounce(cup))
  }

  const pick = (group: IngredientGroup, ingredient: Ingredient, art: Element | null) => {
    const landed = group.counter ? config.addOne(group, ingredient) : config.toggle(group, ingredient.id)
    if (landed) dropIntoCup(art)
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
        'tinted fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col overflow-hidden bg-[linear-gradient(180deg,var(--tinted)_0%,var(--tinted)_55%,var(--bg)_100%)] [view-transition-name:sheet]',
        sheetEnter && 'animate-[sheet-in_0.36s_var(--ease-soft)]',
      )}
      style={{ '--tint': item.art.bg } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5">
        <h1 key={item.id} className="col-start-2 text-center text-[24px] animate-fade-in">
          {item.name}
        </h1>
        <button className={iconBtn('right')} onClick={back} aria-label="Закрыть">
          <CloseIcon />
        </button>
      </header>

      <NutritionBar nutrition={config.nutrition} />
      <ProductDetails item={item} open={showDetails} onToggle={() => setShowDetails((v) => !v)} />

      <div
        className="relative grid min-h-0 flex-1 place-items-center py-2 before:absolute before:aspect-square before:w-[78%] before:rounded-full before:bg-[radial-gradient(circle,var(--glow)_0%,transparent_68%)] before:content-['']"
        onClick={() => {
          setOpenGroupId(null)
          setShowDetails(false)
        }}
      >
        <div
          className="relative grid h-full max-h-[360px] place-items-center transition-transform duration-[520ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}
        >
          <div ref={cupRef} className="grid h-full origin-bottom place-items-center">
            <ItemArt
              key={item.id}
              art={item.art}
              className="h-full w-auto max-w-[80vw] animate-[art-in_0.35s_var(--ease-soft),float_6s_ease-in-out_0.35s_infinite]"
              style={{ viewTransitionName: PRODUCT_ART }}
            />
          </div>
        </div>
      </div>

      <div className="relative">
        {openGroup && (
          <AddonPanel
            group={openGroup}
            groupIndex={config.groups.indexOf(openGroup)}
            qtyOf={(id) => config.qtyOf(openGroup, id)}
            total={config.totalOf(openGroup)}
            canAdd={(ing) => config.canAdd(openGroup, ing)}
            onPick={(ing, art) => pick(openGroup, ing, art)}
            onRemove={(ing) => config.removeOne(openGroup, ing.id)}
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
        <footer className="mx-2 mb-[calc(10px+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full bg-dock p-[7px] shadow-lift backdrop-blur-[12px]">
          {variant.size !== 'ONE' && <SizePicker variants={item.variants} selected={config.variantIdx} onSelect={config.setVariantIdx} />}
          <AddToCartButton price={config.price} soldOut={config.soldOut} added={added} onAdd={add} />
        </footer>
      </div>
    </div>
  )
}
