import { execSync, spawn } from 'node:child_process'

const ORIGIN = 'http://localhost:5173'
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json()
const tab = tabs.find((t) => t.type === 'page' && t.url.startsWith(ORIGIN))
if (!tab) {
  console.error('No tab found on localhost:5173')
  process.exit(1)
}
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

let id = 0; const p = new Map(); const errs = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description?.slice(0, 160))
  if (p.has(m.id)) { p.get(m.id)(m); p.delete(m.id) }
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const js = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
await send('Runtime.enable')

console.log('1. Resetting state & reloading...')
await js(`localStorage.setItem('zerno-cart','[]'); localStorage.setItem('shit-coffee-cart','[]'); location.replace('#/menu')`)
await send('Page.reload')
await sleep(2500)

// Start screenrecord on device
console.log('2. Starting screenrecord on emulator...')
const rec = spawn('adb', ['shell', 'screenrecord', '--time-limit', '25', '/sdcard/tour.mp4'], {
  env: { ...process.env, PATH: '/Users/dakon/Library/Android/sdk/platform-tools:' + process.env.PATH }
})
await sleep(800)

console.log('3. Opening HeroBanner...')
await js(`document.querySelector('button.tinted[style*="--tint"]')?.click()`)
await sleep(1400)

console.log('4. Closing Hero drink back to hero banner...')
await js(`document.querySelector('button[aria-label="Закрыть"]')?.click()`)
await sleep(1400)

console.log('5. Scrolling to Latte and opening it...')
await js(`scrollTo({top: document.getElementById('section-milk-coffee')?.offsetTop - 96 || 0, behavior:'instant'})`)
await sleep(500)
await js(`document.querySelector('button[aria-label^="Латте,"]')?.click()`)
await sleep(1400)

console.log('6. Swapping hot ↔ iced (Холодный)...')
await js(`(() => { const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Холодный')); if (b) b.click(); })()`)
await sleep(1400)

console.log('7. Swapping back (Горячий)...')
await js(`(() => { const b = [...document.querySelectorAll('button')].find(el => el.textContent.includes('Горячий')); if (b) b.click(); })()`)
await sleep(1400)

console.log('8. Adding to cart (flying cup to bottom dock)...')
await js(`document.querySelector('button[aria-label^="Добавить в корзину за"]')?.click()`)
await sleep(2200)

console.log('9. Opening Cart...')
await js(`document.querySelector('[data-cart-target=dock]')?.click()`)
await sleep(1400)

console.log('10. Opening drink from cart line...')
await js(`document.querySelector('button[aria-label^="Открыть"]')?.click()`)
await sleep(1400)

console.log('11. Closing drink back to cart...')
await js(`document.querySelector('button[aria-label="Закрыть"]')?.click()`)
await sleep(1400)

console.log('12. Closing Cart back to menu...')
await js(`document.querySelector('button[aria-label="Назад в меню"]')?.click()`)
await sleep(1500)

console.log('13. Tour finished! Status:')
console.log(
  'hash:', await js('location.hash'),
  'overlays:', await js('document.querySelectorAll("[role=dialog]").length'),
  'clones:', await js('document.querySelectorAll("body > svg").length'),
  'hidden:', await js(`[...document.querySelectorAll('[data-art-of]')].filter(e=>e.style.visibility==='hidden').length`),
  'errors:', errs.length ? errs : 'none'
)

// Wait for screenrecord process or kill it
await sleep(1000)
try {
  execSync('/Users/dakon/Library/Android/sdk/platform-tools/adb shell pkill -2 screenrecord')
} catch {}
await sleep(1500)
execSync('/Users/dakon/Library/Android/sdk/platform-tools/adb pull /sdcard/tour.mp4 ./tour_recording.mp4')
console.log('Pulled tour_recording.mp4 successfully!')
ws.close()
