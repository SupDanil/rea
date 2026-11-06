import { type RefObject,useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ArtGlow, ItemArt } from '../../components/ItemArt'
import type { IngredientGroup, MenuItem, Variant } from '../../domain'
import { countAddons } from '../../domain'
import { cx } from '../../utils/cx'
import { artProps } from '../../utils/morph'
import { prefersReducedMotion } from '../../utils/motion'
import { type SelectedAddonItem,SelectedAddonsList } from './SelectedAddonsList'
import { useArtBounds } from './useArtBounds'
import type { Selection } from './useProductConfig'

export type HeroBuilderAreaProps = {
  item: MenuItem
  variant: Variant
  variants?: Variant[]
  variantIdx?: number
  onSelectVariant?: (idx: number) => void
  groups: IngredientGroup[]
  selection: Selection
  onRemoveAll: (group: IngredientGroup, ingredientId: string) => void
  cupRef: RefObject<HTMLDivElement | null>
  artRef: RefObject<SVGSVGElement | null>
  openedWith: string
  imageUrl?: string
  temperature?: 'hot' | 'cold'
}

/** Extracts all chosen ingredients from selection into grouped items. */
function getSelectedItems(groups: IngredientGroup[], selection: Selection): SelectedAddonItem[] {
  const items: SelectedAddonItem[] = []
  for (const group of groups) {
    const pickedIds = selection[group.id] ?? []
    if (pickedIds.length === 0) continue
    const ingredients = pickedIds
      .map((id) => group.ingredients.find((i) => i.id === id)!)
      .filter(Boolean)
    const counted = countAddons(ingredients)
    for (const { ingredient, qty } of counted) {
      items.push({ group, ingredient, qty })
    }
  }
  return items
}

/**
 * 2026 Adaptive Animated Hero Builder Stage:
 *
 * STATE A (EMPTY / HERO):
 * - No toppings selected.
 * - Coffee cup is prominent (~2x larger than State B) and strictly centered horizontally.
 * - Adaptive sizing accounts for different screen widths and heights so it never overflows.
 * - Addons list on the right is completely absent.
 *
 * STATE B (BUILDER):
 * - >= 1 topping selected.
 * - Cup smoothly slides to the left boundary and returns to compact size (~160-175px).
 * - Vertical SelectedAddonsList appears on the right with elongated chips (up to ~225px),
 *   allowing full ingredient names without truncation.
 * - Volume switcher is in the top cockpit bar next to NutritionBar, keeping the stage uncluttered.
 */
export function HeroBuilderArea({
  item,
  variant,
  groups,
  selection,
  onRemoveAll,
  cupRef,
  artRef,
  openedWith,
  imageUrl,
  temperature,
}: HeroBuilderAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerDims, setContainerDims] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 600) {
      return { width: Math.min(700, window.innerWidth), height: 420 }
    }
    return { width: 390, height: 380 }
  })
  const [isInitial, setIsInitial] = useState(true)

  const items = useMemo(() => getSelectedItems(groups, selection), [groups, selection])
  const hasAddons = items.length > 0

  const [cachedItems, setCachedItems] = useState<SelectedAddonItem[]>(items)
  const [leaving, setLeaving] = useState(false)
  const [prevHasAddons, setPrevHasAddons] = useState(hasAddons)

  if (prevHasAddons !== hasAddons) {
    setPrevHasAddons(hasAddons)
    if (hasAddons) {
      setCachedItems(items)
      setLeaving(false)
    } else {
      setLeaving(true)
    }
  } else if (hasAddons && cachedItems !== items) {
    setCachedItems(items)
  }

  useEffect(() => {
    if (leaving) {
      const t = window.setTimeout(() => {
        setLeaving(false)
      }, prefersReducedMotion() ? 0 : 220)
      return () => window.clearTimeout(t)
    }
  }, [leaving])

  const renderedItems = hasAddons ? items : leaving ? cachedItems : []

  // Track container dimensions (width & height) via ResizeObserver for precise responsive calculations
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) {
        setContainerDims((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
      } else if (w > 0) {
        setContainerDims((prev) => (prev.width === w ? prev : { ...prev, width: w }))
      }
    }
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // After first mount, enable smooth animations for subsequent changes
  useEffect(() => {
    const t = window.setTimeout(() => {
      setIsInitial(false)
    }, 50)
    return () => window.clearTimeout(t)
  }, [])

  const effectiveImageUrl = imageUrl !== undefined ? imageUrl : item.imageUrl
  const bounds = useArtBounds(artRef, effectiveImageUrl, `${item.id}-${temperature}-${item.art.kind}`)
  const isBuilder = hasAddons
  const W = containerDims.width || 390
  const H = containerDims.height || 380
  const isDesktop = W >= 560 || (typeof window !== 'undefined' && window.innerWidth >= 600)

  const baseHeight = 160

  // Symmetrical outer margin:
  // "отступ справа у списка такой же как у стакана слева"
  const sideMargin = W <= 320 ? 10 : isDesktop ? 20 : 16

  // 1. STATE A (HERO - no addons chosen):
  // Cup is centered horizontally and scaled adaptively to fill the central hero space
  const safeVerticalPaddingA = H <= 260 ? 12 : H <= 340 ? 18 : 24
  const maxClearHeightA = Math.min(
    Math.max(140, H - safeVerticalPaddingA),
    Math.round((W - sideMargin * 2) * 1.1),
  )
  const maxHeroCap = W <= 300 ? 1.9 : W <= 340 ? 2.2 : isDesktop ? 2.8 : 2.55
  const heroScale = Math.max(
    1.4,
    Math.min(
      Math.round((maxClearHeightA / baseHeight) * 100) / 100,
      maxHeroCap,
    ),
  )

  // 2. STATE B (BUILDER - addons chosen):
  // "Чуть побольше стакан"
  // Cup is prominent and tall, filling almost the entire vertical height of the stage on the left,
  // while the vertical carousel floats DIRECTLY ON TOP of the cup's right half with frosted glass.
  const safeVerticalPaddingB = H <= 260 ? 4 : H <= 340 ? 8 : 10
  // On a phone the cup keeps its proportion to the screen's width (0.8, the 426×844 reference). A short,
  // wide screen (a foldable's outer display) would otherwise shrink it into the corner next to the list.
  // The stage may be overflowed by 30%: that is the transparent margin around the art.
  const phoneHeightB = isDesktop ? 0 : Math.min(W * 0.8, H * 1.3)
  const maxClearHeightB = Math.max(160, H - safeVerticalPaddingB, phoneHeightB)
  const maxBuilderCap = W <= 300 ? 2.05 : W <= 340 ? 2.35 : isDesktop ? 2.9 : 2.65
  const builderScale = Math.max(
    1.4,
    Math.min(
      Math.round((maxClearHeightB / baseHeight) * 100) / 100,
      maxBuilderCap,
    ),
  )

  const sizeScale = variant.size === 'L' ? 1.05 : variant.size === 'S' ? 0.94 : 1
  const currentScale = isBuilder ? sizeScale * builderScale : sizeScale * heroScale

  const rightMargin = sideMargin

  // Vertical carousel width: generous ~62-66% of screen width so it directly overlaps the cup
  const listWidthRatio = W <= 300 ? 0.68 : W <= 340 ? 0.65 : W >= 600 ? 0.52 : 0.63
  const maxListLimit = W >= 600 ? 320 : 255
  const rightListWidth = Math.max(140, Math.min(maxListLimit, Math.round(W * listWidthRatio)))

  // Align the visible left edge, including asymmetric transparent image padding.
  // Scale, vertical position and the addons list retain their original layout.
  const shiftX = isBuilder
    ? sideMargin - W / 2 + (100 - bounds.x) * (160 / 220) * currentScale
    : 0

  const shouldAnimate = !isInitial && !prefersReducedMotion()

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-50 flex items-center justify-center overflow-visible"
    >
      {/* 1. DRINK CUP: Center in State A, shifted left in State B (z-10, sits UNDER the carousel) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div
          className="relative flex items-center justify-center will-change-transform"
          style={{
            transform: `translate3d(${shiftX}px, 0, 0) scale(${currentScale})`,
            transition: shouldAnimate ? 'transform 420ms var(--ease-soft)' : 'none',
          }}
        >
          {/* Cup Art with floating keyframe and bounce ref. The float waits for the flight in to land, and settles after a while: a loop that never ends keeps the phone busy for nothing. */}
          <div ref={cupRef} className="animate-[float-soft_6s_ease-in-out_1s_2]">
            {/*
              The shadow fades in under the flying copy, so it is there when the real cup takes over.
            */}
            <div className="relative">
              <ArtGlow color="var(--pd-cup-shadow)" className="-inset-[14%] top-[2%] animate-[fade-only_0.3s_ease_0.08s_both]" />
              <ItemArt
                key={`${item.id}-${temperature || 'default'}`}
                art={temperature === 'cold' && item.art.kind === 'cup' && !imageUrl ? { ...item.art, kind: 'iced' as const } : item.art}
                imageUrl={effectiveImageUrl}
                className={cx(
                  'relative h-40 w-auto aspect-[200/220] select-none pointer-events-none',
                  item.id !== openedWith && 'animate-[swap-in_0.4s_var(--ease-soft)_both]',
                )}
                ref={artRef}
                {...artProps(item.id)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SELECTED ADDONS LIST: Floats DIRECTLY OVER the cup in BUILDER state (z-20) */}
      {renderedItems && renderedItems.length > 0 && (
        <div
          className={cx(
            'absolute top-1/2 -translate-y-1/2 z-20 h-full max-h-[calc(100%-calc(var(--space-unit)*2))] flex flex-col justify-center',
            isBuilder && !leaving
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 translate-x-3 pointer-events-none',
          )}
          style={{
            right: `${rightMargin}px`,
            width: `${rightListWidth}px`,
            transition: shouldAnimate
              ? isBuilder && !leaving
                ? 'opacity 260ms 90ms var(--ease-soft), transform 260ms 90ms var(--ease-soft)'
                : 'opacity 200ms ease-in, transform 200ms ease-in'
              : 'none',
          }}
        >
          <SelectedAddonsList items={renderedItems} onRemoveAll={onRemoveAll} />
        </div>
      )}
    </div>
  )
}
