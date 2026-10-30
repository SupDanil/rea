import { createHashRouter, Navigate } from 'react-router'
import { CartPage } from '../pages/cart/CartPage'
import { LoginPage } from '../pages/login/LoginPage'
import { OrderPage } from '../pages/order/OrderPage'
import { ProductPage } from '../pages/product/ProductPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { RootLayout } from './RootLayout'

// Hash routing keeps deep links working on GitHub Pages without a server fallback;
// the paths mirror Drinkit's app links (/menu, /product/<id>, /orderHistory → /order/<id>).
export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: null },
      { path: 'menu', element: null },
      { path: 'product/:id', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'order/:id', element: <OrderPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
