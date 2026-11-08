import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import brand from '../../brand.json'
import { Loader } from './Loader'

describe('Loader', () => {
  it('is the brand logo with the eyes from brand.json, the same as the launch screen', () => {
    const { container } = render(<Loader size={64} />)
    expect(container.querySelector('.brand-loader')).toHaveStyle({ width: '64px' })
    expect(container.querySelector('.brand-logo .brand-coffee')).toBeInTheDocument()
    expect(container.querySelectorAll('.brand-eye')).toHaveLength(brand.eyes.length)
  })
})
