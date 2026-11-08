#!/usr/bin/env node
/**
 * Builds every brand image from src/brand/logo.svg and brand.json: the PWA icons (also what
 * Android draws on its launch splash), the iOS icon, the favicon and the notification badges.
 *
 *   npm run brand
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const brand = JSON.parse(readFileSync(new URL('../brand.json', import.meta.url), 'utf8'))
const logo = readFileSync(new URL('../src/brand/logo.svg', import.meta.url), 'utf8')
const [, , logoW, logoH] = /viewBox="([^"]+)"/.exec(logo)[1].split(/[\s,]+/).map(Number)
const [minX, minY] = /viewBox="([^"]+)"/.exec(logo)[1].split(/[\s,]+/).map(Number)
// The eyes in brand.json, back in the logo's own coordinates, in the background colour.
const eyes = brand.eyes
  .map(({ x, y, size }) => `<circle cx="${minX + (x / 100) * logoW}" cy="${minY + (y / 100) * logoH}" r="${(size / 200) * logoW}" fill="${brand.iconBackground}" />`)
  .join('')
const logoShape = logo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '')
const inner = logoShape + eyes

/** The logo centred on a square of `size`, `share` of its width wide. */
function icon(size, share, { radius = 0 } = {}) {
  const w = size * share
  const h = (w * logoH) / logoW
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${brand.iconBackground}" />
  <svg x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" viewBox="${minX} ${minY} ${logoW} ${logoH}" fill="${brand.logoColor}">${inner}</svg>
</svg>
`
}

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 72 * 4 }).resize(size, size).png().toFile(new URL(`../public/${file}`, import.meta.url).pathname)

// Full-bleed: Android masks it to its own shape, also on the launch splash.
await png(icon(512, brand.iconLogoWidth), 512, 'icon-512.png')
await png(icon(512, brand.iconLogoWidth), 192, 'icon-192.png')
await png(icon(512, brand.iconLogoWidth), 180, 'apple-touch-icon.png')
// The favicon is tiny: the logo fills more of it, inside its own rounded square.
writeFileSync(new URL('../public/icon.svg', import.meta.url), icon(48, brand.faviconLogoWidth, { radius: 13 }))

// Notification badge: Android shows only its shape, white on transparent, the eyes cut out.
const badgeSvg = (size) => {
  const w = size * brand.faviconLogoWidth
  const h = (w * logoH) / logoW
  const holes = brand.eyes
    .map(({ x, y, size: d }) => `<circle cx="${minX + (x / 100) * logoW}" cy="${minY + (y / 100) * logoH}" r="${(d / 200) * logoW}" fill="#000" />`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <svg x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" viewBox="${minX} ${minY} ${logoW} ${logoH}">
    <mask id="eyes" maskUnits="userSpaceOnUse" x="${minX}" y="${minY}" width="${logoW}" height="${logoH}">
      <rect x="${minX}" y="${minY}" width="${logoW}" height="${logoH}" fill="#fff" />${holes}
    </mask>
    <g mask="url(#eyes)" fill="#fff">${logoShape}</g>
  </svg>
</svg>
`
}
writeFileSync(new URL('../public/badge.svg', import.meta.url), badgeSvg(48))
await png(badgeSvg(96), 96, 'badge.png')
await png(badgeSvg(96), 96, 'badge-96.png')
await png(badgeSvg(96), 72, 'badge-72.png')
// The admin is the same brand, in the repository next door.
const admin = new URL('../../../REA-ADMIN/public/', import.meta.url)
if (existsSync(admin)) {
  for (const file of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'icon.svg', 'badge.svg', 'badge.png', 'badge-96.png', 'badge-72.png']) {
    copyFileSync(new URL(`../public/${file}`, import.meta.url), new URL(file, admin))
  }
}
console.log('Brand images rebuilt from src/brand/logo.svg')
