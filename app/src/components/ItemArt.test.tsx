import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { ItemArt } from './ItemArt'

const art = { kind: 'cup', fill: '#5e4b7e', bg: '#dcd8ec' } as const

describe('ItemArt', () => {
  it('loads the resized photo and falls back to the original if that fails', () => {
    const { container } = render(<ItemArt art={art} imageUrl="/uploads/products/latte.png" />)
    const image = container.querySelector('image')!
    expect(image.getAttribute('href')).toContain('/_next/image')

    fireEvent.error(image)
    expect(image.getAttribute('href')).toMatch(/\/uploads\/products\/latte\.png$/)
  })
})
