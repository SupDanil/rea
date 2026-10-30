import type { MenuItem } from '../../data/menu'
import { useExitTransition } from '../../hooks/useExitTransition'
import { cx } from '../../utils/cx'

type Props = { item: MenuItem; open: boolean; onToggle: () => void; hidden?: boolean }

/** "подробнее" — floats over the stage so opening it never shifts the product art. */
export function ProductDetails({ item, open, onToggle, hidden = false }: Props) {
  // Keep the popover mounted for its exit; fade the whole thing while an add-on panel is up.
  const { rendered, leaving } = useExitTransition(open && !hidden ? item : null, 180)
  return (
    <div
      className={cx('relative z-10 mt-3 flex justify-center transition-[opacity,translate] duration-200 ease-soft', hidden && 'pointer-events-none -translate-y-1 opacity-0')}
      aria-hidden={hidden || undefined}
    >
      <button
        className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur-md border border-white/10 transition-[background-color,transform,scale] active:scale-95 hover:bg-white/15 shadow-sm"
        aria-expanded={open}
        aria-controls="inside"
        onClick={onToggle}
        tabIndex={hidden ? -1 : undefined}
      >
        подробнее
      </button>
      {rendered && (
        <div
          className={cx(
            'absolute top-[calc(100%+8px)] right-3 left-3 sm:right-4 sm:left-4 z-30 origin-top space-y-2 rounded-[22px] bg-[#1c120e]/95 text-white/90 p-3.5 sm:p-4 text-[12px] sm:text-[13px] leading-[1.5] shadow-lift backdrop-blur-2xl border border-white/10',
            leaving ? 'pointer-events-none animate-[pop-out_0.18s_ease-in_both]' : 'animate-[fade-in_0.25s_var(--ease-soft)_both]',
          )}
          id="inside"
        >
          <p>{rendered.description}</p>
          <p>
            <b className="text-white">Состав:</b> {rendered.composition}
          </p>
          {rendered.allergens && (
            <p>
              <b className="text-white">Аллергены:</b> {rendered.allergens}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
