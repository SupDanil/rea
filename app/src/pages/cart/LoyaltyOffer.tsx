import { Button } from '../../components/Button'
import { SwitchRow } from '../../components/SwitchRow'
import { block } from '../../components/ui'
import { formatPrice } from '../../utils/format'
import type { CartLoyalty } from './cartPricing'

const giftEmoji = 'flex-none text-heading leading-none'

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
        <SwitchRow className="ui-surface" checked={useGift} onChange={onToggleGift}
          leading={<span className={giftEmoji} aria-hidden="true">🎁</span>} label="Напиток в подарок"
          description={`−${formatPrice(loyalty.giftValue)} · осталось подарков: ${loyalty.giftsAvailable}`} />
      </section>
    )
  }
  return (
    <section className={block}>
      <Button
        className="flex w-full items-center gap-3.5 rounded-card bg-surface/90 border-(length:--stroke-width) border-accent/25 hover:border-accent/45 px-4 py-3.5 text-left shadow-card cursor-pointer transition-all active:scale-98"
        onClick={onLogin}
      >
        <span className={giftEmoji} aria-hidden="true">
          🎁
        </span>
        <span className="flex-1">
          <span className="block font-display text-control font-bold text-ink">Войдите — напиток в подарок</span>
          <span className="mt-0.5 block text-caption text-muted font-medium">И скидка уровня со штампами за каждый заказ</span>
        </span>
        <span className="font-display font-bold text-accent text-lead" aria-hidden="true">›</span>
      </Button>
    </section>
  )
}
