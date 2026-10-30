import { useRef } from 'react'
import type { Variant } from '../../data/menu'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

/** M / L switch: one white pill springs between sizes. */
export function SizePicker({ variants, selected, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const pill = useSlidingIndicator(rowRef, variants[selected]?.id ?? '', '[aria-checked="true"]')
  return (
    <div ref={rowRef} className="relative flex rounded-full bg-white/10 p-1" role="radiogroup" aria-label="Размер">
      <span
        ref={pill}
        className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-white opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-[transform,width] duration-[460ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        aria-hidden="true"
      />
      {variants.map((v, idx) => (
        <button
          key={v.id}
          role="radio"
          aria-checked={idx === selected}
          disabled={v.stopped}
          className="relative z-1 flex h-[52px] min-w-12 flex-col items-center justify-center rounded-full px-2.5 text-white/85 transition-[color] duration-300 disabled:opacity-30 aria-checked:min-w-[66px] aria-checked:text-[#1d1916]"
          onClick={() => onSelect(idx)}
        >
          <span className="text-[18px] leading-none font-extrabold">{sizeLabel[v.size]}</span>
          {idx === selected && v.volume && <span className="mt-[3px] text-[10px] font-semibold opacity-70 animate-fade-in">{v.volume}</span>}
        </button>
      ))}
    </div>
  )
}
