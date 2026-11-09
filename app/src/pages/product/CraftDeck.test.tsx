import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { IngredientGroup } from '../../domain'
import { CraftDeck } from './CraftDeck'

const dummyNutrition = { kcal: 40, fat: 1, carbs: 6, protein: 1 }

// Complete real catalog data from coffee.db (all 22 production ingredients across 5 groups)
const allGroupsFixture: IngredientGroup[] = [
  {
    id: 'milk',
    name: 'Молоко',
    max: 1,
    ingredients: [
      { id: 'oat', name: 'Овсяное', price: 70, color: '#efe2c4', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/oat.svg' },
      { id: 'almond', name: 'Миндальное', price: 70, color: '#f1e6d6', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/almond.svg' },
      { id: 'coconut', name: 'Кокосовое', price: 70, color: '#fbf6ee', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/coconut.svg' },
      { id: 'lactosefree', name: 'Безлактозное', price: 40, color: '#f7f3ea', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/lactosefree.svg' },
      { id: 'goat', name: 'Козье', price: 50, color: '#f3efe6', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/ing-1793706331977.svg' },
    ],
  },
  {
    id: 'syrups',
    name: 'Сиропы',
    max: 4,
    counter: true,
    ingredients: [
      { id: 'vanilla', name: 'Ваниль', price: 60, color: '#f5e6cb', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/vanilla.svg' },
      { id: 'caramel', name: 'Солёная карамель', price: 60, color: '#c68b59', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/caramel.svg' },
      { id: 'hazelnut', name: 'Лесной орех', price: 60, color: '#a76b43', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/hazelnut.svg' },
      { id: 'pumpkin', name: 'Тыквенный пряный', price: 60, color: '#d46e29', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/pumpkin.svg' },
      { id: 'lavender', name: 'Лаванда', price: 60, color: '#b7a3e0', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/lavender.svg' },
      { id: 'maple', name: 'Клён', price: 60, color: '#b0702a', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/maple.svg' },
    ],
  },
  {
    id: 'toppings',
    name: 'Топпинги',
    max: 5,
    counter: true,
    ingredients: [
      { id: 'cinnamon', name: 'Корица', price: 0, color: '#a5643a', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/cinnamon.svg' },
      { id: 'cocoa', name: 'Какао', price: 30, color: '#6b3d26', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/cocoa.svg' },
      { id: 'coconut-flakes', name: 'Кокосовая стружка', price: 40, color: '#f4efe6', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/coconut-flakes.svg' },
      { id: 'pistachio', name: 'Фисташка', price: 60, color: '#a9c27a', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/pistachio.svg' },
      { id: 'marshmallow', name: 'Маршмеллоу', price: 40, color: '#f6d2dc', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/marshmallow.svg' },
    ],
  },
  {
    id: 'extra',
    name: 'Экстра',
    max: 5,
    counter: true,
    ingredients: [
      { id: 'shot', name: 'Доп. шот эспрессо', price: 60, color: '#4a2a1a', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/shot.svg' },
      { id: 'decaf', name: 'Без кофеина', price: 0, color: '#8d6a55', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/decaf.svg' },
      { id: 'cream', name: 'Взбитые сливки', price: 60, color: '#fffaf2', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/cream.svg' },
    ],
  },
  {
    id: 'protein',
    name: 'Протеин',
    max: 3,
    counter: true,
    ingredients: [
      { id: 'whey', name: 'Сывороточный протеин', price: 90, color: '#f0ece1', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/whey.svg' },
      { id: 'collagen', name: 'Коллаген', price: 80, color: '#fff5ee', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/collagen.svg' },
      { id: 'plant-protein', name: 'Гороховый протеин', price: 90, color: '#e4edd8', nutrition: dummyNutrition, imageUrl: '/uploads/products/addons/plant-protein.svg' },
    ],
  },
]

describe('CraftDeck selection and quantities', () => {
  // -------------------------------------------------------------
  // SUITE 4: Single-Choice (Milk) Group Mechanics
  // -------------------------------------------------------------
  describe('Suite 4: Single-Choice Group Mechanics', () => {
    const milkGroup = allGroupsFixture.find((g) => g.id === 'milk')!

    it('marks the selected card with aria-pressed and a check badge; the card itself is the control', () => {
      const { container } = render(
        <CraftDeck
          group={milkGroup}
          groupIndex={0}
          qtyOf={(id) => (id === 'oat' ? 1 : 0)}
          total={1}
          canAdd={() => true}
          onPick={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const oatCard = container.querySelector('[data-card-index="0"]')!
      expect(oatCard).toHaveAttribute('aria-pressed', 'true')
      expect(oatCard.querySelector('svg')).toBeInTheDocument() // Checkmark badge ✓

      const almondCard = container.querySelector('[data-card-index="1"]')!
      expect(almondCard).toHaveAttribute('aria-pressed', 'false')
      expect(almondCard).not.toHaveTextContent(/Выбра/)
    })

    it('triggers onPick with ingredient and art element on card click', () => {
      const onPick = vi.fn()
      render(
        <CraftDeck
          group={milkGroup}
          groupIndex={0}
          qtyOf={() => 0}
          total={0}
          canAdd={() => true}
          onPick={onPick}
          onRemove={vi.fn()}
        />
      )

      const almondCard = screen.getByRole('button', { name: 'Миндальное' })
      fireEvent.click(almondCard)
      expect(onPick).toHaveBeenCalledWith(milkGroup.ingredients[1], expect.anything())
    })
  })

  // -------------------------------------------------------------
  // SUITE 5: Counter Group Mechanics (Toppings, Syrups, Protein, Extra)
  // -------------------------------------------------------------
  describe('Suite 5: Counter Group Mechanics', () => {
    const toppingsGroup = allGroupsFixture.find((g) => g.id === 'toppings')!

    it('transitions between "+ Добавить" and "− qty +" stepper smoothly', () => {
      const onPick = vi.fn()
      const onRemove = vi.fn()

      const { rerender } = render(
        <CraftDeck
          group={toppingsGroup}
          groupIndex={2}
          qtyOf={() => 0}
          total={0}
          canAdd={() => true}
          onPick={onPick}
          onRemove={onRemove}
        />
      )

      // Initially "+ Добавить"
      const addBtn = screen.getByLabelText('Кокосовая стружка: добавить порцию')
      expect(addBtn).toBeInTheDocument()
      expect(addBtn).toHaveTextContent('Добавить')

      // Click to add
      fireEvent.click(addBtn)
      expect(onPick).toHaveBeenCalledWith(toppingsGroup.ingredients[2], expect.anything())

      // Rerender with qty = 1
      rerender(
        <CraftDeck
          group={toppingsGroup}
          groupIndex={2}
          qtyOf={(id) => (id === 'coconut-flakes' ? 1 : 0)}
          total={1}
          canAdd={() => true}
          onPick={onPick}
          onRemove={onRemove}
        />
      )

      // Now stepper exists
      // The amount appears once, in the stepper; the corner shows a plain check mark
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.queryByText('×1')).toBeNull()

      // Click "+" to add second portion
      const plusBtn = screen.getByLabelText('Кокосовая стружка: добавить порцию')
      fireEvent.click(plusBtn)
      expect(onPick).toHaveBeenCalledTimes(2)

      // Click "−" to remove portion
      const minusBtn = screen.getByLabelText('Кокосовая стружка: убрать порцию')
      fireEvent.click(minusBtn)
      expect(onRemove).toHaveBeenCalledWith(toppingsGroup.ingredients[2])
    })

    it('disables "+" button when canAdd returns false (max portions reached)', () => {
      render(
        <CraftDeck
          group={toppingsGroup}
          groupIndex={2}
          qtyOf={(id) => (id === 'coconut-flakes' ? 5 : 0)}
          total={5}
          canAdd={() => false}
          onPick={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      const plusBtn = screen.getByLabelText('Кокосовая стружка: добавить порцию')
      expect(plusBtn).toBeDisabled()
    })

    it('handles out of stock (stopped) ingredients gracefully', () => {
      const stoppedGroup: IngredientGroup = {
        id: 'test',
        name: 'Тест',
        max: 2,
        counter: true,
        ingredients: [
          {
            id: 'stopped-ing',
            name: 'Закончившийся сироп',
            price: 50,
            color: '#888888',
            nutrition: dummyNutrition,
            stopped: true,
          },
        ],
      }

      render(
        <CraftDeck
          group={stoppedGroup}
          groupIndex={0}
          qtyOf={() => 0}
          total={0}
          canAdd={() => true}
          onPick={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByText('нет в наличии')).toBeInTheDocument()
      expect(screen.getByText('Закончилось')).toBeInTheDocument()
      const btn = screen.getByRole('button', { name: 'Закончившийся сироп: добавить порцию' })
      expect(btn).toBeDisabled()
    })
  })

  // -------------------------------------------------------------
  // SUITE 6: Price Representation
  // -------------------------------------------------------------
  describe('Suite 6: Price Representation', () => {
    it('correctly labels prices: "+X ₽", "включено" (single 0₽), and "бесплатно" (counter 0₽)', () => {
      // 1. Single-choice with 0₽ (включено)
      const singleGroupWithZero: IngredientGroup = {
        id: 'milk',
        name: 'Молоко',
        max: 1,
        ingredients: [
          { id: 'cow', name: 'Обычное', price: 0, color: '#ffffff', nutrition: dummyNutrition },
          { id: 'oat', name: 'Овсяное', price: 70, color: '#efe2c4', nutrition: dummyNutrition },
        ],
      }
      const { unmount } = render(
        <CraftDeck
          group={singleGroupWithZero}
          groupIndex={0}
          qtyOf={() => 0}
          total={0}
          canAdd={() => true}
          onPick={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText('включено')).toBeInTheDocument()
      expect(screen.getByText('+70 ₽')).toBeInTheDocument()
      unmount()

      // 2. Counter group with 0₽ (бесплатно)
      const extraGroup = allGroupsFixture.find((g) => g.id === 'extra')!
      render(
        <CraftDeck
          group={extraGroup}
          groupIndex={3}
          qtyOf={() => 0}
          total={0}
          canAdd={() => true}
          onPick={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText('бесплатно')).toBeInTheDocument()
    })
  })


})

function setupDeck(group = allGroupsFixture[0], selected = '') {
  const onPick = vi.fn()
  const view = render(
    <CraftDeck group={group} groupIndex={0} qtyOf={(id) => id === selected ? 1 : 0}
      total={selected ? 1 : 0} canAdd={() => true} onPick={onPick} onRemove={vi.fn()} />,
  )
  const track = view.container.querySelector<HTMLDivElement>('[data-carousel-container]')!
  Object.defineProperty(track, 'clientWidth', { configurable: true, value: 390 })
  view.container.querySelectorAll<HTMLElement>('[data-card-index]').forEach((card, i) => {
    Object.defineProperty(card, 'offsetLeft', { configurable: true, value: 135 + i * 132 })
    Object.defineProperty(card, 'offsetWidth', { configurable: true, value: 120 })
  })
  const scrollTo = vi.fn()
  track.scrollTo = scrollTo
  return { ...view, track, scrollTo, onPick }
}

function pointer(target: Element | Window, type: string, x: number, pointerType = 'mouse') {
  // jsdom has no native PointerEvent; include real pointer metadata explicitly.
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0 })
  Object.defineProperties(event, { pointerType: { value: pointerType }, pointerId: { value: 1 } })
  fireEvent(target, event)
}

describe('CraftDeck native scrolling and input isolation', () => {
  it('does not start mouse dragging or programmatically scroll during touch/pen gestures', () => {
    const { track, scrollTo, onPick } = setupDeck()
    for (const type of ['touch', 'pen']) {
      pointer(track, 'pointerdown', 250, type)
      pointer(window, 'pointermove', 60, type)
      pointer(window, 'pointerup', 60, type)
      expect(track.style.scrollSnapType).toBe('')
      expect(track.scrollLeft).toBe(0)
      expect(scrollTo).not.toHaveBeenCalled()
    }
    expect(onPick).not.toHaveBeenCalled()
  })

  it('keeps a tap clickable and suppresses ingredient selection after a mouse drag', () => {
    const { track, onPick } = setupDeck()
    const card = screen.getByRole('button', { name: 'Овсяное' })
    pointer(card, 'pointerdown', 200)
    pointer(window, 'pointerup', 200)
    fireEvent.click(card)
    expect(onPick).toHaveBeenCalledTimes(1)
    pointer(track, 'pointerdown', 200)
    pointer(window, 'pointermove', 100)
    expect(track.scrollLeft).toBe(100)
    expect(track.style.scrollSnapType).toBe('none')
    pointer(window, 'pointerup', 100)
    expect(track.style.scrollSnapType).toBe('')
    fireEvent.click(card)
    expect(onPick).toHaveBeenCalledTimes(1)
    pointer(card, 'pointerdown', 200)
    pointer(window, 'pointerup', 200)
    fireEvent.click(card)
    expect(onPick).toHaveBeenCalledTimes(2)
  })

  it('removes global drag listeners on unmount', () => {
    const { track, unmount } = setupDeck()
    pointer(track, 'pointerdown', 200)
    pointer(window, 'pointermove', 100)
    const scroll = track.scrollLeft
    unmount()
    pointer(window, 'pointermove', 0)
    expect(track.scrollLeft).toBe(scroll)
    expect(track.style.scrollSnapType).toBe('')
  })

  it('cleans up a cancelled pointer', () => {
    const { track } = setupDeck()
    pointer(track, 'pointerdown', 200)
    pointer(window, 'pointermove', 100)
    pointer(window, 'pointercancel', 100)
    expect(track.style.scrollSnapType).toBe('')
    pointer(window, 'pointermove', 0)
    expect(track.scrollLeft).toBe(100)
  })

  it('centers the last card with keyboard and pagination and allows returning to the first', () => {
    const { scrollTo } = setupDeck()
    const region = screen.getByRole('region', { name: 'Молоко' })
    fireEvent.keyDown(region, { key: 'End' })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 528, behavior: 'smooth' })
    expect(screen.getByRole('button', { name: 'Козье (5 из 5)' })).toHaveAttribute('aria-current', 'true')
    fireEvent.keyDown(region, { key: 'Home' })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' })
    fireEvent.click(screen.getByRole('button', { name: 'Миндальное (2 из 5)' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 132, behavior: 'smooth' })
  })

  it('starts on the selected ingredient', () => {
    setupDeck(allGroupsFixture[0], 'almond')
    expect(screen.getByRole('button', { name: 'Миндальное (2 из 5)' })).toHaveAttribute('aria-current', 'true')
  })

  it('leaves horizontal trackpad scrolling and zoom gestures to the browser', () => {
    const { track, scrollTo } = setupDeck()
    fireEvent.wheel(track, { deltaX: 80, deltaY: 1 })
    fireEvent.wheel(track, { deltaY: 80, ctrlKey: true })
    expect(scrollTo).not.toHaveBeenCalled()
    fireEvent.wheel(track, { deltaY: 80 })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 132, behavior: 'smooth' })
  })

  it('respects reduced motion for explicit navigation', () => {
    const { scrollTo } = setupDeck()
    const match = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    fireEvent.click(screen.getByRole('button', { name: 'Миндальное (2 из 5)' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 132, behavior: 'instant' })
    match.mockRestore()
  })
})
