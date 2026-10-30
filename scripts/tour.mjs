// Usage: node scripts/tour.mjs [setup]
// Drives Chrome over CDP on 127.0.0.1:9333
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json()
const tab = tabs.find((t) => t.type === 'page' && t.url.includes(':5173'))
if (!tab) {
  console.error('No tab found on port 5173')
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

if (process.argv[2] === 'setup') {
  await js(`localStorage.setItem('zerno-cart','[]'); localStorage.setItem('shit-coffee-cart','[]'); location.replace('#/menu')`)
  await send('Page.reload')
  await sleep(2500)
  await js(`scrollTo({top: document.getElementById('section-milk-coffee')?.offsetTop - 96 || 0, behavior:'instant'})`)
  process.exit(0)
}

await js(`document.querySelector('button[aria-label^="Латте,"]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label="Закрыть"]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label^="Латте,"]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label^="Добавить в корзину за"]').click()`); await sleep(2000)
await js(`document.querySelector('[data-cart-target=dock]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label^="Открыть"]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label="Закрыть"]').click()`); await sleep(1300)
await js(`document.querySelector('button[aria-label="Назад в меню"]').click()`); await sleep(1300)

console.log(
  'hash', await js('location.hash'),
  'overlays', await js('document.querySelectorAll("[role=dialog]").length'),
  'clones', await js('document.querySelectorAll("body > svg").length'),
  'hidden', await js(`[...document.querySelectorAll('[data-art-of]')].filter(e=>e.style.visibility==='hidden').length`),
  'errors', errs.length ? errs : 'none'
)
ws.close()
