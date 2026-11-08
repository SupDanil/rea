import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import brand from '../../brand.json'
import { BrandLogo } from './BrandLogo'

describe('BrandLogo', () => {
  it('draws the logo from src/brand/logo.svg with the eyes from brand.json cut out', () => {
    const { container } = render(<BrandLogo size={20} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('width', '20')
    expect(svg.querySelector('g path')).toBeInTheDocument()
    expect(svg.querySelectorAll('mask circle')).toHaveLength(brand.eyes.length)
  })
})
