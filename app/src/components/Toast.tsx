import { useExitTransition } from '../hooks/useExitTransition'
import { useApp } from '../state/AppContext'
import { cx } from '../utils/cx'

export function Toast() {
  const { toast: current, hideToast } = useApp()
  // Slides away instead of vanishing; a new toast replaces the old one with a fresh entrance.
  const { rendered: toast, leaving } = useExitTransition(current, 200)
  if (!toast) return null
  return (
    <div
      key={toast.text}
      className={cx(
        "fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100%-32px)] items-center gap-3.5 overflow-hidden rounded-full bg-inverse px-[18px] py-3 text-[14px] font-semibold whitespace-nowrap text-inverse-ink shadow-lift [transform:translateX(-50%)]",
        leaving ? 'pointer-events-none animate-[toast-out_0.2s_ease-in_both]' : 'animate-toast-in',
      )}
      role="status"
    >
      <span className="overflow-hidden text-ellipsis">{toast.text}</span>
      {toast.action && (
        <button
          className="flex-none font-extrabold text-[#8fd1bb] dark:text-accent"
          onClick={() => {
            toast.action?.run()
            hideToast()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
