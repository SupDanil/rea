import type { HTMLAttributes } from 'react'

import { cx } from '../utils/cx'
import { Button, type ButtonProps } from './Button'

type ChoiceStyle = { selected?: boolean; tone?: 'surface' | 'product' }
const choiceClass = ({ selected, tone = 'surface' }: ChoiceStyle, className?: string) =>
  cx('ui-choice', `ui-choice--${tone}`, selected && 'ui-choice--selected', className)

/** Neutral raised choice; selected choices use the same recess as SegmentedControl. */
export function ChoiceButton({ selected = false, tone, className, ...props }: Omit<ButtonProps, 'variant'> & ChoiceStyle) {
  return <Button aria-pressed={selected} {...props} className={choiceClass({ selected, tone }, className)} />
}

/** Visual face when the whole ingredient tile is already a button. Avoids nested buttons. */
export function ChoiceFace({ selected, tone, className, ...props }: HTMLAttributes<HTMLSpanElement> & ChoiceStyle) {
  return <span {...props} className={choiceClass({ selected, tone }, className)} />
}
