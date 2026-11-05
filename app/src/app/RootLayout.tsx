import { AnimatedOutlet } from './AnimatedOutlet'
import { Toast } from '../components/Toast'
import { MenuDock } from '../pages/menu/MenuDock'
import { MenuPage } from '../pages/menu/MenuPage'

/** The menu always stays underneath; every other route renders over it. */
export function RootLayout() {
  return (
    <>
      <MenuPage />
      <MenuDock />
      <AnimatedOutlet />
      <Toast />
    </>
  )
}
