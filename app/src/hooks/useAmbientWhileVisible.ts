import { useEffect, type RefObject } from 'react'

/** Marks `ref` with `data-offscreen` while it is out of view, which pauses the `data-ambient` loops inside it. */
export function useAmbientWhileVisible(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => el.toggleAttribute('data-offscreen', !entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}
