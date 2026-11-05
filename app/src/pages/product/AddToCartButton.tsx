import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = { price: number; soldOut: boolean; added: boolean; onAdd: () => void }

/**
 * 2026 Liquid Glass AddToCartButton:
 * Floating pill button with rich roasted caramel / crema amber accent (NOT Drinkit blue!),
 * animated price roll, spring reaction, and luminous confirm checkmark.
 */
export function AddToCartButton({ price, soldOut, added, onAdd }: Props) {
  const shown = useAnimatedNumber(price, 400)
  return (
    <button
      className={cx(
        'flex w-full h-[50px] sm:h-[54px] flex-1 items-center justify-center gap-2 sm:gap-2.5 rounded-full px-5 sm:px-7 font-display font-bold text-white transition-all duration-200 ease-soft active:scale-97 cursor-pointer',
        soldOut
          ? 'cursor-not-allowed bg-pd-glass text-pd-faint shadow-none border border-pd-line'
          : added
          ? 'bg-open shadow-[0_6px_22px_rgba(63,191,127,0.35)] border border-white/30'
          : 'bg-accent hover:bg-accent-2 text-accent-ink shadow-[0_8px_28px_rgba(196,91,36,0.32)] dark:shadow-[0_8px_28px_rgba(224,125,62,0.3)] border border-white/25',
      )}
      disabled={soldOut || added}
      onClick={onAdd}
      aria-label={soldOut ? 'Закончилось' : added ? 'В корзине' : `Добавить в корзину за ${formatPrice(price)}`}
    >
      {soldOut ? (
        <span className="text-[14px] sm:text-[15px] font-semibold">Закончилось</span>
      ) : added ? (
        <span className="flex items-center gap-2 animate-pop">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="sm:size-[22px]">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="[stroke-dasharray:24] animate-[draw_0.35s_var(--ease-soft)_both]"
            />
          </svg>
          <span className="text-[15px] sm:text-[16px] tracking-tight">В корзине</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <span className="text-[18px] sm:text-[20px] font-light leading-none" aria-hidden="true">+</span>
          <span className="text-[16px] sm:text-[18px] font-extrabold tracking-tight tabular-nums">
            {formatPrice(Math.round(shown))}
          </span>
        </span>
      )}
    </button>
  )
}
