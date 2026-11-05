import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'

import { api, type ApiClient } from '../api'
import { routes } from '../app/router'
import { AppProvider } from '../state/AppProvider'
import { catalogData, testShop } from './catalogFixture'

type ApiOverrides = Partial<{ [K in keyof ApiClient]: ApiClient[K] }>

/**
 * Renders the real app (provider, routes, layout) at `path` with the API client's
 * network calls stubbed: a signed-out guest with no orders and the fixture menu,
 * unless a test overrides a method.
 */
export function renderApp(path = '/', overrides: ApiOverrides = {}) {
  const defaults: ApiOverrides = {
    getCatalog: async () => catalogData,
    getShops: async () => [testShop],
    getProfile: async () => null,
    getOrders: async () => [],
  }
  const spies = Object.fromEntries(
    (Object.keys({ ...defaults, ...overrides }) as (keyof ApiClient)[]).map((key) => {
      const impl = (overrides[key] ?? defaults[key]) as (...args: unknown[]) => unknown
      return [key, vi.spyOn(api, key).mockImplementation(impl as never)]
    }),
  )

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </QueryClientProvider>,
  )
  return { ...utils, router, queryClient, spies }
}
