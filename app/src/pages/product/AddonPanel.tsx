import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = {
  group: IngredientGroup
  selected: string[]
  onToggle: (ingredient: Ingredient, tile: HTMLElement) => void
}

/** Grid of add-ons for one group, raised over the product art. */
export function AddonPanel({ group, selected, onToggle }: Props) {
  return (
    <div
      className="absolute right-2 bottom-[calc(100%+8px)] left-2 max-h-[52dvh] overflow-y-auto rounded-[26px] bg-panel px-3 pt-3.5 pb-3 text-white shadow-lift backdrop-blur-[18px] backdrop-saturate-130 animate-[rise_0.24s_var(--ease-soft)]"
      role="group"
      aria-label={group.name}
    >
      <div className="flex items-baseline justify-between px-1 pb-3 text-[15px] font-bold">
        <span>{group.name}</span>
        <span className="text-[13px] font-medium text-muted opacity-65">{group.max === 1 ? 'выберите одно' : `до ${group.max} шт.`}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {group.ingredients.map((ing) => {
          const isOn = selected.includes(ing.id)
          return (
            <button
              key={ing.id}
              className={cx(
                'flex flex-col items-center gap-1 rounded-[20px] px-1.5 pt-3 pb-2.5 text-center [transition:background_0.18s,color_0.18s,scale_0.18s_var(--ease-soft)] not-disabled:active:scale-95 disabled:opacity-35',
                isOn ? 'bg-white text-[#1d1916]' : 'bg-white/9 text-white',
              )}
              disabled={ing.stopped}
              aria-pressed={isOn}
              onClick={(e) => onToggle(ing, e.currentTarget)}
            >
              <IngredientArt color={ing.color} className="size-[46px]" data-addon-art />
              <span className="flex min-h-[29px] items-center text-[12px] leading-[1.2] font-semibold">{ing.name}</span>
              <span className="text-[11px] opacity-65">{ing.stopped ? 'нет в наличии' : `+${formatPrice(ing.price)}`}</span>
              <span
                className={cx('mt-0.5 grid size-6 place-items-center rounded-full text-[15px] leading-none', isOn ? 'bg-accent text-white animate-pop' : 'bg-white/14')}
                aria-hidden="true"
              >
                {isOn ? '✓' : '+'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
