import { ChoiceButton } from '../../components/ChoiceButton'
import type { IngredientGroup } from '../../domain'
import type { Selection } from './useProductConfig'

type Props = {
  groups: IngredientGroup[]
  selection: Selection
  activeGroupId: string | null
  onSelectGroup: (groupId: string) => void
}

export function CraftTabBar({
  groups,
  selection,
  activeGroupId,
  onSelectGroup,
}: Props) {
  if (groups.length === 0) return null

  return (
    <div className="no-scrollbar relative z-10 flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 py-5.5 -my-4">
      {/* Ingredient Group Tabs */}
      {groups.map((group) => {
        const isActive = activeGroupId === group.id
        const pickedCount = (selection[group.id] ?? []).length

        return (
          <ChoiceButton
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            aria-label={group.name}
            selected={isActive}
            tone="product"
            className="shrink-0 transition-colors duration-200"
          >
            <span>{group.name}</span>
            {pickedCount > 0 && (
              <span
                key={pickedCount}
                className="ui-count-badge grid size-5 place-items-center rounded-pill text-caption font-bold leading-none animate-pop"
              >
                {pickedCount}
              </span>
            )}
          </ChoiceButton>
        )
      })}
    </div>
  )
}
