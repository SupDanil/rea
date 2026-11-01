import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ConfirmBox } from './ConfirmBox'
import { Toast } from './Toast'
import { Sheet } from './Sheet'
import { CartLineItem } from '../pages/cart/CartLineItem'
import { AppContext, type AppState } from '../state/AppContext'
import type { ResolvedLine } from '../state/cart'

describe('2026 Interactive UI Patterns', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('ConfirmBox (Hold or click to confirm)', () => {
    it('renders with accessible alertdialog semantics and calls onConfirm on click', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(
        <ConfirmBox
          title="Отменить заказ?"
          text="Деньги вернутся на карту"
          confirmLabel="Да, отменить"
          cancelLabel="Не отменять"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      )

      expect(screen.getByRole('alertdialog', { name: 'Отменить заказ?' })).toBeInTheDocument()
      expect(screen.getByText('Деньги вернутся на карту')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Да, отменить' }))
      expect(onConfirm).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByRole('button', { name: 'Не отменять' }))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('triggers confirmation on long hold (600ms) with vibration feedback', () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      const vibrateSpy = vi.fn()
      navigator.vibrate = vibrateSpy

      render(
        <ConfirmBox
          title="Выйти?"
          text="Вы уверены?"
          confirmLabel="Выйти"
          cancelLabel="Отмена"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      )

      const btn = screen.getByRole('button', { name: 'Выйти' })
      fireEvent.pointerDown(btn)

      expect(vibrateSpy).toHaveBeenCalledWith(20)
      expect(onConfirm).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(650)
      })

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 40])
    })
  })

  describe('Toast (Dynamic Island with Undo Action)', () => {
    it('renders status message and executes action callback', () => {
      const runAction = vi.fn()
      const hideToast = vi.fn()

      const mockAppState = {
        toast: {
          text: 'Эспрессо удалён из корзины',
          action: { label: 'Отменить', run: runAction },
        },
        hideToast,
      } as unknown as AppState

      render(
        <AppContext.Provider value={mockAppState}>
          <Toast />
        </AppContext.Provider>,
      )

      expect(screen.getByRole('status')).toHaveTextContent('Эспрессо удалён из корзины')
      const undoBtn = screen.getByRole('button', { name: 'Отменить' })
      expect(undoBtn).toBeInTheDocument()

      fireEvent.click(undoBtn)
      expect(runAction).toHaveBeenCalledTimes(1)
      expect(hideToast).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sheet (Swipe down dismissal & Focus Trap)', () => {
    it('traps and restores focus, and dismisses on swipe down beyond threshold', () => {
      const onBack = vi.fn()

      const triggerBtn = document.createElement('button')
      triggerBtn.textContent = 'Open'
      document.body.appendChild(triggerBtn)
      triggerBtn.focus()

      const { unmount } = render(
        <Sheet label="Настройки" title="Настройки" onBack={onBack}>
          <button>Option 1</button>
        </Sheet>,
      )

      act(() => {
        vi.advanceTimersByTime(60)
      })

      const grabber = document.querySelector('.cursor-grab')
      expect(grabber).toBeInTheDocument()

      // Swipe down gesture
      fireEvent.touchStart(grabber!, { touches: [{ clientY: 100 }] })
      fireEvent.touchMove(grabber!, { touches: [{ clientY: 260 }] })
      fireEvent.touchEnd(grabber!)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(onBack).toHaveBeenCalledTimes(1)

      unmount()
      expect(document.activeElement).toBe(triggerBtn)
      document.body.removeChild(triggerBtn)
    })
  })

  describe('CartLineItem (Swipe-to-delete gesture)', () => {
    it('triggers onRemove on touch swipe left beyond -70px', () => {
      const onRemove = vi.fn()
      const onOpen = vi.fn()
      const onQty = vi.fn()

      const dummyNutrition = { kcal: 210, fat: 8, carbs: 28, protein: 7 }
      const line: ResolvedLine = {
        key: 'cappuccino-m',
        itemId: 'cappuccino',
        variantId: 'm',
        ingredientIds: [],
        item: {
          id: 'cappuccino',
          name: 'Капучино',
          description: 'Кофе с молоком',
          composition: 'Эспрессо, молоко',
          categoryId: 'coffee',
          groupIds: [],
          variants: [{ id: 'm', size: 'M', volume: '300 мл', price: 220, stopped: false, nutrition: dummyNutrition }],
          art: { kind: 'cup', fill: '#4E2A1B', bg: '#D9954C' },
        },
        variant: { id: 'm', size: 'M', volume: '300 мл', price: 220, stopped: false, nutrition: dummyNutrition },
        ingredients: [],
        unitPrice: 220,
        qty: 1,
      }

      render(
        <CartLineItem
          line={line}
          disabled={false}
          onOpen={onOpen}
          onQty={onQty}
          onRemove={onRemove}
        />,
      )

      const card = screen.getByText('Капучино').closest('.relative.z-1')
      expect(card).toBeInTheDocument()

      // Swipe left
      fireEvent.touchStart(card!, { touches: [{ clientX: 200 }] })
      fireEvent.touchMove(card!, { touches: [{ clientX: 110 }] })
      fireEvent.touchEnd(card!)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })
  })
})
