import type { ApiClient } from './client'
import { createHttpClient } from './httpClient'

export * from './client'
export * from './httpClient'
export * from './types'

function resolveApiUrl(rawUrl?: string): string {
  // If running in a real mobile/external browser and apiUrl points to localhost,
  // route through Vite's dev proxy (/api/v1) on the current origin so requests reach the Mac.
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
    if (!isLocal && (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1'))) {
      return '/api/v1'
    }
  }
  return rawUrl || '/api/v1'
}

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined
const apiUrl = resolveApiUrl(rawApiUrl)

if (!apiUrl) {
  throw new Error('VITE_API_URL is not set: point it at the REA-ADMIN API, e.g. http://localhost:3000/api/v1')
}

export const api: ApiClient = createHttpClient(apiUrl)
