import { useState } from 'react'

import { ConfirmBox } from '../../components/ConfirmBox'
import { Sheet, SheetBody } from '../../components/Sheet'
import { avatar, textBtn } from '../../components/ui'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useApp } from '../../state/AppContext'
import type { Profile } from '../../state/loyalty'
import type { Order } from '../../state/orders'
import { LoginPage } from '../login/LoginPage'
import { LevelCard } from './LevelCard'
import { OrderHistory } from './OrderHistory'
import { ProfileSettings } from './ProfileSettings'
import { StampCard } from './StampCard'

/** Signed out, the profile route asks to sign in and then turns into the profile. */
export function ProfilePage() {
  const { profile, isAuthLoading } = useApp()
  if (isAuthLoading) {
    return <ProfileLoadingSkeleton />
  }
  return profile ? <ProfileView profile={profile} /> : <LoginPage />
}

function ProfileLoadingSkeleton() {
  const { back } = useAppNavigate()
  return (
    <Sheet label="Профиль" title="Профиль" onBack={back} backLabel="В меню">
      <SheetBody>
        <div className="space-y-4 pt-1" role="status" aria-label="Загружаем профиль">
          <div className="flex items-center gap-3.5 px-1 pt-1 pb-4 animate-pulse">
            <div className="size-12 rounded-full bg-surface-2" />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded-lg bg-surface-2" />
              <div className="h-4 w-24 rounded bg-surface-2" />
            </div>
          </div>
          <div className="h-36 rounded-[22px] bg-surface-2 animate-pulse" />
          <div className="h-28 rounded-[22px] bg-surface-2 animate-pulse" />
        </div>
      </SheetBody>
    </Sheet>
  )
}

function ProfileView({ profile }: { profile: Profile }) {
  const { cart, loyalty, myOrders, theme, toggleTheme, updateProfile, signOut, showToast } = useApp()
  const { go, back } = useAppNavigate()
  const [confirmExit, setConfirmExit] = useState(false)

  const saveProfile = (patch: Partial<Profile>) => {
    updateProfile(patch).catch(() => showToast({ text: 'Не удалось сохранить — попробуйте ещё раз' }))
  }

  const repeat = (order: Order) => {
    order.lines.forEach((l) => cart.add(l.itemId, l.variantId, l.ingredientIds, l.qty))
    showToast({ text: `Заказ № ${order.number} в корзине` })
    go('/cart')
  }

  return (
    <Sheet label="Профиль" title="Профиль" onBack={back} backLabel="В меню">
      <SheetBody>
        <div className="flex items-center gap-3.5 px-1 pt-1 pb-4">
          <span className={avatar()} aria-hidden="true">
            {profile.name.trim().slice(0, 1).toUpperCase() || '☕'}
          </span>
          <div>
            <div className="text-[22px] font-extrabold tracking-[-0.03em]">{profile.name}</div>
            <div className="mt-0.5 text-[14px] text-muted">{profile.phone}</div>
          </div>
        </div>

        <LevelCard loyalty={loyalty} />
        <StampCard loyalty={loyalty} />
        <OrderHistory orders={myOrders} onOpen={(o) => go(`/order/${o.id}`)} onRepeat={repeat} />
        <ProfileSettings profile={profile} theme={theme} onToggleTheme={toggleTheme} onUpdate={saveProfile} />

        <div className="mt-[22px] text-center">
          <button className={textBtn(true)} onClick={() => setConfirmExit(true)}>
            Выйти из профиля
          </button>
        </div>

        {confirmExit && (
          <ConfirmBox
            modal
            title="Выйти из профиля?"
            text="Уровень, штампы и подарки сохранятся — вернутся, когда войдёте снова."
            confirmLabel="Выйти"
            cancelLabel="Остаться"
            onConfirm={() => {
              void signOut()
              showToast({ text: 'Вы вышли из профиля' })
              back()
            }}
            onCancel={() => setConfirmExit(false)}
          />
        )}
      </SheetBody>
    </Sheet>
  )
}
