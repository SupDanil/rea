#!/usr/bin/env node
/** Real CSS contracts + responsive screens against the running application and its actual API. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchBrowser, sleep } from './lib/browser.mjs'

const url = process.argv[2] || 'http://localhost:5173/'
const output = process.env.DESIGN_SCREENSHOTS
const browser = await launchBrowser()
const waitFor = async (fn) => {
  for (let attempt = 0; attempt < 100; attempt++) { if (await browser.evaluate(fn)) return; await sleep(100) }
  throw new Error(`Timed out: ${fn}`)
}
try {
  await browser.send('Page.enable')
  await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await browser.send('Page.navigate', { url })
  await waitFor(() => !!document.querySelector('[data-open]'))
  // Inspect real catalogue consumers, mutate only CSS custom properties, and restore them afterwards.
  const contract = await browser.evaluate(async () => {
    const root = document.documentElement
    const quick = document.querySelector('main .ui-icon-button') || document.querySelector('.ui-icon-button')
    const card = document.querySelector('[data-open]').parentElement
    const title = card.querySelector('.font-display')
    const capture = () => {
      const button = getComputedStyle(quick), panel = getComputedStyle(card), text = getComputedStyle(title)
      return { radius: panel.borderRadius, gap: panel.paddingLeft, font: text.fontSize, family: text.fontFamily, stroke: button.borderTopWidth, buttonWidth: quick.getBoundingClientRect().width }
    }
    const before = capture()
    const changes = { '--space-unit': '5px', '--type-scale': '1.2', '--radius-scale': '.5', '--stroke-width': '3px', '--font-heading': 'monospace', '--accent': '#5b40a8' }
    const old = root.getAttribute('style')
    Object.entries(changes).forEach(([key, value]) => root.style.setProperty(key, value))
    await new Promise((resolve) => setTimeout(resolve, 450))
    const after = capture()
    const accent = getComputedStyle(root).getPropertyValue('--pd-tile-on-line').trim()
    if (old === null) root.removeAttribute('style'); else root.setAttribute('style', old)
    return { before, after, accent }
  })
  for (const property of ['radius', 'gap', 'font', 'family', 'stroke', 'buttonWidth']) {
    assert.notEqual(contract.before[property], contract.after[property], `Token does not propagate: ${property}`)
  }
  assert.equal(contract.accent, '#5b40a8', 'Product accent must follow the common accent')
  console.log('Token propagation:', JSON.stringify(contract))
  const viewports = [[320,568], [390,844], [416,657], [616,816], [768,1024], [1440,900]]
  if (output) await mkdir(output, { recursive: true })
  for (const theme of ['light', 'dark']) for (const [width, height] of viewports) {
    await browser.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 })
    await browser.evaluate((theme) => { document.documentElement.dataset.theme = theme; location.hash = '#/' }, theme)
    await waitFor(() => !document.querySelector('[data-modal-panel]'))
    await sleep(120)
    const check = async (screen) => {
      const result = await browser.evaluate(() => {
        const modal = document.querySelector('[data-modal-panel]'), box = modal?.getBoundingClientRect()
        return { viewport: innerWidth, page: document.documentElement.scrollWidth, modal: box && { left: box.left, right: box.right, top: box.top, bottom: box.bottom }, background: getComputedStyle(modal || document.body).backgroundColor }
      })
      assert.ok(result.page <= width + 1, `${theme} ${width} ${screen}: document overflows`)
      if (result.modal) {
        assert.ok(result.modal.left >= -1 && result.modal.right <= width + 1, `${theme} ${width} ${screen}: modal cropped horizontally`)
        assert.ok(result.modal.top >= -1 && result.modal.bottom <= height + 1, `${theme} ${width} ${screen}: modal cropped vertically`)
      }
      if (output && [390,1440].includes(width)) {
        const image = await browser.send('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(output, `${theme}-${width}-${screen}.png`), Buffer.from(image.data, 'base64'))
      }
    }
    await check('menu')
    await browser.evaluate(() => document.querySelector('[data-open]').click())
    await waitFor(() => !!document.querySelector('[data-modal-panel]'))
    await sleep(150)
    await check('product')
    const background = await browser.evaluate(() => getComputedStyle(document.querySelector('[data-modal-panel]')).backgroundImage)
    assert.notEqual(background, 'none', 'Product background must retain its local API tint')
    await browser.evaluate(() => document.querySelector('[data-modal-panel] .ui-button--primary')?.click())
    // Add only to local cart; this test never submits an order or payment.
    await sleep(500)
    await browser.evaluate(() => { location.hash = '#/cart' })
    await waitFor(() => !!document.querySelector('[aria-label="Когда забрать"], input[autocomplete="tel"]'))
    const signedIn = await browser.evaluate(() => !!document.querySelector('[aria-label="Когда забрать"]'))
    await check(signedIn ? 'cart' : 'cart-login')
    await browser.evaluate(() => { location.hash = '#/profile' })
    await waitFor(() => !!document.querySelector('[data-modal-panel]'))
    await sleep(150)
    await check(signedIn ? 'profile' : 'profile-login')
    console.log(`PASS ${theme} ${width}×${height}: menu, product, ${signedIn ? 'cart, profile' : 'cart/profile login gates (signed out)'}`)
  }
} catch (error) {
  console.error(await browser.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(-800), error: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(-1000) })))
  throw error
} finally { await browser.close() }
