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
    'flex h-[106px] w-[98px] shrink-0 flex-col items-center rounded-[20px] px-1.5 text-center backdrop-blur-md border transition-[background-color,border-color,padding,transform,scale] duration-200 ease-soft active:scale-96',
    open ? 'bg-white/22 border-white/30 shadow-lg' : 'bg-white/10 border-white/10 hover:bg-white/14',
    related ? 'justify-between py-2.5' : 'py-2.5',
  )
/** Chip contents swap with a short fade when a group goes from empty to picked and back. */
const chipBody = (picked: boolean) =>
  cx('flex h-full w-full flex-col items-center animate-[fade-in_0.22s_var(--ease-soft)_both]', picked ? 'justify-between' : 'justify-center gap-2')

/** Row under the product: the hot/iced twin, then one chip per add-on group. */
export function AddonChips({ item, related, groups, selection, openGroupId, onOpenGroup, onOpenRelated }: Props) {
  if (!related && groups.length === 0) return null
  return (
    // Above the add-on backdrop (z-20), under the panel (z-30): chips stay tappable to switch groups.
    <div className="no-scrollbar relative z-[25] flex items-stretch gap-2 overflow-x-auto px-3 pb-3">
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
        const isPicked = picks.length > 0
        const totalCount = picks.reduce((s, p) => s + p.qty, 0)
        const summaryLabel =
          picks.length === 1
            ? addonLabel(picks[0])
            : `${g.name} · ${totalCount}`
        const totalPrice = picks.reduce((s, p) => s + p.ingredient.price * p.qty, 0)

        return (
          <button
            key={g.id}
            className={chip(isOpen)}
            aria-expanded={isOpen}
            onClick={() => onOpenGroup(isOpen ? null : g.id)}
          >
            <span key={isPicked ? 'picked' : 'empty'} className={chipBody(isPicked)}>
            {isPicked ? (
              <>
                <span key={`${g.id}-${totalCount}`} className="animate-pop">
                  <IngredientArt color={picks[0].ingredient.color} className="block size-[36px]" />
                </span>
                <span className={cx(chipTitle, 'line-clamp-2 max-w-[86px]')}>{summaryLabel}</span>
                <span className="text-[11px] font-medium text-white/70 leading-none tabular-nums animate-fade-in">
                  +{formatPrice(totalPrice)}
                </span>
              </>
            ) : (
              <>
                <span
                  className="grid size-[36px] place-items-center rounded-full bg-white/12 text-white border border-white/10 text-[20px] font-light leading-none shadow-sm transition-transform active:scale-95"
                  aria-hidden="true"
                >
                  +
                </span>
                <span className={cx(chipTitle, 'line-clamp-2 max-w-[86px] px-1')}>{g.name}</span>
              </>
            )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
