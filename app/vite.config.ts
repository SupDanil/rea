/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from /<repo>/; the deploy workflow passes it in.
// Locally it stays at the root.
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/_next': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Зерно — кофе и еда',
        short_name: 'Зерно',
        description: 'Меню кофейни: напитки, добавки и еда',
        lang: 'ru',
        // Relative to the manifest, so it follows `base`.
        id: './',
        start_url: './#/menu',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3efe9',
        theme_color: '#f3efe9',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Product photos come from the API; a copy of each must not be downloaded on install.
        globIgnores: ['uploads/**'],
        runtimeCaching: [
          {
            // Offline the app still shows the last menu it got from the API.
            urlPattern: ({ url }) => url.pathname.endsWith('/api/v1/catalog'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api-catalog', networkTimeoutSeconds: 4, expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
