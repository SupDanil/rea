import { useRef, useState } from 'react'
import { hint } from '../../components/ui'
import { GIFT_DRINK_LIMIT, STAMP_MIN_TOTAL, STAMPS_PER_GIFT, type Loyalty } from '../../state/loyalty'
import { cx } from '../../utils/cx'
import { formatPrice, plural } from '../../utils/format'
import { prefersReducedMotion } from '../../utils/motion'

/** Coffee bean stamp SVG imprint */
function BeanStamp({ stamped }: { stamped: boolean }) {
  if (!stamped) {
    return (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-faint">
        <ellipse cx="14" cy="14" rx="10" ry="8" transform="rotate(-30 14 14)" />
        <path d="M8 12c3 2 9 2 12 4" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 28 28" width="24" height="24" fill="currentColor" className="text-accent animate-[stamp-press_0.35s_var(--spring)] drop-shadow-xs">
      <ellipse cx="14" cy="14" rx="10" ry="8" transform="rotate(-30 14 14)" />
      <path d="M8 12c3 2 9 2 12 4" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/**
 * 2026 Physical StampCard:
 * Tactile loyalty card with coffee bean stamp imprints, stamp animation,
 * and gentle 3D parallax tilt (disabled if reduced motion).
 */
export function StampCard({ loyalty }: { loyalty: Loyalty }) {
  const cardRef = useRef<HTMLElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handlePointerMove = (e: React.PointerEvent) => {
    if (prefersReducedMotion() || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -py * 8, y: px * 8 })
  }

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <section
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      className={cx(
        'mt-3 rounded-[26px] p-5 bg-surface/90 border border-line shadow-lift backdrop-blur-xl',
        'will-change-transform',
      )}
      aria-label="Штампы"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[17px] font-bold text-ink">Штампы</h2>
        <span className="font-display text-[13px] font-semibold text-muted">
          {loyalty.stamps} из {STAMPS_PER_GIFT}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-6 gap-2">
        {Array.from({ length: STAMPS_PER_GIFT }, (_, i) => {
          const isGift = i === STAMPS_PER_GIFT - 1
          const isStamped = i < loyalty.stamps
          return (
            <span
              key={i}
              className={cx(
                'grid aspect-square place-items-center rounded-full text-[17px] transition-all',
                isGift
                  ? 'border-2 border-accent bg-accent/10 shadow-xs'
                  : isStamped
                    ? 'bg-accent/15 border border-accent/30 shadow-xs'
                    : 'border-2 border-dashed border-faint/60 bg-surface-2/40',
              )}
              aria-hidden="true"
            >
              {isGift ? '🎁' : <BeanStamp stamped={isStamped} />}
            </span>
          )
        })}
      </div>

      <p className={hint()}>
        Заказ от {formatPrice(STAMP_MIN_TOTAL)} — штамп. {STAMPS_PER_GIFT} штампов — напиток в подарок (до {formatPrice(GIFT_DRINK_LIMIT)}).
      </p>

      {loyalty.giftsAvailable > 0 && (
        <div className="mt-3.5 flex items-center gap-3 rounded-[18px] bg-accent/10 border border-accent/25 p-3.5 text-[13px] leading-relaxed text-ink">
          <span className="text-[26px] flex-none" aria-hidden="true">
            🎁
          </span>
          <div>
            <b className="font-display font-bold text-[14px] text-ink block">
              {loyalty.giftsAvailable} {plural(loyalty.giftsAvailable, 'напиток', 'напитка', 'напитков')} в подарок
            </b>
            <div className="text-muted text-[12px] mt-0.5">Применится в корзине, если в заказе есть напиток</div>
          </div>
        </div>
      )}
    </section>
  )
}
