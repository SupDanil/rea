import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = { price: number; soldOut: boolean; added: boolean; onAdd: () => void }

/** Drinkit's royal electric blue action button: + {price} with roll animation and confirm checkmark. */
export function AddToCartButton({ price, soldOut, added, onAdd }: Props) {
  const shown = useAnimatedNumber(price, 500)
  return (
    <button
      className={cx(
        'flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full px-6 text-[18px] font-bold text-white transition-[background-color,transform,box-shadow] duration-200 ease-soft active:scale-[0.98]',
        soldOut
          ? 'cursor-not-allowed bg-white/10 text-white/35 shadow-none'
          : added
          ? 'bg-[#27a868] shadow-[0_4px_16px_rgba(39,168,104,0.35)]'
          : 'bg-[#334cdb] shadow-[0_6px_20px_rgba(51,76,219,0.38)] hover:bg-[#2b41c4]',
      )}
      disabled={soldOut || added}
      onClick={onAdd}
      aria-label={soldOut ? 'Закончилось' : added ? 'В корзине' : `Добавить в корзину за ${formatPrice(price)}`}
    >
      {soldOut ? (
        <span className="text-[16px] font-semibold">Закончилось</span>
      ) : added ? (
        <span className="flex items-center gap-2 animate-pop">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="[stroke-dasharray:24] animate-[draw_0.35s_var(--ease-soft)_both]"
            />
          </svg>
          В корзине
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="text-[22px] font-light leading-none" aria-hidden="true">+</span>
          <span className="text-[19px] font-extrabold tracking-tight tabular-nums">{formatPrice(Math.round(shown))}</span>
        </span>
      )}
    </button>
  )
}
