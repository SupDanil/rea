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
}

/**
 * Grid of add-ons raised over the product art. It stays mounted while you
 * switch groups: the height eases to the new content and the tiles slide in
 * from the side of the chip you tapped.
 */
export function AddonPanel({ group, groupIndex, qtyOf, total, canAdd, onPick, onRemove }: Props) {
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
    <div
      className="absolute right-2 bottom-[calc(100%+8px)] left-2 max-h-[52dvh] overflow-x-hidden overflow-y-auto rounded-[26px] bg-panel text-white shadow-lift backdrop-blur-[18px] backdrop-saturate-130 transition-[height] duration-300 ease-soft animate-[rise_0.24s_var(--ease-soft)]"
      style={{ height }}
      role="group"
      aria-label={group.name}
    >
      <div ref={contentRef} key={group.id} className={cx('px-3 pt-3.5 pb-3', slide)}>
        <div className="flex items-baseline justify-between px-1 pb-3 text-[15px] font-bold">
          <span>{group.name}</span>
          <span className="text-[13px] font-medium text-muted opacity-65">
            {group.counter ? `${total} из ${group.max} ${group.unit ?? ''}` : group.max === 1 ? 'выберите одно' : `до ${group.max} шт.`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
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
  )
}

type ChoiceProps = { ingredient: Ingredient; selected: boolean; style: CSSProperties; onPick: (ingredient: Ingredient, art: Element | null) => void }

/** Single-choice add-on (milk, toppings): the whole tile toggles. */
function ChoiceTile({ ingredient, selected, style, onPick }: ChoiceProps) {
  const artRef = useRef<SVGSVGElement>(null)
  return (
    <button
      className={cx(
        'flex flex-col items-center gap-1 rounded-[20px] px-1.5 pt-3 pb-2.5 text-center [transition:background_0.18s,color_0.18s,scale_0.18s_var(--ease-soft)] not-disabled:active:scale-95 disabled:opacity-35 animate-[tile-in_0.32s_var(--ease-soft)_both]',
        selected ? 'bg-white text-[#1d1916]' : 'bg-white/9 text-white',
      )}
      style={style}
      disabled={ingredient.stopped}
      aria-pressed={selected}
      onClick={() => onPick(ingredient, artRef.current)}
    >
      <IngredientArt ref={artRef} color={ingredient.color} className="size-[46px]" />
      <span className="flex min-h-[29px] items-center text-[12px] leading-[1.2] font-semibold">{ingredient.name}</span>
      <span className="text-[11px] opacity-65">{ingredient.stopped ? 'нет в наличии' : `+${formatPrice(ingredient.price)}`}</span>
      <span
        className={cx('mt-0.5 grid size-6 place-items-center rounded-full text-[15px] leading-none', selected ? 'bg-accent text-white animate-pop' : 'bg-white/14')}
        aria-hidden="true"
      >
        {selected ? '✓' : '+'}
      </span>
    </button>
  )
}
