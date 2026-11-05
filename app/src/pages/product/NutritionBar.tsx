import { useState } from 'react'
import { RollingNumber } from '../../components/RollingNumber'
import type { Nutrition } from '../../domain'
import { cx } from '../../utils/cx'
import { formatAmount } from '../../utils/format'

/**
 * 2026 Interactive Nutrition Pill Button:
 * Compact button showing total KCAL that smoothly unfolds full BJU breakdown on tap.
 * Rolling digits and animated delta badges (+40 kcal) provide tactile feedback.
 */
export function NutritionBar({ nutrition }: { nutrition: Nutrition }) {
  const [isOpen, setIsOpen] = useState(false)
  const [last, setLast] = useState(nutrition.kcal)
  const [delta, setDelta] = useState<number | null>(null)

  if (last !== nutrition.kcal) {
    setDelta(Math.round(nutrition.kcal - last))
    setLast(nutrition.kcal)
  }

  return (
    <div className="relative z-30 flex flex-col items-center">
      {/* Delta float below KCAL button so it never overlaps temperature/size buttons above */}
      {delta !== null && delta !== 0 && (
        <span
          key={delta}
          className={cx(
            'pointer-events-none absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-tight tabular-nums animate-[delta-float-down_1.1s_var(--ease-soft)_both] shadow-xs z-20',
            delta > 0 ? 'bg-accent text-white shadow-sm' : 'bg-pd-glass text-pd-ink border border-pd-line',
          )}
          aria-hidden="true"
        >
          {delta > 0 ? '+' : ''}{delta} ккал
        </span>
      )}

      {/* Main KCAL & BJU Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cx(
          'group relative flex items-center gap-1.5 h-8 rounded-full px-3.5 text-[12px] font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs box-border',
          isOpen
            ? 'bg-ink text-surface dark:bg-surface-2 dark:text-crema border border-transparent shadow-sm'
            : 'bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border border-pd-line',
        )}
        aria-expanded={isOpen}
        aria-label={`Пищевая ценность: ${Math.round(nutrition.kcal)} ккал. Нажмите, чтобы открыть БЖУ`}
      >
        <span className="text-[13px]" aria-hidden="true">⚡️</span>
        <span className="font-display font-extrabold tracking-tight tabular-nums">
          <RollingNumber text={formatAmount(Math.round(nutrition.kcal))} />
        </span>
        <span className="text-pd-muted font-normal text-[11px]">ккал</span>
        <span className="mx-0.5 text-pd-line-strong font-light">·</span>
        <span className="text-[10px] font-bold text-pd-muted tracking-wide uppercase">БЖУ</span>
        <span
          className={cx(
            'text-[9px] text-pd-muted transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
          )}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {/* Unfolded Detailed BJU Card: strictly centered on the screen */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[calc(100px+env(safe-area-inset-top))] px-4 pointer-events-none animate-[fade-only_0.2s_ease_both]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 pointer-events-auto"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Centered Modal Card */}
          <div
            className={cx(
              'relative z-10 w-full max-w-[340px] p-3.5 rounded-[22px]',
              'bg-pd-panel/98 text-pd-ink border border-pd-line shadow-lift',
              'pointer-events-auto animate-[rise_0.22s_var(--ease-soft)_both]',
            )}
            role="region"
            aria-label="Подробный состав БЖУ"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-pd-line text-[11px] font-medium text-pd-muted">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-pd-ink text-[13px]">Пищевая ценность</span>
                <span className="text-[11px] text-pd-muted">· на порцию</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-6 grid place-items-center rounded-full text-pd-muted hover:text-pd-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[12px] font-bold cursor-pointer"
                aria-label="Закрыть БЖУ"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <Cell label="энергия" value={Math.round(nutrition.kcal)} unit="ккал" />
              <Cell label="жиры" value={round1(nutrition.fat)} unit="г" />
              <Cell label="углеводы" value={round1(nutrition.carbs)} unit="г" />
              <Cell label="белки" value={round1(nutrition.protein)} unit="г" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const round1 = (v: number) => Math.round(v * 10) / 10

function Cell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <span className="text-[13.5px] xs:text-[14.5px] font-bold tracking-tight text-pd-ink tabular-nums whitespace-nowrap">
        <RollingNumber text={formatAmount(value)} />
        &nbsp;{unit}
      </span>
      <span className="text-[10px] xs:text-[11px] font-normal text-pd-muted">{label}</span>
    </div>
  )
}
