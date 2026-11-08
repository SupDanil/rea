/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { brandLoaderHtml } from './src/brand/loaderMarkup.js'

// GitHub Pages serves the app from /<repo>/; the deploy workflow passes it in.
// Locally it stays at the root.
const base = process.env.BASE_PATH ?? '/'
// The brand in one place (brand.json + src/brand/logo.svg): colours, the launch screen
// in index.html and the PWA splash all read from it. `npm run brand` rebuilds the icons.
const brand = JSON.parse(readFileSync(new URL('./brand.json', import.meta.url), 'utf8'))
const logoSvg = readFileSync(new URL('./src/brand/logo.svg', import.meta.url), 'utf8')
const [, , logoWidth, logoHeight] = /viewBox="([^"]+)"/
  .exec(logoSvg)![1]
  .split(/[\s,]+/)
  .map(Number)

/** Fills `%brand.key%` in index.html, so the launch screen matches the splash Android draws. */
function brandHtml(): Plugin {
  const values: Record<string, string | number> = {
    ...brand,
    logoAspect: logoWidth / logoHeight,
    loader: brandLoaderHtml(brand.eyes),
    // Inlined, not fetched: the logo must be there on the very first frame after the splash.
    logoMask: `url("data:image/svg+xml,${encodeURIComponent(logoSvg)}")`,
    // The coffee's surface: a wave in the fill colour, as a data URL.
    wave: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10' preserveAspectRatio='none'><path d='M0 6 Q25 0 50 6 T100 6 V10 H0Z' fill='${brand.logoFill}'/></svg>`)}")`,
  }
  return {
    name: 'brand-html',
    transformIndexHtml: (html) => html.replace(/%brand\.(\w+)%/g, (_, key: string) => String(values[key])),
  }
}

// PWA install, splash & Android system navigation bar color: dark, so the Android WebAPKActivity
// sets android:navigationBarColor and windowBackground to dark, with no white bottom strip.
const pwaThemeColor = brand.background

// https://vite.dev/config/
export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3336,
    strictPort: false,
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
  preview: {
    port: 3336,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    react(),
    brandHtml(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
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
        background_color: pwaThemeColor,
        theme_color: pwaThemeColor,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        importScripts: ['push-handler.js'],
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
