import { describe, expect, it } from 'vitest'

import { optimizedImageUrl, originalImageUrl } from './imageUrl'

describe('optimizedImageUrl', () => {
  it('routes an upload through the API image optimizer', () => {
    const url = new URL(optimizedImageUrl('/uploads/products/1-latte.png'))
    expect(url.pathname).toBe('/_next/image')
    expect(url.searchParams.get('url')).toBe('/uploads/products/1-latte.png')
    expect(url.searchParams.get('w')).toBe('750')
  })

  it('leaves what the optimizer cannot help with', () => {
    expect(optimizedImageUrl('/uploads/products/logo.svg')).toBe(originalImageUrl('/uploads/products/logo.svg'))
    expect(optimizedImageUrl('/uploads/products/loop.GIF')).toBe(originalImageUrl('/uploads/products/loop.GIF'))
    expect(optimizedImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(optimizedImageUrl('//cdn.example.com/a.png')).toBe('//cdn.example.com/a.png')
  })
})
