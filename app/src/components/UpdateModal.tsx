import { useEscape } from '../hooks/useEscape'
import { usePwaUpdate } from '../hooks/usePwaUpdate'
import { cx } from '../utils/cx'
import { Button } from './Button'
import { buttonRow, hint } from './ui'

type Props = {
  /** Optional override for needRefresh (e.g. for testing) */
  needRefresh?: boolean
  /** Optional override for isUpdating (e.g. for testing) */
  isUpdating?: boolean
  /** Optional callback for update */
  onUpdate?: () => void
  /** Optional callback for dismiss */
  onDismiss?: () => void
}

/**
 * 2026 Liquid Glass UpdateModal:
 * Displays a centered modal dialog when a new version of the PWA is available.
 * Mirrors the ConfirmBox design (blurred backdrop, rounded-panel, glass border, shadow-lift),
 * with primary action button for reload and secondary button for postponing.
 */
export function UpdateModal({
  needRefresh: controlledNeedRefresh,
  isUpdating: controlledIsUpdating,
  onUpdate: controlledOnUpdate,
  onDismiss: controlledOnDismiss,
}: Props = {}) {
  const pwaUpdate = usePwaUpdate()

  const needRefresh = controlledNeedRefresh ?? pwaUpdate.showModal
  const isUpdating = controlledIsUpdating ?? pwaUpdate.isUpdating
  const handleUpdate = controlledOnUpdate ?? pwaUpdate.updateApp
  const handleDismiss = controlledOnDismiss ?? pwaUpdate.dismissUpdate

  useEscape(handleDismiss, needRefresh && !isUpdating)

  if (!needRefresh) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpdating) {
          handleDismiss()
        }
      }}
    >
      <div className="w-full max-w-(--layout-dialog-sm)">
        <div
          className={cx(
            'relative overflow-hidden rounded-panel p-5 text-left',
            'bg-surface',
            'border-(length:--stroke-width) border-glass-border shadow-lift',
            'animate-[sheet-up_0.25s_var(--ease-soft)_both]',
          )}
          role="alertdialog"
          aria-label="Доступно обновление"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="size-2 rounded-pill bg-open shadow-open-glow animate-pulse" aria-hidden="true" />
            <p className="font-display text-body-lg font-bold text-ink">Доступно обновление</p>
          </div>

          <p className={cx(hint(), 'mt-1 text-compact text-muted leading-relaxed')}>
            Вышла новая версия shit кофе. Обновите приложение, чтобы загрузить актуальное меню и свежие улучшения.
          </p>

          <div className={cx(buttonRow, 'mt-4')}>
            <Button
              variant="primary"
              size="md"
              disabled={isUpdating}
              onClick={() => void handleUpdate()}
            >
              {isUpdating ? 'Обновляем…' : 'Обновить'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={isUpdating}
              onClick={handleDismiss}
            >
              Позже
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
