import { useEffect, useRef } from 'react'

import { Button } from '../../components/Button'
import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup, Variant } from '../../domain'
import { countAddons } from '../../domain'
import { cx } from '../../utils/cx'
import type { Selection } from './useProductConfig'

export type RecipeTagItem = {
  group: IngredientGroup
  ingredient: Ingredient
  qty: number
}

/**
 * Extracts and groups all currently chosen ingredients into structured tag items.
 */
function getRecipeTagItems(
  groups: IngredientGroup[],
  selection: Selection,
): RecipeTagItem[] {
  const items: RecipeTagItem[] = []
  for (const group of groups) {
    const pickedIds = selection[group.id] ?? []
    if (pickedIds.length === 0) continue
    const ingredients = pickedIds
      .map((id) => group.ingredients.find((i) => i.id === id)!)
      .filter(Boolean)
    const counted = countAddons(ingredients)
    for (const { ingredient, qty } of counted) {
      items.push({ group, ingredient, qty })
    }
  }
  return items
}

/**
 * Single tactile recipe pill tag with color swatch, multiplier badge, and quick ✕ remove.
 */
export function RecipeTagChip({
  item,
  onGroupClick,
  onRemove,
}: {
  item: RecipeTagItem
  onGroupClick?: (groupId: string) => void
  onRemove?: (group: IngredientGroup, ingredient: Ingredient) => void
}) {
  const { group, ingredient, qty } = item

  return (
    <div
      className={cx(
        'group/tag shrink-0 flex items-center gap-1.5 rounded-pill pl-2.5 pr-1.5 py-1 text-micro xs:text-caption font-bold text-pd-ink border-(length:--stroke-width) shadow-xs transition-all duration-150 animate-pop select-none whitespace-nowrap',
        'bg-pd-glass hover:bg-pd-glass-hover border-pd-line/70',
      )}
    >
      {/* Clickable info area */}
      <Button
        onClick={() => onGroupClick?.(group.id)}
        className="flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
        title={`Нажмите, чтобы настроить ${group.name.toLowerCase()}`}
      >
        <IngredientArt color={ingredient.color} className="size-3.5 shrink-0" />
        <span>{ingredient.name}</span>
      </Button>

      {/* Multiplier pill */}
      {qty > 1 && (
        <span className="shrink-0 rounded-pill bg-accent/18 text-accent dark:bg-accent/28 dark:text-crema px-1.5 py-0.2 text-micro font-black leading-none">
          ×{qty}
        </span>
      )}

      {/* Quick remove button */}
      {onRemove && (
        <Button
          onClick={() => onRemove(group, ingredient)}
          aria-label={`Убрать ${ingredient.name}`}
          className="shrink-0 grid size-4 place-items-center rounded-pill text-pd-muted hover:text-error hover:bg-black/5 dark:hover:bg-white/10 text-micro font-bold transition-colors cursor-pointer ml-0.5"
        >
          ✕
        </Button>
      )}
    </div>
  )
}

type Props = {
  variant?: Variant
  chosen?: Ingredient[]
  groups: IngredientGroup[]
  selection: Selection
  onGroupClick?: (groupId: string) => void
  onRemoveIngredient?: (group: IngredientGroup, ingredient: Ingredient) => void
}

/**
 * 2026 Specialty Coffee Recipe Ribbon:
 * Stable ~34px height single-row horizontal ribbon with liquid glass tags.
 * Solves layout jumping: whether 1 or 12 toppings, the height never moves!
 * Clean 16px screen padding prevents touching edges.
 */
export function RecipeLiveTags({
  groups,
  selection,
  onGroupClick,
  onRemoveIngredient,
}: Props) {
  const items = getRecipeTagItems(groups, selection)
  const ribbonRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(items.length)

  // Auto-scroll ribbon to end when a new topping is added
  useEffect(() => {
    if (items.length > prevCount.current && ribbonRef.current) {
      const el = ribbonRef.current
      if (typeof el.scrollTo === 'function') {
        try {
          el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
        } catch {
          el.scrollLeft = el.scrollWidth
        }
      } else {
        el.scrollLeft = el.scrollWidth
      }
    }
    prevCount.current = items.length
  }, [items.length])

  // Desktop mouse wheel translation for the recipe ribbon
  useEffect(() => {
    const el = ribbonRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={ribbonRef}
      className={cx(
        'no-scrollbar relative w-full flex items-center gap-1.5 overflow-x-auto py-1 px-4 sm:px-6 overscroll-contain touch-pan-x',
        items.length <= 2 ? 'justify-center' : 'justify-start',
      )}
      aria-label="Текущий состав напитка"
    >
      {items.length === 0 ? (
        <span className="flex items-center gap-1.5 rounded-pill bg-pd-glass/70 px-3.5 py-1 text-micro font-medium text-pd-muted border-(length:--stroke-width) border-pd-line/50 backdrop-blur-xs whitespace-nowrap shadow-xs animate-fade-in">
          <span className="size-1.5 rounded-pill bg-accent/70" aria-hidden="true" />
          <span>Базовый рецепт</span>
        </span>
      ) : (
        items.map((item) => (
          <RecipeTagChip
            key={`${item.group.id}-${item.ingredient.id}`}
            item={item}
            onGroupClick={onGroupClick}
            onRemove={onRemoveIngredient}
          />
        ))
      )}
    </div>
  )
}
