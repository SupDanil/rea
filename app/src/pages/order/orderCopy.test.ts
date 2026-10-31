import { describe, it, expect } from 'vitest'
import { statusTitles, statusSubtitle, totalLabel, discountRows } from './orderCopy'
import type { Order } from '../../state/orders'

describe('Order copy helpers', () => {
  const baseOrder: Order = {
    id: 'ord-test-copy',
    number: 42,
    createdAt: 1000000,
    readyAt: 1600000,
    status: 'making',
    lines: [],
    subtotal: 500,
    discount: 50,
    total: 450,
    name: 'Данил',
    pickup: { kind: 'asap' },
    payment: 'card',
  }

  it('has readable titles for all statuses', () => {
    expect(statusTitles.paying).toBe('Проводим оплату')
    expect(statusTitles.accepted).toBe('Приняли заказ')
    expect(statusTitles.making).toBe('Готовим')
    expect(statusTitles.ready).toBe('Заказ готов')
    expect(statusTitles.cancelled).toBe('Заказ отменён')
  })

  it('generates correct subtitle for each status', () => {
    // paying
    expect(statusSubtitle(baseOrder, 'paying', 1000000)).toBe('Секунду, подтверждаем платёж')
    expect(statusSubtitle({ ...baseOrder, payment: 'cash' }, 'paying', 1000000)).toBe('Секунду, отправляем на кухню')

    // accepted
    expect(statusSubtitle(baseOrder, 'accepted', 1000000)).toBe('Скоро начнём готовить')

    // making
    const makingSub = statusSubtitle(baseOrder, 'making', 1200000)
    expect(makingSub).toContain('·')

    // ready
    expect(statusSubtitle(baseOrder, 'ready', 1600000)).toBe('Заберите на стойке выдачи. Всё хорошо?')
    expect(statusSubtitle({ ...baseOrder, rating: 'good' }, 'ready', 1600000)).toBe('Спасибо за оценку!')

    // cancelled
    expect(statusSubtitle(baseOrder, 'cancelled', 1600000)).toBe('Деньги вернутся на карту в течение 3 дней')
  })

  it('totalLabel formats payment method label', () => {
    expect(totalLabel(baseOrder, 'making')).toBe('Оплачено картой')
    expect(totalLabel({ ...baseOrder, payment: 'cash' }, 'making')).toBe('К оплате при получении')
    expect(totalLabel(baseOrder, 'cancelled')).toBe('Вернём на карту')
  })

  it('discountRows returns itemized discounts or fallback discount', () => {
    const itemized = discountRows({
      ...baseOrder,
      rewardDiscount: 200,
      levelDiscount: 30,
      promoDiscount: 20,
    })
    expect(itemized.length).toBe(3)
    expect(itemized[0]).toEqual(['Напиток в подарок', 200])

    const fallback = discountRows({
      ...baseOrder,
      discount: 50,
    })
    expect(fallback).toEqual([['Скидка', 50]])
  })
})
