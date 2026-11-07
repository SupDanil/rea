#!/usr/bin/env node
/**
 * End-to-end check of the card ↔ product flights in real Chrome on an Android
 * emulator, across phone sizes and slowed-down CPUs. jsdom has no layout or
 * compositor, so this is the test for how the animation behaves, not just its logic.
 *
 *   npm run build && npm run preview      (the budgets are for a production build)
 *   npm run test:flights [-- <url>]
 *
 * Needs a running emulator with Chrome open on the app and the API reachable.
 */
import { checkTaskBudget, connect, PHONES, sleep } from './lib/emulator.mjs'

const URL_UNDER_TEST = process.argv[2] ?? 'http://localhost:4173/'
const CPU_SLOWDOWNS = [1, 4, 6]

const LANDING_TOLERANCE_PX = 1
const OVERSHOOT_TOLERANCE_PX = 1
const FLIGHT_TIMEOUT_MS = 5000
// The compositor keeps flying through main-thread stalls, but a tap should still answer fast.
const LONGEST_TASK_BUDGET_MS = 300

/**
 * Runs in the page: records every frame of a flight, and the clone next to the real
 * `target` at the moment the one replaces the other.
 */
const recorder = (target) => `(() => {
  const box = (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => +v.toFixed(1)) }
  window.__box = box
  window.__flights = { target: ${JSON.stringify(target)}, frames: [], planned: [], landings: [], longTasks: [] }
  if (!window.__patched) {
    window.__patched = true
    // What the flight was told at take-off: a stalled main thread can't correct it in time.
    const animate = Element.prototype.animate
    Element.prototype.animate = function (keyframes, timing) {
      const end = this.dataset?.flight !== undefined && keyframes.at(-1).transform
      if (end) window.__flights.planned.push(+/scale\\(([\\d.]+)\\)/.exec(end)[1] * parseFloat(this.style.height))
      return animate.call(this, keyframes, timing)
    }
    const remove = Element.prototype.remove
    Element.prototype.remove = function () {
      if (this.dataset?.flight !== undefined) {
        const real = document.querySelector(window.__flights.target)
        window.__flights.landings.push({ clone: box(this), real: real && box(real) })
      }
      remove.call(this)
    }
    new PerformanceObserver((list) => {
      for (const task of list.getEntries()) window.__flights.longTasks.push(Math.round(task.duration))
    }).observe({ entryTypes: ['longtask'] })
    const tick = () => {
      const clone = document.querySelector('[data-flight]')
      if (clone) window.__flights.frames.push(box(clone))
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
})()`

const artSelector = (id, slot) => `[data-art-of="${id}"][data-art-slot="${slot}"]`
const dialogArt = '[role=dialog] [data-art-of]'

/** Art boxes differ in shape around the same cup, so compare the cup: its middle, top and height. */
function landingError({ clone, real }) {
  const centre = ([left, , width]) => left + width / 2
  return Math.max(Math.abs(centre(clone) - centre(real)), Math.abs(clone[1] - real[1]), Math.abs(clone[3] - real[3]))
}

async function flight(page, { label, id, slot, tap }) {
  const problems = []
  const fail = (text) => problems.push(`${label}: ${text}`)

  await page.evaluate(`document.querySelector('${artSelector(id, slot)}').scrollIntoView({ block: 'center', behavior: 'instant' })`)
  await sleep(500)
  const scrollBefore = await page.evaluate('scrollY')
  const fly = async (target, action) => {
    await page.evaluate(recorder(target))
    await page.evaluate(action)
    for (let waited = 0; waited < FLIGHT_TIMEOUT_MS; waited += 100) {
      await sleep(100)
      if (await page.evaluate(`__flights.landings.some((l) => l.real) && !document.querySelector('[data-flight]')`)) break
    }
    await sleep(500) // the leaving screen is gone by now
    return JSON.parse(await page.evaluate('JSON.stringify(__flights)'))
  }

  const opened = await fly(dialogArt, tap)
  const openLanding = opened.landings.at(-1)
  if (!openLanding?.real) fail('no flight on open')
  else {
    if (landingError(openLanding) > LANDING_TOLERANCE_PX) fail(`open landed off the cup: ${JSON.stringify(openLanding)}`)
    // A big promo on a desktop can start taller than the cup: then it only ever shrinks.
    const limit = Math.max(openLanding.real[3], opened.frames[0][3]) + OVERSHOOT_TOLERANCE_PX
    const tallest = Math.max(...opened.frames.map((frame) => frame[3]), opened.planned.at(-1))
    if (tallest > limit) fail(`cup overshot: ${tallest} > ${openLanding.real[3]}`)
    const settled = await page.evaluate(`__box(document.querySelector('${dialogArt}'))[3]`)
    if (Math.abs(settled - openLanding.real[3]) > 1) fail(`cup resized after landing: ${openLanding.real[3]} → ${settled}`)
  }

  const closed = await fly(artSelector(id, slot), `document.querySelector('[aria-label="Закрыть"]').click()`)
  const closeLanding = closed.landings.at(-1)
  if (!closeLanding?.real) fail('no flight on close')
  else if (landingError(closeLanding) > LANDING_TOLERANCE_PX) fail(`close missed where it left from: ${JSON.stringify(closeLanding)}`)

  const longest = Math.max(0, ...opened.longTasks, ...closed.longTasks)
  const scrollAfter = await page.evaluate('scrollY')
  if (Math.abs(scrollAfter - scrollBefore) >= 0.5) fail(`menu moved under the screen: ${scrollBefore} → ${scrollAfter}`)
  if (await page.evaluate(`!!document.querySelector('[data-flight], [role=dialog]') || document.documentElement.hasAttribute('data-scroll-lock')`))
    fail('left something behind')
  return { problems, longest }
}

/** Nothing on screen is animating, so the page must not be working. */
async function idleWork(page) {
  const metrics = async () =>
    Object.fromEntries((await page.send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]))
  await page.evaluate(`document.getAnimations().forEach((a) => a.effect.getComputedTiming().iterations === Infinity || a.finish())`)
  await sleep(300)
  const before = await metrics()
  await sleep(1500)
  const after = await metrics()
  return after.RecalcStyleCount - before.RecalcStyleCount
}

const page = await connect(URL_UNDER_TEST)
await page.send('Performance.enable')
await page.loadFresh()

const product = await page.evaluate(`[...document.querySelectorAll('[data-art-slot]')]
  .map((el) => el.getAttribute('data-art-of'))
  .find((id, _, all) => all.filter((other) => other === id).length > 1)`)
if (!product) throw new Error('Needs a product that is both in a promo and in the feed')
const promoSlot = await page.evaluate(`[...document.querySelectorAll('[data-art-of="${product}"]')]
  .map((el) => el.getAttribute('data-art-slot')).find((slot) => slot !== 'card')`)
const promoTap = `document.querySelector('${artSelector(product, promoSlot)}').closest('[data-promo-id]').querySelector('.ui-promo-open').click()`
const cardTap = `document.querySelector('${artSelector(product, 'card')}').closest('.group').querySelector('[data-open]').click()`

const problems = []
const longestTasks = []
for (const phone of PHONES) {
  await page.send('Emulation.setDeviceMetricsOverride', { width: phone.width, height: phone.height, deviceScaleFactor: phone.dpr, mobile: !phone.wide })
  await sleep(600)
  for (const slowdown of CPU_SLOWDOWNS) {
    await page.send('Emulation.setCPUThrottlingRate', { rate: slowdown })
    const where = `${phone.name}, CPU ÷${slowdown}`
    const runs = [
      await flight(page, { label: `${where}, promo`, id: product, slot: promoSlot, tap: promoTap }),
      await flight(page, { label: `${where}, feed card`, id: product, slot: 'card', tap: cardTap }),
    ]
    await page.evaluate(`document.querySelector('${artSelector(product, 'card')}').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    const recalcs = await idleWork(page)
    if (recalcs > 0) problems.push(`${where}: ${recalcs} style recalcs while idle`)
    problems.push(...runs.flatMap((run) => run.problems))
    longestTasks.push(...runs.map((run) => run.longest))
    console.log(`${problems.length ? '✗' : '✓'} ${where}: longest task ${Math.max(...runs.map((r) => r.longest))}ms, idle recalcs ${recalcs}`)
  }
}

await page.send('Emulation.setCPUThrottlingRate', { rate: 1 })
await page.send('Emulation.clearDeviceMetricsOverride')
page.close()
problems.push(...checkTaskBudget(longestTasks, LONGEST_TASK_BUDGET_MS))

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join('\n')}`)
  process.exit(1)
}
console.log('\nAll flights landed where they left from, within budget.')
