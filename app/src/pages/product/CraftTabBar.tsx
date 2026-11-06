import { Button } from '../../components/Button'
import type { IngredientGroup } from '../../domain'
import { cx } from '../../utils/cx'
import type { Selection } from './useProductConfig'

type Props = {
  groups: IngredientGroup[]
  selection: Selection
  activeGroupId: string | null
  onSelectGroup: (groupId: string) => void
}

/**
 * 2026 Specialty Recipe Category Bar:
 * Replaces Drinkit's clumsy floating chips with a high-tactile segmented recipe switcher.
 * Instant tab switching in-place — zero modal dialogs obstructing the view.
 */
export function CraftTabBar({
  groups,
  selection,
  activeGroupId,
  onSelectGroup,
}: Props) {
  if (groups.length === 0) return null

  return (
    <div className="no-scrollbar relative z-10 flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 py-1.5">
      {/* Ingredient Group Tabs */}
      {groups.map((group) => {
        const isActive = activeGroupId === group.id
        const pickedCount = (selection[group.id] ?? []).length

        return (
          <Button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            aria-label={group.name}
            className={cx(
              'flex h-8.5 shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-caption font-bold transition-all duration-200 ease-soft active:scale-95 cursor-pointer shadow-xs',
              isActive
                ? 'bg-ink text-surface dark:bg-surface-2 dark:text-crema border-(length:--stroke-width) border-transparent shadow-sm'
                : 'bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border-(length:--stroke-width) border-pd-line',
            )}
          >
            <span>{group.name}</span>
            {pickedCount > 0 && (
              <span
                key={pickedCount}
                className={cx(
                  'grid size-4.5 place-items-center rounded-pill text-micro font-extrabold leading-none animate-pop',
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-accent/15 text-accent dark:bg-accent/25 dark:text-crema',
                )}
              >
                {pickedCount}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
