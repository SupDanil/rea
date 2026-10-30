import { useCallback, useEffect, useRef, useState } from 'react'
import { CartScreen, type CartLoyalty, type Checkout } from './components/CartScreen'
import { LoginScreen } from './components/LoginScreen'
import { MenuDock } from './components/MenuDock'
import { MenuScreen } from './components/MenuScreen'
import { OrderScreen } from './components/OrderScreen'
import { ProductScreen, type AddRequest } from './components/ProductScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { formatPrice, itemById, type MenuItem } from './data/menu'
import { giftValue, loyaltyOf, useProfile } from './loyalty'
import { countOf, isActive, readyTimeFor, subtotalOf, useCart, useNow, useOrders, type CartLine } from './store'
import { useTheme } from './theme'
import { btn, sheet } from './ui'

// Hash routes mirror the original's deep links: #/menu, #/product/<id>, #/cart, #/order/<id>, #/profile, #/login.
type Route =
  | { name: 'menu' }
  | { name: 'product'; id: string }
  | { name: 'cart' }
  | { name: 'order'; id: string }
  | { name: 'profile' }
  | { name: 'login' }

const parseRoute = (): Route => {
  const hash = window.location.hash
  const product = hash.match(/^#\/product\/([\w-]+)/)
  if (product) return { name: 'product', id: product[1] }
  const order = hash.match(/^#\/order\/([\w-]+)/)
  if (order) return { name: 'order', id: order[1] }
  if (hash.startsWith('#/cart')) return { name: 'cart' }
  if (hash.startsWith('#/profile')) return { name: 'profile' }
  if (hash.startsWith('#/login')) return { name: 'login' }
  return { name: 'menu' }
}

type Toast = { text: string; action?: { label: string; run: () => void } }

export default function App() {
  const [route, setRoute] = useState(parseRoute)
  const [toast, setToast] = useState<Toast | null>(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const cart = useCart()
  const orders = useOrders()
  const { profile, signIn, update: updateProfile, signOut } = useProfile()
  const loyalty = loyaltyOf(orders.orders, profile)
  // Coarse clock: only decides whether an order still counts as active.
  const now = useNow(5000)

  // How many screens we pushed on top of the menu, so "back" can pop history;
  // a screen reached by deep link closes by replacing the route instead.
  const depth = useRef(0)
  const selfBack = useRef(false)

  useEffect(() => {
    const onHash = () => {
      // The browser's own back button also pops one of our screens.
      if (!selfBack.current && depth.current > 0) depth.current--
      selfBack.current = false
      setRoute(parseRoute())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.body.style.overflow = route.name === 'menu' ? '' : 'hidden'
  }, [route.name])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.action ? 4000 : 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const push = (hash: string) => {
    depth.current++
    window.location.hash = hash
  }
  const replace = (hash: string) => window.location.replace(`#${hash}`)
  const back = useCallback(() => {
    if (depth.current > 0) {
      depth.current--
      selfBack.current = true
      window.history.back()
    } else window.location.replace('#/menu')
  }, [])

  const openItem = (next: MenuItem) => {
    // Opening a related item replaces the card instead of stacking history.
    if (route.name === 'product') replace(`/product/${next.id}`)
    else push(`/product/${next.id}`)
  }

  const addFromCard = ({ itemId, variantId, ingredientIds, price }: AddRequest) => {
    cart.add(itemId, variantId, ingredientIds)
    setToast({ text: `${itemById.get(itemId)?.name} — ${formatPrice(price)} в корзине` })
    back()
  }

  const addUpsell = (item: MenuItem) => {
    cart.add(item.id, item.variants[0].id, [])
    setToast({ text: `${item.name} добавлен` })
  }

  const removeLine = (line: CartLine, index: number) => {
    cart.setQty(line.key, 0)
    setToast({ text: `${itemById.get(line.itemId)?.name} удалён`, action: { label: 'Вернуть', run: () => cart.restore(line, index) } })
  }

  const clearCart = () => {
    const snapshot = cart.lines
    cart.clear()
    setToast({ text: 'Корзина очищена', action: { label: 'Вернуть', run: () => snapshot.forEach((l, i) => cart.restore(l, i)) } })
  }

  const checkout = async (c: Checkout) => {
    // Demo payment: no provider, just a short pause like a real confirmation.
    await new Promise((r) => window.setTimeout(r, 1200))
    const now = Date.now()
    const order = orders.create({
      createdAt: now,
      readyAt: readyTimeFor(c.pickup, now),
      lines: cart.lines,
      subtotal: c.subtotal,
      discount: c.discount,
      total: c.total,
      name: c.name,
      pickup: c.pickup,
      payment: c.payment,
      phone: profile?.phone,
      levelDiscount: c.levelDiscount,
      promoDiscount: c.promoDiscount,
      rewardDiscount: c.rewardDiscount || undefined,
    })
    cart.clear()
    replace(`/order/${order.id}`)
  }

  const repeatOrder = (o: (typeof orders.orders)[number]) => {
    o.lines.forEach((l) => cart.add(l.itemId, l.variantId, l.ingredientIds, l.qty))
    setToast({ text: `Заказ № ${o.number} в корзине` })
    push('/cart')
  }

  const finishLogin = (phone: string, name: string) => {
    const returning = profile?.phone === phone
    signIn(phone, name)
    setToast({ text: returning ? `С возвращением, ${name}!` : `${name}, напиток в подарок уже ждёт 🎁` })
    // On #/profile the same route turns into the profile itself once signed in.
    if (route.name === 'login') back()
  }

  const cartLoyalty: CartLoyalty = profile
    ? { levelName: loyalty.level.name, levelPercent: loyalty.level.percent, giftValue: giftValue(cart.lines), giftsAvailable: loyalty.giftsAvailable }
    : null

  const activeOrder = orders.orders.find((o) => isActive(o, now))
  const item = route.name === 'product' ? itemById.get(route.id) : undefined
  const order = route.name === 'order' ? orders.orders.find((o) => o.id === route.id) : undefined

  return (
    <>
      <MenuScreen
        cartCount={countOf(cart.lines)}
        onOpen={openItem}
        onOpenCart={() => push('/cart')}
        profileInitial={profile ? profile.name.slice(0, 1).toUpperCase() : undefined}
        giftsAvailable={loyalty.giftsAvailable}
        onOpenProfile={() => push('/profile')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {route.name === 'menu' && (
        <MenuDock
          count={countOf(cart.lines)}
          total={subtotalOf(cart.lines)}
          activeOrder={activeOrder}
          onOpenCart={() => push('/cart')}
          onOpenOrder={(o) => push(`/order/${o.id}`)}
        />
      )}
      {route.name === 'cart' && (
        <CartScreen
          lines={cart.lines}
          onQty={cart.setQty}
          onRemove={removeLine}
          onAddUpsell={addUpsell}
          onOpenItem={openItem}
          onClear={clearCart}
          onClose={back}
          onCheckout={checkout}
          profileName={profile?.name}
          loyalty={cartLoyalty}
          onLogin={() => push('/login')}
        />
      )}
      {item && <ProductScreen item={item} onClose={back} onAdd={addFromCard} onOpenItem={openItem} />}
      {route.name === 'login' && <LoginScreen initialName={profile?.name ?? readSavedName()} onDone={finishLogin} onClose={back} />}
      {route.name === 'profile' &&
        (profile ? (
          <ProfileScreen
            profile={profile}
            loyalty={loyalty}
            orders={orders.orders.filter((o) => o.phone === profile.phone)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onUpdate={updateProfile}
            onSignOut={() => {
              signOut()
              setToast({ text: 'Вы вышли из профиля' })
              back()
            }}
            onOpenOrder={(o) => push(`/order/${o.id}`)}
            onRepeat={repeatOrder}
            onClose={back}
          />
        ) : (
          <LoginScreen initialName={readSavedName()} onDone={finishLogin} onClose={back} />
        ))}
      {route.name === 'order' &&
        (order ? (
          <OrderScreen
            key={order.id}
            order={order}
            onCancel={() => orders.update(order.id, { cancelledAt: Date.now() })}
            onRate={(rating) => orders.update(order.id, { rating })}
            onClose={back}
          />
        ) : (
          <NotFound onClose={back} />
        ))}
      {toast && (
        <div
          className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100%-32px)] items-center gap-3.5 overflow-hidden rounded-full bg-inverse px-[18px] py-3 text-[14px] font-semibold whitespace-nowrap text-inverse-ink shadow-lift [transform:translateX(-50%)] animate-toast-in"
          role="status"
        >
          <span className="overflow-hidden text-ellipsis">{toast.text}</span>
          {toast.action && (
            <button
              className="flex-none font-extrabold text-[#8fd1bb] dark:text-accent"
              onClick={() => {
                toast.action?.run()
                setToast(null)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  )
}

function NotFound({ onClose }: { onClose: () => void }) {
  return (
    <div className={sheet} role="dialog" aria-modal="true" aria-label="Заказ не найден">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <h2 className="mt-2 text-[22px]">Заказ не найден</h2>
        <p className="mb-3 max-w-[260px] text-[14px] leading-[1.4] text-muted">Возможно, он был сделан на другом устройстве</p>
        <button className={btn('primary')} onClick={onClose}>
          В меню
        </button>
      </div>
    </div>
  )
}

/** Name typed at a previous checkout, offered as the profile name. */
function readSavedName() {
  try {
    return localStorage.getItem('zerno-name') ?? ''
  } catch {
    return ''
  }
}
