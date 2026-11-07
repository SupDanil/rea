import { Button, IconButton } from '../../components/Button'
import { CloseIcon, RabbitIcon } from '../../components/icons'
import { usePwaInstall } from '../../hooks/usePwaInstall'

type Props = {
  onOpenGuide: () => void
}

export function InstallBanner({ onOpenGuide }: Props) {
  const { canInstall, isBannerDismissed, promptInstall, dismissBanner } = usePwaInstall()

  if (!canInstall || isBannerDismissed) return null

  const handleInstall = async () => {
    const outcome = await promptInstall()
    if (outcome === 'guide') {
      onOpenGuide()
    }
  }

  return (
    <div
      role="region"
      aria-label="Предложение установить приложение"
      className="mx-2.5 sm:mx-3 my-2 flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-card bg-surface border-(length:--stroke-width) border-line shadow-card animate-fade-in"
    >
      <div className="grid size-9 sm:size-10 place-items-center rounded-pill bg-ink text-surface dark:bg-surface-2 dark:text-crema shadow-xs flex-none">
        <RabbitIcon size={22} className="size-5.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-display text-caption sm:text-body font-bold text-ink tracking-tight truncate">
          Установите shit кофе
        </div>
        <div className="text-micro sm:text-caption text-muted truncate">
          Быстрый заказ и статус кофе с экрана смартфона
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="primary" size="sm" onClick={() => void handleInstall()}>
          Установить
        </Button>
        <IconButton size="sm" variant="ghost" onClick={dismissBanner} aria-label="Скрыть предложение об установке">
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  )
}
