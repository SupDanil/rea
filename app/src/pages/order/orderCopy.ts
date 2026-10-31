import type { Order, OrderStatus } from '../../state/orders'
import { clockTime } from '../../utils/format'

export const statusTitles: Record<OrderStatus, string> = {
  paying: 'Проводим оплату',
  accepted: 'Готовим ваш кофе',
  making: 'Готовим ваш кофе',
  ready: 'Заказ готов',
  completed: 'Заказ выдан',
  cancelled: 'Заказ отменён',
}

export function statusSubtitle(order: Order, status: OrderStatus, now: number) {
  switch (status) {
    case 'paying':
      return order.payment === 'card' ? 'Секунду, подтверждаем платёж' : 'Секунду, отправляем на кухню'
    case 'accepted':
    case 'making': {
      const left = Math.max(1, Math.ceil((order.readyAt - now) / 60_000))
      return order.pickup.kind === 'asap'
        ? `Будет готов к ${clockTime(order.readyAt)} · ~${left} мин`
        : `Приготовим к ${clockTime(order.readyAt)}`
    }
    case 'ready':
      return order.rating ? 'Спасибо за оценку!' : 'Заберите на стойке выдачи'
    case 'completed':
      return 'Приятного кофепития! Будем рады видеть снова'
    case 'cancelled':
      return order.payment === 'card' ? 'Деньги вернутся на карту в течение 3 дней' : 'Будем ждать вас снова'
  }
}

export function totalLabel(order: Order, status: OrderStatus) {
  if (status === 'cancelled') return order.payment === 'card' ? 'Вернём на карту' : 'Не оплачен'
  return order.payment === 'card' ? 'Оплачено картой' : 'К оплате при получении'
}

/** Older orders only stored a single total discount, so fall back to it. */
export function discountRows(order: Order): [string, number][] {
  const rows: [string, number][] = [
    ['Напиток в подарок', order.rewardDiscount ?? 0],
    ['Скидка уровня', order.levelDiscount ?? 0],
    ['Промокод', order.promoDiscount ?? 0],
  ]
  const known = rows.filter(([, amount]) => amount > 0)
  if (known.length) return known
  return order.discount > 0 ? [['Скидка', order.discount]] : []
}
