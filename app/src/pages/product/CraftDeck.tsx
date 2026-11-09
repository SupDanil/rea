import { type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { AddonIcon } from '../../components/AddonIcon'
import { Button, IconButton } from '../../components/Button'
import { BackIcon } from '../../components/icons'
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

// 164px card (room for a 44px control) + optional 44px pagination. No loading jump.
export function CraftDeckSlot({ group }: { group: IngredientGroup }) {
  return <div aria-hidden="true" className={group.ingredients.length > 1 ? 'h-52 wide:h-55' : 'h-41 wide:h-44'} />
}

function nearestCard(el: HTMLDivElement) {
  const center = el.scrollLeft + el.clientWidth / 2
  let nearest = 0
  let distance = Infinity
  el.querySelectorAll<HTMLElement>('[data-card-index]').forEach((card, index) => {
    const diff = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
    if (diff < distance) { nearest = index; distance = diff }
  })
  return nearest
}

/** Native touch scrolling; mouse dragging never handles touch-generated mouse events. */
export function CraftDeck({ group, qtyOf, canAdd, onPick, onRemove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, group.ingredients.findIndex((i) => qtyOf(i.id) > 0)))
  const activeRef = useRef(activeIndex)
  const scrollFrame = useRef(0)
  const dragCleanup = useRef<(() => void) | null>(null)
  const dragged = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const markActive = (index: number) => {
    activeRef.current = index
    setActiveIndex(index)
  }

  const centerCard = (index: number, smooth = true) => {
    const el = containerRef.current
    const card = el?.querySelector<HTMLElement>(`[data-card-index="${index}"]`)
    if (!el || !card) return
    const left = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
    const behavior = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'
    if (typeof el.scrollTo === 'function') el.scrollTo({ left, behavior })
    else el.scrollLeft = left
    markActive(index)
  }

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    centerCard(Math.max(0, group.ingredients.findIndex((i) => qtyOf(i.id) > 0)), false)
    // Resize/orientation changes retain the current card; selections don't restart the swipe.
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (width === el.clientWidth) return
      width = el.clientWidth
      centerCard(activeRef.current, false)
    })
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id])

  useEffect(() => () => {
    cancelAnimationFrame(scrollFrame.current)
    dragCleanup.current?.()
  }, [])

  const handleScroll = () => {
    if (scrollFrame.current) return
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = 0
      const el = containerRef.current
      if (el) markActive(nearestCard(el))
    })
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastWheel = -Infinity
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY) || Math.abs(e.deltaY) < 6) return
      const next = Math.max(0, Math.min(group.ingredients.length - 1, activeRef.current + Math.sign(e.deltaY)))
      if (next === activeRef.current) return // At the ends, let the page scroll vertically.
      e.preventDefault()
      if (Date.now() - lastWheel < 220) return
      lastWheel = Date.now()
      centerCard(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, group.ingredients.length])

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Native pan + inertia + CSS snap own the entire touch/pen gesture.
    dragged.current = false
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = e.currentTarget
    const startX = e.clientX
    const startScroll = el.scrollLeft
    const pointerId = e.pointerId
    dragCleanup.current?.()
    const move = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId) return
      const delta = event.clientX - startX
      if (!dragged.current && Math.abs(delta) <= 6) return
      dragged.current = true
      el.style.scrollSnapType = 'none'
      setIsDragging(true)
      event.preventDefault()
      el.scrollLeft = startScroll - delta
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      window.removeEventListener('blur', cancel)
      el.style.scrollSnapType = ''
      dragCleanup.current = null
    }
    const cancel = () => { cleanup(); setIsDragging(false) }
    const end = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId) return
      const index = nearestCard(el)
      cleanup()
      setIsDragging(false)
      if (dragged.current) centerCard(index)
    }
    dragCleanup.current = cleanup
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    window.addEventListener('blur', cancel)
  }

  return (
    <section
      role="region"
      aria-roledescription="карусель"
      aria-label={group.name}
      tabIndex={0}
      onKeyDown={(e) => {
        const index = activeRef.current
        const next = e.key === 'ArrowLeft' ? Math.max(0, index - 1)
          : e.key === 'ArrowRight' ? Math.min(group.ingredients.length - 1, index + 1)
          : e.key === 'Home' ? 0 : e.key === 'End' ? group.ingredients.length - 1 : null
        if (next !== null) { e.preventDefault(); centerCard(next) }
      }}
      className="craft-deck relative flex w-full min-w-0 flex-col items-center focus-visible:outline-(length:--focus-width) focus-visible:outline-accent focus-visible:outline-offset-[calc(var(--space-unit)*0.5)]"
    >
      {activeIndex > 0 && <IconButton onClick={() => centerCard(activeRef.current - 1)} aria-label="Предыдущая добавка" className="absolute left-2 bottom-2 z-10 hidden sm:grid"><BackIcon /></IconButton>}
      {activeIndex < group.ingredients.length - 1 && <IconButton onClick={() => centerCard(activeRef.current + 1)} aria-label="Следующая добавка" className="absolute right-2 bottom-2 z-10 hidden sm:grid"><span className="rotate-180"><BackIcon /></span></IconButton>}
      <div
        ref={containerRef}
        data-carousel-container="true"
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false }
        }}
        className={cx(
          'no-scrollbar relative flex w-full min-w-0 items-stretch gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory',
          'px-[calc(50%-calc(var(--space-unit)*15))] py-4 -my-4 touch-auto',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
      >
        {group.ingredients.map((ingredient, index) => (
          <IngredientCard
            key={ingredient.id}
            ingredient={ingredient}
            index={index}
            active={index === activeIndex}
            counter={!!group.counter}
            qty={qtyOf(ingredient.id)}
            canAdd={canAdd(ingredient)}
            onPick={(art) => { onPick(ingredient, art); centerCard(index) }}
            onRemove={() => { onRemove(ingredient); centerCard(index) }}
          />
        ))}
      </div>
      {group.ingredients.length > 1 && (
        <div className="flex h-11 sm:my-2 max-w-full sm:max-w-[calc(100%-calc(var(--space-unit)*28))] items-center justify-center overflow-x-auto" aria-label="Навигация по карусели добавок">
          {group.ingredients.map((ingredient, index) => (
            <Button
              key={ingredient.id}
              type="button"
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`${ingredient.name} (${index + 1} из ${group.ingredients.length})`}
              onClick={() => centerCard(index)}
              className="grid size-11 shrink-0 place-items-center rounded-pill focus-visible:outline-(length:--focus-width) focus-visible:outline-accent"
            >
              <span className={cx('block h-1.5 rounded-pill', index === activeIndex ? 'w-5 bg-accent' : 'w-1.5 bg-pd-muted')} />
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}

function IngredientCard({ ingredient, index, active, counter, qty, canAdd, onPick, onRemove }: {
  ingredient: Ingredient
  index: number
  active: boolean
  counter: boolean
  qty: number
  canAdd: boolean
  onPick: (art: Element | null) => void
  onRemove: () => void
}) {
  const artRef = useRef<HTMLDivElement>(null)
  const selected = qty > 0

  const content = (
    <>
      {/* Top bar: Price on top-left, selection counter/check badge on top-right */}
      <div className="relative w-full flex items-center justify-between h-5 px-0.5 z-10 pointer-events-none">
        <span className="text-micro font-bold text-pd-ink-2 tabular-nums">
          {ingredient.stopped
            ? 'нет в наличии'
            : ingredient.price > 0
              ? `+${formatPrice(ingredient.price)}`
              : counter
                ? 'бесплатно'
                : 'включено'}
        </span>
        {selected && (
          // One flat "selected" mark for every card; the amount lives only in the − n + control below.
          <span className="grid size-5 place-items-center rounded-pill bg-accent text-accent-ink">
            <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
              <path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      {/* Media: Centered photo-icon. A toggle card has no button, so its picture takes that room. */}
      <div data-ingredient-media className={cx('relative w-full flex items-center justify-center', counter ? 'pt-0.5' : 'flex-1 min-h-0')}>
        <div ref={artRef} data-deck-art className={cx('flex w-full items-center justify-center', counter ? 'h-12' : 'h-18')}>
          {ingredient.imageUrl ? (
            <AddonIcon
              url={ingredient.imageUrl}
              alt={ingredient.name}
              className={cx('w-auto object-contain pointer-events-none drop-shadow-xs', counter ? 'size-12 max-h-12' : 'size-18 max-h-18')}
            />
          ) : <IngredientArt color={ingredient.color} className={counter ? 'size-10' : 'size-14'} />}
        </div>
      </div>

      {/* Title: Exactly fixed 32px height (h-8) for 1 or 2 lines, so names never move the button */}
      <div className="flex h-8 w-full items-center justify-center text-center px-0.5 overflow-hidden">
        <span className="font-sans text-caption font-bold text-pd-ink leading-[1.15] line-clamp-2 text-balance break-words">
          {ingredient.name}
        </span>
      </div>
    </>
  )

  // No plate: the picture, name and control float on the stage. Selection reads from the check badge,
  // focus from the muted neighbours; the radius only shapes the keyboard focus ring.
  const cardClass = cx(
    'relative flex flex-col items-center h-41 w-30 min-w-0 shrink-0 snap-center p-2 text-center select-none rounded-2xl text-pd-ink',
    ingredient.stopped && 'opacity-60',
  )

  const actionAreaClass = 'w-full flex justify-center mt-auto'

  if (!counter) return (
    <Button
      type="button"
      data-card-index={index}
      data-active={active}
      aria-label={ingredient.name}
      aria-pressed={selected}
      disabled={ingredient.stopped}
      onClick={() => onPick(artRef.current)}
      className={cx(
        cardClass,
        'cursor-pointer focus-visible:outline-(length:--focus-width) focus-visible:outline-accent focus-visible:outline-offset-[calc(var(--space-unit)*0.5)]',
      )}
    >
      {/* The whole card is the control: state reads from the check badge and the accent border. */}
      {content}
    </Button>
  )

  return (
    <div
      data-card-index={index}
      data-active={active}
      className={cardClass}
    >
      {content}
      <div className={actionAreaClass}>
        {qty > 0 ? (
          <div
            className="ui-choice ui-choice--product ui-choice--selected ui-choice--deck ui-choice--stepper w-full max-w-25 flex items-center justify-between select-none"
            role="group"
            aria-label={`Количество: ${qty}`}
          >
            <IconButton
              variant="plain"
              size="sm"
              aria-label={`${ingredient.name}: убрать порцию`}
              disabled={ingredient.stopped}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-lead font-extrabold text-pd-ink hover:text-accent transition-colors grid place-items-center rounded-pill active:scale-95"
            >
              −
            </IconButton>
            <span className="min-w-4 text-caption font-heading font-bold text-pd-ink text-center tabular-nums" aria-live="polite">
              {qty}
            </span>
            <IconButton
              variant="plain"
              size="sm"
              aria-label={`${ingredient.name}: добавить порцию`}
              disabled={!canAdd || ingredient.stopped}
              onClick={(e) => {
                e.stopPropagation()
                onPick(artRef.current)
              }}
              className="text-lead font-extrabold text-pd-ink hover:text-accent transition-colors grid place-items-center rounded-pill disabled:opacity-30 active:scale-95"
            >
              +
            </IconButton>
          </div>
        ) : (
          <Button
            type="button"
            aria-label={`${ingredient.name}: добавить порцию`}
            disabled={!canAdd || ingredient.stopped}
            onClick={() => onPick(artRef.current)}
            className="ui-choice ui-choice--product ui-choice--deck w-full max-w-25 text-caption font-bold text-pd-ink disabled:opacity-40 transition-all focus-visible:outline-(length:--focus-width) focus-visible:outline-accent"
          >
            {ingredient.stopped ? 'Закончилось' : '+ Добавить'}
          </Button>
        )}
      </div>
    </div>
  )
}
