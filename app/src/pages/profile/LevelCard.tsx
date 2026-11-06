import { levels, type Loyalty } from '../../state/loyalty'
import { cx } from '../../utils/cx'
import { plural } from '../../utils/format'

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
        'mesh-grain relative overflow-hidden rounded-dialog p-5 text-white shadow-lift border-(length:--stroke-width) border-white/20 ',
        'brand-level [background:var(--background-level)]',
      )}
      data-level={level.level}
      aria-label="Уровень лояльности"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-micro font-display font-bold tracking-widest uppercase opacity-80">
            Уровень {level.level}
          </div>
          <div className="mt-0.5 font-display text-heading sm:text-heading font-black tracking-tight text-white">
            {level.name}
          </div>
        </div>
        <div className="font-display text-heading sm:text-display font-black tracking-tight text-white">
          {level.percent ? `−${level.percent}%` : '0%'}
        </div>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-pill bg-black/25 border-(length:--stroke-width) border-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span
          className="block h-full origin-left bg-gradient-to-r from-crema to-white transition-transform duration-600 ease-soft shadow-white-glow"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <p className="mt-2.5 text-compact leading-relaxed opacity-90 font-medium">
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
                'flex flex-col items-center gap-0.5 rounded-control px-1 py-2 text-micro transition-all',
                reached
                  ? 'bg-white/25 border-(length:--stroke-width) border-white/30 text-white font-bold shadow-xs'
                  : 'bg-black/15 border-(length:--stroke-width) border-white/5 opacity-55 text-white/80',
              )}
            >
              <span className="truncate max-w-13.5">{l.name}</span>
              <b className="font-display text-caption">{l.percent}%</b>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
