import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Toast } from '../components/Toast'
import { MenuDock } from '../pages/menu/MenuDock'
import { MenuPage } from '../pages/menu/MenuPage'

const isMenuPath = (pathname: string) => pathname === '/' || pathname === '/menu'

/** The menu always stays underneath; every other route renders over it. */
export function RootLayout() {
  const { pathname } = useLocation()
  const onMenu = isMenuPath(pathname)

  // Freeze the menu's scroll while a screen covers it.
  useEffect(() => {
    document.body.style.overflow = onMenu ? '' : 'hidden'
  }, [onMenu])

  return (
    <>
      <MenuPage />
      {onMenu && <MenuDock />}
      <Outlet />
      <Toast />
    </>
  )
}
