import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IngredientArt } from '../../components/ItemArt'
import type { Ingredient, IngredientGroup } from '../../domain'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = {
  group: IngredientGroup
  groupIndex: number
  qtyOf: (ingredientId: string) => number
  total: number
  canAdd: (ingredient: Ingredient) => boolean
  onPick: (ingredient: Ingredient, art: Element | null) => void
  onRemove: (ingredient: Ingredient) => void
}

/** The deck's exact height, so the cup above it keeps its size until the deck is built. */
export function CraftDeckSlot({ group }: { group: IngredientGroup }) {
  const withDots = group.ingredients.length > 1
  return <div aria-hidden="true" className={withDots ? 'h-[188px] xs:h-[192px]' : 'h-[158px] xs:h-[162px]'} />
}

/**
 * 2026 Specialty Coffee CoverFlow Deck:
 * Compact square/squircle cards (104px × 128px) that leave maximum room for the drink cup.
 * The active central card is visibly brought forward (scale-110, -translate-y-1.5, z-20, glowing crema elevation).
 * Side cards gracefully recede (scale-90, opacity-40).
 * Magnetic snap centering with exact pixel offset calculations.
 */
export function CraftDeck({
  group,
  qtyOf,
  canAdd,
  onPick,
  onRemove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialIndex = () => {
    const selectedIdx = group.ingredients.findIndex((i) => qtyOf(i.id) > 0)
    return selectedIdx >= 0 ? selectedIdx : 0
  }
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  // Mouse drag-to-scroll state for desktop
  const isMouseDownRef = useRef(false)
  const dragDistanceRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const centerCard = (index: number, smooth = true) => {
    const el = containerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>(`[data-card-index="${index}"]`)
    if (card) {
      const targetScroll = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
      if (Math.abs(el.scrollLeft - targetScroll) > 2) {
        if (typeof el.scrollTo === 'function') {
          try {
            el.scrollTo({ left: targetScroll, behavior: smooth ? 'smooth' : 'instant' })
          } catch {
            el.scrollLeft = targetScroll
          }
        } else {
          el.scrollLeft = targetScroll
        }
      }
      setActiveIndex(index)
    }
  }

  // Synchronously center the selected card (or first card) before first paint when switching groups.
  // This eliminates all 1-frame jerks, layout shifts, or scale animations on tab change.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const selectedIdx = group.ingredients.findIndex((i) => qtyOf(i.id) > 0)
    const targetIdx = selectedIdx >= 0 ? selectedIdx : 0
    setActiveIndex(targetIdx)

    const card = el.querySelector<HTMLElement>(`[data-card-index="${targetIdx}"]`)
    if (card) {
      const targetScroll = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
      el.scrollLeft = targetScroll
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id])

  // Track centered card on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const containerCenter = el.scrollLeft + el.clientWidth / 2
    const cards = el.querySelectorAll<HTMLElement>('[data-card-index]')
    let closestIdx = 0
    let minDiff = Infinity
    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const diff = Math.abs(containerCenter - cardCenter)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })
    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx)
    }
  }

  // Desktop mouse wheel translation: scroll horizontally when rolling the wheel over the carousel
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        try {
          el.scrollBy({ left: e.deltaY, behavior: 'auto' })
        } catch {
          el.scrollLeft += e.deltaY
        }
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [group.id])

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      try {
        e.currentTarget.scrollBy({ left: e.deltaY, behavior: 'auto' })
      } catch {
        e.currentTarget.scrollLeft += e.deltaY
      }
    }
  }

  // Desktop mouse drag-to-scroll: smooth click & drag across the carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !containerRef.current) return
    isMouseDownRef.current = true
    const startX = e.clientX || e.pageX
    const startScrollLeft = containerRef.current.scrollLeft
    dragDistanceRef.current = 0

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      if (!isMouseDownRef.current || !containerRef.current) return
      const currentX = moveEvent.clientX || moveEvent.pageX
      const diff = (currentX - startX) * 1.2
      dragDistanceRef.current = Math.abs(diff)
      if (dragDistanceRef.current > 4) {
        setIsDragging(true)
      }
      containerRef.current.scrollLeft = startScrollLeft - diff
    }

    const onGlobalMouseUp = () => {
      isMouseDownRef.current = false
      setIsDragging(false)
      window.removeEventListener('mousemove', onGlobalMouseMove)
      window.removeEventListener('mouseup', onGlobalMouseUp)
    }

    window.addEventListener('mousemove', onGlobalMouseMove)
    window.addEventListener('mouseup', onGlobalMouseUp)
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 6) {
      e.stopPropagation()
      e.preventDefault()
      dragDistanceRef.current = 0
    }
  }

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex < group.ingredients.length - 1

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canGoPrev) centerCard(activeIndex - 1, true)
  }

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canGoNext) centerCard(activeIndex + 1, true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && canGoPrev) {
      e.preventDefault()
      centerCard(activeIndex - 1, true)
    } else if (e.key === 'ArrowRight' && canGoNext) {
      e.preventDefault()
      centerCard(activeIndex + 1, true)
    }
  }

  return (
    <section
      role="dialog"
      aria-label={group.name}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative flex flex-col items-center w-full animate-[fade-only_0.15s_var(--ease-soft)_both] focus:outline-none"
    >
      {/* Desktop Prev / Next Nav Chevrons */}
      {canGoPrev && (
        <button
          type="button"
          onClick={goPrev}
          aria-label="Предыдущая добавка"
          className="hidden sm:grid absolute left-2 top-1/2 -translate-y-1/2 z-30 size-8.5 place-items-center rounded-full bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border border-pd-line shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-[18px] font-bold leading-none select-none">‹</span>
        </button>
      )}
      {canGoNext && (
        <button
          type="button"
          onClick={goNext}
          aria-label="Следующая добавка"
          className="hidden sm:grid absolute right-2 top-1/2 -translate-y-1/2 z-30 size-8.5 place-items-center rounded-full bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border border-pd-line shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-[18px] font-bold leading-none select-none">›</span>
        </button>
      )}

      {/* Center-Snapped Magnetic Carousel */}
      <div
        ref={containerRef}
        data-carousel-container="true"
        onScroll={handleScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        className={cx(
          'no-scrollbar relative w-full flex items-center gap-2.5 overflow-x-auto pt-5 pb-3 [perspective:1000px]',
          // Dynamic padding magnetically centers the 104px (xs: 108px) card
          'px-[calc(50%-52px)] xs:px-[calc(50%-54px)]',
          'snap-x snap-mandatory touch-pan-x',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab sm:cursor-auto',
        )}
      >
        {group.ingredients.map((ing, idx) => {
          const qty = qtyOf(ing.id)
          const isSelected = qty > 0
          const isCenter = idx === activeIndex

          return group.counter ? (
            <CoverFlowCounterCard
              key={ing.id}
              ingredient={ing}
              index={idx}
              qty={qty}
              isCenter={isCenter}
              canAdd={canAdd(ing)}
              onAdd={(item, art) => {
                onPick(item, art)
                centerCard(idx, true)
              }}
              onRemove={(item) => {
                onRemove(item)
                centerCard(idx, true)
              }}
              onClick={() => centerCard(idx, true)}
            />
          ) : (
            <CoverFlowChoiceCard
              key={ing.id}
              ingredient={ing}
              index={idx}
              selected={isSelected}
              isCenter={isCenter}
              onPick={(item, art) => {
                onPick(item, art)
                centerCard(idx, true)
              }}
              onClick={() => centerCard(idx, true)}
            />
          )
        })}
      </div>

      {/* Horizontal Carousel Pagination Dots */}
      {group.ingredients.length > 1 && (
        <div
          className="flex items-center justify-center gap-1 pt-1.5 pb-1"
          role="tablist"
          aria-label="Навигация по карусели добавок"
        >
          {group.ingredients.map((ing, idx) => {
            const isCurrent = idx === activeIndex
            const hasQty = qtyOf(ing.id) > 0
            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => centerCard(idx, true)}
                aria-label={`${ing.name} (${idx + 1} из ${group.ingredients.length})`}
                className="group size-5 grid place-items-center cursor-pointer"
              >
                <span
                  className={cx(
                    'transition-all duration-300 ease-soft rounded-full block',
                    isCurrent
                      ? 'w-6 h-2 bg-accent shadow-xs'
                      : hasQty
                      ? 'size-2 bg-accent/65 group-hover:bg-accent/85'
                      : 'size-2 bg-pd-ink/25 group-hover:bg-pd-ink/50 dark:bg-crema/25 dark:group-hover:bg-crema/50',
                  )}
                />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** CoverFlow Centered Card for Single-Choice (Milk) */
function CoverFlowChoiceCard({
  ingredient,
  index,
  selected,
  isCenter,
  onPick,
  onClick,
}: {
  ingredient: Ingredient
  index: number
  selected: boolean
  isCenter: boolean
  onPick: (ing: Ingredient, art: Element | null) => void
  onClick: () => void
}) {
  const artRef = useRef<SVGSVGElement>(null)

  return (
    <button
      role="button"
      data-card-index={index}
      aria-pressed={selected}
      aria-label={ingredient.name}
      disabled={ingredient.stopped}
      onClick={() => {
        onClick()
        onPick(ingredient, artRef.current)
      }}
      className={cx(
        'group relative flex w-[104px] xs:w-[108px] h-[126px] xs:h-[130px] shrink-0 flex-col items-center justify-between p-2 rounded-[20px] border text-center transition-all duration-300 ease-soft snap-center select-none cursor-pointer transform-gpu',
        isCenter
          ? cx(
              'scale-110 -translate-y-1.5 z-20 opacity-100',
              selected
                ? 'bg-pd-tile-on border-accent shadow-sm ring-1.5 ring-accent/40'
                : 'bg-pd-tile border-pd-tile-on-line/80 shadow-xs',
            )
          : cx(
              'scale-90 translate-y-1 z-0 opacity-85 hover:opacity-100 border-pd-line shadow-xs',
              selected ? 'bg-pd-tile-on/90 border-accent/60' : 'bg-pd-tile/90',
            ),
        ingredient.stopped && 'opacity-25 pointer-events-none',
      )}
    >
      {/* Centered Top: Compact Swatch Disc */}
      <div className="relative mt-0.5 grid size-8.5 place-items-center rounded-full bg-pd-glass border border-pd-line shadow-xs">
        <IngredientArt ref={artRef} color={ingredient.color} className="size-4.5" />
        {selected && (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-accent text-white text-[9px] font-black animate-pop shadow-xs">
            ✓
          </span>
        )}
      </div>

      {/* Centered Middle: Name & Price */}
      <div className="my-auto flex flex-col items-center w-full px-0.5">
        <div className="font-display text-[11px] xs:text-[11.5px] font-bold text-pd-ink leading-[1.18] line-clamp-2 text-center break-words w-full">
          {ingredient.name}
        </div>
        <div className="mt-0.5 text-[10px] font-semibold text-pd-muted text-center tabular-nums">
          {ingredient.stopped
            ? 'нет в наличии'
            : ingredient.price > 0
            ? `+${formatPrice(ingredient.price)}`
            : 'включено'}
        </div>
      </div>

      {/* Centered Bottom: Compact Selector */}
      <div className="w-full mt-auto">
        <span
          className={cx(
            'flex h-6 w-full items-center justify-center rounded-full text-[10.5px] font-bold transition-all duration-200',
            selected
              ? 'bg-accent text-white shadow-xs'
              : 'bg-pd-glass border border-pd-line text-pd-ink hover:bg-pd-glass-hover',
          )}
        >
          {selected ? 'Выбрано ✓' : 'Выбрать'}
        </span>
      </div>
    </button>
  )
}

/** CoverFlow Centered Card for Counter Groups (Syrups, espresso shots, protein) */
function CoverFlowCounterCard({
  ingredient,
  index,
  qty,
  isCenter,
  canAdd,
  onAdd,
  onRemove,
  onClick,
}: {
  ingredient: Ingredient
  index: number
  qty: number
  isCenter: boolean
  canAdd: boolean
  onAdd: (ing: Ingredient, art: Element | null) => void
  onRemove: (ing: Ingredient) => void
  onClick: () => void
}) {
  const artRef = useRef<SVGSVGElement>(null)
  const isSelected = qty > 0

  return (
    <div
      data-card-index={index}
      onClick={onClick}
      className={cx(
        'group relative flex w-[104px] xs:w-[108px] h-[126px] xs:h-[130px] shrink-0 flex-col items-center justify-between p-2 rounded-[20px] border text-center transition-all duration-300 ease-soft snap-center select-none cursor-pointer transform-gpu',
        isCenter
          ? cx(
              'scale-110 -translate-y-1.5 z-20 opacity-100',
              isSelected
                ? 'bg-pd-tile-on border-accent shadow-sm ring-1.5 ring-accent/40'
                : 'bg-pd-tile border-pd-tile-on-line/80 shadow-xs',
            )
          : cx(
              'scale-90 translate-y-1 z-0 opacity-85 hover:opacity-100 border-pd-line shadow-xs',
              isSelected ? 'bg-pd-tile-on/90 border-accent/60' : 'bg-pd-tile/90',
            ),
        ingredient.stopped && 'opacity-25',
      )}
    >
      {/* Centered Top: Swatch with Animated Badge */}
      <div className="relative mt-0.5 grid size-8.5 place-items-center rounded-full bg-pd-glass border border-pd-line shadow-xs">
        <IngredientArt ref={artRef} color={ingredient.color} className="size-4.5" />
        {isSelected && (
          <span
            key={qty}
            className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-accent text-white text-[9px] font-black animate-pop shadow-xs"
          >
            ×{qty}
          </span>
        )}
      </div>

      {/* Centered Middle: Name & Price */}
      <div className="my-auto flex flex-col items-center w-full px-0.5">
        <div className="font-display text-[11px] xs:text-[11.5px] font-bold text-pd-ink leading-[1.18] line-clamp-2 text-center break-words w-full">
          {ingredient.name}
        </div>
        <div className="mt-0.5 text-[10px] font-semibold text-pd-muted text-center tabular-nums">
          {ingredient.stopped
            ? 'нет в наличии'
            : `+${formatPrice(ingredient.price)}`}
        </div>
      </div>

      {/* Centered Bottom: Touch-friendly Controls */}
      <div className="w-full mt-auto" onClick={(e) => e.stopPropagation()}>
        {ingredient.stopped ? (
          <button
            disabled
            aria-label={`${ingredient.name}: добавить порцию`}
            className="flex h-6 w-full items-center justify-center rounded-full bg-pd-glass text-[9.5px] font-semibold text-pd-muted border border-pd-line opacity-50 cursor-not-allowed"
          >
            Закончилось
          </button>
        ) : qty === 0 ? (
          <button
            disabled={!canAdd}
            onClick={() => onAdd(ingredient, artRef.current)}
            aria-label={`${ingredient.name}: добавить порцию`}
            className="flex h-6 w-full items-center justify-center gap-0.5 rounded-full bg-pd-glass hover:bg-pd-glass-hover border border-pd-line text-[10.5px] font-bold text-pd-ink shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <span className="text-[13px] font-light leading-none">+</span>
            <span>Добавить</span>
          </button>
        ) : (
          <div className="flex h-6 w-full items-center justify-between rounded-full bg-pd-glass px-1 border border-accent/40 shadow-xs">
            <button
              onClick={() => onRemove(ingredient)}
              aria-label={`${ingredient.name}: убрать порцию`}
              className="grid size-4.5 place-items-center rounded-full bg-surface text-ink text-[12px] font-bold shadow-xs active:scale-90 transition-transform cursor-pointer"
            >
              −
            </button>
            <span
              className="font-display text-[11.5px] font-black text-pd-ink tabular-nums animate-pop px-1"
              aria-live="polite"
            >
              {qty}
            </span>
            <button
              disabled={!canAdd}
              onClick={() => onAdd(ingredient, artRef.current)}
              aria-label={`${ingredient.name}: добавить порцию`}
              className="grid size-4.5 place-items-center rounded-full bg-accent text-white text-[12px] font-bold shadow-xs active:scale-90 transition-transform cursor-pointer disabled:opacity-35"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
