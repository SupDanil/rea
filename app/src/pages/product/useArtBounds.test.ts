import { describe, expect, it } from 'vitest'

import { imageBounds } from './useArtBounds'

describe('visible image bounds', () => {
  it('ignores asymmetric transparent padding when locating the left edge', () => {
    const pixels = new Uint8ClampedArray(100 * 200 * 4)
    for (let y = 20; y < 180; y++) {
      for (let x = 10; x < 80; x++) pixels[(y * 100 + x) * 4 + 3] = 255
    }
    // A 100×200 image is centered inside ItemArt's 170×200 image frame.
    expect(imageBounds(100, 200, pixels)).toEqual({ x: 60, y: 26, width: 70, height: 160 })
  })

  it('accounts for letterboxing of an opaque landscape image', () => {
    const pixels = new Uint8ClampedArray(200 * 100 * 4).fill(255)
    expect(imageBounds(200, 100, pixels)).toEqual({ x: 15, y: 63.5, width: 170, height: 85 })
  })

  it('uses a finite conservative frame for a fully transparent image', () => {
    expect(imageBounds(10, 10, new Uint8ClampedArray(400))).toEqual({ x: 15, y: 6, width: 170, height: 200 })
  })
})
