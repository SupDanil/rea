import type { ReactNode } from 'react'

import { cx } from '../utils/cx'
import { IconButton } from './Button'

type Props = {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  disabled?: boolean
  decreaseDisabled?: boolean
  increaseDisabled?: boolean
  decreaseIcon?: ReactNode
  size?: 'sm' | 'md'
  tone?: 'surface' | 'product'
  className?: string
}

/** Limits/removal are domain decisions made by the caller, not by the visual control. */
export function QuantityStepper({ value, onDecrease, onIncrease, decreaseLabel, increaseLabel, disabled, decreaseDisabled, increaseDisabled, decreaseIcon = '−', size = 'md', tone = 'surface', className }: Props) {
  return <div className={cx('ui-stepper', `ui-stepper--${size}`, `ui-stepper--${tone}`, className)} role="group" aria-label={`Количество: ${value}`}>
    <IconButton variant="plain" size={size} aria-label={decreaseLabel} disabled={disabled || decreaseDisabled} onClick={onDecrease}>{decreaseIcon}</IconButton>
    <span className="ui-stepper__value" aria-live="polite">{value}</span>
    <IconButton variant="plain" size={size} aria-label={increaseLabel} disabled={disabled || increaseDisabled} onClick={onIncrease}>+</IconButton>
  </div>
}
