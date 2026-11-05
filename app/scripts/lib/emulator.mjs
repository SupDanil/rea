import { execSync } from 'node:child_process'

export const PHONES = [
  { name: 'small 320×568', width: 320, height: 568, dpr: 2 },
  { name: 'budget 360×640', width: 360, height: 640, dpr: 2 },
  { name: 'typical 393×852', width: 393, height: 852, dpr: 3 },
  { name: 'big 430×932', width: 430, height: 932, dpr: 3 },
  { name: 'tablet 768×1024', width: 768, height: 1024, dpr: 2, wide: true },
  { name: 'desktop 1280×800', width: 1280, height: 800, dpr: 1, wide: true },
]

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Judges the longest main-thread task of every run by the 90th percentile: a single
 * run can hit a garbage collection or the first layout of a new screen size, so one bad
 * number proves little. The worst run is still printed, so rare pauses stay visible.
 */
export function checkTaskBudget(longestTasks, budgetMs) {
  const sorted = [...longestTasks].sort((a, b) => a - b)
  const p90 = sorted[Math.floor(sorted.length * 0.9)]
  console.log(`\nLongest task per run: p90 ${p90}ms, worst ${sorted.at(-1)}ms (budget ${budgetMs}ms)`)
  return p90 > budgetMs ? [`main thread blocked ${p90}ms in 1 run of 10 or more`] : []
}

/** Attaches to the Chrome tab showing `url` in the running Android emulator, over DevTools. */
export async function connect(url) {
  const { port, origin } = new URL(url)
  execSync(`adb reverse tcp:${port} tcp:${port} && adb forward tcp:9333 localabstract:chrome_devtools_remote`)
  const pages = await (await fetch('http://localhost:9333/json')).json()
  const page = pages.find((p) => p.type === 'page' && new URL(p.url).origin === origin)
  if (!page) throw new Error(`Open ${url} in the emulator's Chrome first`)

  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => Object.assign(socket, { onopen: resolve, onerror: reject }))
  let lastId = 0
  const pending = new Map()
  const traceEvents = []
  let traceDone = () => {}
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Tracing.dataCollected') traceEvents.push(...message.params.value)
    if (message.method === 'Tracing.tracingComplete') traceDone()
    pending.get(message.id)?.(message)
    pending.delete(message.id)
  }
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      pending.set(++lastId, resolve)
      socket.send(JSON.stringify({ id: lastId, method, params }))
    })
  const evaluate = async (expression) => {
    const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'page error')
    return result.result.value
  }
  /** Runs `action` under Chrome's tracer and returns the animations that could not go to the compositor. */
  const uncomposited = async (action) => {
    traceEvents.length = 0
    await send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['blink.animations', 'devtools.timeline', 'disabled-by-default-devtools.timeline'] } })
    await action()
    const finished = new Promise((resolve) => (traceDone = resolve))
    await send('Tracing.end')
    await finished
    return traceEvents
      .filter((e) => e.name === 'Animation' && e.args?.data?.compositeFailed)
      .map((e) => `${e.args.data.nodeName ?? '?'} (${e.args.data.compositeFailed})`)
  }
  /** Loads the page as it is on disk: the PWA's service worker would happily serve the previous build. */
  const loadFresh = async () => {
    await evaluate(`Promise.all([
      navigator.serviceWorker.getRegistrations().then((all) => Promise.all(all.map((r) => r.unregister()))),
      caches.keys().then((all) => Promise.all(all.map((key) => caches.delete(key)))),
    ])`)
    await send('Page.navigate', { url })
    for (let waited = 0; waited < 15000; waited += 250) {
      await sleep(250)
      if (await evaluate(`!!document.querySelector('main [data-art-of]')`)) break
    }
    await sleep(1000)
  }
  return { send, evaluate, uncomposited, loadFresh, close: () => socket.close() }
}
