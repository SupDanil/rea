import { useRef } from 'react'
import type { Variant } from '../../data/menu'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

/** Drinkit size picker capsule: active size is a white pill with size and volume; inactive is clean text. */
export function SizePicker({ variants, selected, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const pill = useSlidingIndicator(rowRef, variants[selected]?.id ?? '', '[aria-checked="true"]')
  return (
    <div
      ref={rowRef}
      className="relative flex items-center rounded-full bg-pd-track p-0.5 sm:p-1 border border-pd-line backdrop-blur-md shadow-sm shrink-0"
      role="radiogroup"
      aria-label="Размер"
    >
      <span
        ref={pill}
        className="pointer-events-none absolute top-0.5 bottom-0.5 sm:top-1 sm:bottom-1 left-0 rounded-full bg-white opacity-0 shadow-[0_2px_10px_var(--pd-cup-shadow)] transition-[transform,scale,width] duration-[380ms] ease-[cubic-bezier(0.34,1.25,0.64,1)]"
        aria-hidden="true"
      />
      {variants.map((v, idx) => (
        <button
          key={v.id}
          role="radio"
          aria-checked={idx === selected}
          disabled={v.stopped}
          className="relative z-1 flex h-[46px] sm:h-[50px] min-w-[40px] sm:min-w-[48px] flex-col items-center justify-center rounded-full px-2 sm:px-3 text-pd-muted transition-[color,scale] duration-200 disabled:opacity-30 aria-checked:min-w-[58px] sm:aria-checked:min-w-[70px] aria-checked:text-[#221b2c] active:scale-95"
          onClick={() => onSelect(idx)}
        >
          <span className="text-[15px] sm:text-[17px] leading-none font-extrabold">{sizeLabel[v.size]}</span>
          {idx === selected && v.volume && (
            <span className="mt-[2px] sm:mt-[3px] text-[9px] sm:text-[10px] font-semibold text-[#5d5470] leading-none animate-fade-in">{v.volume}</span>
          )}
        </button>
      ))}
    </div>
  )
}
