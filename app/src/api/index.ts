import type { ApiClient } from './client'
import { createHttpClient } from './httpClient'

export * from './client'
export * from './httpClient'
export * from './types'

const apiUrl = import.meta.env.VITE_API_URL as string | undefined

if (!apiUrl) {
  throw new Error('VITE_API_URL is not set: point it at the REA-ADMIN API, e.g. http://localhost:3000/api/v1')
}

export const api: ApiClient = createHttpClient(apiUrl)
