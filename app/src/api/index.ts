import type { ApiClient } from './client'
import { createHttpClient } from './httpClient'
import { mockApiClient } from './mockClient'

export * from './client'
export * from './mockClient'
export * from './httpClient'
export * from './types'

const apiUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_URL as string | undefined) : undefined

export const api: ApiClient = apiUrl ? createHttpClient(apiUrl) : mockApiClient
