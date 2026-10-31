import { makingProgress, type Order, type OrderStatus } from '../../state/orders'
import { clockTime } from '../../utils/format'

export const statusTitles: Record<OrderStatus, string> = {
  paying: 'Проводим оплату',
  accepted: 'Приняли заказ',
  making: 'Готовим',
  ready: 'Заказ готов',
  cancelled: 'Заказ отменён',
}

// Same sub-steps Drinkit narrates while an order is being made.
const makingSteps = ['заказ в очереди', 'изучаем рецепт', 'готовим ингредиенты', 'взбиваем и смешиваем', 'последние штрихи', 'аккуратно упаковываем']

export function statusSubtitle(order: Order, status: OrderStatus, now: number) {
  switch (status) {
    case 'paying':
      return order.payment === 'card' ? 'Секунду, подтверждаем платёж' : 'Секунду, отправляем на кухню'
    case 'accepted':
      return order.pickup.kind === 'asap' ? 'Скоро начнём готовить' : `Приготовим к ${clockTime(order.readyAt)}`
    case 'making': {
      if (order.status === 'making') {
        return 'Бариста готовит ваш напиток прямо сейчас'
      }
      const p = makingProgress(order, now)
      const left = Math.max(1, Math.ceil((order.readyAt - now) / 60_000))
      return `${makingSteps[Math.min(makingSteps.length - 1, Math.floor(p * makingSteps.length))]} · ${p > 0.8 ? 'пара минут' : `~${left} мин`}`
    }
    case 'ready':
      return order.rating ? 'Спасибо за оценку!' : 'Заберите на стойке выдачи. Всё хорошо?'
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
