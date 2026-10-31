import { useState } from 'react'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import { readyTimeFor, type PaymentMethod, type Pickup } from '../../state/orders'
import { SAVED_NAME_KEY, writeString } from '../../utils/storage'
import type { cartPricing } from './cartPricing'

// Demo payment: no provider, just a short pause like a real confirmation.
const PAYMENT_DELAY = 1200

type Options = {
  pricing: ReturnType<typeof cartPricing>
  pickup: Pickup
  payment: PaymentMethod
  onMissingName: () => void
}

/** Turns the cart into an order and swaps the cart screen for its status. */
export function useCheckout({ pricing, pickup, payment, onMissingName }: Options) {
  const { cart, orders, profile } = useApp()
  const { replace } = useAppNavigate()
  const [paying, setPaying] = useState(false)

  const pay = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return onMissingName()
    writeString(SAVED_NAME_KEY, trimmed)
    setPaying(true)
    await new Promise((r) => window.setTimeout(r, PAYMENT_DELAY))
    const placedAt = Date.now()
    const order = await orders.create({
      createdAt: placedAt,
      readyAt: readyTimeFor(pickup, placedAt),
      lines: cart.lines,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      name: trimmed,
      pickup,
      payment,
      phone: profile?.phone,
      levelDiscount: pricing.levelDiscount,
      promoDiscount: pricing.promoDiscount,
      rewardDiscount: pricing.rewardDiscount || undefined,
    })
    cart.clear()
    replace(`/order/${order.id}`)
  }

  return { paying, pay }
}
