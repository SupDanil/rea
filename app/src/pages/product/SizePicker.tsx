import { useRef } from 'react'
import type { Variant } from '../../domain'
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

/**
 * 2026 Liquid Glass SizePicker:
 * Liquid droplet indicator that glides between S / M / L segments with volume display.
 */
export function SizePicker({ variants, selected, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const pill = useSlidingIndicator(rowRef, variants[selected]?.id ?? '', '[aria-checked="true"]')

  return (
    <div
      ref={rowRef}
      className="relative flex items-center rounded-full bg-pd-track p-1 border border-pd-line backdrop-blur-xl shadow-inner shrink-0"
      role="radiogroup"
      aria-label="Размер"
    >
      <span
        ref={pill}
        className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-white dark:bg-surface-2 border border-glass-border opacity-0 shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-[transform,width] duration-300 ease-soft"
        aria-hidden="true"
      />
      {variants.map((v, idx) => {
        const isChecked = idx === selected
        return (
          <button
            key={v.id}
            role="radio"
            aria-checked={isChecked}
            disabled={v.stopped}
            className="relative z-1 flex h-[46px] sm:h-[50px] w-[64px] sm:w-[72px] flex-col items-center justify-center rounded-full px-2 text-pd-muted transition-colors duration-150 disabled:opacity-30 aria-checked:text-ink active:scale-95 cursor-pointer"
            onClick={() => onSelect(idx)}
          >
            <span className="font-display text-[15px] sm:text-[16px] leading-none font-bold">
              {sizeLabel[v.size]}
            </span>
            {isChecked && v.volume && (
              <span className="mt-1 text-[10px] sm:text-[11px] font-semibold text-muted leading-none whitespace-nowrap animate-fade-in">
                {v.volume}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
