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
import {
  addBtn,
  addPrice,
  block,
  blockTitle,
  btn,
  cx,
  field,
  hint,
  iconBtn,
  option,
  optionSub,
  optionTitle,
  panel,
  radio,
  sheet,
  sheetBody,
  sheetDock,
  sheetHead,
  sheetTitle,
  summary,
  summaryDiscount,
  summaryRow,
  summaryTotal,
  textBtn,
  toggle,
} from '../ui'
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
const stepBtn = 'grid size-[34px] place-items-center rounded-full text-[18px] font-semibold disabled:opacity-35'
const giftEmoji = 'flex-none text-[26px] leading-none'
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
    <div className={sheet} role="dialog" aria-modal="true" aria-label="Корзина">
      <header className={sheetHead}>
        <button className={iconBtn('left')} onClick={onClose} aria-label="Назад в меню" disabled={paying}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={sheetTitle}>Корзина</h1>
        {resolved.length > 0 && (
          <button className={textBtn()} onClick={onClear} disabled={paying}>
            Очистить
          </button>
        )}
      </header>

      {resolved.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle cx="60" cy="60" r="56" fill="var(--surface)" />
            <path d="M38 46h44l-4 44H42z" fill="none" stroke="var(--faint)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M50 46a10 10 0 0 1 20 0" fill="none" stroke="var(--faint)" strokeWidth="4" />
          </svg>
          <h2 className="mt-2 text-[22px]">Пока пусто</h2>
          <p className="mb-3 max-w-[260px] text-[14px] leading-[1.4] text-muted">Загляните в меню — там тыквенный раф и свежие круассаны</p>
          <button className={btn('primary')} onClick={onClose}>
            В меню
          </button>
        </div>
      ) : (
        <div className={sheetBody}>
          <ul className="flex flex-col gap-2">
            {resolved.map((line, index) => (
              <li key={line.key} className={cx('grid grid-cols-[76px_1fr] gap-3 rounded-[22px] p-2 animate-fade-in', panel)}>
                <button
                  className="art-glow grid size-[76px] place-items-center rounded-2xl"
                  style={{ '--tint': line.item.art.bg } as CSSProperties} onClick={() => onOpenItem(line.item)} aria-label={`Открыть ${line.item.name}`}>
                  <ItemArt art={line.item.art} className="size-[86%]" />
                </button>
                <div className="flex min-w-0 flex-col pt-0.5 pr-1">
                  <div className="text-[15px] font-bold tracking-[-0.01em]">{line.item.name}</div>
                  <div className="mt-[3px] text-[12px] leading-[1.35] text-muted">
                    {[line.variant.size !== 'ONE' && `${sizeText[line.variant.size]} · ${line.variant.volume}`, ...line.ingredients.map((i) => `+ ${i.name}`)]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-[15px] font-bold">{formatPrice(line.unitPrice * line.qty)}</span>
                    <div className="flex items-center rounded-full bg-surface-2" role="group" aria-label={`Количество: ${line.qty}`}>
                      <button
                        className={stepBtn}
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
                      <span className="min-w-5 text-center text-[14px] font-bold">{line.qty}</span>
                      <button className={stepBtn} onClick={() => onQty(line.key, line.qty + 1)} aria-label="Больше" disabled={paying || line.qty >= 20}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {upsell.length > 0 && (
            <section className={block}>
              <h2 className={blockTitle}>Добавить к заказу</h2>
              <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
                {upsell.map((item) => (
                  <button
                    key={item.id}
                    className={cx('flex flex-[0_0_116px] flex-col gap-1 rounded-[20px] px-1.5 pt-1.5 pb-2.5 text-left', panel)}
                    onClick={() => onAddUpsell(item)} disabled={paying}>
                    <span className="tinted grid aspect-square place-items-center rounded-[15px] bg-(--tinted)" style={{ '--tint': item.art.bg } as CSSProperties}>
                      <ItemArt art={item.art} className="size-[82%]" />
                    </span>
                    <span className="mx-1 mt-1 min-h-[29px] text-[12px] leading-[1.2] font-semibold">{item.name}</span>
                    <span className="mx-1 text-[12px] font-bold text-accent-soft">+ {formatPrice(item.variants[0].price)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {loyalty ? (
            canGift && (
              <section className={block}>
                <button className={cx(option, 'w-full')} role="switch" aria-checked={useGift} onClick={() => setUseGift((v) => !v)}>
                  <span className={giftEmoji} aria-hidden="true">🎁</span>
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
          ) : (
            <section className={block}>
              <button
                className="flex w-full items-center gap-3 rounded-[18px] bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface))] px-4 py-3.5 text-left shadow-card"
                onClick={onLogin}
              >
                <span className={giftEmoji} aria-hidden="true">🎁</span>
                <span className="flex-1">
                  <span className={optionTitle}>Войдите — напиток в подарок</span>
                  <span className={optionSub}>И скидка уровня со штампами за каждый заказ</span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </section>
          )}

          <section className={block}>
            <label className={blockTitle} htmlFor="guest-name">
              Как вас назвать?
            </label>
            <input
              id="guest-name"
              ref={nameRef}
              className={field(nameError)}
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
            <p id="guest-name-hint" className={hint(nameError ? 'error' : 'plain')}>
              {nameError ? 'Напишите имя — так бариста позовёт вас' : 'Назовём, когда заказ будет готов'}
            </p>
          </section>

          <section className={block}>
            <h2 className={blockTitle}>Когда забрать</h2>
            <div
              className="grid grid-cols-4 gap-1 rounded-[18px] bg-surface p-1 shadow-card *:h-[42px] *:rounded-[14px] *:text-[14px] *:font-semibold *:text-ink-2 *:transition-[background,color] *:duration-200 *:ease-[ease] *:aria-checked:bg-inverse *:aria-checked:text-inverse-ink"
              role="radiogroup" aria-label="Когда забрать">
              {pickupOptions.map((p) => {
                const checked = p.kind === pickup.kind && (p.kind === 'asap' || (pickup.kind === 'in' && pickup.minutes === p.minutes))
                return (
                  <button key={p.kind === 'asap' ? 'asap' : p.minutes} role="radio" aria-checked={checked} onClick={() => setPickup(p)}>
                    {p.kind === 'asap' ? 'Сразу' : `${p.minutes} мин`}
                  </button>
                )
              })}
            </div>
            <p className={hint()}>Покровка, 12 · {pickup.kind === 'asap' ? 'приготовим за 5–7 минут' : `приготовим к нужному времени`}</p>
          </section>

          <section className={block}>
            <h2 className={blockTitle}>Промокод</h2>
            <div className="flex gap-2">
              <input
                className={field(!!promoError)}
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
              <button className={cx(btn('secondary'), 'h-[50px] flex-none')} onClick={applyPromo} disabled={!promoInput.trim()}>
                Применить
              </button>
            </div>
            {promo && <p className={hint('ok')}>{promo}: {promoCodes[promo].label}</p>}
            {promoError && <p className={hint('error')}>{promoError}</p>}
          </section>

          <section className={block}>
            <h2 className={blockTitle}>Оплата</h2>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Способ оплаты">
              {(
                [
                  ['card', 'Картой онлайн', 'Демо: деньги не списываются'],
                  ['cash', 'При получении', 'Картой или наличными на кассе'],
                ] as const
              ).map(([id, title, sub]) => (
                <button key={id} role="radio" aria-checked={payment === id} className={option} onClick={() => setPayment(id)}>
                  <span className={radio} aria-hidden="true" />
                  <span>
                    <span className={optionTitle}>{title}</span>
                    <span className={optionSub}>{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <dl className={summary}>
            <div className={summaryRow}>
              <dt>Товары · {countOf(lines)}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {rewardDiscount > 0 && (
              <div className={summaryRow}>
                <dt>Напиток в подарок</dt>
                <dd className={summaryDiscount}>−{formatPrice(rewardDiscount)}</dd>
              </div>
            )}
            {levelDiscount > 0 && loyalty && (
              <div className={summaryRow}>
                <dt>
                  Уровень «{loyalty.levelName}» · {loyalty.levelPercent}%
                </dt>
                <dd className={summaryDiscount}>−{formatPrice(levelDiscount)}</dd>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className={summaryRow}>
                <dt>Промокод {promo}</dt>
                <dd className={summaryDiscount}>−{formatPrice(promoDiscount)}</dd>
              </div>
            )}
            <div className={summaryTotal}>
              <dt>Итого</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>
      )}

      {resolved.length > 0 && (
        <footer className={sheetDock}>
          <button className={cx(addBtn, 'w-full shadow-lift')} onClick={pay} disabled={paying} aria-busy={paying}>
            {paying ? (
              <span className="flex w-full items-center justify-center gap-2.5">
                <span className="size-5 rounded-full border-[2.5px] border-white/35 border-t-white animate-[spin_0.8s_linear_infinite]" aria-hidden="true" />
                {payment === 'card' ? 'Оплачиваем…' : 'Отправляем…'}
              </span>
            ) : (
              <>
                <span>{payment === 'card' ? 'Оплатить' : 'Заказать'}</span>
                <span className={addPrice} key={total}>
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
