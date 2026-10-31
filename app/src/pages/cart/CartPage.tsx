import { useRef, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { Sheet, SheetBody, SheetDock } from '../../components/Sheet'
import { Summary, SummaryRow, SummaryTotal } from '../../components/Summary'
import { addBtn, addPrice, textBtn } from '../../components/ui'
import { isDrink, menuItems, type MenuItem } from '../../data/menu'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import { countOf, resolveLines, type ResolvedLine } from '../../state/cart'
import { giftValue } from '../../state/loyalty'
import type { PaymentMethod, Pickup } from '../../state/orders'
import { cx } from '../../utils/cx'
import { formatPrice } from '../../utils/format'
import { collapseOut, fadeAway } from '../../utils/motion'
import { readSavedName } from '../../utils/storage'
import { CartLineItem } from './CartLineItem'
import { cartPricing, type CartLoyalty } from './cartPricing'
import { LoyaltyOffer } from './LoyaltyOffer'
import { NameField } from './NameField'
import { PaymentPicker } from './PaymentPicker'
import { PickupPicker } from './PickupPicker'
import { PromoField } from './PromoField'
import { UpsellRow } from './UpsellRow'
import { useCheckout } from './useCheckout'

export function CartPage() {
  const { cart, profile, loyalty, showToast } = useApp()
  const { go, back } = useAppNavigate()
  const [name, setName] = useState(() => profile?.name || readSavedName())
  const [nameError, setNameError] = useState(false)
  const [pickup, setPickup] = useState<Pickup>({ kind: 'asap' })
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [promo, setPromo] = useState<string | null>(null)
  const [useGift, setUseGift] = useState(true)
  const nameRef = useRef<HTMLInputElement>(null)

  const lines = resolveLines(cart.lines)
  const cartLoyalty: CartLoyalty = profile
    ? { levelName: loyalty.level.name, levelPercent: loyalty.level.percent, giftValue: giftValue(cart.lines), giftsAvailable: loyalty.giftsAvailable }
    : null
  const price = cartPricing(cart.lines, cartLoyalty, promo, useGift)
  const inCart = new Set(cart.lines.map((l) => l.itemId))
  const upsell = menuItems.filter((i) => !isDrink(i) && !inCart.has(i.id)).slice(0, 6)

  const bodyRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const removing = useRef(new Set<string>())

  // The row plays its exit first; when it was the last one, the rest of the
  // cart fades away too, and only then does the empty state take over.
  const remove = async (line: ResolvedLine, row: HTMLLIElement | null) => {
    if (removing.current.has(line.key)) return
    removing.current.add(line.key)
    const index = cart.lines.findIndex((l) => l.key === line.key)
    const stored = cart.lines[index]
    const last = cart.lines.length - removing.current.size === 0
    await collapseOut(row)
    if (last) await fadeAway([bodyRef.current, dockRef.current])
    removing.current.delete(line.key)
    cart.setQty(line.key, 0)
    showToast({ text: `${line.item.name} удалён`, action: { label: 'Вернуть', run: () => cart.restore(stored, index) } })
  }
  const clear = async () => {
    const snapshot = cart.lines
    const rows = [...(listRef.current?.children ?? [])] as HTMLElement[]
    // Rows leave in a quick cascade from the bottom, then the form fades out.
    await Promise.all(rows.reverse().map((row, i) => collapseOut(row, i * 60)))
    await fadeAway([bodyRef.current, dockRef.current])
    cart.clear()
    showToast({ text: 'Корзина очищена', action: { label: 'Вернуть', run: () => snapshot.forEach((l, i) => cart.restore(l, i)) } })
  }
  const addUpsell = (item: MenuItem) => {
    cart.add(item.id, item.variants[0].id, [])
    showToast({ text: `${item.name} добавлен` })
  }

  const { paying, pay } = useCheckout({
    pricing: price,
    pickup,
    payment,
    onMissingName: () => {
      setNameError(true)
      nameRef.current?.focus()
      nameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
  })

  const clearButton = lines.length > 0 && (
    <button className={textBtn()} onClick={() => void clear()} disabled={paying}>
      Очистить
    </button>
  )

  return (
    <Sheet label="Корзина" title="Корзина" onBack={back} backLabel="Назад в меню" locked={paying} action={clearButton}>
      {lines.length === 0 ? (
        <EmptyState art={<EmptyCartArt />} title="Пока пусто" text="Загляните в меню — там капучино с зайцем и тёплые круассаны" actionLabel="В меню" onAction={back} />
      ) : (
        <SheetBody ref={bodyRef}>
          <ul ref={listRef} className="flex flex-col gap-2">
            {lines.map((line) => (
              <CartLineItem
                key={line.key}
                line={line}
                disabled={paying}
                onOpen={() => go(`/product/${line.item.id}`)}
                onQty={(qty) => cart.setQty(line.key, qty)}
                onRemove={(row) => void remove(line, row)}
              />
            ))}
          </ul>
          <UpsellRow items={upsell} disabled={paying} onAdd={addUpsell} />
          <LoyaltyOffer loyalty={cartLoyalty} canGift={price.canGift} useGift={useGift} onToggleGift={() => setUseGift((v) => !v)} onLogin={() => go('/login')} />
          <NameField
            value={name}
            error={nameError}
            inputRef={nameRef}
            onChange={(value) => {
              setName(value)
              if (value.trim()) setNameError(false)
            }}
          />
          <PickupPicker value={pickup} onChange={setPickup} />
          <PromoField applied={promo} onApply={setPromo} />
          <PaymentPicker value={payment} onChange={setPayment} />
          <Summary>
            <SummaryRow label={`Товары · ${countOf(cart.lines)}`} amount={price.subtotal} />
            {price.rewardDiscount > 0 && <SummaryRow label="Напиток в подарок" amount={price.rewardDiscount} discount />}
            {price.levelDiscount > 0 && cartLoyalty && (
              <SummaryRow label={`Уровень «${cartLoyalty.levelName}» · ${cartLoyalty.levelPercent}%`} amount={price.levelDiscount} discount />
            )}
            {price.promoDiscount > 0 && <SummaryRow label={`Промокод ${promo}`} amount={price.promoDiscount} discount />}
            <SummaryTotal label="Итого" amount={price.total} />
          </Summary>
        </SheetBody>
      )}

      {lines.length > 0 && (
        <SheetDock ref={dockRef}>
          <button className={cx(addBtn, 'w-full shadow-lift')} onClick={() => void pay(name)} disabled={paying} aria-busy={paying}>
            {paying ? (
              <span className="flex w-full items-center justify-center gap-2.5">
                <span className="size-5 rounded-full border-[2.5px] border-white/35 border-t-white animate-[spin_0.8s_linear_infinite]" aria-hidden="true" />
                {payment === 'card' ? 'Оплачиваем…' : 'Отправляем…'}
              </span>
            ) : (
              <>
                <span>{payment === 'card' ? 'Оплатить' : 'Заказать'}</span>
                <span className={addPrice} key={price.total}>
                  {formatPrice(price.total)}
                </span>
              </>
            )}
          </button>
        </SheetDock>
      )}
    </Sheet>
  )
}

function EmptyCartArt() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--surface-2)" />
      {/* Little rabbit ears peeking */}
      <ellipse cx="50" cy="38" rx="6" ry="16" transform="rotate(-12 50 38)" fill="var(--accent)" opacity="0.45" />
      <ellipse cx="70" cy="38" rx="6" ry="16" transform="rotate(12 70 38)" fill="var(--accent)" opacity="0.45" />
      <circle cx="60" cy="54" r="18" fill="var(--surface)" />
      <circle cx="54" cy="52" r="2" fill="var(--ink)" opacity="0.75" />
      <circle cx="66" cy="52" r="2" fill="var(--ink)" opacity="0.75" />
      <path d="M38 56h44l-4 40H42z" fill="none" stroke="var(--faint)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M48 56a12 12 0 0 1 24 0" fill="none" stroke="var(--faint)" strokeWidth="3" />
    </svg>
  )
}
