import { type CSSProperties, type ReactNode, type Ref,useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

import { EntranceContext, useIsLeaving } from '../app/leaving'
import { useEscape } from '../hooks/useEscape'
import { useScrollLock } from '../hooks/useScrollLock'
import { cx } from '../utils/cx'

const DISMISS_DISTANCE_PX = 120
const DISMISS_MS = 180
// Past the rise: focus repaints inside the moving panel.
const FOCUS_DELAY_MS = 450

type Props = {
  /** Accessible name of the dialog */
  label: string
  onClose: () => void
  /** Blocks leaving, e.g. while a payment is in flight */
  locked?: boolean
  /** `sheet` rises from the bottom almost to the top and swipes away; `screen` covers the whole phone. */
  kind?: 'sheet' | 'screen'
  panelRef?: Ref<HTMLDivElement>
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** Open modals, topmost last: only that one answers Escape. */
const stack: object[] = []

const panels = {
  sheet: cx(
    'flex w-full max-w-(--layout-phone) flex-col overflow-hidden bg-surface',
    'rounded-t-dialog wide:rounded-dialog border-t-(length:--stroke-width) border-glass-border wide:border-(length:--stroke-width) shadow-lift shadow-black/25',
  ),
  screen: cx(
    'flex h-full w-full max-w-(--layout-phone) flex-col overflow-hidden select-none',
    'wide:max-w-(--layout-product) md:max-w-(--layout-product-wide) wide:h-[min(calc(var(--space-unit)*220),94dvh)] wide:rounded-dialog wide:border-(length:--stroke-width) wide:border-glass-border wide:shadow-lift',
  ),
}

/**
 * Every layer that opens over the app: dimmed backdrop, panel, focus, Escape and a
 * still page underneath. How it comes and goes lives in index.css (`data-modal-*`);
 * leaving is driven from outside by `data-leaving` (AnimatedOutlet, Presence).
 *
 * All of it moves on the compositor. Nothing inside animates `backdrop-filter`, and the
 * panel is opaque, so a frame costs the same on a budget phone as on a flagship.
 */
export function Modal({ label, onClose, locked = false, kind = 'sheet', panelRef, className, style, children }: Props) {
  const leaving = useIsLeaving()
  const closable = !locked && !leaving
  const [self] = useState(() => ({}))
  useEscape(() => stack.at(-1) === self && onClose(), closable)
  useScrollLock()

  useLayoutEffect(() => {
    stack.push(self)
    return () => void stack.splice(stack.indexOf(self), 1)
  }, [self])

  // Its screen may swap what is inside (a skeleton for the cart): the rise plays only the first time.
  const entrance = useContext(EntranceContext)
  const [settled] = useState(() => !!entrance?.played())
  useLayoutEffect(() => entrance?.markPlayed(), [entrance])

  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useImperativeHandle(panelRef, () => panel.current as HTMLDivElement)

  // Taking over from a screen on its way out (back to the cart from a product): nothing to rise
  // from, it dissolves in on the spot, and art can fly straight to its place in it.
  useLayoutEffect(() => {
    root.current?.toggleAttribute('data-modal-swap', !!document.querySelector('[data-leaving] [data-modal]'))
  }, [])

  // Focus moves in, and back to where it was on close, never by scrolling anything. It lands on
  // the panel, not its first button: that would light up the close button's focus ring for no
  // reason. A field asks for it with `data-autofocus`, but on touch screens it waits for a tap:
  // focusing it brings up the keyboard and Chrome's address bar, and the whole page jumps.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const timer = setTimeout(() => {
      if (panel.current?.contains(document.activeElement)) return
      const field = window.matchMedia('(pointer: fine)').matches && panel.current?.querySelector<HTMLElement>('[data-autofocus]')
      const target = field || panel.current
      target?.focus({ preventScroll: true })
    }, settled ? 0 : FOCUS_DELAY_MS)
    return () => {
      clearTimeout(timer)
      previous?.focus({ preventScroll: true })
    }
  }, [settled])

  // The swipe writes straight to the panel: a finger must not wait for React on every move.
  const swipe = useRef<{ startY: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    if (!closable || !panel.current) return
    swipe.current = { startY: e.touches[0].clientY, y: 0 }
    panel.current.style.transition = 'none'
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipe.current || !panel.current) return
    swipe.current.y = Math.max(0, e.touches[0].clientY - swipe.current.startY)
    panel.current.style.transform = `translateY(${swipe.current.y}px)`
  }

  const onTouchEnd = () => {
    const el = panel.current
    if (!swipe.current || !el) return
    const dismissed = swipe.current.y > DISMISS_DISTANCE_PX
    swipe.current = null
    el.style.transition = `transform ${DISMISS_MS}ms ease-out`
    el.style.transform = dismissed ? 'translateY(100%)' : ''
    if (!dismissed) return
    setTimeout(() => {
      onClose()
      // Going back a step in the same sheet (login) leaves it open: bring it back up.
      requestAnimationFrame(() => requestAnimationFrame(() => el.closest('[data-leaving]') || (el.style.transform = '')))
    }, DISMISS_MS)
  }

  return (
    <div
      ref={root}
      className={cx(
        'fixed inset-0 z-30 flex flex-col items-center overscroll-contain',
        kind === 'sheet' ? 'justify-end wide:justify-center wide:p-4 md:wide:p-6' : 'justify-center',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-modal
      data-modal-settled={settled || undefined}
    >
      <div
        className={cx('absolute inset-0 wide:backdrop-blur-sm', kind === 'sheet' ? 'bg-black/40' : 'bg-black/60')}
        onClick={closable ? onClose : undefined}
        data-modal-backdrop
      />
      <div
        ref={panel}
        tabIndex={-1}
        className={cx('relative outline-none', panels[kind], className)}
        style={style}
        data-modal-panel={kind}
      >
        {kind === 'sheet' && (
          <div
            className="wide:hidden flex flex-none flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            aria-hidden="true"
          >
            <div className="w-11 h-1.5 rounded-pill bg-ink/15 dark:bg-white/20" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
