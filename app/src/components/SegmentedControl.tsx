import { type ReactNode, useRef } from 'react'

import { cx } from '../utils/cx'
import { Button } from './Button'

type Segment<T extends string> = { value: T; label: ReactNode; detail?: ReactNode; accessibleLabel?: string; disabled?: boolean }
type Props<T extends string> = { label: string; value: T; options: Segment<T>[]; onChange: (value: T) => void; stretch?: boolean; tone?: 'surface' | 'product'; cycleOnSelected?: boolean; className?: string }

/**
 * Soft UI switch for size, temperature and pickup time. A choice is pressed into the surface where
 * it stands, it doesn't slide there: the old one rises as the new one sinks. Its size never depends
 * on the choice: columns are equal, and a `detail` is always laid out, only shown when selected.
 */
export function SegmentedControl<T extends string>({ label, value, options, onChange, stretch, tone = 'surface', cycleOnSelected = false, className }: Props<T>) {
  const rowRef = useRef<HTMLDivElement>(null)
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
      {option.detail
        ? <span className="ui-segments__face">
          <span className="ui-segments__short">{option.label}</span>
          <span className="ui-segments__full">{option.label}<span className="ui-segments__detail">{option.detail}</span></span>
        </span>
        : <span>{option.label}</span>}
    </Button>)}
  </div>
}
