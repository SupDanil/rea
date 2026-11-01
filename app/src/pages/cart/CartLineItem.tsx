import { useRef, useState, type CSSProperties } from 'react'
import { TrashIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { addonLabel, countAddons } from '../../domain'
import type { ResolvedLine } from '../../state/cart'
import { ART_ATTR } from '../../utils/morph'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

const sizeText = { S: 'S', M: 'M', L: 'L', ONE: '' } as const
const stepBtn = 'grid size-[32px] sm:size-[34px] place-items-center rounded-full text-[17px] font-bold text-ink hover:bg-surface active:scale-90 transition-all disabled:opacity-30 cursor-pointer'

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

  const meta = [line.variant.size !== 'ONE' && `${sizeText[line.variant.size]} · ${line.variant.volume}`, ...countAddons(line.ingredients).map((a) => `+ ${addonLabel(a)}`)]
    .filter(Boolean)
    .join(', ')

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
      className="relative overflow-hidden rounded-[22px] bg-surface/90 border border-line shadow-card transition-all"
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
        className="relative z-1 w-full rounded-[22px] grid grid-cols-[76px_1fr] gap-3 p-2.5 bg-surface/95 dark:bg-surface/95 backdrop-blur-xl"
      >
        <button
          className="art-glow grid size-[76px] place-items-center rounded-[18px] cursor-pointer hover:opacity-90 active:scale-96 transition-all"
          style={{ '--tint': line.item.art.bg } as CSSProperties}
          onClick={onOpen}
          aria-label={`Открыть ${line.item.name}`}
        >
          <ItemArt art={line.item.art} className="size-[86%]" {...{ [ART_ATTR]: line.item.id }} />
        </button>

        <div className="flex min-w-0 flex-col pt-0.5 pr-1">
          <div className="font-display text-[15px] sm:text-[16px] font-bold text-ink tracking-tight truncate">
            {line.item.name}
          </div>
          <div className="mt-1 text-[12px] leading-[1.35] text-muted line-clamp-2">
            {meta}
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-[15px] sm:text-[16px] font-bold text-ink">
              {formatPrice(line.unitPrice * line.qty)}
            </span>

            {/* Stepper Capsule */}
            <div
              className="flex items-center rounded-full bg-surface-2/90 border border-line/60 p-0.5 shadow-xs"
              role="group"
              aria-label={`Количество: ${line.qty}`}
            >
              <button
                className={stepBtn}
                onClick={() => (line.qty === 1 ? onRemove(rowRef.current) : onQty(line.qty - 1))}
                aria-label={line.qty === 1 ? 'Удалить' : 'Меньше'}
                disabled={disabled}
              >
                {line.qty === 1 ? <TrashIcon /> : '−'}
              </button>
              <span className="min-w-5 text-center font-display text-[14px] font-bold text-ink tabular-nums">
                {line.qty}
              </span>
              <button
                className={stepBtn}
                onClick={() => onQty(line.qty + 1)}
                aria-label="Больше"
                disabled={disabled || line.qty >= 20}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
