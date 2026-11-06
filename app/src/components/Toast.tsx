import { useExitTransition } from '../hooks/useExitTransition'
import { useApp } from '../state/AppContext'
import { cx } from '../utils/cx'
import { Button } from './Button'

/**
 * 2026 Dynamic Island Toast:
 * Floats at the top with safe-area spacing, expands like a liquid capsule,
 * displays actions ("Вернуть" / "Отменить"), and dismisses smoothly.
 */
export function Toast() {
  const { toast: current, hideToast } = useApp()
  const { rendered: toast, leaving } = useExitTransition(current, 240)
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed top-[calc(calc(var(--space-unit)*3)+env(safe-area-inset-top))] inset-x-0 z-50 flex justify-center px-3">
      <div
        key={toast.text}
        role="status"
        aria-live="polite"
        className={cx(
          'pointer-events-auto flex items-center gap-2.5 sm:gap-3 rounded-card sm:rounded-pill',
          'max-w-(--layout-dock) bg-ink/90 dark:bg-surface/90 text-inverse-ink dark:text-ink backdrop-blur-2xl',
          'border-(length:--stroke-width) border-white/15 dark:border-white/10 px-3.5 sm:px-4 py-2 sm:py-2.5 text-compact sm:text-body font-medium shadow-lift',
          'transition-all duration-200',
          leaving
            ? 'pointer-events-none animate-[toast-island-out_0.22s_ease-in_both]'
            : 'animate-[toast-island-in_0.32s_var(--spring)_both]',
        )}
      >
        <span className="size-2 rounded-pill bg-accent flex-none animate-pulse" aria-hidden="true" />
        <span className="break-words leading-snug">{toast.text}</span>
        {toast.action && (
          <Button
            className="flex-none font-display text-compact font-bold text-accent dark:text-accent-soft hover:opacity-85 active:scale-95 transition-transform ml-1 cursor-pointer"
            onClick={() => {
              toast.action?.run()
              hideToast()
            }}
          >
            {toast.action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
