import { useEffect, useState } from 'react'
import { formatPrice } from '../data/menu'
import { GIFT_DRINK_LIMIT, levels, STAMP_MIN_TOTAL, STAMPS_PER_GIFT, type Loyalty, type Profile } from '../loyalty'
import { resolveLines, statusOf, useNow, type Order } from '../store'
import type { Theme } from '../theme'

type Props = {
  profile: Profile
  loyalty: Loyalty
  orders: Order[]
  theme: Theme
  onToggleTheme: () => void
  onUpdate: (patch: Partial<Profile>) => void
  onSignOut: () => void
  onOpenOrder: (order: Order) => void
  onRepeat: (order: Order) => void
  onClose: () => void
}

const statusText = { paying: 'Оплата', accepted: 'Принят', making: 'Готовится', ready: 'Выдан', cancelled: 'Отменён' } as const
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const dateTime = (ts: number) =>
  new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function ProfileScreen({ profile, loyalty, orders, theme, onToggleTheme, onUpdate, onSignOut, onOpenOrder, onRepeat, onClose }: Props) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [emailError, setEmailError] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const now = useNow(5000)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { level, next } = loyalty
  const toNext = next ? next.minOrders - loyalty.completed : 0
  const levelProgress = next ? (loyalty.completed - level.minOrders) / (next.minOrders - level.minOrders) : 1
  const initials = profile.name.trim().slice(0, 1).toUpperCase() || '☕'

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== profile.name) onUpdate({ name: trimmed })
    else setName(profile.name)
  }
  const saveEmail = () => {
    const trimmed = email.trim()
    if (trimmed && !isEmail(trimmed)) return setEmailError(true)
    setEmailError(false)
    if (trimmed !== profile.email) onUpdate({ email: trimmed })
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Профиль">
      <header className="sheet-head">
        <button className="icon-btn icon-btn-left" onClick={onClose} aria-label="В меню">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>Профиль</h1>
      </header>

      <div className="sheet-body">
        <div className="me">
          <span className="avatar" aria-hidden="true">{initials}</span>
          <div>
            <div className="me-name">{profile.name}</div>
            <div className="me-phone">{profile.phone}</div>
          </div>
        </div>

        <section className={`level-card is-level-${level.level}`} aria-label="Уровень лояльности">
          <div className="level-top">
            <div>
              <div className="level-kicker">Уровень {level.level}</div>
              <div className="level-name">{level.name}</div>
            </div>
            <div className="level-percent">{level.percent ? `−${level.percent}%` : '0%'}</div>
          </div>
          <div className="level-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelProgress * 100)}>
            <span style={{ transform: `scaleX(${levelProgress})` }} />
          </div>
          <p className="level-note">
            {next
              ? `Ещё ${toNext} ${plural(toNext, 'заказ', 'заказа', 'заказов')} до «${next.name}» — скидка ${next.percent}% на всё`
              : 'Максимальный уровень — скидка на все заказы'}
          </p>
          <ol className="level-ladder">
            {levels.map((l) => (
              <li key={l.level} className={l.level <= level.level ? 'is-reached' : ''}>
                <span>{l.name}</span>
                <b>{l.percent}%</b>
              </li>
            ))}
          </ol>
        </section>

        <section className="stamp-card" aria-label="Штампы">
          <div className="stamp-head">
            <h2>Штампы</h2>
            <span className="muted">
              {loyalty.stamps} из {STAMPS_PER_GIFT}
            </span>
          </div>
          <div className="stamps">
            {Array.from({ length: STAMPS_PER_GIFT }, (_, i) => (
              <span key={i} className={`stamp${i < loyalty.stamps ? ' is-on' : ''}${i === STAMPS_PER_GIFT - 1 ? ' is-gift' : ''}`} aria-hidden="true">
                {i === STAMPS_PER_GIFT - 1 ? '🎁' : i < loyalty.stamps ? '☕' : ''}
              </span>
            ))}
          </div>
          <p className="hint">
            Заказ от {formatPrice(STAMP_MIN_TOTAL)} — штамп. {STAMPS_PER_GIFT} штампов — напиток в подарок (до {formatPrice(GIFT_DRINK_LIMIT)}).
          </p>
          {loyalty.giftsAvailable > 0 && (
            <div className="gift-banner">
              <span aria-hidden="true">🎁</span>
              <div>
                <b>
                  {loyalty.giftsAvailable} {plural(loyalty.giftsAvailable, 'напиток', 'напитка', 'напитков')} в подарок
                </b>
                <div>Применится в корзине, если в заказе есть напиток</div>
              </div>
            </div>
          )}
        </section>

        <section className="block">
          <h2 className="block-title">История заказов</h2>
          {orders.length === 0 ? (
            <p className="hint">Здесь появятся ваши заказы</p>
          ) : (
            <ul className="history">
              {orders.map((o) => {
                const lines = resolveLines(o.lines)
                const status = statusOf(o, now)
                return (
                  <li key={o.id}>
                    <button className="history-main" onClick={() => onOpenOrder(o)}>
                      <span className="history-top">
                        <b>№ {o.number}</b>
                        <span className={`history-status is-${status}`}>{statusText[status]}</span>
                      </span>
                      <span className="history-items">{lines.map((l) => (l.qty > 1 ? `${l.item.name} ×${l.qty}` : l.item.name)).join(', ')}</span>
                      <span className="history-meta">
                        {dateTime(o.createdAt)} · {formatPrice(o.total)}
                      </span>
                    </button>
                    {lines.length > 0 && (
                      <button className="secondary-btn small" onClick={() => onRepeat(o)}>
                        Повторить
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="block">
          <h2 className="block-title">Настройки</h2>
          <div className="settings">
            <label className="setting">
              <span className="setting-label">Имя</span>
              <input className="setting-input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
            </label>
            <div className="setting">
              <span className="setting-label">Телефон</span>
              <span className="setting-value">{profile.phone}</span>
            </div>
            <label className="setting">
              <span className="setting-label">E-mail для чеков</span>
              <input
                className={`setting-input${emailError ? ' has-error' : ''}`}
                type="email"
                inputMode="email"
                placeholder="не указан"
                value={email}
                aria-invalid={emailError}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(false)
                }}
                onBlur={saveEmail}
              />
            </label>
            {emailError && <p className="hint is-error setting-error">Проверьте e-mail</p>}
            <button className="setting" role="switch" aria-checked={profile.notifications} onClick={() => onUpdate({ notifications: !profile.notifications })}>
              <span>
                <span className="setting-label">Уведомления</span>
                <span className="setting-sub">О готовности заказа и новых акциях</span>
              </span>
              <span className="switch" aria-hidden="true" />
            </button>
            <button className="setting" role="switch" aria-checked={theme === 'dark'} onClick={onToggleTheme}>
              <span className="setting-label">Тёмная тема</span>
              <span className="switch" aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="cancel-zone">
          {confirmExit ? (
            <div className="confirm" role="alertdialog" aria-label="Выйти из профиля?">
              <p className="confirm-title">Выйти из профиля?</p>
              <p className="hint">Уровень, штампы и подарки сохранятся — вернутся, когда войдёте снова.</p>
              <div className="rate">
                <button className="danger-btn" onClick={onSignOut}>
                  Выйти
                </button>
                <button className="secondary-btn" onClick={() => setConfirmExit(false)}>
                  Остаться
                </button>
              </div>
            </div>
          ) : (
            <button className="text-btn danger" onClick={() => setConfirmExit(true)}>
              Выйти из профиля
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}
