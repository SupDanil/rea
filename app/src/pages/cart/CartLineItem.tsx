import { type CSSProperties,useRef, useState } from 'react'

import { Button } from '../../components/Button'
import { TrashIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { QuantityStepper } from '../../components/QuantityStepper'
import { addonLabel, countAddons, itemImage } from '../../domain'
import type { ResolvedLine } from '../../state/cart'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { artProps } from '../../utils/morph'

const sizeText = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

type Props = {
  line: ResolvedLine
  disabled: boolean
  onOpen: () => void
  onQty: (qty: number) => void
  onRemove: (row: HTMLLIElement | null) => void
}

/**
 * 2026 Liquid Glass CartLineItem:
 * Supports intuitive swipe-to-delete with tactile snap, capsule stepper, and soft tinted art spot.
 */
export function CartLineItem({ line, disabled, onOpen, onQty, onRemove }: Props) {
  const rowRef = useRef<HTMLLIElement>(null)
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartX = useRef(0)

  const tempLabel = line.temperature ? (line.temperature === 'hot' ? '☕ Горячий' : '🧊 Холодный') : null
  const meta = [tempLabel, line.variant.size !== 'ONE' && `${sizeText[line.variant.size]} · ${line.variant.volume}`, ...countAddons(line.ingredients).map((a) => `+ ${addonLabel(a)}`)]
    .filter(Boolean)
    .join(', ')

  const cartImage = itemImage(line.item, line.temperature)

  const cartArt =
    line.temperature === 'cold' && line.item.art.kind === 'cup' && !cartImage
      ? { ...line.item.art, kind: 'iced' as const }
      : line.item.art

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    touchStartX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return
    const diff = e.touches[0].clientX - touchStartX.current
    if (diff < 0) {
      // Swiping left (revealing delete)
      setSwipeX(Math.max(-90, diff))
    } else {
      setSwipeX(0)
    }
  }

  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return
    setIsSwiping(false)
    if (swipeX < -70) {
      // Threshold passed: trigger remove
      onRemove(rowRef.current)
    } else {
      setSwipeX(0)
    }
  }

  return (
    <li
      ref={rowRef}
      className="relative overflow-hidden rounded-card bg-surface/90 border-(length:--stroke-width) border-line shadow-card transition-all"
    >
      {/* Background delete trigger revealed on swipe only */}
      <div
        style={{ opacity: swipeX < -4 ? 1 : 0 }}
        className={cx(
          'absolute inset-y-0 right-0 w-24 bg-danger flex items-center justify-center text-white cursor-pointer transition-opacity duration-150',
          swipeX >= -4 && 'pointer-events-none',
        )}
        onClick={() => onRemove(rowRef.current)}
        aria-hidden="true"
      >
        <span className="size-6 animate-pulse flex items-center justify-center">
          <TrashIcon />
        </span>
      </div>

      {/* Foreground card */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s var(--ease-soft)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-1 w-full rounded-card grid grid-cols-[calc(var(--space-unit)*19)_1fr] gap-3 p-2.5 bg-surface/95 dark:bg-surface/95"
      >
        <Button
          className="art-glow mesh-grain grid size-19 place-items-center rounded-media cursor-pointer hover:opacity-90 active:scale-96 transition-all overflow-hidden"
          style={{ '--tint': line.item.art.bg } as CSSProperties}
          onClick={onOpen}
          aria-label={`Открыть ${line.item.name}`}
        >
          <ItemArt art={cartArt} imageUrl={cartImage} className="relative z-10 size-[86%]" {...artProps(line.item.id, line.key)} />
        </Button>

        <div className="flex min-w-0 flex-col pt-0.5 pr-1">
          <div className="font-display text-control sm:text-body-lg font-bold text-ink tracking-tight truncate">
            {line.item.name}
          </div>
          <div className="mt-1 text-caption leading-(--leading-copy) text-muted line-clamp-2">
            {meta}
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-control sm:text-body-lg font-bold text-ink">
              {formatPrice(line.unitPrice * line.qty)}
            </span>

            <QuantityStepper size="sm" value={line.qty} disabled={disabled} increaseDisabled={line.qty >= 20}
              onDecrease={() => line.qty === 1 ? onRemove(rowRef.current) : onQty(line.qty - 1)}
              onIncrease={() => onQty(line.qty + 1)} decreaseLabel={line.qty === 1 ? 'Удалить' : 'Меньше'} increaseLabel="Больше"
              decreaseIcon={line.qty === 1 ? <TrashIcon /> : '−'} />
          </div>
        </div>
      </div>
    </li>
  )
}
