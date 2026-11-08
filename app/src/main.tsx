import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { router } from './app/router'
import { initPwaUpdate } from './hooks/usePwaUpdate'
import { AppProvider } from './state/AppProvider'

// Initialize PWA Service Worker lifecycle & update detection
initPwaUpdate()

// Handle push notification click navigation messages from Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'PUSH_NAVIGATE' && event.data.url) {
      try {
        const url = new URL(event.data.url, window.location.origin)
        if (url.hash) {
          const path = url.hash.replace(/^#/, '')
          void router.navigate(path)
        }
      } catch {}
    }
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// The menu stays mounted under every other screen, so it never needs its scroll back.
// The browser's restore on Back works from a stale position and jumps the page mid-flight.
history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </QueryClientProvider>
  </StrictMode>,
)
