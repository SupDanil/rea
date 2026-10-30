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

const stepBtn =
  'grid size-6 sm:size-7 place-items-center rounded-full text-[15px] sm:text-[17px] leading-none font-bold transition-[transform,scale,opacity] duration-150 active:scale-90 disabled:opacity-25'

/** Drinkit counter add-on tile (syrups, protein, shots): frosted glass when 0, solid white when selected. */
export function AddonTile({ ingredient, qty, canAdd, style, onAdd, onRemove }: Props) {
  const artRef = useRef<SVGSVGElement>(null)
  const on = qty > 0
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-between rounded-[18px] sm:rounded-[22px] p-2 sm:p-2.5 text-center min-h-[136px] sm:min-h-[148px] border transition-[background-color,color,transform,scale,box-shadow] duration-200 ease-soft animate-[tile-in_0.32s_var(--ease-soft)_both]',
        on
          ? 'bg-white text-zinc-950 border-white shadow-[0_10px_25px_rgba(0,0,0,0.32)] scale-[1.02]'
          : 'bg-white/10 hover:bg-white/15 border-white/10 text-white backdrop-blur-xl',
        ingredient.stopped && 'opacity-35 pointer-events-none',
      )}
      style={style}
    >
      <button
        className="flex w-full flex-1 flex-col items-center justify-center gap-0.5 sm:gap-1 transition-transform duration-150 ease-soft active:scale-95"
        disabled={!canAdd}
        onClick={() => onAdd(ingredient, artRef.current)}
        aria-label={`${ingredient.name}: добавить порцию, сейчас ${qty}`}
      >
        <div className="relative my-0.5">
          <IngredientArt ref={artRef} color={ingredient.color} className="size-[38px] sm:size-[44px]" />
          {on && (
            <span
              key={qty}
              className="absolute -top-1 -right-2 grid h-4.5 sm:h-5 min-w-4.5 sm:min-w-5 place-items-center rounded-full bg-[#334cdb] px-1 text-[10px] sm:text-[11px] font-extrabold text-white shadow-sm animate-pop"
            >
              ×{qty}
            </span>
          )}
        </div>
        <span className={cx('flex min-h-[26px] sm:min-h-[28px] items-center text-[11px] sm:text-[12px] leading-[1.15] sm:leading-[1.2] font-bold line-clamp-2 px-0.5', on ? 'text-zinc-950' : 'text-white')}>
          {ingredient.name}
        </span>
        <span className={cx('text-[10px] sm:text-[11px] font-medium', on ? 'text-zinc-600' : 'text-white/70')}>
          {ingredient.stopped ? 'нет в наличии' : `+${formatPrice(ingredient.price)}`}
        </span>
      </button>
      <div className={cx('mt-1 sm:mt-1.5 flex items-center gap-1 sm:gap-1.5 rounded-full p-0.5 border', on ? 'bg-zinc-100 border-zinc-200 text-zinc-950' : 'bg-white/12 border-white/10 text-white')}>
        <button className={stepBtn} onClick={() => onRemove(ingredient)} disabled={!on} aria-label={`${ingredient.name}: убрать порцию`}>
          −
        </button>
        <span className="min-w-3.5 sm:min-w-4 text-[12px] sm:text-[13px] font-bold tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button className={stepBtn} onClick={() => onAdd(ingredient, artRef.current)} disabled={!canAdd} aria-label={`${ingredient.name}: добавить порцию`}>
          +
        </button>
      </div>
    </div>
  )
}
