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

const chipTitle = 'text-[12px] leading-[1.2] font-semibold text-center text-white'
const chip = (open: boolean, related = false) =>
  cx(
    'flex h-[106px] w-[98px] shrink-0 flex-col items-center justify-between rounded-[20px] px-1.5 py-2.5 text-center backdrop-blur-md border transition-[background-color,border-color,transform] duration-200 ease-soft active:scale-96',
    open ? 'bg-white/22 border-white/30 shadow-lg' : 'bg-white/10 border-white/10 hover:bg-white/14',
    related && 'justify-between',
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
        const totalCount = picks.reduce((s, p) => s + p.qty, 0)
        const summaryLabel =
          picks.length === 1
            ? addonLabel(picks[0])
            : `${g.name} · ${totalCount}`
        const totalPrice = picks.reduce((s, p) => s + p.ingredient.price * p.qty, 0)

        return (
          <button key={g.id} className={chip(isOpen)} aria-expanded={isOpen} onClick={() => onOpenGroup(isOpen ? null : g.id)}>
            {/* 1. Icon slot: fixed 36px height */}
            <div className="flex h-[36px] w-full items-center justify-center">
              {picks.length ? (
                <span key={`${g.id}-${totalCount}`} className="animate-pop">
                  <IngredientArt color={picks[0].ingredient.color} className="size-[34px]" />
                </span>
              ) : (
                <span
                  className="grid size-[32px] place-items-center rounded-full bg-white/12 text-white border border-white/10 text-[18px] font-light leading-none shadow-sm"
                  aria-hidden="true"
                >
                  +
                </span>
              )}
            </div>

            {/* 2. Title slot: fixed 28px height, perfectly aligned across all chips */}
            <div className="flex h-[28px] w-full items-center justify-center px-0.5">
              <span className={cx(chipTitle, 'line-clamp-2 max-w-[86px] overflow-hidden')}>
                {picks.length ? summaryLabel : g.name}
              </span>
            </div>

            {/* 3. Price / subtitle slot: fixed 16px height so nothing shifts */}
            <div className="flex h-[16px] w-full items-center justify-center">
              {picks.length ? (
                <span className="text-[11px] font-medium text-white/70 leading-none tabular-nums animate-fade-in">
                  +{formatPrice(totalPrice)}
                </span>
              ) : (
                <span className="h-[16px]" aria-hidden="true" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
