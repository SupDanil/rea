/** Minimal desktop Chrome transport for visual contract tests; Node 22+, no npm browser download. */
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export async function launchBrowser() {
  const executable = process.env.CHROME_PATH || [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].find(existsSync)
  if (!executable) throw new Error('Set CHROME_PATH to Chrome/Chromium. Node 22+ is required.')
  const profile = await mkdtemp(join(tmpdir(), 'rea-design-'))
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
  let launchError
  child.on('error', (error) => { launchError = error })
  let socket
  const close = async () => {
    socket?.close()
    if (child.exitCode === null && !launchError) {
      const exited = new Promise((resolve) => child.once('exit', resolve))
      child.kill()
      await Promise.race([exited, sleep(3000)])
      if (child.exitCode === null) { child.kill('SIGKILL'); await exited }
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 })
  }
  try {
    let port
    for (let attempt = 0; attempt < 100; attempt++) {
      if (launchError) throw launchError
      if (child.exitCode !== null) throw new Error(`Chrome exited: ${child.exitCode}`)
      try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { await sleep(100) }
    }
    if (!port) throw new Error('Chrome DevTools did not start')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
    let id = 0
    const pending = new Map()
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data), request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id); clearTimeout(request.timer)
      if (message.error) request.reject(new Error(message.error.message))
      else request.resolve(message.result)
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const current = ++id
      const timer = setTimeout(() => { pending.delete(current); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
      pending.set(current, { resolve, reject, timer }); socket.send(JSON.stringify({ id: current, method, params }))
    })
    const evaluate = async (fn, arg) => {
      const result = await send('Runtime.evaluate', { expression: `(${fn})(${JSON.stringify(arg) ?? ''})`, awaitPromise: true, returnByValue: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
      return result.result.value
    }
    return { send, evaluate, close }
  } catch (error) { await close(); throw error }
}
