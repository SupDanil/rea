import { useState } from 'react'

import { Button } from '../../components/Button'
import { BellIcon, CloseIcon, InstallIcon } from '../../components/icons'
import { InstallGuideSheet } from '../../components/InstallGuideSheet'
import { Presence } from '../../components/Presence'
import { Surface } from '../../components/Surface'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useApp } from '../../state/AppContext'
import type { OrderStatus } from '../../state/orders'

type Props = {
  orderId: string
  status: OrderStatus
}

export function OrderNotificationPrompt({ orderId, status }: Props) {
  const { profile, updateProfile, showToast } = useApp()
  const { isSupported, permission, subscribe } = usePushNotifications()
  const { isStandalone, isMobile } = usePwaInstall()
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`hide-order-prompt-${orderId}`) === '1'
    } catch {
      return false
    }
  })
  const [showGuide, setShowGuide] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)

  // Don't show if dismissed or order finished
  if (dismissed || status === 'completed' || status === 'cancelled') {
    return null
  }

  // If notifications are already active, nothing to prompt
  const isNotificationsActive = Boolean(isSupported && permission === 'granted' && profile?.notifications)
  if (isNotificationsActive) {
    return null
  }

  // If user explicitly denied browser permission, don't nag with an action button that would fail
  if (permission === 'denied') {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(`hide-order-prompt-${orderId}`, '1')
    } catch {}
  }

  const handleEnable = async () => {
    setIsSubscribing(true)
    try {
      const ok = await subscribe(profile?.phone)
      if (ok) {
        if (updateProfile) {
          await updateProfile({ notifications: true }).catch(() => {})
        }
        showToast({ text: 'Уведомления включены! Сообщим о готовности кофе ☕️' })
      } else {
        // User declined permission — ensure profile notifications stays false
        if (updateProfile) {
          await updateProfile({ notifications: false }).catch(() => {})
        }
        handleDismiss()
      }
    } finally {
      setIsSubscribing(false)
    }
  }

  // iOS Safari case: PWA not installed to Home Screen yet
  if (!isSupported && isMobile && !isStandalone) {
    return (
      <>
        <Surface className="relative flex items-center justify-between gap-3 rounded-media p-3.5 ring-(length:--stroke-width) ring-line">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 flex-none items-center justify-center rounded-control bg-accent/15 text-accent">
              <InstallIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-control font-semibold leading-(--leading-title) truncate">
                Уведомления о заказе
              </div>
              <div className="mt-0.5 text-caption text-muted leading-(--leading-copy)">
                Добавьте на экран «Домой», чтобы получать пуши на iPhone
              </div>
            </div>
          </div>
          <div className="flex flex-none items-center gap-1.5">
            <Button variant="secondary" size="sm" onClick={() => setShowGuide(true)}>
              Установить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Закрыть подсказку"
              className="size-8 p-0 text-muted hover:text-foreground"
              onClick={handleDismiss}
            >
              <CloseIcon />
            </Button>
          </div>
        </Surface>
        <Presence>{showGuide && <InstallGuideSheet onClose={() => setShowGuide(false)} />}</Presence>
      </>
    )
  }

  // Device supports push notifications
  if (isSupported) {
    let title = 'Включите уведомления'
    if (status === 'making') {
      title = 'Бариста уже варит ваш кофе ☕️'
    } else if (status === 'ready') {
      title = 'Заказ ждёт у стойки!'
    }

    return (
      <Surface className="relative flex items-center justify-between gap-3 rounded-media p-3.5 ring-(length:--stroke-width) ring-line">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 flex-none items-center justify-center rounded-control bg-accent/15 text-accent">
            <BellIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-control font-semibold leading-(--leading-title) truncate">
              {title}
            </div>
            <div className="mt-0.5 text-caption text-muted leading-(--leading-copy)">
              Пришлём пуш на телефон, когда кофе будет готов
            </div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            disabled={isSubscribing}
            onClick={() => void handleEnable()}
          >
            {isSubscribing ? '…' : 'Включить'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Закрыть подсказку"
            className="size-8 p-0 text-muted hover:text-foreground"
            onClick={handleDismiss}
          >
            <CloseIcon />
          </Button>
        </div>
      </Surface>
    )
  }

  return null
}
