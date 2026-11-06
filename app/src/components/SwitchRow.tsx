import type { ReactNode } from 'react'

import { cx } from '../utils/cx'
import { Button } from './Button'

type Props = {
  checked: boolean
  onChange: () => void
  label: ReactNode
  description?: ReactNode
  leading?: ReactNode
  className?: string
  disabled?: boolean
}

export function SwitchRow({ checked, onChange, label, description, leading, className, disabled }: Props) {
  return <Button role="switch" aria-checked={checked} disabled={disabled} onClick={onChange} className={cx('ui-switch-row', className)}>
    {leading}
    <span className="ui-switch-row__copy"><span className="ui-switch-row__label">{label}</span>{description && <span className="ui-switch-row__description">{description}</span>}</span>
    <span className="ui-switch" aria-hidden="true" />
  </Button>
}
