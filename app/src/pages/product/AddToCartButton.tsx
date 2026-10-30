import { addBtn } from '../../components/ui'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'

type Props = { price: number; soldOut: boolean; added: boolean; onAdd: () => void }

/** Price rolls to each new total; after a tap the button confirms with a check before the screen closes. */
export function AddToCartButton({ price, soldOut, added, onAdd }: Props) {
  const shown = useAnimatedNumber(price, 500)
  return (
    <button className={cx(addBtn, added && 'justify-center')} disabled={soldOut || added} onClick={onAdd}>
      {soldOut ? (
        'Закончилось'
      ) : added ? (
        <span className="flex items-center gap-2 animate-pop">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="[stroke-dasharray:24] animate-[draw_0.35s_var(--ease-soft)_both]" />
          </svg>
          В корзине
        </span>
      ) : (
        <>
          <span>Добавить</span>
          <span className="text-[19px] font-extrabold tabular-nums">{formatPrice(Math.round(shown))}</span>
        </>
      )}
    </button>
  )
}
