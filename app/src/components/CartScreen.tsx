import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { formatPrice, menuItems, type MenuItem } from '../data/menu'
import {
  countOf,
  normalizePromo,
  promoCodes,
  resolveLines,
  subtotalOf,
  type CartLine,
  type PaymentMethod,
  type Pickup,
} from '../store'
import { ItemArt } from './ItemArt'

export type Checkout = {
  name: string
  pickup: Pickup
  payment: PaymentMethod
  subtotal: number
  discount: number
  levelDiscount: number
  promoDiscount: number
  rewardDiscount: number
  total: number
}

/** What the signed-in guest brings to the cart; null for a guest. */
export type CartLoyalty = { levelName: string; levelPercent: number; giftValue: number; giftsAvailable: number } | null

type Props = {
  lines: CartLine[]
  onQty: (key: string, qty: number) => void
  onRemove: (line: CartLine, index: number) => void
  onAddUpsell: (item: MenuItem) => void
  onOpenItem: (item: MenuItem) => void
  onClear: () => void
  onClose: () => void
  onCheckout: (checkout: Checkout) => Promise<void>
  profileName?: string
  loyalty: CartLoyalty
  onLogin: () => void
}

const NAME_KEY = 'zerno-name'
const pickupOptions: Pickup[] = [{ kind: 'asap' }, { kind: 'in', minutes: 15 }, { kind: 'in', minutes: 30 }, { kind: 'in', minutes: 45 }]
const sizeText = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function CartScreen({ lines, onQty, onRemove, onAddUpsell, onOpenItem, onClear, onClose, onCheckout, profileName, loyalty, onLogin }: Props) {
  const resolved = resolveLines(lines)
  const [name, setName] = useState(() => profileName || readName())
  const [nameError, setNameError] = useState(false)
  const [pickup, setPickup] = useState<Pickup>({ kind: 'asap' })
  const [payment, setPayment] = useState<PaymentMethod>('card')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [useGift, setUseGift] = useState(true)
  const nameRef = useRef<HTMLInputElement>(null)

  const subtotal = subtotalOf(lines)
  // Gift drink comes off first, then level and promo percentages apply to the rest.
  const canGift = !!loyalty && loyalty.giftsAvailable > 0 && loyalty.giftValue > 0
  const rewardDiscount = canGift && useGift ? loyalty.giftValue : 0
  const base = subtotal - rewardDiscount
  const levelDiscount = loyalty ? Math.round((base * loyalty.levelPercent) / 100) : 0
  const promoDiscount = promo ? Math.round((base * promoCodes[promo].percent) / 100) : 0
  const discount = rewardDiscount + levelDiscount + promoDiscount
  const total = Math.max(0, subtotal - discount)

  // Suggest food the guest has not picked yet — the cart-level upsell Drinkit shows.
  const inCart = new Set(lines.map((l) => l.itemId))
  const upsell = menuItems.filter((i) => i.variants[0].size === 'ONE' && !inCart.has(i.id)).slice(0, 6)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !paying && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, paying])

  const applyPromo = () => {
    const code = normalizePromo(promoInput)
    if (!code) return
    if (promoCodes[code]) {
      setPromo(code)
      setPromoError(null)
    } else {
      setPromo(null)
      setPromoError('Такого промокода нет')
    }
  }

  const pay = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError(true)
      nameRef.current?.focus()
      nameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    try {
      localStorage.setItem(NAME_KEY, trimmed)
    } catch {
      // Not critical: the name is just prefilled next time.
    }
    setPaying(true)
    try {
      await onCheckout({ name: trimmed, pickup, payment, subtotal, discount, levelDiscount, promoDiscount, rewardDiscount, total })
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Корзина">
      <header className="sheet-head">
        <button className="icon-btn icon-btn-left" onClick={onClose} aria-label="Назад в меню" disabled={paying}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>Корзина</h1>
        {resolved.length > 0 && (
          <button className="text-btn" onClick={onClear} disabled={paying}>
            Очистить
          </button>
        )}
      </header>

      {resolved.length === 0 ? (
        <div className="empty">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle cx="60" cy="60" r="56" fill="var(--surface)" />
            <path d="M38 46h44l-4 44H42z" fill="none" stroke="var(--faint)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M50 46a10 10 0 0 1 20 0" fill="none" stroke="var(--faint)" strokeWidth="4" />
          </svg>
          <h2>Пока пусто</h2>
          <p>Загляните в меню — там тыквенный раф и свежие круассаны</p>
          <button className="primary-btn" onClick={onClose}>
            В меню
          </button>
        </div>
      ) : (
        <div className="sheet-body">
          <ul className="lines">
            {resolved.map((line, index) => (
              <li key={line.key} className="line">
                <button className="line-art" style={{ '--tint': line.item.art.bg } as CSSProperties} onClick={() => onOpenItem(line.item)} aria-label={`Открыть ${line.item.name}`}>
                  <ItemArt art={line.item.art} />
                </button>
                <div className="line-info">
                  <div className="line-name">{line.item.name}</div>
                  <div className="line-meta">
                    {[line.variant.size !== 'ONE' && `${sizeText[line.variant.size]} · ${line.variant.volume}`, ...line.ingredients.map((i) => `+ ${i.name}`)]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div className="line-foot">
                    <span className="line-price">{formatPrice(line.unitPrice * line.qty)}</span>
                    <div className="stepper" role="group" aria-label={`Количество: ${line.qty}`}>
                      <button
                        onClick={() => (line.qty === 1 ? onRemove(line, index) : onQty(line.key, line.qty - 1))}
                        aria-label={line.qty === 1 ? 'Удалить' : 'Меньше'}
                        disabled={paying}
                      >
                        {line.qty === 1 ? (
                          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                            <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          '−'
                        )}
                      </button>
                      <span>{line.qty}</span>
                      <button onClick={() => onQty(line.key, line.qty + 1)} aria-label="Больше" disabled={paying || line.qty >= 20}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {upsell.length > 0 && (
            <section className="block">
              <h2 className="block-title">Добавить к заказу</h2>
              <div className="upsell">
                {upsell.map((item) => (
                  <button key={item.id} className="upsell-card" onClick={() => onAddUpsell(item)} disabled={paying}>
                    <span className="upsell-art" style={{ '--tint': item.art.bg } as CSSProperties}>
                      <ItemArt art={item.art} />
                    </span>
                    <span className="upsell-name">{item.name}</span>
                    <span className="upsell-price">+ {formatPrice(item.variants[0].price)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {loyalty ? (
            canGift && (
              <section className="block">
                <button className="option gift-option" role="switch" aria-checked={useGift} onClick={() => setUseGift((v) => !v)}>
                  <span className="gift-emoji" aria-hidden="true">🎁</span>
                  <span>
                    <span className="option-title">Напиток в подарок</span>
                    <span className="option-sub">
                      −{formatPrice(loyalty.giftValue)} · осталось подарков: {loyalty.giftsAvailable}
                    </span>
                  </span>
                  <span className="switch" aria-hidden="true" />
                </button>
              </section>
            )
          ) : (
            <section className="block">
              <button className="login-banner" onClick={onLogin}>
                <span className="gift-emoji" aria-hidden="true">🎁</span>
                <span>
                  <span className="option-title">Войдите — напиток в подарок</span>
                  <span className="option-sub">И скидка уровня со штампами за каждый заказ</span>
                </span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            </section>
          )}

          <section className="block">
            <label className="block-title" htmlFor="guest-name">
              Как вас назвать?
            </label>
            <input
              id="guest-name"
              ref={nameRef}
              className={`field${nameError ? ' has-error' : ''}`}
              value={name}
              maxLength={20}
              autoComplete="given-name"
              placeholder="Имя для бариста"
              aria-invalid={nameError}
              aria-describedby="guest-name-hint"
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.trim()) setNameError(false)
              }}
            />
            <p id="guest-name-hint" className={`hint${nameError ? ' is-error' : ''}`}>
              {nameError ? 'Напишите имя — так бариста позовёт вас' : 'Назовём, когда заказ будет готов'}
            </p>
          </section>

          <section className="block">
            <h2 className="block-title">Когда забрать</h2>
            <div className="segmented" role="radiogroup" aria-label="Когда забрать">
              {pickupOptions.map((p) => {
                const checked = p.kind === pickup.kind && (p.kind === 'asap' || (pickup.kind === 'in' && pickup.minutes === p.minutes))
                return (
                  <button key={p.kind === 'asap' ? 'asap' : p.minutes} role="radio" aria-checked={checked} onClick={() => setPickup(p)}>
                    {p.kind === 'asap' ? 'Сразу' : `${p.minutes} мин`}
                  </button>
                )
              })}
            </div>
            <p className="hint">Покровка, 12 · {pickup.kind === 'asap' ? 'приготовим за 5–7 минут' : `приготовим к нужному времени`}</p>
          </section>

          <section className="block">
            <h2 className="block-title">Промокод</h2>
            <div className="promo">
              <input
                className={`field${promoError ? ' has-error' : ''}`}
                value={promoInput}
                placeholder="Например, ЗЕРНО10"
                autoCapitalize="characters"
                aria-label="Промокод"
                onChange={(e) => {
                  setPromoInput(e.target.value)
                  setPromoError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
              />
              <button className="secondary-btn" onClick={applyPromo} disabled={!promoInput.trim()}>
                Применить
              </button>
            </div>
            {promo && <p className="hint is-ok">{promo}: {promoCodes[promo].label}</p>}
            {promoError && <p className="hint is-error">{promoError}</p>}
          </section>

          <section className="block">
            <h2 className="block-title">Оплата</h2>
            <div className="options" role="radiogroup" aria-label="Способ оплаты">
              {(
                [
                  ['card', 'Картой онлайн', 'Демо: деньги не списываются'],
                  ['cash', 'При получении', 'Картой или наличными на кассе'],
                ] as const
              ).map(([id, title, sub]) => (
                <button key={id} role="radio" aria-checked={payment === id} className="option" onClick={() => setPayment(id)}>
                  <span className="radio" aria-hidden="true" />
                  <span>
                    <span className="option-title">{title}</span>
                    <span className="option-sub">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <dl className="summary">
            <div>
              <dt>Товары · {countOf(lines)}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {rewardDiscount > 0 && (
              <div className="is-discount">
                <dt>Напиток в подарок</dt>
                <dd>−{formatPrice(rewardDiscount)}</dd>
              </div>
            )}
            {levelDiscount > 0 && loyalty && (
              <div className="is-discount">
                <dt>
                  Уровень «{loyalty.levelName}» · {loyalty.levelPercent}%
                </dt>
                <dd>−{formatPrice(levelDiscount)}</dd>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className="is-discount">
                <dt>Промокод {promo}</dt>
                <dd>−{formatPrice(promoDiscount)}</dd>
              </div>
            )}
            <div className="summary-total">
              <dt>Итого</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>
      )}

      {resolved.length > 0 && (
        <footer className="sheet-dock">
          <button className="add-btn" onClick={pay} disabled={paying} aria-busy={paying}>
            {paying ? (
              <span className="spinner-wrap">
                <span className="spinner" aria-hidden="true" />
                {payment === 'card' ? 'Оплачиваем…' : 'Отправляем…'}
              </span>
            ) : (
              <>
                <span>{payment === 'card' ? 'Оплатить' : 'Заказать'}</span>
                <span className="add-price" key={total}>
                  {formatPrice(total)}
                </span>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  )
}
