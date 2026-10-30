import { block, option, optionSub, optionTitle, toggle } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import type { CartLoyalty } from './cartPricing'

const giftEmoji = 'flex-none text-[26px] leading-none'

type Props = { loyalty: CartLoyalty; canGift: boolean; useGift: boolean; onToggleGift: () => void; onLogin: () => void }

/** Signed in: the gift-drink switch. Guest: an invitation to sign in. */
export function LoyaltyOffer({ loyalty, canGift, useGift, onToggleGift, onLogin }: Props) {
  if (loyalty) {
    if (!canGift) return null
    return (
      <section className={block}>
        <button className={cx(option, 'w-full')} role="switch" aria-checked={useGift} onClick={onToggleGift}>
          <span className={giftEmoji} aria-hidden="true">
            🎁
          </span>
          <span className="flex-1">
            <span className={optionTitle}>Напиток в подарок</span>
            <span className={optionSub}>
              −{formatPrice(loyalty.giftValue)} · осталось подарков: {loyalty.giftsAvailable}
            </span>
          </span>
          <span className={toggle} aria-hidden="true" />
        </button>
      </section>
    )
  }
  return (
    <section className={block}>
      <button
        className="flex w-full items-center gap-3 rounded-[18px] bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface))] px-4 py-3.5 text-left shadow-card"
        onClick={onLogin}
      >
        <span className={giftEmoji} aria-hidden="true">
          🎁
        </span>
        <span className="flex-1">
          <span className={optionTitle}>Войдите — напиток в подарок</span>
          <span className={optionSub}>И скидка уровня со штампами за каждый заказ</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>
    </section>
  )
}
