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
        'flex h-[46px] sm:h-[52px] flex-1 items-center justify-center gap-1.5 sm:gap-2.5 rounded-full px-3 sm:px-6 text-[16px] sm:text-[18px] font-bold text-white transition-[background-color,transform,scale,box-shadow] duration-200 ease-soft active:scale-[0.98] min-w-0',
        soldOut
          ? 'cursor-not-allowed bg-pd-glass text-pd-faint shadow-none'
          : added
          ? 'bg-[#3f7547] shadow-[0_4px_16px_rgba(63,117,71,0.35)]'
          : 'bg-[#5e4b7e] shadow-[0_6px_22px_rgba(94,75,126,0.45)] hover:bg-[#4d3b6b] border border-white/15',
      )}
      disabled={soldOut || added}
      onClick={onAdd}
      aria-label={soldOut ? 'Закончилось' : added ? 'В корзине' : `Добавить в корзину за ${formatPrice(price)}`}
    >
      {soldOut ? (
        <span className="text-[14px] sm:text-[16px] font-semibold">Закончилось</span>
      ) : added ? (
        <span className="flex items-center gap-1.5 sm:gap-2 animate-pop">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="sm:size-[22px]">
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
          <span className="text-[15px] sm:text-[17px]">В корзине</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <span className="text-[19px] sm:text-[22px] font-light leading-none" aria-hidden="true">+</span>
          <span className="text-[16px] sm:text-[19px] font-extrabold tracking-tight tabular-nums">{formatPrice(Math.round(shown))}</span>
        </span>
      )}
    </button>
  )
}
