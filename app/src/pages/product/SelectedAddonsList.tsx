import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Button } from '../../components/Button'
import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup } from '../../domain'
import { cx } from '../../utils/cx'
import { optimizedImageUrl } from '../../utils/imageUrl'

export type SelectedAddonItem = {
  group: IngredientGroup
  ingredient: Ingredient
  qty: number
}

type Props = {
  items: SelectedAddonItem[]
  onRemoveAll: (group: IngredientGroup, ingredientId: string) => void
  className?: string
}

/**
 * Compute valid scroll stops for vertical carousel.
 * Dots strictly represent reachable scroll positions / pages, NOT raw item count.
 */
function computeScrollStops(el: HTMLElement): number[] {
  const maxScroll = el.scrollHeight - el.clientHeight
  // If content fits or barely exceeds by a trivial jitter (<= 14px), no scrolling is possible
  if (maxScroll <= 14) return []

  const children = Array.from(el.children) as HTMLElement[]
  if (children.length <= 1) return []

  const stops: number[] = [0]
  const baseOffset = children[0].offsetTop

  for (let i = 1; i < children.length; i++) {
    const top = children[i].offsetTop - baseOffset
    // Only add if it is comfortably before maxScroll (at least 10px before maxScroll)
    // and at least 22px after previous stop
    if (top < maxScroll - 10 && top - stops[stops.length - 1] >= 22) {
      stops.push(top)
    }
  }

  // Ensure maxScroll is the final stop if not already close to the last stop
  if (maxScroll - stops[stops.length - 1] >= 14) {
    stops.push(maxScroll)
  }

  return stops
}

/**
 * 2026 Compact Vertical Addon Carousel:
 * Positioned to the right of the coffee cup in BUILDER state.
 * Displays chosen toppings in a tight vertical stack.
 *
 * Features:
 * - Single action: full deletion via ✕.
 * - Dynamic vertical fade mask at boundaries (disappears when not overflowing).
 * - Smooth inertial vertical scrolling with snap alignment.
 * - Pagination dots reflect truthful number of reachable scroll steps (like horizontal carousel).
 * - Auto-scroll to newly added items.
 * - Touch, mouse wheel, trackpad compatible.
 */
export function SelectedAddonsList({ items, onRemoveAll, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(items.length)
  const [scrollStops, setScrollStops] = useState<number[]>([])
  const scrollStopsRef = useRef<number[]>([])
  const [activeScrollIdx, setActiveScrollIdx] = useState(0)
  const [canScroll, setCanScroll] = useState(false)

  // Inertial smooth wheel scrolling for desktop / mouse wheel / trackpad
  const targetScrollRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (el.scrollHeight <= el.clientHeight) return
      e.preventDefault()

      const maxScroll = el.scrollHeight - el.clientHeight
      const currentScroll = el.scrollTop
      if (animFrameRef.current === null) {
        targetScrollRef.current = currentScroll
      }

      targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current + e.deltaY * 0.9))

      const step = () => {
        if (!scrollRef.current) {
          animFrameRef.current = null
          return
        }
        const curr = scrollRef.current.scrollTop
        const target = targetScrollRef.current
        const diff = target - curr

        if (Math.abs(diff) < 0.5) {
          scrollRef.current.scrollTop = target
          animFrameRef.current = null
          return
        }

        scrollRef.current.scrollTop = curr + diff * 0.24
        animFrameRef.current = requestAnimationFrame(step)
      }

      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(step)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [])

  // Mouse drag-to-scroll for desktop & Android emulator
  const isMouseDownRef = useRef(false)
  const startYRef = useRef(0)
  const startScrollTopRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !scrollRef.current) return
    // Allow clicking on delete button without initiating drag
    if ((e.target as HTMLElement).closest('button')) return

    e.preventDefault()
    isMouseDownRef.current = true
    startYRef.current = e.clientY || e.pageY
    startScrollTopRef.current = scrollRef.current.scrollTop

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!isMouseDownRef.current || !scrollRef.current) return
      moveEvent.preventDefault()
      const currentY = moveEvent.clientY || moveEvent.pageY
      const diff = (currentY - startYRef.current) * 1.3
      scrollRef.current.scrollTop = startScrollTopRef.current - diff
    }

    const onGlobalMouseUp = () => {
      isMouseDownRef.current = false
      window.removeEventListener('mousemove', onGlobalMouseMove)
      window.removeEventListener('mouseup', onGlobalMouseUp)
    }

    window.addEventListener('mousemove', onGlobalMouseMove)
    window.addEventListener('mouseup', onGlobalMouseUp)
  }

  const updateEdgeStatus = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollHeight, clientHeight } = el
    const overflowing = scrollHeight > clientHeight + 8
    setCanScroll(overflowing)
  }, [])

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setScrollStops([])
      scrollStopsRef.current = []
      setCanScroll(false)
      return
    }
    updateEdgeStatus()
    const stops = computeScrollStops(el)
    setScrollStops(stops)
    scrollStopsRef.current = stops
    const hasMultipleStops = stops.length > 1

    if (hasMultipleStops) {
      let closestIdx = 0
      let minDiff = Infinity
      for (let i = 0; i < stops.length; i++) {
        const diff = Math.abs(el.scrollTop - stops[i])
        if (diff < minDiff) {
          minDiff = diff
          closestIdx = i
        }
      }
      setActiveScrollIdx(closestIdx)
    } else {
      setActiveScrollIdx(0)
    }
  }, [updateEdgeStatus])

  const handleScroll = () => {
    updateEdgeStatus()
    const el = scrollRef.current
    const stops = scrollStopsRef.current
    if (!el || stops.length <= 1) return

    let closestIdx = 0
    let minDiff = Infinity
    for (let i = 0; i < stops.length; i++) {
      const diff = Math.abs(el.scrollTop - stops[i])
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    }
    if (closestIdx !== activeScrollIdx) {
      setActiveScrollIdx(closestIdx)
    }
  }

  const scrollToStop = (index: number) => {
    const el = scrollRef.current
    const stops = scrollStopsRef.current
    if (!el || index < 0 || index >= stops.length) return
    const targetTop = stops[index]
    setActiveScrollIdx(index)
    if (typeof el.scrollTo === 'function') {
      try {
        el.scrollTo({ top: targetTop, behavior: 'smooth' })
      } catch {
        el.scrollTop = targetTop
      }
    } else {
      el.scrollTop = targetTop
    }
  }

  // Auto-scroll to bottom when a new topping is added
  useEffect(() => {
    if (items.length > prevCount.current && scrollRef.current) {
      requestAnimationFrame(() => {
        if (!scrollRef.current) return
        updateScrollState()
        const el = scrollRef.current
        if (el.scrollHeight > el.clientHeight + 14) {
          if (typeof el.scrollTo === 'function') {
            try {
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
            } catch {
              el.scrollTop = el.scrollHeight
            }
          } else {
            el.scrollTop = el.scrollHeight
          }
        }
      })
    }
    prevCount.current = items.length
  }, [items.length, updateScrollState])

  // Monitor DOM size changes to refresh scroll stops & mask
  useLayoutEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      updateScrollState()
    })
    observer.observe(el)
    for (let i = 0; i < el.children.length; i++) {
      observer.observe(el.children[i])
    }
    return () => observer.disconnect()
  }, [updateScrollState, items.length])

  if (items.length === 0) return null

  return (
    <div
      className={cx('relative flex items-center w-full h-full max-h-full', className)}
    >
      {/* Expand the scroll viewport sideways for shadows; matching padding keeps
          the rows at their original width and position. Vertical masking stays. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        role="region"
        aria-label="Выбранные добавки"
        style={{
          scrollPadding: '10px 0',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 14px, black calc(100% - 14px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14px, black calc(100% - 14px), transparent 100%)',
        }}
        className={cx(
          'no-scrollbar relative w-[calc(100%+calc(var(--space-unit)*12))] -mx-6 px-6 shrink-0 h-full max-h-full flex flex-col gap-1.5 overflow-y-auto overscroll-contain snap-y snap-proximity scroll-py-2 touch-pan-y py-1',
          'cursor-grab active:cursor-grabbing select-none',
          !canScroll && 'justify-center',
        )}
      >
        {items.map((item) => (
          <div
            key={`${item.group.id}-${item.ingredient.id}`}
            className={cx(
              'snap-start group/row flex items-center justify-between gap-1.5 pl-3 pr-1 rounded-control',
              'bg-pd-glass text-pd-ink shadow-xs',
              'transition-all duration-150 select-none animate-[slide-in-right_0.22s_var(--ease-soft)_both]',
            )}
          >
            {/* Left: Icon & Name */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="size-4.5 xs:size-5 shrink-0 grid place-items-center rounded-pill overflow-hidden">
                {item.ingredient.imageUrl ? (
                  <img
                    src={optimizedImageUrl(item.ingredient.imageUrl)}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : (
                  <IngredientArt color={item.ingredient.color} className="size-3 xs:size-3.5" />
                )}
              </div>
              <span className="text-caption font-semibold text-pd-ink truncate leading-tight">
                {item.ingredient.name}
              </span>
            </div>

            {/* Right: Multiplier badge (only for counter-enabled groups like syrups/protein) & Delete button */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {item.group.counter && (
                <span
                  key={item.qty}
                  className="text-caption font-black text-pd-muted tabular-nums animate-pop"
                  title={`Количество: ${item.qty}`}
                >
                  ×{item.qty}
                </span>
              )}
              <Button
                type="button"
                onClick={() => onRemoveAll(item.group, item.ingredient.id)}
                aria-label={`Удалить ${item.ingredient.name}`}
                className="size-11 grid place-items-center rounded-control text-pd-muted hover:text-error hover:bg-error/15 transition-colors cursor-pointer text-caption font-bold leading-none active:scale-90"
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Vertical Carousel Scroll Dots Indicator - Strictly reflects reachable scroll stops, not item count */}
      {canScroll && scrollStops.length > 1 && (
        <div
          className="absolute left-[calc(100%+calc(var(--space-unit)*0.75))] xs:left-[calc(100%+calc(var(--space-unit)*1))] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 select-none pointer-events-auto max-h-full overflow-hidden animate-[fade-in_0.2s_ease_both]"
          role="tablist"
          aria-label="Индикатор прокрутки добавок"
        >
          {scrollStops.map((_, idx) => {
            const isCurrent = idx === activeScrollIdx
            return (
              <Button
                key={`scroll-stop-${idx}`}
                type="button"
                onClick={() => scrollToStop(idx)}
                className="group size-3.5 grid place-items-center cursor-pointer"
                aria-label={`Прокрутка ${idx + 1} из ${scrollStops.length}`}
              >
                <span
                  className={cx(
                    'transition-all duration-300 ease-soft rounded-pill block',
                    isCurrent
                      ? 'w-1.5 h-3.5 bg-accent shadow-xs'
                      : 'size-1 bg-pd-ink/30 group-hover:bg-pd-ink/60 dark:bg-crema/30 dark:group-hover:bg-crema/60',
                  )}
                />
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
