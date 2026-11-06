import type { InputHTMLAttributes, Ref } from 'react'

import { cx } from '../utils/cx'

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  fieldSize?: 'md' | 'xl' | 'code' | 'inline'
  error?: boolean
  ref?: Ref<HTMLInputElement>
}

export function TextField({ fieldSize = 'md', error = false, className, ref, ...props }: TextFieldProps) {
  return <input {...props} ref={ref} aria-invalid={props['aria-invalid'] ?? (error || undefined)} className={cx('ui-field', `ui-field--${fieldSize}`, error && 'ui-field--error', className)} />
}

export function Checkbox({ className, ref, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { ref?: Ref<HTMLInputElement> }) {
  return <input {...props} ref={ref} type="checkbox" className={cx('ui-checkbox', className)} />
}
