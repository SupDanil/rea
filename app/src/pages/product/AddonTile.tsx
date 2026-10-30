import { useRef, type CSSProperties } from 'react'
import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = {
  ingredient: Ingredient
  qty: number
  canAdd: boolean
  style: CSSProperties
  onAdd: (ingredient: Ingredient, art: Element | null) => void
  onRemove: (ingredient: Ingredient) => void
}

const stepBtn = 'grid size-7 place-items-center rounded-full text-[17px] leading-none font-bold transition-[scale,opacity] duration-150 active:scale-90 disabled:opacity-30'

/** Counter add-on (syrups, protein, shots): tap the tile for one more portion, − to take one back. */
export function AddonTile({ ingredient, qty, canAdd, style, onAdd, onRemove }: Props) {
  const artRef = useRef<SVGSVGElement>(null)
  const on = qty > 0
  return (
    <div
      className={cx(
        'flex flex-col items-center rounded-[20px] px-1.5 pt-3 pb-2 text-center [transition:background_0.18s,color_0.18s] animate-[tile-in_0.32s_var(--ease-soft)_both]',
        on ? 'bg-white text-[#1d1916]' : 'bg-white/9 text-white',
        ingredient.stopped && 'opacity-35',
      )}
      style={style}
    >
      <button
        className="flex w-full flex-col items-center gap-1 transition-[scale] duration-150 ease-soft not-disabled:active:scale-95"
        disabled={!canAdd}
        onClick={() => onAdd(ingredient, artRef.current)}
        aria-label={`${ingredient.name}: добавить порцию, сейчас ${qty}`}
      >
        <span className="relative">
          <IngredientArt ref={artRef} color={ingredient.color} className="size-[46px]" />
          {on && (
            <span
              key={qty}
              className="absolute -top-1 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-white animate-pop"
            >
              ×{qty}
            </span>
          )}
        </span>
        <span className="flex min-h-[29px] items-center text-[12px] leading-[1.2] font-semibold">{ingredient.name}</span>
        <span className="text-[11px] opacity-65">{ingredient.stopped ? 'нет в наличии' : `+${formatPrice(ingredient.price)}`}</span>
      </button>
      <div className={cx('mt-1 flex items-center gap-1 rounded-full p-0.5', on ? 'bg-[#1d1916]/8' : 'bg-white/14')}>
        <button className={stepBtn} onClick={() => onRemove(ingredient)} disabled={!on} aria-label={`${ingredient.name}: убрать порцию`}>
          −
        </button>
        <span className="min-w-4 text-[13px] font-bold tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button className={stepBtn} onClick={() => onAdd(ingredient, artRef.current)} disabled={!canAdd} aria-label={`${ingredient.name}: добавить порцию`}>
          +
        </button>
      </div>
    </div>
  )
}
