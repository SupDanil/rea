import { levels, type Loyalty } from '../../state/loyalty'
import { cx } from '../../utils/cx'
import { plural } from '../../utils/format'

// 2026 Warm Espresso Glass Level Cards: warm roast gradients with mesh light
const levelBg: Record<number, string> = {
  1: '[background:radial-gradient(120%_120%_at_90%_10%,rgba(255,255,255,0.25),transparent_60%),linear-gradient(135deg,#B85F38,#7D3A18)]',
  2: '[background:radial-gradient(120%_120%_at_90%_10%,rgba(255,255,255,0.25),transparent_60%),linear-gradient(135deg,#C45B24,#8E3810)]',
  3: '[background:radial-gradient(120%_120%_at_90%_10%,rgba(255,255,255,0.3),transparent_60%),linear-gradient(135deg,#D96E32,#9C3D0C)]',
  4: '[background:radial-gradient(120%_120%_at_90%_10%,rgba(217,149,76,0.35),transparent_60%),linear-gradient(135deg,#341E14,#120906)]',
}

/**
 * 2026 Liquid Glass LevelCard:
 * Frosted level card with mesh lighting, Unbounded typography, and glossy progress bar.
 */
export function LevelCard({ loyalty }: { loyalty: Loyalty }) {
  const { level, next } = loyalty
  const toNext = next ? next.minOrders - loyalty.completed : 0
  const progress = next ? (loyalty.completed - level.minOrders) / (next.minOrders - level.minOrders) : 1

  return (
    <section
      className={cx(
        'mesh-grain relative overflow-hidden rounded-[28px] p-5 text-white shadow-lift border border-white/20 ',
        levelBg[level.level],
      )}
      aria-label="Уровень лояльности"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-display font-bold tracking-widest uppercase opacity-80">
            Уровень {level.level}
          </div>
          <div className="mt-0.5 font-display text-[26px] sm:text-[28px] font-black tracking-tight text-white">
            {level.name}
          </div>
        </div>
        <div className="font-display text-[28px] sm:text-[30px] font-black tracking-tight text-white">
          {level.percent ? `−${level.percent}%` : '0%'}
        </div>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/25  border border-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span
          className="block h-full origin-left bg-gradient-to-r from-crema to-white transition-transform duration-600 ease-soft shadow-[0_0_10px_rgba(255,255,255,0.6)]"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed opacity-90 font-medium">
        {next
          ? `Ещё ${toNext} ${plural(toNext, 'заказ', 'заказа', 'заказов')} до «${next.name}» — скидка ${next.percent}% на всё`
          : 'Максимальный уровень — скидка на все заказы'}
      </p>

      <ol className="mt-4 grid grid-cols-4 gap-1.5">
        {levels.map((l) => {
          const reached = l.level <= level.level
          return (
            <li
              key={l.level}
              className={cx(
                'flex flex-col items-center gap-0.5 rounded-[14px] px-1 py-2 text-[11px] transition-all',
                reached
                  ? 'bg-white/25 border border-white/30 text-white font-bold shadow-xs'
                  : 'bg-black/15 border border-white/5 opacity-55 text-white/80',
              )}
            >
              <span className="truncate max-w-[54px]">{l.name}</span>
              <b className="font-display text-[12px]">{l.percent}%</b>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
