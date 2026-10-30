import type { MenuItem } from '../../data/menu'

type Props = { item: MenuItem; open: boolean; onToggle: () => void; hidden?: boolean }

/** "подробнее" — floats over the stage so opening it never shifts the product art. */
export function ProductDetails({ item, open, onToggle, hidden = false }: Props) {
  if (hidden) return null
  return (
    <div className="relative z-10 mt-3 flex justify-center">
      <button
        className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-medium text-white/90 backdrop-blur-md border border-white/10 transition-[background-color,transform] active:scale-95 hover:bg-white/15 shadow-sm"
        aria-expanded={open}
        aria-controls="inside"
        onClick={onToggle}
      >
        подробнее
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-4 left-4 z-30 space-y-2 rounded-[22px] bg-[#1c120e]/95 text-white/90 p-4 text-[13px] leading-[1.5] shadow-lift backdrop-blur-2xl border border-white/10 animate-fade-in"
          id="inside"
        >
          <p>{item.description}</p>
          <p>
            <b className="text-white">Состав:</b> {item.composition}
          </p>
          {item.allergens && (
            <p>
              <b className="text-white">Аллергены:</b> {item.allergens}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
