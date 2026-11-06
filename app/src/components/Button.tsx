import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

import { cx } from '../utils/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'plain'
export type ControlSize = 'sm' | 'md' | 'lg'
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ControlSize
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
}

/** One native button contract: refs/events/ARIA are forwarded, never wrapped in another button. */
export function Button({ variant = 'plain', size = 'md', fullWidth, type = 'button', className, ref, ...props }: ButtonProps) {
  return <button {...props} ref={ref} type={type} className={cx('ui-button', `ui-button--${variant}`, variant !== 'plain' && `ui-control--${size}`, fullWidth && 'w-full', className)} />
}

export type IconButtonProps = Omit<ButtonProps, 'children'> & { children: ReactNode; 'aria-label': string }

export function IconButton({ size = 'md', variant = 'secondary', className, ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} size={size} className={cx('ui-icon-button', className)} />
}
