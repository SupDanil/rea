import { hint, panel } from '../../components/ui'
import { GIFT_DRINK_LIMIT, STAMP_MIN_TOTAL, STAMPS_PER_GIFT, type Loyalty } from '../../state/loyalty'
import { cx } from '../../utils/cx'
import { formatPrice, plural } from '../../utils/format'

const stampClass = (on: boolean, gift: boolean) =>
  cx(
    'grid aspect-square place-items-center rounded-full text-[18px] text-ink',
    gift ? 'border-2 border-solid border-accent-soft' : !on && 'border-2 border-dashed border-faint',
    on && 'bg-[color-mix(in_oklab,var(--accent)_22%,var(--surface))] animate-[pop_0.35s_var(--ease-soft)]',
  )

export function StampCard({ loyalty }: { loyalty: Loyalty }) {
  return (
    <section className={cx('mt-3 rounded-[24px] p-4', panel)} aria-label="Штампы">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px]">Штампы</h2>
        <span className="text-[13px] text-muted">
          {loyalty.stamps} из {STAMPS_PER_GIFT}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {Array.from({ length: STAMPS_PER_GIFT }, (_, i) => (
          <span key={i} className={stampClass(i < loyalty.stamps, i === STAMPS_PER_GIFT - 1)} aria-hidden="true">
            {i === STAMPS_PER_GIFT - 1 ? '🎁' : i < loyalty.stamps ? '🐰' : ''}
          </span>
        ))}
      </div>
      <p className={hint()}>
        Заказ от {formatPrice(STAMP_MIN_TOTAL)} — штамп. {STAMPS_PER_GIFT} штампов — напиток в подарок (до {formatPrice(GIFT_DRINK_LIMIT)}).
      </p>
      {loyalty.giftsAvailable > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface))] px-3.5 py-3 text-[13px] leading-[1.35]">
          <span className="text-[26px]" aria-hidden="true">
            🎁
          </span>
          <div>
            <b className="text-[14px]">
              {loyalty.giftsAvailable} {plural(loyalty.giftsAvailable, 'напиток', 'напитка', 'напитков')} в подарок
            </b>
            <div>Применится в корзине, если в заказе есть напиток</div>
          </div>
        </div>
      )}
    </section>
  )
}
