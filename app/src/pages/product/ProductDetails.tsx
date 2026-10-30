import type { MenuItem } from '../../data/menu'

type Props = { item: MenuItem; open: boolean; onToggle: () => void }

/** "What's inside" — floats over the stage so opening it never shifts the product art. */
export function ProductDetails({ item, open, onToggle }: Props) {
  return (
    <div className="relative z-4 mt-2.5 flex justify-center">
      <button
        className="self-center rounded-full bg-glass px-3.5 py-[7px] text-[13px] font-semibold"
        aria-expanded={open}
        aria-controls="inside"
        onClick={onToggle}
      >
        что внутри <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-4 left-4 space-y-1.5 rounded-[18px] bg-surface px-4 py-3.5 text-[13px] leading-[1.5] shadow-lift animate-fade-in"
          id="inside"
        >
          <p>{item.description}</p>
          <p>
            <b>Состав:</b> {item.composition}
          </p>
          {item.allergens && (
            <p>
              <b>Аллергены:</b> {item.allergens}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
