import { useState, type CSSProperties } from 'react'
import { Navigate, useParams } from 'react-router'
import { CloseIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { addBtn, addPrice, iconBtn } from '../../components/ui'
import { itemById, type MenuItem } from '../../data/menu'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useEscape } from '../../hooks/useEscape'
import { useApp } from '../../state/AppContext'
import { formatPrice } from '../../utils/format'
import { AddonChips } from './AddonChips'
import { AddonPanel } from './AddonPanel'
import { NutritionBar } from './NutritionBar'
import { ProductDetails } from './ProductDetails'
import { SizePicker } from './SizePicker'
import { useProductConfig } from './useProductConfig'

export function ProductPage() {
  const { id = '' } = useParams()
  const item = itemById.get(id)
  if (!item) return <Navigate to="/" replace />
  return <ProductView item={item} />
}

function ProductView({ item }: { item: MenuItem }) {
  const { cart, showToast } = useApp()
  const { back, replace } = useAppNavigate()
  const config = useProductConfig(item)
  const { variant, openGroupId, setOpenGroupId } = config
  const [showDetails, setShowDetails] = useState(false)
  const openGroup = config.groups.find((g) => g.id === openGroupId)

  useEscape(() => (openGroupId ? setOpenGroupId(null) : back()))

  const add = () => {
    cart.add(item.id, variant.id, config.chosen.map((i) => i.id))
    showToast({ text: `${item.name} — ${formatPrice(config.price)} в корзине` })
    back()
  }

  return (
    <div
      className="tinted fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col overflow-hidden bg-[linear-gradient(180deg,var(--tinted)_0%,var(--tinted)_55%,var(--bg)_100%)] animate-[sheet-in_0.36s_var(--ease-soft)]"
      style={{ '--tint': item.art.bg } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5">
        <h1 className="col-start-2 text-center text-[24px]">{item.name}</h1>
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
          className="relative grid h-full max-h-[360px] place-items-center transition-transform duration-[450ms] ease-soft"
          style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}
        >
          <ItemArt
            key={item.id}
            art={item.art}
            className="h-full w-auto max-w-[80vw] animate-[art-in_0.35s_var(--ease-soft),float_6s_ease-in-out_0.35s_infinite]"
          />
        </div>
      </div>

      <div className="relative">
        {openGroup && (
          <AddonPanel group={openGroup} selected={config.selection[openGroup.id] ?? []} onToggle={(ing) => config.toggle(openGroup.id, openGroup.max, ing.id)} />
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
          <button className={addBtn} disabled={config.soldOut} onClick={add}>
            {config.soldOut ? (
              'Закончилось'
            ) : (
              <>
                <span>Добавить</span>
                <span className={addPrice} key={config.price}>
                  {formatPrice(config.price)}
                </span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
