import { useId } from 'react'

import brand from '../../brand.json'
import logo from './logo.svg?raw'

const viewBox = /viewBox="([^"]+)"/.exec(logo)![1]
const [minX, minY, width, height] = viewBox.split(/[\s,]+/).map(Number)
const shape = logo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '')

/** The brand logo in the current colour, eyes cut through to whatever is behind it. */
export function BrandLogo({ className, size = 24 }: { className?: string; size?: number }) {
  const mask = `brand-eyes-${useId().replace(/:/g, '')}`
  return (
    <svg className={className} viewBox={viewBox} width={size} height={size} fill="currentColor" aria-hidden="true">
      <mask id={mask} maskUnits="userSpaceOnUse" x={minX} y={minY} width={width} height={height}>
        <rect x={minX} y={minY} width={width} height={height} fill="white" />
        {brand.eyes.map(({ x, y, size: d }) => (
          <circle key={`${x}-${y}`} cx={minX + (x / 100) * width} cy={minY + (y / 100) * height} r={(d / 200) * width} fill="black" />
        ))}
      </mask>
      <g mask={`url(#${mask})`} dangerouslySetInnerHTML={{ __html: shape }} />
    </svg>
  )
}
