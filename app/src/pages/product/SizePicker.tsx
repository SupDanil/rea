import type { Variant } from '../../data/menu'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

export function SizePicker({ variants, selected, onSelect }: Props) {
  return (
    <div className="flex rounded-full bg-white/10 p-1" role="radiogroup" aria-label="Размер">
      {variants.map((v, idx) => (
        <button
          key={v.id}
          role="radio"
          aria-checked={idx === selected}
          disabled={v.stopped}
          className="flex h-[52px] min-w-12 flex-col items-center justify-center rounded-full px-2.5 text-white/85 [transition:background_0.25s,color_0.25s,min-width_0.25s_var(--ease-soft)] disabled:opacity-30 aria-checked:min-w-[66px] aria-checked:bg-white aria-checked:text-[#1d1916]"
          onClick={() => onSelect(idx)}
        >
          <span className="text-[18px] leading-none font-extrabold">{sizeLabel[v.size]}</span>
          {idx === selected && v.volume && <span className="mt-[3px] text-[10px] font-semibold opacity-70">{v.volume}</span>}
        </button>
      ))}
    </div>
  )
}
