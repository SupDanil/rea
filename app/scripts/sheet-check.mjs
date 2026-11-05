#!/usr/bin/env node
/**
 * End-to-end check of how modals come and go, in real Chrome on an Android emulator,
 * across phone sizes and slowed-down CPUs. See flight-check.mjs for the set-up.
 *
 *   npm run build && npm run preview
 *   npm run test:sheets [-- <url>]
 */
import { execSync } from 'node:child_process'
import { checkTaskBudget, connect, PHONES, sleep } from './lib/emulator.mjs'

const URL_UNDER_TEST = process.argv[2] ?? 'http://localhost:4173/'
const CPU_SLOWDOWNS = [1, 4, 6]

const TOP_GAP_PX = 16
const LONGEST_TASK_BUDGET_MS = 300
const RISE_MS = 300
const SETTLE_MS = 1200
const CLOSE_TIMEOUT_MS = 4000

const MODALS = [
  { name: 'cart', open: `location.hash = '#/cart'` },
  { name: 'profile', open: `location.hash = '#/profile'` },
  { name: 'shop picker', open: `document.querySelector('[aria-label^="shit кофе"]').click()` },
]
const close = `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`

/** Runs in the page: follows the panel frame by frame and notes what blocked the main thread. */
const RECORDER = `(() => {
  window.__sheet = { tops: [], started: [], longTasks: [] }
  if (window.__recording) return
  window.__recording = true
  new PerformanceObserver((list) => {
    for (const task of list.getEntries()) window.__sheet.longTasks.push(Math.round(task.duration))
  }).observe({ entryTypes: ['longtask'] })
  // An event, not a frame sample: on a stalled main thread a whole exit can pass between frames.
  document.addEventListener('animationstart', (e) => window.__sheet.started.push(e.animationName), true)
  const tick = () => {
    const panel = document.querySelector('[data-modal-panel]')
    if (panel) window.__sheet.tops.push(+panel.getBoundingClientRect().top.toFixed(1))
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})()`

const OPEN_STATE = `JSON.stringify({
  ...__sheet,
  top: document.querySelector('[data-modal-panel]')?.getBoundingClientRect().top,
  locked: document.documentElement.hasAttribute('data-scroll-lock'),
  blurred: [...document.querySelectorAll('[data-modal], [data-modal] *')].filter((el) => getComputedStyle(el).backdropFilter !== 'none').length,
})`

async function modal(page, { name, open }, where, { withTrace, wide }) {
  const problems = []
  const fail = (text) => problems.push(`${where}, ${name}: ${text}`)
  const scrollBefore = await page.evaluate('scrollY')

  await page.evaluate(RECORDER)
  const rise = async () => {
    await page.evaluate(open)
    await sleep(RISE_MS)
  }
  const failed = withTrace ? await page.uncomposited(rise) : await rise()
  if (failed?.length) fail(`not on the compositor during the rise: ${failed.join(', ')}`)
  await sleep(SETTLE_MS - RISE_MS)
  await page.evaluate(`Promise.all((document.querySelector('[data-modal-panel]')?.getAnimations() ?? []).map((a) => a.finished))`)

  const opened = JSON.parse(await page.evaluate(OPEN_STATE))
  if (opened.top === undefined) return { problems: [`${where}, ${name}: did not open`], longest: 0 }
  if (!wide && opened.top > TOP_GAP_PX) fail(`opens only up to ${opened.top}px from the top`)
  if (!opened.locked) fail('page is free to scroll underneath')
  if (!wide && opened.blurred) fail(`${opened.blurred} element(s) with backdrop-filter`)
  if (Math.min(...opened.tops) < opened.top - 1) fail('panel overshot the top')
  if (opened.tops.some((top, i) => i && top > opened.tops[i - 1] + 0.5)) fail('panel moved back on the way up')
  if (!wide && opened.tops.length > 1 && opened.tops[0] < opened.top + 100) fail(`no rise: started at ${opened.tops[0]}`)

  await page.evaluate(RECORDER)
  await page.evaluate(close)
  for (let waited = 0; waited < CLOSE_TIMEOUT_MS; waited += 100) {
    await sleep(100)
    if (await page.evaluate(`!document.querySelector('[data-modal]')`)) break
  }
  await sleep(200)
  const closed = JSON.parse(await page.evaluate(OPEN_STATE))
  if (closed.top !== undefined) fail('still open after closing')
  if (!closed.started.includes(wide ? 'panel-drop' : 'sheet-drop')) fail('closed without an animation')
  if (closed.tops.some((top, i) => i && top < closed.tops[i - 1] - 0.5)) fail('panel moved back on the way down')
  if (closed.locked) fail('scroll lock left on')
  const scrollAfter = await page.evaluate('scrollY')
  if (Math.abs(scrollAfter - scrollBefore) >= 0.5) fail(`menu moved: ${scrollBefore} → ${scrollAfter}`)

  const longest = Math.max(0, ...opened.longTasks, ...closed.longTasks)
  return { problems, longest }
}

/** A real touch on the grabber: the panel must stay under the finger and go away when let go. */
async function swipe(page, where) {
  const problems = []
  const touch = (type, y, x) =>
    page.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  await page.evaluate(`location.hash = '#/cart'`)
  await sleep(SETTLE_MS)
  const { x, y, top } = JSON.parse(await page.evaluate(`(() => {
    const grabber = document.querySelector('[data-modal-panel] .cursor-grab').getBoundingClientRect()
    return JSON.stringify({ x: grabber.left + grabber.width / 2, y: grabber.top + grabber.height / 2, top: document.querySelector('[data-modal-panel]').getBoundingClientRect().top })
  })()`))

  await touch('touchStart', y, x)
  await touch('touchMove', y + 60, x)
  await sleep(100)
  const dragged = await page.evaluate(`document.querySelector('[data-modal-panel]').getBoundingClientRect().top`)
  if (Math.abs(dragged - top - 60) > 2) problems.push(`${where}, swipe: panel at ${dragged - top}px under a 60px drag`)
  await touch('touchMove', y + 200, x)
  await touch('touchEnd')
  await sleep(SETTLE_MS)
  if (await page.evaluate(`!!document.querySelector('[data-modal]')`)) {
    problems.push(`${where}, swipe: still open`)
    await page.evaluate(close)
    await sleep(SETTLE_MS)
  }
  return problems
}

/** With the address bar scrolled away, opening a modal must not bring it back: the whole page would jump. */
async function addressBarStaysHidden(page) {
  const problems = []
  await page.evaluate(`scrollTo({ top: 0, behavior: 'instant' })`)
  await sleep(300)
  execSync('adb shell input swipe 640 2000 640 1100 300')
  await sleep(900)
  execSync('adb shell input swipe 640 2000 640 1500 300')
  await sleep(900)
  const height = await page.evaluate('innerHeight')
  for (const { name, open } of MODALS) {
    await page.evaluate(open)
    await sleep(SETTLE_MS)
    const opened = await page.evaluate('innerHeight')
    await page.evaluate(close)
    await sleep(SETTLE_MS)
    if (opened !== height) problems.push(`${name}: address bar came back, ${height} → ${opened}`)
  }
  return problems
}

const page = await connect(URL_UNDER_TEST)
await page.loadFresh()

const problems = []
const longestTasks = []
for (const phone of PHONES) {
  await page.send('Emulation.setDeviceMetricsOverride', { width: phone.width, height: phone.height, deviceScaleFactor: phone.dpr, mobile: !phone.wide })
  await sleep(600)
  await page.evaluate(`scrollTo({ top: 300, behavior: 'instant' })`)
  await sleep(400)
  for (const slowdown of CPU_SLOWDOWNS) {
    await page.send('Emulation.setCPUThrottlingRate', { rate: slowdown })
    const where = `${phone.name}, CPU ÷${slowdown}`
    let longest = 0
    for (const entry of MODALS) {
      const run = await modal(page, entry, where, { withTrace: slowdown === 1, wide: phone.wide })
      problems.push(...run.problems)
      longestTasks.push(run.longest)
      longest = Math.max(longest, run.longest)
    }
    if (slowdown === 1 && !phone.wide) problems.push(...(await swipe(page, where)))
    console.log(`${problems.length ? '✗' : '✓'} ${where}: longest task ${longest}ms`)
  }
}

await page.send('Emulation.setCPUThrottlingRate', { rate: 1 })
await page.send('Emulation.clearDeviceMetricsOverride')
await sleep(600)
problems.push(...(await addressBarStaysHidden(page)))
page.close()
problems.push(...checkTaskBudget(longestTasks, LONGEST_TASK_BUDGET_MS))

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join('\n')}`)
  process.exit(1)
}
console.log('\nEvery modal rose, reached the top and left smoothly, within budget.')
