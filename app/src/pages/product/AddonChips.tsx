import { IngredientArt, ItemArt } from '../../components/ItemArt'
import { addonLabel, countAddons, type IngredientGroup, type MenuItem } from '../../data/menu'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import type { Selection } from './useProductConfig'

type Props = {
  item: MenuItem
  related?: MenuItem
  groups: IngredientGroup[]
  selection: Selection
  openGroupId: string | null
  onOpenGroup: (groupId: string | null) => void
  onOpenRelated: (item: MenuItem) => void
}

const chipTitle = 'text-[12px] leading-[1.2] font-semibold'
const chip = (open: boolean, related = false) =>
  cx(
    'flex min-h-[106px] flex-[0_0_98px] flex-col items-center gap-[5px] rounded-[20px] px-1.5 py-2.5 text-center backdrop-blur-[8px] [transition:background_0.2s,scale_0.18s_var(--ease-soft)] active:scale-96',
    related ? 'justify-between' : 'justify-center',
    open ? 'bg-surface shadow-card' : 'bg-glass',
  )

/** Row under the product: the hot/iced twin, then one chip per add-on group. */
export function AddonChips({ item, related, groups, selection, openGroupId, onOpenGroup, onOpenRelated }: Props) {
  if (!related && groups.length === 0) return null
  return (
    <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto px-3 pb-3">
      {related && (
        <>
          <button className={chip(false, true)} onClick={() => onOpenRelated(related)}>
            <span className={chipTitle}>{item.related!.label}</span>
            <ItemArt art={related.art} className="h-[60px] w-14" />
          </button>
          {groups.length > 0 && <span className="my-5 flex-[0_0_1px] bg-line" aria-hidden="true" />}
        </>
      )}
      {groups.map((g) => {
        const picks = countAddons((selection[g.id] ?? []).map((id) => g.ingredients.find((i) => i.id === id)!))
        const isOpen = openGroupId === g.id
        return (
          <button key={g.id} className={chip(isOpen)} aria-expanded={isOpen} onClick={() => onOpenGroup(isOpen ? null : g.id)}>
            {picks.length ? (
              <>
                {/* Keyed by the picks so the chip pops whenever its contents change. */}
                <span key={picks.map(addonLabel).join()} className="flex flex-col items-center gap-[5px] animate-pop">
                  <IngredientArt color={picks[0].ingredient.color} className="block size-9" />
                  <span className={chipTitle}>{picks.map(addonLabel).join(', ')}</span>
                </span>
                <span className="text-[11px] text-muted">+{formatPrice(picks.reduce((s, p) => s + p.ingredient.price * p.qty, 0))}</span>
              </>
            ) : (
              <>
                <span className="grid size-[34px] place-items-center rounded-full bg-surface text-[22px] leading-none shadow-card" aria-hidden="true">
                  +
                </span>
                <span className={chipTitle}>{g.name}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
