import { levels, type Loyalty } from '../../state/loyalty'
import { cx } from '../../utils/cx'
import { plural } from '../../utils/format'

// Each level gets its own card colour: roast-brown, green, copper, espresso.
const levelBg: Record<number, string> = {
  1: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#6f5a48,#3b2f26)]',
  2: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#5f8f63,#2f5d50)]',
  3: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.22),transparent_55%),linear-gradient(135deg,#b0703a,#6b3a1f)]',
  4: '[background:radial-gradient(120%_120%_at_100%_0%,rgba(255,255,255,0.25),transparent_55%),linear-gradient(135deg,#3a2a20,#120d0a)]',
}

export function LevelCard({ loyalty }: { loyalty: Loyalty }) {
  const { level, next } = loyalty
  const toNext = next ? next.minOrders - loyalty.completed : 0
  const progress = next ? (loyalty.completed - level.minOrders) / (next.minOrders - level.minOrders) : 1

  return (
    <section className={cx('rounded-[26px] p-[18px] text-white shadow-lift', levelBg[level.level])} aria-label="Уровень лояльности">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-bold tracking-[0.06em] uppercase opacity-75">Уровень {level.level}</div>
          <div className="mt-0.5 text-[30px] font-extrabold tracking-[-0.04em]">{level.name}</div>
        </div>
        <div className="text-[30px] font-extrabold tracking-[-0.04em]">{level.percent ? `−${level.percent}%` : '0%'}</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-[4px] bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <span className="block h-full origin-left bg-white transition-transform duration-600 ease-soft" style={{ transform: `scaleX(${progress})` }} />
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
            className={cx('flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-[11px]', l.level <= level.level ? 'bg-white/20' : 'bg-white/8 opacity-60')}
          >
            <span>{l.name}</span>
            <b className="text-[13px]">{l.percent}%</b>
          </li>
        ))}
      </ol>
    </section>
  )
}
