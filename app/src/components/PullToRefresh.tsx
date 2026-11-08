import { type ReactNode, type TouchEvent, useEffect, useRef, useState } from 'react'

import brand from '../../brand.json'
import { cx } from '../utils/cx'

export type PullToRefreshProps = {
  children: ReactNode
  /** Resolves when fresh data is in; rejects when it could not be fetched (shown to the user). */
  onRefresh: () => Promise<unknown>
  disabled?: boolean
  className?: string
  /** Pull distance in px to trigger refresh. Default 64. */
  threshold?: number
}

/** idle → pulling → ready → refreshing → done | error → idle */
export type PullPhase = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done' | 'error'

const DEFAULT_THRESHOLD = 64
const MAX_PULL = 96
/** Slop before a downward drag counts as a pull, so taps and scroll flicks don't move the pill. */
const SLOP = 6
/** Tucked up behind the header, and where it rests (just below it, set in CSS) while refreshing. */
const HIDDEN_Y = -56
const RESTING_Y = 0
/** One short tick when letting go will refresh, like Android's own pull. */
const TICK_MS = 12
const RESULT_MS = { done: 1000, error: 1800 } as const
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Not shown: the logo says it all. Read out by screen readers. */
const CAPTION: Record<PullPhase, string> = {
  idle: '',
  pulling: 'Потяните, чтобы обновить меню',
  ready: 'Отпустите, чтобы обновить меню',
  refreshing: 'Обновляем меню',
  done: 'Меню обновлено',
  error: 'Нет связи, меню прежнее',
}

const scrollTop = () => window.scrollY || document.documentElement.scrollTop || 0

const vibrate = () => {
  try {
    navigator.vibrate?.(TICK_MS)
  } catch {
    // Not allowed here (iframe, no user gesture): the pull works without it.
  }
}

/**
 * Pull down at the top of the page to refresh. A ceramic disc slides out from under the header:
 * the logo fills with coffee as you pull, brims (with a tick) when letting go will refresh, pours
 * while it loads, and shows full or empty for how it went. During the gesture only transforms are written straight to
 * the DOM (no React render per frame), so it keeps up on old phones.
 */
export function PullToRefresh({ children, onRefresh, disabled = false, className, threshold = DEFAULT_THRESHOLD }: PullToRefreshProps) {
  const pillRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const [phase, setPhaseState] = useState<PullPhase>('idle')
  const phaseRef = useRef<PullPhase>('idle')
  const gesture = useRef<{ x: number; y: number; distance: number; pulling: boolean } | null>(null)
  const resultTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(resultTimer.current)
    }
  }, [])

  const setPhase = (next: PullPhase) => {
    if (phaseRef.current === next) return
    phaseRef.current = next
    setPhaseState(next)
  }

  const movePill = (y: number, animate: boolean) => {
    const el = pillRef.current
    if (!el) return
    el.style.transition = animate ? `transform 0.32s ${EASE}, opacity 0.2s ease` : 'none'
    el.style.transform = `translate3d(0, ${y}px, 0)`
    // Fades in over the first half of its way out, so it never pops into view.
    el.style.opacity = `${Math.min(1, Math.max(0, ((y - HIDDEN_Y) / (RESTING_Y - HIDDEN_Y)) * 2))}`
  }

  /** 0 → empty logo, 1 → full to the brim. */
  const fillTo = (progress: number) => {
    if (fillRef.current) fillRef.current.style.transform = `translate3d(0, ${(1 - Math.min(1, Math.max(0, progress))) * 100}%, 0)`
  }

  const busy = () => phaseRef.current === 'refreshing'

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || busy() || e.touches.length !== 1 || scrollTop() > 2) return
    clearTimeout(resultTimer.current)
    gesture.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, distance: 0, pulling: false }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const g = gesture.current
    const touch = e.touches[0]
    if (!g || !touch || disabled || busy()) return
    const dx = touch.clientX - g.x
    const dy = touch.clientY - g.y

    if (!g.pulling) {
      // Sideways (category tabs) or upwards (scrolling): not ours.
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || scrollTop() > 2) {
        gesture.current = null
        return
      }
      if (dy <= SLOP) return
      g.pulling = true
      setPhase('pulling')
    }

    // Rubber band: easy at first, stiffer the further it goes.
    g.distance = Math.min(MAX_PULL, Math.pow(Math.max(0, dy - SLOP), 0.82) * 1.5)
    const ready = g.distance >= threshold
    if (ready && phaseRef.current !== 'ready') {
      setPhase('ready')
      vibrate()
    } else if (!ready && phaseRef.current === 'ready') {
      setPhase('pulling')
    }
    movePill(HIDDEN_Y + (RESTING_Y - HIDDEN_Y) * Math.min(1, g.distance / threshold) + Math.max(0, g.distance - threshold) * 0.4, false)
    fillTo(g.distance / threshold)
  }

  const finish = (result: 'done' | 'error') => {
    if (!mounted.current) return
    setPhase(result)
    fillTo(result === 'done' ? 1 : 0)
    resultTimer.current = setTimeout(() => {
      movePill(HIDDEN_Y, true)
      setPhase('idle')
    }, RESULT_MS[result])
  }

  const handleTouchEnd = async () => {
    const g = gesture.current
    gesture.current = null
    if (!g?.pulling || busy()) return

    if (g.distance < threshold || disabled) {
      movePill(HIDDEN_Y, true)
      fillTo(0)
      setPhase('idle')
      return
    }

    setPhase('refreshing')
    movePill(RESTING_Y, true)
    try {
      await onRefresh()
      finish('done')
    } catch {
      finish('error')
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cx('relative min-h-dvh w-full', className)}
    >
      <div
        ref={pillRef}
        role="status"
        aria-live="polite"
        data-state={phase}
        className="ui-ptr"
        style={{ transform: `translate3d(0, ${HIDDEN_Y}px, 0)`, opacity: 0 }}
      >
        <span className="ui-ptr__mark" aria-hidden="true">
          <span ref={fillRef} className="ui-ptr__fill" />
          {brand.eyes.map(({ x, y, size }) => (
            <i key={`${x}-${y}`} className="ui-ptr__eye" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }} />
          ))}
        </span>
        <span className="sr-only">{CAPTION[phase]}</span>
      </div>

      {children}
    </div>
  )
}
