import { createElement, type HTMLAttributes } from 'react'

import { cx } from '../utils/cx'

type Props = HTMLAttributes<HTMLElement> & { tone?: 'surface' | 'muted' | 'product'; padding?: 'none' | 'md' | 'lg'; as?: 'div' | 'section' | 'li' | 'ul' | 'dl' }

/** The shared card/panel shell; page layout stays with its owner. */
export function Surface({ tone = 'surface', padding = 'none', className, as: Tag = 'div', ...props }: Props) {
  return createElement(Tag, { ...props, className: cx('ui-surface', `ui-surface--${tone}`, `ui-surface--pad-${padding}`, className) })
}
