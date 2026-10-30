import { useRef, type CSSProperties } from 'react'
import { TrashIcon } from '../../components/icons'
import { ItemArt } from '../../components/ItemArt'
import { addonLabel, countAddons } from '../../data/menu'
import { panel } from '../../components/ui'
import type { ResolvedLine } from '../../state/cart'
import { useSharedArt } from '../../hooks/useSharedArt'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

const sizeText = { S: 'S', M: 'M', L: 'L', ONE: '' } as const
const stepBtn = 'grid size-[34px] place-items-center rounded-full text-[18px] font-semibold disabled:opacity-35'

type Props = {
  line: ResolvedLine
  disabled: boolean
  onOpen: () => void
  onQty: (qty: number) => void
  /** Gets the row so the page can animate it out before dropping it */
  onRemove: (row: HTMLLIElement | null) => void
}

export function CartLineItem({ line, disabled, onOpen, onQty, onRemove }: Props) {
  const sharedArt = useSharedArt(line.item.id, (path) => path === '/cart')
  const rowRef = useRef<HTMLLIElement>(null)
  const meta = [line.variant.size !== 'ONE' && `${sizeText[line.variant.size]} · ${line.variant.volume}`, ...countAddons(line.ingredients).map((a) => `+ ${addonLabel(a)}`)]
    .filter(Boolean)
    .join(', ')
  return (
    <li ref={rowRef} className={cx('grid grid-cols-[76px_1fr] gap-3 rounded-[22px] p-2 animate-fade-in', panel)}>
      <button
        className="art-glow grid size-[76px] place-items-center rounded-2xl"
        style={{ '--tint': line.item.art.bg } as CSSProperties}
        onClick={onOpen}
        aria-label={`Открыть ${line.item.name}`}
      >
        <ItemArt art={line.item.art} className="size-[86%]" style={sharedArt} />
      </button>
      <div className="flex min-w-0 flex-col pt-0.5 pr-1">
        <div className="text-[15px] font-bold tracking-[-0.01em]">{line.item.name}</div>
        <div className="mt-[3px] text-[12px] leading-[1.35] text-muted">{meta}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[15px] font-bold">{formatPrice(line.unitPrice * line.qty)}</span>
          <div className="flex items-center rounded-full bg-surface-2" role="group" aria-label={`Количество: ${line.qty}`}>
            <button
              className={stepBtn}
              onClick={() => (line.qty === 1 ? onRemove(rowRef.current) : onQty(line.qty - 1))}
              aria-label={line.qty === 1 ? 'Удалить' : 'Меньше'}
              disabled={disabled}
            >
              {line.qty === 1 ? <TrashIcon /> : '−'}
            </button>
            <span className="min-w-5 text-center text-[14px] font-bold">{line.qty}</span>
            <button className={stepBtn} onClick={() => onQty(line.qty + 1)} aria-label="Больше" disabled={disabled || line.qty >= 20}>
              +
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
