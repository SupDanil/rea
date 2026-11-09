import { useState } from 'react'

import { checkIsIos } from '../hooks/usePwaInstall'
import { Button } from './Button'
import { AddToHomeIcon, CheckIcon, MoreVerticalIcon, RabbitIcon, ShareIcon } from './icons'
import { SegmentedControl } from './SegmentedControl'
import { Sheet, SheetBody, SheetDock } from './Sheet'
import { Surface } from './Surface'

type Platform = 'ios' | 'android'

type Props = {
  onClose: () => void
}

export function InstallGuideSheet({ onClose }: Props) {
  const [platform, setPlatform] = useState<Platform>(() => (checkIsIos() ? 'ios' : 'android'))

  return (
    <Sheet label="Как установить приложение shit кофе" title="Установка приложения" onBack={onClose}>
      <SheetBody className="space-y-4">
        {/* App Hero Badge */}
        <Surface className="flex items-center gap-3.5 p-4">
          <div className="grid size-12 place-items-center rounded-pill bg-ink text-surface dark:bg-surface-2 dark:text-crema shadow-xs flex-none">
            <RabbitIcon size={28} className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-body-lg font-bold text-ink tracking-tight">shit кофе</h2>
            <p className="mt-0.5 text-caption text-muted leading-tight">
              Быстрый заказ, статус приготовления и бонусы на главном экране
            </p>
          </div>
        </Surface>

        {/* Platform Switcher */}
        <div className="pt-1">
          <SegmentedControl<Platform>
            label="Выберите операционную систему"
            value={platform}
            onChange={setPlatform}
            stretch
            options={[
              { value: 'ios', label: 'iOS (iPhone / iPad)' },
              { value: 'android', label: 'Android' },
            ]}
          />
        </div>

        {/* Step-by-step instructions */}
        {platform === 'ios' ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5">
                <ShareIcon className="size-4.5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-accent uppercase">Шаг 1</span>
                  <span className="font-semibold text-body text-ink">Нажмите «Поделиться»</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  В нижней панели браузера Safari нажмите значок «Поделиться» (квадрат со стрелкой вверх).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5">
                <AddToHomeIcon className="size-4.5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-accent uppercase">Шаг 2</span>
                  <span className="font-semibold text-body text-ink">«На экран „Домой“»</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  Прокрутите список действий вниз и выберите пункт «На экран „Домой“».
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5">
                <CheckIcon className="size-4.5 text-open" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-open uppercase">Шаг 3</span>
                  <span className="font-semibold text-body text-ink">Нажмите «Добавить»</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  В правом верхнем углу нажмите «Добавить». Иконка «shit кофе» появится на рабочем столе.
                </p>
              </div>
            </div>

            <div className="rounded-card bg-surface-2 p-3.5 border-(length:--stroke-width) border-line text-caption text-muted leading-normal">
              <strong className="block text-ink font-semibold mb-1">🔔 Уведомления на iOS (iOS 16.4+)</strong>
              Apple поддерживает push-уведомления в Safari только после добавления приложения на экран «Домой».
              {' '}Запускайте приложение с иконки на рабочем столе, чтобы получать оповещения о готовности кофе!
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5 font-display font-bold text-caption text-accent">
                1
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-accent uppercase">Шаг 1</span>
                  <span className="font-semibold text-body text-ink">Окно установки</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  Если внизу экрана появилось системное окно «Установить shit кофе», нажмите кнопку «Установить».
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5">
                <MoreVerticalIcon className="size-4.5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-accent uppercase">Шаг 2</span>
                  <span className="font-semibold text-body text-ink">Или меню Chrome (⋮)</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  Нажмите на три точки в правом верхнем углу браузера (Chrome, Яндекс Браузер или Samsung Internet).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-card bg-surface p-3.5 border-(length:--stroke-width) border-line">
              <div className="grid size-8 place-items-center rounded-pill bg-surface-2 text-ink flex-none mt-0.5">
                <CheckIcon className="size-4.5 text-open" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-micro font-bold tracking-widest text-open uppercase">Шаг 3</span>
                  <span className="font-semibold text-body text-ink">«Установить приложение»</span>
                </div>
                <p className="mt-1 text-caption text-muted leading-normal">
                  В списке выберите пункт «Установить приложение» (или «Добавить на главный экран»).
                </p>
              </div>
            </div>

            <div className="rounded-card bg-surface-2 p-3.5 border-(length:--stroke-width) border-line text-caption text-muted leading-normal">
              <strong className="block text-ink font-semibold mb-1">🔔 Уведомления на Android</strong>
              Вы сможете получать мгновенные пуши о статусе приготовления кофе прямо в шторку уведомлений смартфона.
            </div>
          </div>
        )}
      </SheetBody>

      <SheetDock>
        <Button variant="primary" fullWidth size="lg" onClick={onClose}>
          Понятно
        </Button>
      </SheetDock>
    </Sheet>
  )
}
