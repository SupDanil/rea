import { memo } from 'react'

import brand from '../../brand.json'
import { brandLoaderHtml } from '../brand/loaderMarkup'
import { cx } from '../utils/cx'

type Props = {
  /** Width of the logo, px. */
  size?: number
  /** Optional caption under it */
  text?: string
  className?: string
}

// Built once from brand.json: static, our own markup.
const markup = brandLoaderHtml(brand.eyes)

/**
 * The brand logo filling with coffee: the same mark as the launch screen (index.html styles
 * `.brand-logo`, from brand.json), so swapping the logo changes every loader at once.
 */
export const Loader = memo(function Loader({ size = 40, text, className }: Props) {
  return (
    <div role="status" aria-label="Загрузка" className={cx('grid place-items-center gap-2 p-6 select-none', className)}>
      <div className="brand-loader" style={{ width: size }} dangerouslySetInnerHTML={{ __html: markup }} />
      {text && <span className="text-caption text-muted font-medium">{text}</span>}
    </div>
  )
})
