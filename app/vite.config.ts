/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from /<repo>/; the deploy workflow passes it in.
// Locally it stays at the root.
const base = process.env.BASE_PATH ?? '/'
// PWA install/splash colour follows the same light palette as the app.
const tokens = readFileSync(new URL('./src/styles/tokens.css', import.meta.url), 'utf8')
const themeBackground = tokens.match(/--bg:\s*(#[\da-f]{3,8})\s*;/i)?.[1]
if (!themeBackground) throw new Error('tokens.css: --bg must be a hex colour for the PWA manifest')

// https://vite.dev/config/
export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
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
      devOptions: {
        enabled: true,
      },
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'shit кофе — кофе и кое-кто ещё',
        short_name: 'shit кофе',
        description: 'Кофе с компанией в Петербурге. Заяц на пене и мягкий спутник с собой.',
        lang: 'ru',
        // Relative to the manifest, so it follows `base`.
        id: './',
        start_url: './#/menu',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: themeBackground,
        theme_color: themeBackground,
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
