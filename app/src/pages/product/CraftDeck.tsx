import { type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Button } from '../../components/Button'
import { IngredientArt } from '../../components/ItemArt'
import { QuantityStepper } from '../../components/QuantityStepper'
import type { Ingredient, IngredientGroup } from '../../domain'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { optimizedImageUrl } from '../../utils/imageUrl'

type Props = {
  group: IngredientGroup
  groupIndex: number
  qtyOf: (ingredientId: string) => number
  total: number
  canAdd: (ingredient: Ingredient) => boolean
  onPick: (ingredient: Ingredient, art: Element | null) => void
  onRemove: (ingredient: Ingredient) => void
}

// 152px card + 8px bottom padding + optional 44px pagination. No loading jump.
export function CraftDeckSlot({ group }: { group: IngredientGroup }) {
  return <div aria-hidden="true" className={group.ingredients.length > 1 ? 'h-51' : 'h-40'} />
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
      className="relative flex w-full min-w-0 flex-col items-center pb-2 focus-visible:outline-(length:--focus-width) focus-visible:outline-accent focus-visible:outline-offset-[calc(var(--space-unit)*0.5)]"
    >
      {activeIndex > 0 && <Button type="button" onClick={() => centerCard(activeRef.current - 1)} aria-label="Предыдущая добавка" className="absolute left-2 top-24 z-10 hidden size-11 place-items-center rounded-pill bg-pd-panel text-pd-ink sm:grid">‹</Button>}
      {activeIndex < group.ingredients.length - 1 && <Button type="button" onClick={() => centerCard(activeRef.current + 1)} aria-label="Следующая добавка" className="absolute right-2 top-24 z-10 hidden size-11 place-items-center rounded-pill bg-pd-panel text-pd-ink sm:grid">›</Button>}
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
          'px-[calc(50%-calc(var(--space-unit)*15))] touch-auto',
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
        <div className="flex h-11 max-w-full items-center justify-center overflow-x-auto" aria-label="Навигация по карусели добавок">
          {group.ingredients.map((ingredient, index) => (
            <Button
              key={ingredient.id}
              type="button"
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`${ingredient.name} (${index + 1} из ${group.ingredients.length})`}
              onClick={() => centerCard(index)}
              className="grid size-11 shrink-0 justify-items-center content-start pt-2 rounded-pill focus-visible:outline-(length:--focus-width) focus-visible:outline-accent"
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
      <div data-ingredient-media className="relative h-22 w-full min-w-0">
        <div ref={artRef} className="mx-auto flex h-19 w-28 items-center justify-center">
          {ingredient.imageUrl ? (
            <img src={optimizedImageUrl(ingredient.imageUrl)} alt={ingredient.name} width={112} height={76} draggable={false} decoding="async" className="pointer-events-none block h-full w-full min-w-0 object-contain" />
          ) : <IngredientArt color={ingredient.color} className="size-16" />}
        </div>
        <span className="absolute inset-x-0 bottom-0 flex justify-center">
          <span className="max-w-full rounded-lg bg-pd-panel/60 dark:bg-pd-panel/35 px-1 py-0.5 text-compact font-bold leading-[calc(var(--space-unit)*3.5)] text-pd-ink">
            <span className="line-clamp-2 break-words">{ingredient.name}</span>
          </span>
        </span>
        {selected && <span className="absolute right-1 top-0 grid min-w-5 h-5 place-items-center rounded-pill bg-accent px-1 text-micro font-bold text-white">{counter ? `×${qty}` : <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" /></svg>}</span>}
      </div>
      <span className="text-caption font-medium leading-[calc(var(--space-unit)*4)] text-pd-ink-2 tabular-nums">
        {ingredient.stopped ? 'нет в наличии' : ingredient.price > 0 ? `+${formatPrice(ingredient.price)}` : counter ? 'бесплатно' : 'включено'}
      </span>
    </>
  )
  const cardClass = cx(
    // Compact, unboxed cards. Only the caption gets a backing over the image.
    'relative grid h-38 w-30 min-w-0 shrink-0 snap-center grid-rows-[calc(var(--space-unit)*22)_calc(var(--space-unit)*4)_calc(var(--space-unit)*11)] gap-y-0.5 text-center select-none',
    ingredient.stopped && 'opacity-60',
  )
  const actionClass = 'group flex h-11 w-full items-center justify-center rounded-pill px-1 text-caption font-bold text-pd-ink focus-visible:outline-(length:--focus-width) focus-visible:outline-accent disabled:opacity-40'
  const actionFillClass = 'flex h-8 w-full items-center justify-center rounded-pill transition-colors'
  const idleFillClass = 'bg-pd-glass group-hover:bg-pd-glass-hover'
  if (!counter) return (
    <Button type="button" data-card-index={index} data-active={active} aria-label={ingredient.name} aria-pressed={selected} disabled={ingredient.stopped} onClick={() => onPick(artRef.current)} className={cx(cardClass, 'cursor-pointer focus-visible:outline-(length:--focus-width) focus-visible:outline-accent focus-visible:outline-offset-[calc(var(--space-unit)*0.5)]')}>
      {content}
      <span className={actionClass}><span className={cx(actionFillClass, selected ? 'bg-accent text-white' : idleFillClass)}>{selected ? 'Выбрано' : 'Выбрать'}</span></span>
    </Button>
  )
  return (
    <div data-card-index={index} data-active={active} className={cardClass}>
      {content}
      {qty > 0 ? (
        <QuantityStepper tone="product" value={qty} onDecrease={onRemove} onIncrease={() => onPick(artRef.current)}
          decreaseLabel={`${ingredient.name}: убрать порцию`} increaseLabel={`${ingredient.name}: добавить порцию`}
          increaseDisabled={!canAdd || ingredient.stopped} />
      ) : (
        <Button type="button" aria-label={`${ingredient.name}: добавить порцию`} disabled={!canAdd || ingredient.stopped} onClick={() => onPick(artRef.current)} className={actionClass}><span className={cx(actionFillClass, idleFillClass)}>{ingredient.stopped ? 'Закончилось' : '+ Добавить'}</span></Button>
      )}
    </div>
  )
}
