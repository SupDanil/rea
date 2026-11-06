import { type ReactNode, useRef } from 'react'

import { useSlidingIndicator } from '../hooks/useSlidingIndicator'
import { cx } from '../utils/cx'
import { Button } from './Button'

type Segment<T extends string> = { value: T; label: ReactNode; detail?: ReactNode; accessibleLabel?: string; disabled?: boolean }
type Props<T extends string> = { label: string; value: T; options: Segment<T>[]; onChange: (value: T) => void; stretch?: boolean; tone?: 'surface' | 'product'; cycleOnSelected?: boolean; className?: string }

/** Shared animated indicator for size, temperature and pickup time. */
export function SegmentedControl<T extends string>({ label, value, options, onChange, stretch, tone = 'surface', cycleOnSelected = false, className }: Props<T>) {
  const rowRef = useRef<HTMLDivElement>(null)
  const indicator = useSlidingIndicator(rowRef, value, '[aria-checked="true"]')
  const tabValue = options.find((option) => option.value === value && !option.disabled)?.value
    ?? options.find((option) => !option.disabled)?.value
  const chooseNext = (current: T, key: string) => {
    const available = options.filter((option) => !option.disabled)
    const index = available.findIndex((option) => option.value === current)
    const next = key === 'Home' ? 0 : key === 'End' ? available.length - 1 : (index + (key === 'ArrowLeft' ? -1 : 1) + available.length) % available.length
    const option = available[next]
    if (option) {
      onChange(option.value)
      Array.from(rowRef.current?.querySelectorAll<HTMLButtonElement>('[data-value]') ?? []).find((button) => button.dataset.value === option.value)?.focus()
    }
  }
  return <div ref={rowRef} role="radiogroup" aria-label={label} className={cx('ui-segments', `ui-segments--${tone}`, stretch && 'ui-segments--stretch', className)}>
    <span ref={indicator} className="ui-segments__indicator" aria-hidden="true" />
    {options.map((option) => <Button key={option.value} role="radio" data-value={option.value} aria-label={option.accessibleLabel} aria-checked={option.value === value} disabled={option.disabled}
      tabIndex={option.value === tabValue ? 0 : -1}
      className="ui-segments__option" onClick={() => {
        if (cycleOnSelected && option.value === value) chooseNext(option.value, 'ArrowRight')
        else onChange(option.value)
      }}
      onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          chooseNext(option.value, event.key)
        } else if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          onChange(option.value)
        }
      }}>
      <span>{option.label}</span>
      {option.value === value && option.detail && <span className="ui-segments__detail">{option.detail}</span>}
    </Button>)}
  </div>
}
