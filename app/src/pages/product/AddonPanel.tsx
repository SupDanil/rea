import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { AddonTile } from './AddonTile'

type Props = {
  group: IngredientGroup
  /** Position of the group among the chips: decides which way the content slides */
  groupIndex: number
  qtyOf: (ingredientId: string) => number
  total: number
  canAdd: (ingredient: Ingredient) => boolean
  /** `art` is the tile's illustration, the start of the fly-to-cup animation */
  onPick: (ingredient: Ingredient, art: Element | null) => void
  onRemove: (ingredient: Ingredient) => void
  onClose?: () => void
}

/**
 * Grid of add-ons raised over the product art. It stays mounted while you
 * switch groups: the height eases to the new content and the tiles slide in
 * from the side of the chip you tapped.
 */
export function AddonPanel({ group, groupIndex, qtyOf, total, canAdd, onPick, onRemove, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()
  const [shown, setShown] = useState({ id: group.id, index: groupIndex, dir: 'up' as 'up' | 'left' | 'right' })
  if (shown.id !== group.id) setShown({ id: group.id, index: groupIndex, dir: groupIndex > shown.index ? 'right' : 'left' })

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // The content block remounts per group, so observe the new one each time.
  }, [group.id])

  const slide = shown.dir === 'right' ? 'animate-[addon-in-right_0.32s_var(--ease-soft)]' : shown.dir === 'left' ? 'animate-[addon-in-left_0.32s_var(--ease-soft)]' : ''

  return (
    <>
      {onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px] transition-opacity animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className="absolute right-2 sm:right-2.5 bottom-[calc(100%+8px)] sm:bottom-[calc(100%+10px)] left-2 sm:left-2.5 z-30 max-h-[min(54dvh,calc(100dvh-170px))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[24px] sm:rounded-[28px] bg-[#22140f]/92 text-white shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl border border-white/12 transition-[height] duration-300 ease-soft animate-[rise_0.24s_var(--ease-soft)]"
        style={{ height }}
        role="group"
        aria-label={group.name}
      >
        <div ref={contentRef} key={group.id} className={cx('px-2 sm:px-3 pb-2.5 sm:pb-3', slide)}>
          <div className="sticky top-0 z-10 -mx-2 sm:-mx-3 mb-2 flex items-center justify-between rounded-t-[24px] sm:rounded-t-[28px] bg-[#22140f]/95 px-3 sm:px-4 pt-3 sm:pt-3.5 pb-2 sm:pb-2.5 backdrop-blur-2xl border-b border-white/8 text-[14px] sm:text-[15px] font-bold">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-[15px] sm:text-[16px] text-white">{group.name}</span>
              <span className="text-[11px] sm:text-[12px] font-normal text-white/60">
                {group.counter ? `${total} из ${group.max} ${group.unit ?? ''}` : group.max === 1 ? 'выберите одно' : `до ${group.max} шт.`}
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="grid size-6 sm:size-7 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[11px] sm:text-[12px] font-bold transition-colors"
                aria-label="Закрыть"
              >
                ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {group.ingredients.map((ing, i) => {
              const style = { animationDelay: `${i * 28}ms` } as CSSProperties
              return group.counter ? (
                <AddonTile key={ing.id} ingredient={ing} qty={qtyOf(ing.id)} canAdd={canAdd(ing)} style={style} onAdd={onPick} onRemove={onRemove} />
              ) : (
                <ChoiceTile key={ing.id} ingredient={ing} selected={qtyOf(ing.id) > 0} style={style} onPick={onPick} />
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

type ChoiceProps = { ingredient: Ingredient; selected: boolean; style: CSSProperties; onPick: (ingredient: Ingredient, art: Element | null) => void }

/** Single-choice add-on (milk, toppings): the whole tile picks it; tap again to clear. */
function ChoiceTile({ ingredient, selected, style, onPick }: ChoiceProps) {
  const artRef = useRef<SVGSVGElement>(null)
  return (
    <button
      className={cx(
        'flex flex-col items-center justify-between rounded-[18px] sm:rounded-[22px] p-2 sm:p-2.5 text-center min-h-[136px] sm:min-h-[148px] border transition-[background-color,color,transform,box-shadow] duration-200 ease-soft active:scale-95 animate-[tile-in_0.32s_var(--ease-soft)_both]',
        selected
          ? 'bg-white text-zinc-950 border-white shadow-[0_10px_25px_rgba(0,0,0,0.32)] scale-[1.02]'
          : 'bg-white/10 hover:bg-white/15 border-white/10 text-white backdrop-blur-xl',
        ingredient.stopped && 'opacity-35 pointer-events-none',
      )}
      style={style}
      disabled={ingredient.stopped}
      aria-pressed={selected}
      onClick={() => onPick(ingredient, artRef.current)}
    >
      <div className="relative my-0.5">
        <IngredientArt ref={artRef} color={ingredient.color} className="size-[38px] sm:size-[44px]" />
      </div>
      <span className={cx('flex min-h-[26px] sm:min-h-[28px] items-center text-[11px] sm:text-[12px] leading-[1.15] sm:leading-[1.2] font-bold line-clamp-2 px-0.5', selected ? 'text-zinc-950' : 'text-white')}>
        {ingredient.name}
      </span>
      <span className={cx('text-[10px] sm:text-[11px] font-medium', selected ? 'text-zinc-600' : 'text-white/70')}>
        {ingredient.stopped ? 'нет в наличии' : `+${formatPrice(ingredient.price)}`}
      </span>
      <span
        className={cx(
          'mt-1 grid size-5 sm:size-6 place-items-center rounded-full text-[11px] sm:text-[12px] font-bold transition-[background,border-color,transform] duration-200',
          selected ? 'bg-zinc-950 text-white shadow-sm animate-pop' : 'border border-white/25 text-white/40',
        )}
        aria-hidden="true"
      >
        {selected ? '✓' : '+'}
      </span>
    </button>
  )
}
