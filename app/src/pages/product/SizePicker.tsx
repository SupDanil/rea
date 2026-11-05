import { type RefObject,useLayoutEffect, useRef } from 'react'

import type { Variant } from '../../domain'

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = { variants: Variant[]; selected: number; onSelect: (idx: number) => void }

/**
 * Horizontal sliding indicator that glides smoothly between S / M / L segments.
 */
function useHorizontalSlidingIndicator(
  rowRef: RefObject<HTMLDivElement | null>,
  activeKey: string,
  selector = '[aria-checked="true"]',
) {
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const placed = useRef(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    const indicator = indicatorRef.current
    if (!row || !indicator) {
      placed.current = false
      return
    }
    const place = (animate: boolean) => {
      const tab = row.querySelector<HTMLElement>(selector)
      if (!tab) return
      indicator.style.transition = animate ? '' : 'none'
      indicator.style.width = `${tab.offsetWidth}px`
      indicator.style.height = `${tab.offsetHeight}px`
      indicator.style.transform = `translateX(${tab.offsetLeft}px)`
      indicator.style.opacity = '1'
    }
    place(placed.current)
    placed.current = true
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    void document.fonts?.ready?.then(() => place(false))
    return () => window.removeEventListener('resize', onResize)
  }, [rowRef, activeKey, selector])

  return indicatorRef
}

/**
 * 2026 Liquid Glass Horizontal SizePicker:
 * Placed in the top cockpit bar next to NutritionBar (KCAL / BJU).
 * Provides immediate tactile size switching with sliding pill.
 */
export function SizePicker({ variants, selected, onSelect }: Props) {
  const rowRef = useRef<HTMLDivElement>(null)
  const pill = useHorizontalSlidingIndicator(rowRef, variants[selected]?.id ?? '', '[aria-checked="true"]')

  return (
    <div
      ref={rowRef}
      className="relative flex items-center h-8 rounded-full bg-pd-glass border border-pd-line p-0.5 shadow-xs select-none z-30 box-border"
      role="radiogroup"
      aria-label="Размер"
    >
      <span
        ref={pill}
        className="pointer-events-none absolute left-0 top-0.5 bottom-0.5 rounded-full bg-white dark:bg-surface-2 border border-glass-border opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-[transform,width] duration-300 ease-soft"
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
            className="relative z-1 flex items-center justify-center gap-1 h-full rounded-full px-2.5 text-pd-muted transition-colors duration-150 disabled:opacity-30 aria-checked:text-ink active:scale-95 cursor-pointer leading-none"
            onClick={() => onSelect(idx)}
          >
            <span className="font-display text-[12px] leading-none font-bold">
              {sizeLabel[v.size]}
            </span>
            {isChecked && v.volume && (
              <span className="text-[10px] font-semibold text-pd-muted leading-none whitespace-nowrap animate-fade-in">
                {v.volume}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
