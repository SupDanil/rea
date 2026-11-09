import { useState } from 'react'

import { ChoiceButton } from '../../components/ChoiceButton'
import type { IngredientGroup } from '../../domain'
import { cx } from '../../utils/cx'
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
            <TabCount count={pickedCount} />
          </ChoiceButton>
        )
      })}
    </div>
  )
}

/**
 * The count's slot grows from zero width (grid 0fr → 1fr), so the tab widens and its neighbours slide
 * over instead of jumping. Going back to zero it collapses the same way, still showing the last number.
 */
function TabCount({ count }: { count: number }) {
  const [last, setLast] = useState(count)
  if (count > 0 && count !== last) setLast(count)
  const shown = count > 0
  return (
    <span className={cx('ui-tab-count', shown && 'ui-tab-count--shown')} aria-hidden={!shown}>
      <span>
        <span
          key={shown ? count : 'hidden'}
          className={cx('ui-count-badge grid size-5 place-items-center rounded-pill text-caption font-bold leading-none', shown && 'animate-pop')}
        >
          {shown ? count : last}
        </span>
      </span>
    </span>
  )
}
