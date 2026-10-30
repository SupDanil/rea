import { useEffect, useState } from 'react'
import { formatPrice } from '../data/menu'
import { GIFT_DRINK_LIMIT, levels, STAMP_MIN_TOTAL, STAMPS_PER_GIFT, type Loyalty, type Profile } from '../loyalty'
import { resolveLines, statusOf, useNow, type Order } from '../store'
import type { Theme } from '../theme'
import {
  avatar,
  block,
  blockTitle,
  btn,
  buttonRow,
  confirmBox,
  confirmTitle,
  cx,
  hint,
  iconBtn,
  panel,
  sheet,
  sheetBody,
  sheetHead,
  sheetTitle,
  textBtn,
  toggle,
} from '../ui'

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
// Each level gets its own card colour: roast-brown, green, copper, espresso.
const levelBg: Record<number, string> = {
  1: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#6f5a48,#3b2f26)]',
  2: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#5f8f63,#2f5d50)]',
  3: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#b0703a,#6b3a1f)]',
  4: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.25),transparent_55%),linear-gradient(135deg,#3a2a20,#120d0a)]',
}
const statusColor = {
  paying: 'text-[#b8862c]',
  accepted: 'text-[#b8862c]',
  making: 'text-[#b8862c]',
  ready: 'text-[#3f9a64]',
  cancelled: 'text-danger',
} as const
const stampClass = (on: boolean, gift: boolean) =>
  cx(
    'grid aspect-square place-items-center rounded-full text-[18px] text-ink',
    gift ? 'border-2 border-solid border-accent-soft' : !on && 'border-2 border-dashed border-faint',
    on && 'bg-[color-mix(in_oklab,var(--accent)_22%,var(--surface))] animate-[pop_0.35s_var(--ease-soft)]',
  )
const setting = 'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 text-left'
const settingLabel = 'block flex-none text-[15px] font-semibold'
const settingInput = (error: boolean) =>
  cx(
    'min-w-0 flex-1 bg-transparent py-1.5 text-right text-[15px] placeholder:text-faint focus:outline-none',
    error ? 'text-error' : 'text-ink focus:text-accent-soft',
  )

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
    <div className={sheet} role="dialog" aria-modal="true" aria-label="Профиль">
      <header className={sheetHead}>
        <button className={iconBtn('left')} onClick={onClose} aria-label="В меню">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={sheetTitle}>Профиль</h1>
      </header>

      <div className={sheetBody}>
        <div className="flex items-center gap-3.5 px-1 pt-1 pb-4">
          <span className={avatar()} aria-hidden="true">{initials}</span>
          <div>
            <div className="text-[22px] font-extrabold tracking-[-0.03em]">{profile.name}</div>
            <div className="mt-0.5 text-[14px] text-muted">{profile.phone}</div>
          </div>
        </div>

        <section className={cx('rounded-[26px] p-[18px] text-white shadow-lift', levelBg[level.level])} aria-label="Уровень лояльности">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12px] font-bold tracking-[0.06em] uppercase opacity-75">Уровень {level.level}</div>
              <div className="mt-0.5 text-[30px] font-extrabold tracking-[-0.04em]">{level.name}</div>
            </div>
            <div className="text-[30px] font-extrabold tracking-[-0.04em]">{level.percent ? `−${level.percent}%` : '0%'}</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-[4px] bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelProgress * 100)}>
            <span className="block h-full origin-left bg-white transition-transform duration-600 ease-soft" style={{ transform: `scaleX(${levelProgress})` }} />
          </div>
          <p className="mt-2.5 text-[13px] leading-[1.4] opacity-90">
            {next
              ? `Ещё ${toNext} ${plural(toNext, 'заказ', 'заказа', 'заказов')} до «${next.name}» — скидка ${next.percent}% на всё`
              : 'Максимальный уровень — скидка на все заказы'}
          </p>
          <ol className="mt-3.5 grid grid-cols-4 gap-1">
            {levels.map((l) => (
              <li
                key={l.level}
                className={cx(
                  'flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-[11px]',
                  l.level <= level.level ? 'bg-white/20' : 'bg-white/8 opacity-60',
                )}
              >
                <span>{l.name}</span>
                <b className="text-[13px]">{l.percent}%</b>
              </li>
            ))}
          </ol>
        </section>

        <section className={cx('mt-3 rounded-[24px] p-4', panel)} aria-label="Штампы">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px]">Штампы</h2>
            <span className="text-[13px] text-muted">
              {loyalty.stamps} из {STAMPS_PER_GIFT}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {Array.from({ length: STAMPS_PER_GIFT }, (_, i) => (
              <span key={i} className={stampClass(i < loyalty.stamps, i === STAMPS_PER_GIFT - 1)} aria-hidden="true">
                {i === STAMPS_PER_GIFT - 1 ? '🎁' : i < loyalty.stamps ? '☕' : ''}
              </span>
            ))}
          </div>
          <p className={hint()}>
            Заказ от {formatPrice(STAMP_MIN_TOTAL)} — штамп. {STAMPS_PER_GIFT} штампов — напиток в подарок (до {formatPrice(GIFT_DRINK_LIMIT)}).
          </p>
          {loyalty.giftsAvailable > 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface))] px-3.5 py-3 text-[13px] leading-[1.35]">
              <span className="text-[26px]" aria-hidden="true">🎁</span>
              <div>
                <b className="text-[14px]">
                  {loyalty.giftsAvailable} {plural(loyalty.giftsAvailable, 'напиток', 'напитка', 'напитков')} в подарок
                </b>
                <div>Применится в корзине, если в заказе есть напиток</div>
              </div>
            </div>
          )}
        </section>

        <section className={block}>
          <h2 className={blockTitle}>История заказов</h2>
          {orders.length === 0 ? (
            <p className={hint()}>Здесь появятся ваши заказы</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((o) => {
                const lines = resolveLines(o.lines)
                const status = statusOf(o, now)
                return (
                  <li key={o.id} className={cx('flex items-center gap-2.5 rounded-[20px] py-3 pr-3 pl-4', panel)}>
                    <button className="flex min-w-0 flex-1 flex-col gap-[3px] text-left" onClick={() => onOpenOrder(o)}>
                      <span className="flex items-center gap-2 text-[15px]">
                        <b>№ {o.number}</b>
                        <span className={cx('rounded-full bg-surface-2 px-2 py-[3px] text-[11px] font-bold', statusColor[status])}>{statusText[status]}</span>
                      </span>
                      <span className="truncate text-[13px] text-ink-2">{lines.map((l) => (l.qty > 1 ? `${l.item.name} ×${l.qty}` : l.item.name)).join(', ')}</span>
                      <span className="text-[12px] text-muted">
                        {dateTime(o.createdAt)} · {formatPrice(o.total)}
                      </span>
                    </button>
                    {lines.length > 0 && (
                      <button className={btn('secondary', 'sm')} onClick={() => onRepeat(o)}>
                        Повторить
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className={block}>
          <h2 className={blockTitle}>Настройки</h2>
          <div className={cx('divide-y divide-line overflow-hidden rounded-[20px]', panel)}>
            <label className={setting}>
              <span className={settingLabel}>Имя</span>
              <input className={settingInput(false)} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onBlur={saveName} />
            </label>
            <div className={setting}>
              <span className={settingLabel}>Телефон</span>
              <span className="text-[15px] text-muted">{profile.phone}</span>
            </div>
            <div>
            <label className={setting}>
              <span className={settingLabel}>E-mail для чеков</span>
              <input
                className={settingInput(emailError)}
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
            {emailError && <p className="mx-4 -mt-1.5 mb-2 text-right text-[12px] leading-[1.4] text-error">Проверьте e-mail</p>}
            </div>
            <button className={cx(setting, 'group')} role="switch" aria-checked={profile.notifications} onClick={() => onUpdate({ notifications: !profile.notifications })}>
              <span>
                <span className={settingLabel}>Уведомления</span>
                <span className="mt-0.5 block text-[12px] text-muted">О готовности заказа и новых акциях</span>
              </span>
              <span className={toggle} aria-hidden="true" />
            </button>
            <button className={cx(setting, 'group')} role="switch" aria-checked={theme === 'dark'} onClick={onToggleTheme}>
              <span className={settingLabel}>Тёмная тема</span>
              <span className={toggle} aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="mt-[22px] text-center">
          {confirmExit ? (
            <div className={confirmBox} role="alertdialog" aria-label="Выйти из профиля?">
              <p className={confirmTitle}>Выйти из профиля?</p>
              <p className={hint()}>Уровень, штампы и подарки сохранятся — вернутся, когда войдёте снова.</p>
              <div className={cx(buttonRow, 'mt-3.5')}>
                <button className={btn('danger')} onClick={onSignOut}>
                  Выйти
                </button>
                <button className={btn('secondary')} onClick={() => setConfirmExit(false)}>
                  Остаться
                </button>
              </div>
            </div>
          ) : (
            <button className={textBtn(true)} onClick={() => setConfirmExit(true)}>
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
