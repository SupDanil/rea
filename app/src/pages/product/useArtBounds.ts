import { type RefObject, useEffect, useLayoutEffect, useState } from 'react'

import { optimizedImageUrl, originalImageUrl } from '../../utils/imageUrl'

export type ArtBounds = { x: number; y: number; width: number; height: number }
const fullArt: ArtBounds = { x: 47.75, y: 0, width: 104.5, height: 220 }
const imageFrame: ArtBounds = { x: 15, y: 6, width: 170, height: 200 }
const cache = new Map<string, Promise<ArtBounds>>()

/** Map the non-transparent pixels into ItemArt's xMidYMid/meet image frame. */
export function imageBounds(width: number, height: number, alpha: Uint8ClampedArray): ArtBounds {
  let left = width, top = height, right = -1, bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * 4 + 3] <= 8) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < left) return imageFrame
  const scale = Math.min(170 / width, 200 / height)
  return {
    x: 15 + (170 - width * scale) / 2 + left * scale,
    y: 6 + (200 - height * scale) / 2 + top * scale,
    width: (right - left + 1) * scale,
    height: (bottom - top + 1) * scale,
  }
}

function loadBounds(url: string): Promise<ArtBounds> {
  const existing = cache.get(url)
  if (existing) return existing
  const pending = new Promise<ArtBounds>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let retried = false
    // Vite proxies local uploads; use it so localhost's separate API port cannot taint the canvas.
    const source = (value: string) => {
      if (import.meta.env.DEV && url.startsWith('/') && !url.startsWith('//')) {
        const parsed = new URL(value, window.location.href)
        return parsed.pathname + parsed.search
      }
      return value
    }
    img.onload = () => {
      // A small alpha mask is enough; never scan a full-resolution upload on a phone.
      const ratio = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
      try {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(imageFrame)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(imageBounds(canvas.width, canvas.height, ctx.getImageData(0, 0, canvas.width, canvas.height).data))
      } catch {
        // External images without CORS stay inside their conservative SVG frame.
        resolve(imageFrame)
      }
    }
    img.onerror = () => {
      if (!retried) {
        retried = true
        img.src = source(originalImageUrl(url))
      } else resolve(imageFrame)
    }
    img.src = source(optimizedImageUrl(url))
  })
  cache.set(url, pending)
  return pending
}

export function useArtBounds(ref: RefObject<SVGSVGElement | null>, imageUrl: string | undefined, artKey: string) {
  const [measured, setMeasured] = useState<{ key: string; bounds: ArtBounds }>()
  const key = imageUrl || artKey
  useEffect(() => {
    if (!imageUrl) return
    let active = true
    void loadBounds(imageUrl).then((bounds) => {
      if (active) setMeasured({ key, bounds })
    })
    return () => { active = false }
  }, [imageUrl, key])
  useLayoutEffect(() => {
    if (imageUrl || !ref.current) return
    // Exclude the decorative floor shadow and measure the actual vector artwork.
    const boxes = Array.from(ref.current.children)
      .filter((child): child is SVGGraphicsElement => child.tagName.toLowerCase() === 'g' && 'getBBox' in child)
      .map((child) => child.getBBox())
      .filter((box) => box.width > 0 && box.height > 0)
    if (!boxes.length) return
    const x = Math.min(...boxes.map((box) => box.x))
    const y = Math.min(...boxes.map((box) => box.y))
    setMeasured({ key, bounds: {
      x, y,
      width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
      height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
    } })
  }, [ref, imageUrl, key])
  return measured?.key === key ? measured.bounds : imageUrl ? imageFrame : fullArt
}

