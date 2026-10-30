// Usage: node scripts/capture.mjs <outdir>
// Drives Chrome on the emulator over CDP (adb forward tcp:9333 localabstract:chrome_devtools_remote)
// and screenshots every screen of the app in both themes with fixed demo data.
import { mkdirSync, writeFileSync } from 'node:fs'

const out = process.argv[2] || 'screenshots'
mkdirSync(out, { recursive: true })
const ORIGIN = 'http://localhost:5173'

const tabs = await (await fetch('http://127.0.0.1:9333/json')).json()
const tab =
  tabs.find((t) => t.type === 'page' && t.title?.includes('shit кофе') && t.url?.includes(':5173')) ??
  tabs.find((t) => t.type === 'page' && t.url?.includes(':5173'))
if (!tab) {
  console.error(`No tab found on port 5173`)
  process.exit(1)
}
await fetch('http://127.0.0.1:9333/json/activate/' + tab.id)
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq
    pending.set(id, resolve)
    ws.send(JSON.stringify({ id, method, params }))
  })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const js = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails))
  return r.result?.result?.value
}
const shot = async (name) => {
  await sleep(1400)
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64'))
  console.log('shot', name)
}
// Each screen starts from a fresh load so router history and in-memory state never leak between shots.
const go = async (hash) => {
  await js(`location.replace('#' + ${JSON.stringify(hash)})`)
  await send('Page.reload')
  await sleep(2200)
}
const clickText = async (sel, text, prefix = false) => {
  for (let i = 0; i < 15; i++) {
    try {
      return await js(
        `(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find(e => { const t = e.textContent.trim(); return ${prefix} ? t.startsWith(${JSON.stringify(text)}) : t.includes(${JSON.stringify(text)}) }); if (!el) throw new Error('no ' + ${JSON.stringify(text)}); el.click(); return true })()`,
      )
    } catch (e) {
      if (i === 14) throw e
      await sleep(250)
    }
  }
}

await send('Page.enable')
await send('Runtime.enable')

const now = Date.now()
const data = {
  'zerno-cart': [
    { key: 'latte|l|vanilla', itemId: 'latte', variantId: 'l', ingredientIds: ['vanilla'], qty: 2 },
    { key: 'croissant|one', itemId: 'croissant', variantId: 'one', ingredientIds: [], qty: 1 },
  ],
  'zerno-profile': { phone: '+7 999 123-45-67', name: 'Dima', email: '', notifications: true, joinedAt: now - 86400000 },
  'zerno-orders': [
    { id: 'fixedready', number: 42, createdAt: now - 3600000, readyAt: now - 3000000, lines: [{ key: 'latte|m', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 1 }, { key: 'cookie|one', itemId: 'cookie', variantId: 'one', ingredientIds: [], qty: 2 }], subtotal: 490, discount: 49, total: 441, name: 'Dima', pickup: { kind: 'asap' }, payment: 'card', phone: '+7 999 123-45-67', levelDiscount: 0, promoDiscount: 49 },
    { id: 'fixedcancel', number: 17, createdAt: now - 7200000, readyAt: now - 7000000, cancelledAt: now - 7100000, lines: [{ key: 'matcha|l', itemId: 'matcha', variantId: 'l', ingredientIds: ['oat'], qty: 1 }], subtotal: 390, discount: 0, total: 390, name: 'Dima', pickup: { kind: 'in', minutes: 15 }, payment: 'card', phone: '+7 999 123-45-67' },
  ],
  'zerno-name': 'Dima',
}

for (const theme of ['light', 'dark']) {
  await js(`(() => { localStorage.clear(); const d = ${JSON.stringify(data)}; for (const k in d) localStorage.setItem(k, typeof d[k] === 'string' ? d[k] : JSON.stringify(d[k])); localStorage.setItem('zerno-theme', '${theme}'); return true })()`)
  await go('/menu')
  await js('scrollTo(0, 0)')
  await shot(`${theme}-01-menu-top`)
  await js(`scrollTo(0, document.getElementById('section-milk-coffee').offsetTop - 96 + 1)`)
  await shot(`${theme}-02-menu-coffee`)
  await js(`scrollTo(0, document.getElementById('section-bakery').offsetTop - 96 + 1)`)
  await shot(`${theme}-03-menu-food`)

  await go('/product/latte')
  await shot(`${theme}-04-product`)
  await clickText('.chip, button', 'Сиропы')
  await sleep(300)
  await js(`document.querySelector('button[aria-label^="Ваниль: добавить порцию"]').click()`)
  await clickText('button[role=radio]', 'L', true)
  await shot(`${theme}-05-product-addons`)
  await clickText('[role=group] button[aria-label="Закрыть"]', ''); await sleep(500); await clickText('button', 'подробнее')
  await shot(`${theme}-06-product-inside`)

  await go('/cart')
  await shot(`${theme}-07-cart-top`)
  await js(`(() => { const b = document.querySelector('[aria-label="Корзина"] > div:nth-child(2)') ?? document.querySelector('[role=dialog] > div'); b.scrollTop = b.scrollHeight; return true })()`)
  await shot(`${theme}-08-cart-bottom`)
  await go('/menu')

  await go('/order/fixedready')
  await shot(`${theme}-09-order-ready`)
  await go('/menu')
  await go('/order/fixedcancel')
  await shot(`${theme}-10-order-cancelled`)
  await go('/menu')

  await go('/profile')
  await shot(`${theme}-11-profile-top`)
  await js(`(() => { const b = document.querySelector('[aria-label="Профиль"] > div:nth-child(2)'); b.scrollTop = b.scrollHeight; return true })()`)
  await shot(`${theme}-12-profile-bottom`)
  await go('/menu')

  await go('/login')
  await shot(`${theme}-13-login`)
  await go('/menu')
}
ws.close()
