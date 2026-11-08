import { useId, useRef, useState } from 'react'

import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { Presence } from '../../components/Presence'
import { Sheet, SheetBody, SheetDock } from '../../components/Sheet'
import { ShopPickerSheet } from '../../components/ShopPickerSheet'
import { Summary, SummaryRow, SummaryTotal } from '../../components/Summary'
import { addPrice, textBtn } from '../../components/ui'
import { isDrink, isPaused, type MenuItem, shopStatus } from '../../domain'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useNow } from '../../hooks/useNow'
import { useCatalog } from '../../queries/useCatalog'
import { useShop } from '../../queries/useShop'
import { useApp } from '../../state/AppContext'
import { countOf, type ResolvedLine,resolveLines } from '../../state/cart'
import type { Profile } from '../../state/loyalty'
import { giftValue } from '../../state/loyalty'
import type { PaymentMethod, Pickup } from '../../state/orders'
import { formatPrice } from '../../utils/format'
import { collapseOut, fadeAway } from '../../utils/motion'
import { readSavedName } from '../../utils/storage'
import { LoginPage } from '../login/LoginPage'
import { CartLineItem } from './CartLineItem'
import { type AppliedPromo, type CartLoyalty,cartPricing } from './cartPricing'
import { LoyaltyOffer } from './LoyaltyOffer'
import { NameField } from './NameField'
import { PaymentPicker } from './PaymentPicker'
import { PickupPicker } from './PickupPicker'
import { PromoField } from './PromoField'
import { UpsellRow } from './UpsellRow'
import { useCheckout } from './useCheckout'

/** Signed out, the cart route asks to sign in and then turns into the cart. */
export function CartPage() {
  const { profile, isAuthLoading } = useApp()
  if (isAuthLoading) {
    return <CartLoadingSkeleton />
  }
  return profile ? <CartView profile={profile} /> : <LoginPage />
}

function CartLoadingSkeleton() {
  const { back } = useAppNavigate()
  return (
    <Sheet label="Корзина" title="Корзина" onBack={back} backLabel="В меню">
      <SheetBody>
        <div className="space-y-4 pt-1" role="status" aria-label="Проверяем авторизацию">
          <div className="rounded-card bg-surface-2 p-4 animate-pulse">
            <div className="h-4 w-32 rounded-lg bg-surface-3 mb-2.5" />
            <div className="h-3 w-48 rounded bg-surface-3" />
          </div>
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-card bg-surface-2 p-3 flex items-center gap-3 animate-pulse">
                <div className="size-10 rounded-xl bg-surface-3" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-surface-3" />
                  <div className="h-3 w-16 rounded bg-surface-3" />
                </div>
                <div className="h-4 w-12 rounded bg-surface-3" />
              </div>
            ))}
          </div>
          <div className="rounded-card bg-surface-2 p-4 space-y-3 animate-pulse">
            <div className="h-3.5 w-24 rounded bg-surface-3" />
            <div className="h-10 rounded-xl bg-surface-3" />
          </div>
        </div>
      </SheetBody>
    </Sheet>
  )
}

function CartView({ profile }: { profile: Profile }) {
  const { cart, loyalty, showToast } = useApp()
  const { go, back } = useAppNavigate()
  const [name, setName] = useState(() => profile.name || readSavedName())
  const [nameError, setNameError] = useState(false)
  const [pickup, setPickup] = useState<Pickup>({ kind: 'asap' })
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const [useGift, setUseGift] = useState(true)
  const [showShopPicker, setShowShopPicker] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const catalog = useCatalog()
  const shop = useShop()
  const now = useNow(30_000)
  const status = shop ? shopStatus(shop, now) : null
  const isShopClosed = status?.kind === 'closed'
  const isShopPaused = status?.kind === 'paused' || (!!shop && isPaused(shop, now))
  const isOrderingBlocked = isShopClosed || isShopPaused
  const lines = resolveLines(cart.lines, catalog)
  const cartLoyalty: CartLoyalty = {
    levelName: loyalty.level.name,
    levelPercent: loyalty.level.percent,
    giftValue: giftValue(cart.lines, catalog),
    giftsAvailable: loyalty.giftsAvailable,
  }
  const price = cartPricing(cart.lines, cartLoyalty, promo, useGift, catalog)
  const inCart = new Set(cart.lines.map((l) => l.itemId))
  const upsell = catalog.items.filter((i) => !isDrink(i) && !inCart.has(i.id) && !i.variants[0]?.stopped).slice(0, 6)

  const goToMenu = () => {
    go('/')
  }

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
    promo,
    shopId: shop?.id,
    pickup,
    payment,
    onMissingName: () => {
      setNameError(true)
      nameRef.current?.focus()
      nameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    },
  })

  const clearButton = lines.length > 0 && (
    <Button className={textBtn()} onClick={() => void clear()} disabled={paying}>
      Очистить
    </Button>
  )

  return (
    <Sheet label="Корзина" title="Корзина" onBack={lines.length === 0 ? goToMenu : back} backLabel="Назад в меню" locked={paying} action={clearButton}>
      {lines.length === 0 ? (
        <EmptyState
          art={<EmptyCartArt />}
          title="Пока пусто"
          text="Загляните в меню — там капучино с зайцем и тёплые круассаны"
          actionLabel="В меню"
          onAction={goToMenu}
        />
      ) : (
        <SheetBody ref={bodyRef}>
          <ul ref={listRef} className="flex flex-col gap-2">
            {lines.map((line) => (
              <CartLineItem
                key={line.key}
                line={line}
                disabled={paying}
                onOpen={() => go(`/product/${line.item.id}`, { artSlot: line.key, editCartKey: line.key })}
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
          <PickupPicker shop={shop} value={pickup} onChange={setPickup} onChangeShop={() => setShowShopPicker(true)} />
          <PromoField applied={promo} onApply={setPromo} />
          <PaymentPicker value={payment} onChange={setPayment} />
          <Summary>
            <SummaryRow label={`Товары · ${countOf(cart.lines)}`} amount={price.subtotal} />
            {price.rewardDiscount > 0 && <SummaryRow label="Напиток в подарок" amount={price.rewardDiscount} discount />}
            {price.levelDiscount > 0 && cartLoyalty && (
              <SummaryRow label={`Уровень «${cartLoyalty.levelName}» · ${cartLoyalty.levelPercent}%`} amount={price.levelDiscount} discount />
            )}
            {price.promoDiscount > 0 && <SummaryRow label={`Промокод ${promo?.code}`} amount={price.promoDiscount} discount />}
            <SummaryTotal label="Итого" amount={price.total} />
          </Summary>
        </SheetBody>
      )}

      {lines.length > 0 && (
        <SheetDock ref={dockRef}>
          {isShopPaused && (
            <p className="mb-2 text-center text-compact font-semibold text-danger" role="alert">
              {shop?.pauseReason ? `Кофейня временно не принимает заказы: ${shop.pauseReason}` : 'Кофейня временно не принимает заказы'}
            </p>
          )}
          {isShopClosed && (
            <p className="mb-2 text-center text-compact font-semibold text-danger" role="alert">
              {status?.text.startsWith('откроемся')
                ? `Кофейня сейчас закрыта (${status.text})`
                : 'Кофейня сейчас закрыта'}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="flex items-center justify-between"
            onClick={() => void pay(name)}
            disabled={paying || isOrderingBlocked}
            aria-busy={paying}
          >
            {paying ? (
              <span className="flex w-full items-center justify-center gap-2.5">
                <span className="size-5 rounded-pill border-[calc(var(--space-unit)*0.625)] border-white/35 border-t-white animate-[spin_0.8s_linear_infinite]" aria-hidden="true" />
                {payment === 'card' ? 'Оплачиваем…' : 'Отправляем…'}
              </span>
            ) : isShopClosed ? (
              <span className="w-full text-center">Заведение закрыто</span>
            ) : (
              <>
                <span>{payment === 'card' ? 'Оплатить' : 'Заказать'}</span>
                <span className={addPrice} key={price.total}>
                  {formatPrice(price.total)}
                </span>
              </>
            )}
          </Button>
        </SheetDock>
      )}
      <Presence>{showShopPicker && <ShopPickerSheet onClose={() => setShowShopPicker(false)} />}</Presence>
    </Sheet>
  )
}

function EmptyCartArt() {
  const uid = useId().replace(/:/g, '')
  const discId = `cart-disc-${uid}`
  const bagId = `cart-bag-${uid}`
  const cupId = `cart-cup-${uid}`
  const accentId = `cart-accent-${uid}`
  const cremaId = `cart-crema-${uid}`

  return (
    <svg viewBox="0 0 160 160" width="140" height="140" aria-hidden="true" className="overflow-visible select-none">
      <defs>
        {/* Soft ceramic plate backdrop */}
        <radialGradient id={discId} cx="50%" cy="38%" r="62%">
          <stop offset="0%" stopColor="var(--surface)" />
          <stop offset="100%" stopColor="var(--surface-2)" />
        </radialGradient>
        {/* Craft tote bag gradient */}
        <linearGradient id={bagId} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="var(--surface-2)" />
          <stop offset="50%" stopColor="var(--surface)" />
          <stop offset="100%" stopColor="var(--faint)" stopOpacity="0.4" />
        </linearGradient>
        {/* Ceramic coffee cup */}
        <linearGradient id={cupId} x1="0" y1="0" x2="1" y2="0.1">
          <stop offset="0%" stopColor="var(--surface)" />
          <stop offset="45%" stopColor="var(--bg)" />
          <stop offset="100%" stopColor="var(--surface-2)" />
        </linearGradient>
        {/* Brand terracotta accent */}
        <linearGradient id={accentId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-2)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        {/* Golden crema */}
        <linearGradient id={cremaId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--crema)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="80" cy="134" rx="52" ry="7" fill="var(--ink)" opacity="0.08" />

      {/* Ceramic backdrop disc with double rim */}
      <circle cx="80" cy="74" r="58" fill={`url(#${discId})`} stroke="var(--line)" strokeWidth="1.5" />
      <circle cx="80" cy="74" r="50" fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

      {/* Craft shopping bag */}
      <g>
        {/* Back handle */}
        <path
          d="M56 60 C56 42, 78 42, 78 60"
          fill="none"
          stroke="var(--faint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Bag body */}
        <path
          d="M44 60 L48 116 Q49 120 53 120 L93 120 Q97 120 98 116 L102 60 Z"
          fill={`url(#${bagId})`}
          stroke="var(--line-strong)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Bag fold lines / gusset */}
        <path
          d="M55 60 L57 119 M91 60 L89 119"
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Front handle */}
        <path
          d="M60 60 C60 40, 82 40, 82 60"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Bag heart/coffee stamp emblem */}
        <path
          d="M68 83 Q73 78 78 83 Q73 89 68 83 Z"
          fill="var(--accent)"
          opacity="0.7"
        />
        <path
          d="M70 81 Q73 84 76 87"
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>

      {/* Specialty Coffee Cup in foreground */}
      <g>
        {/* Shadow under cup */}
        <ellipse cx="102" cy="122" rx="16" ry="4" fill="var(--ink)" opacity="0.12" />

        {/* Cup body */}
        <path
          d="M87 80 L90 116 Q91 120 95 120 L109 120 Q113 120 114 116 L117 80 Z"
          fill={`url(#${cupId})`}
          stroke="var(--line-strong)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Cup sleeve in terracotta */}
        <path
          d="M88.5 90 L90 106 Q102 108 114 106 L115.5 90 Q102 92 88.5 90 Z"
          fill={`url(#${accentId})`}
        />

        {/* Cup lid */}
        <ellipse cx="102" cy="80" rx="16" ry="3.5" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.2" />
        {/* Lid sip spout */}
        <rect x="99" y="76" width="6" height="3" rx="1.5" fill="var(--faint)" />
      </g>

      {/* Delicate floating steam */}
      <g className="animate-[float-soft_2.5s_ease-in-out_infinite]">
        <path
          d="M98 72 C95 64, 102 58, 98 48 C95 40, 100 33, 98 26"
          fill="none"
          stroke="var(--crema)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M107 70 C110 62, 104 55, 108 46 C111 39, 106 32, 109 25"
          fill="none"
          stroke={`url(#${cremaId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.65"
        />
      </g>

      {/* Floating roasted coffee bean */}
      <g transform="translate(42, 46) rotate(-22)" className="animate-[float-soft_3.2s_ease-in-out_infinite]">
        <ellipse cx="0" cy="0" rx="5.5" ry="8" fill="var(--accent)" />
        <path
          d="M0 -6.5 C-1.8 -2, 1.8 2, 0 6.5"
          stroke="var(--surface)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Aroma sparkle star */}
      <path
        d="M124 50 Q124 54 128 54 Q124 54 124 58 Q124 54 120 54 Q124 54 124 50 Z"
        fill="var(--crema)"
        opacity="0.85"
      />
      <circle cx="38" cy="84" r="1.5" fill="var(--accent)" opacity="0.5" />
    </svg>
  )
}
