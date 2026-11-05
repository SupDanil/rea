import { Toast } from '../components/Toast'
import { MenuDock } from '../pages/menu/MenuDock'
import { MenuPage } from '../pages/menu/MenuPage'
import { AnimatedOutlet } from './AnimatedOutlet'

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
