import { Outlet, useLocation } from 'react-router'
import { Toast } from '../components/Toast'
import { MenuDock } from '../pages/menu/MenuDock'
import { MenuPage } from '../pages/menu/MenuPage'

const isMenuPath = (pathname: string) => pathname === '/' || pathname === '/menu'

/** The menu always stays underneath; every other route renders over it. */
export function RootLayout() {
  const { pathname } = useLocation()
  const onMenu = isMenuPath(pathname)

  // No scroll lock on <html>/<body>: toggling overflow there makes Android
  // Chrome show/hide its URL bar and the sticky category bar jumps 56px.
  // Screens over the menu contain their own scrolling instead (overscroll-contain).

  return (
    <>
      <MenuPage />
      {onMenu && <MenuDock />}
      <Outlet />
      <Toast />
    </>
  )
}
