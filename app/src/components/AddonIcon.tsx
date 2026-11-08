import type { CSSProperties } from 'react'

import { cx } from '../utils/cx'
import { optimizedImageUrl } from '../utils/imageUrl'

type Props = {
  url?: string | null
  alt?: string
  className?: string
  style?: CSSProperties
}

/**
 * Renders an addon/category photo icon.
 * Renders cleanly as an <img> tag with lazy loading and object-contain.
 */
export function AddonIcon({ url, alt = '', className, style }: Props) {
  if (!url) return null

  const resolvedUrl = optimizedImageUrl(url)

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={cx('object-contain', className)}
      style={style}
      loading="lazy"
      decoding="async"
    />
  )
}
