import { memo } from 'react'

import { cx } from '../utils/cx'

type Props = {
  /** If true, fills the whole viewport as an overlay (default true) */
  fullscreen?: boolean
  /** When true in fullscreen mode, initiates smooth exit fade-out */
  isExiting?: boolean
  /** Custom width for inline or fullscreen mode (default min(48vw,190px) fullscreen, 72 inline) */
  size?: number | string
  /** Optional caption text for inline mode */
  text?: string
  className?: string
}

/**
 * Signature coffee-cup animated loader featuring the shit кофе rabbit logo
 * with filling coffee animation and wink.
 */
export const Loader = memo(function Loader({
  fullscreen = true,
  isExiting = false,
  size,
  text,
  className,
}: Props) {
  if (fullscreen) {
    return (
      <div
        role="status"
        aria-label="Загружаем меню"
        className={cx(
          'fixed inset-0 z-50 grid place-items-center bg-bg text-ink isolate select-none overflow-hidden transition-all duration-350 ease-soft',
          isExiting ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100',
          className,
        )}
        style={{ background: 'var(--bg, #f7f2e9)' }}
      >
        <div className="flex flex-col items-center justify-center p-4 animate-[fade-in_0.3s_var(--ease-soft)]">
          <img
            src="/coffee-loader.svg"
            alt="Готовим кофе"
            className="h-auto select-none pointer-events-none drop-shadow-xs"
            style={{ width: size ? (typeof size === 'number' ? `${size}px` : size) : 'min(48vw, 190px)' }}
            width={190}
            height={202}
          />
          {text && (
            <p className="font-sans text-caption text-muted mt-3 font-medium tracking-normal">
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="Загрузка"
      className={cx('grid place-items-center p-6 select-none', className)}
    >
      <img
        src="/coffee-loader.svg"
        alt="Готовим кофе"
        style={{ width: size ?? 72, height: 'auto' }}
        className="select-none pointer-events-none"
      />
      {text && <span className="mt-2 text-caption text-muted font-medium">{text}</span>}
    </div>
  )
})
