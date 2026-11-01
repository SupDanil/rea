import { block, option, optionSub, optionTitle, toggle } from '../../components/ui'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import type { CartLoyalty } from './cartPricing'

const giftEmoji = 'flex-none text-[26px] leading-none'

type Props = { loyalty: CartLoyalty; canGift: boolean; useGift: boolean; onToggleGift: () => void; onLogin: () => void }

/**
 * 2026 Bento LoyaltyOffer:
 * Compact bento tile offering gift drink or loyalty login.
 */
export function LoyaltyOffer({ loyalty, canGift, useGift, onToggleGift, onLogin }: Props) {
  if (loyalty) {
    if (!canGift) return null
    return (
      <section className={block}>
        <button className={cx(option, 'w-full rounded-[20px]')} role="switch" aria-checked={useGift} onClick={onToggleGift}>
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
        className="flex w-full items-center gap-3.5 rounded-[20px] bg-surface/90 border border-accent/25 hover:border-accent/45 px-4 py-3.5 text-left shadow-card cursor-pointer transition-all active:scale-98"
        onClick={onLogin}
      >
        <span className={giftEmoji} aria-hidden="true">
          🎁
        </span>
        <span className="flex-1">
          <span className="block font-display text-[15px] font-bold text-ink">Войдите — напиток в подарок</span>
          <span className="mt-0.5 block text-[12px] text-muted font-medium">И скидка уровня со штампами за каждый заказ</span>
        </span>
        <span className="font-display font-bold text-accent text-[18px]" aria-hidden="true">›</span>
      </button>
    </section>
  )
}
