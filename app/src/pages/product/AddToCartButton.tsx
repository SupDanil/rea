import { Button } from '../../components/Button'
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
    <Button variant="primary" size="lg" fullWidth
      className={cx(
        'flex flex-1 items-center justify-center gap-2 sm:gap-2.5',
        soldOut
          ? 'cursor-not-allowed bg-pd-glass text-pd-faint shadow-none border-(length:--stroke-width) border-pd-line'
          : added
          ? 'bg-open shadow-success border-(length:--stroke-width) border-white/30'
          : '',
      )}
      disabled={soldOut || added}
      onClick={onAdd}
      aria-label={soldOut ? 'Закончилось' : added ? 'В корзине' : `Добавить в корзину за ${formatPrice(price)}`}
    >
      {soldOut ? (
        <span className="text-body sm:text-control font-semibold">Закончилось</span>
      ) : added ? (
        <span className="flex items-center gap-2 animate-pop">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="sm:size-5.5">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="var(--icon-stroke-strong)"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="[stroke-dasharray:24] animate-[draw_0.35s_var(--ease-soft)_both]"
            />
          </svg>
          <span className="text-control sm:text-body-lg tracking-tight">В корзине</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <span className="text-lead sm:text-title-sm font-light leading-none" aria-hidden="true">+</span>
          <span className="text-body-lg sm:text-lead font-extrabold tracking-tight tabular-nums">
            {formatPrice(Math.round(shown))}
          </span>
        </span>
      )}
    </Button>
  )
}
