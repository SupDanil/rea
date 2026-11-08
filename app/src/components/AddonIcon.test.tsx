import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AddonIcon } from './AddonIcon'

describe('AddonIcon', () => {
  it('returns null when url is missing', () => {
    const { container } = render(<AddonIcon url={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a standard img tag for addon photo icons', () => {
    render(<AddonIcon url="/uploads/products/addons/vanilla.png" alt="Ваниль" className="size-9" />)
    const el = screen.getByAltText('Ваниль')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('IMG')
    expect(el).toHaveAttribute('src')
    expect(el.getAttribute('src')).toContain('/uploads/products/addons/vanilla.png')
    expect(el.className).toContain('size-9')
    expect(el.className).toContain('object-contain')
    expect(el).toHaveAttribute('loading', 'lazy')
    expect(el).toHaveAttribute('decoding', 'async')
  })
})
