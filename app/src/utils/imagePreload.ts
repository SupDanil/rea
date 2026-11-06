import { optimizedImageUrl } from './imageUrl'

const isTestEnv =
  (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test')

/** Preload a single image into the browser cache, resolving when decoded or timed out. */
export function preloadImage(rawUrl: string, timeout = 1200): Promise<void> {
  if (typeof window === 'undefined' || !rawUrl || isTestEnv) return Promise.resolve()

  const url = optimizedImageUrl(rawUrl)
  return new Promise((resolve) => {
    const img = new Image()
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        resolve()
      }
    }

    img.onload = finish
    img.onerror = finish
    img.src = url

    if ('decode' in img && typeof img.decode === 'function') {
      img.decode().then(finish).catch(finish)
    }

    setTimeout(finish, timeout)
  })
}

/** Preload critical above-the-fold images in parallel with an overall safety deadline. */
export async function preloadCriticalImages(rawUrls: string[], maxTotalWaitMs = 1200): Promise<void> {
  if (isTestEnv || rawUrls.length === 0) return Promise.resolve()

  const unique = Array.from(new Set(rawUrls.filter(Boolean)))
  await Promise.race([
    Promise.all(unique.map((u) => preloadImage(u, maxTotalWaitMs))),
    new Promise((resolve) => setTimeout(resolve, maxTotalWaitMs)),
  ])
}
