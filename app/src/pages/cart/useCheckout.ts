import { useState } from 'react'
import { ApiError } from '../../api'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import type { PaymentMethod, Pickup } from '../../state/orders'
import { SAVED_NAME_KEY, writeString } from '../../utils/storage'
import type { AppliedPromo, cartPricing } from './cartPricing'

// No acquiring provider is connected yet: a short pause stands in for the card confirmation.
const PAYMENT_DELAY = 1200

type Options = {
  pricing: ReturnType<typeof cartPricing>
  promo: AppliedPromo | null
  shopId?: string
  pickup: Pickup
  payment: PaymentMethod
  onMissingName: () => void
}

/** Turns the cart into an order on the server and swaps the cart screen for its status. */
export function useCheckout({ pricing, promo, shopId, pickup, payment, onMissingName }: Options) {
  const { cart, orders, profile, showToast } = useApp()
  const { replace } = useAppNavigate()
  const [paying, setPaying] = useState(false)

  const pay = async (name: string) => {
    if (!profile) {
      showToast({ text: 'Для оформления заказа необходимо войти в профиль' })
      return
    }
    const trimmed = name.trim()
    if (!trimmed) return onMissingName()
    writeString(SAVED_NAME_KEY, trimmed)
    setPaying(true)
    try {
      if (payment === 'card') await new Promise((r) => window.setTimeout(r, PAYMENT_DELAY))
      const order = await orders.create({
        lines: cart.lines,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        total: pricing.total,
        name: trimmed,
        pickup,
        payment,
        phone: profile.phone,
        shopId,
        levelDiscount: pricing.levelDiscount || undefined,
        promoCode: promo?.code,
        promoDiscount: pricing.promoDiscount || undefined,
        rewardDiscount: pricing.rewardDiscount || undefined,
      })
      cart.clear()
      replace(`/order/${order.id}`)
    } catch (err) {
      // A paused shop explains itself; anything else is a generic retry.
      const paused = err instanceof ApiError && err.reason === 'shop_paused'
      showToast({ text: paused ? err.message : 'Не получилось оформить заказ — попробуйте ещё раз' })
    } finally {
      setPaying(false)
    }
  }

  return { paying, pay }
}
