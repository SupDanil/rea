function resolveApiOrigin(): string {
  const raw = (import.meta.env?.VITE_API_URL as string | undefined) || ''
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
    if (!isLocal && (!raw || raw.includes('localhost') || raw.includes('127.0.0.1'))) {
      return ''
    }
  }
  return (raw || 'http://localhost:3333').replace(/\/api\/v1\/?$/, '')
}

const API_ORIGIN = resolveApiOrigin()

// Enough for the biggest cup on a 3× phone. One size for every place, so a flight
// from card to product shows one decoded image and nothing swaps on landing.
const WIDTH = 750
const QUALITY = 75

const isLocal = (url: string) => url.startsWith('/') && !url.startsWith('//')

/** The upload as stored, on the API's origin. */
export const originalImageUrl = (url: string) => (isLocal(url) ? `${API_ORIGIN}${url}` : url)

/**
 * A product photo as the phone should load it: uploads are full-size PNGs of over
 * a megabyte, the API's image optimizer serves them resized as WebP or AVIF.
 */
export function optimizedImageUrl(url: string) {
  if (!isLocal(url) || /\.(svg|gif)$/i.test(url)) return originalImageUrl(url)
  if (url.includes('/addons/')) {
    const base = originalImageUrl(url)
    return base.includes('?') ? base : `${base}?v=5`
  }
  return `${API_ORIGIN}/_next/image?url=${encodeURIComponent(url)}&w=${WIDTH}&q=${QUALITY}`
}
