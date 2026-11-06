import { act,render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { IngredientGroup, MenuItem, Variant } from '../../domain'
import { HeroBuilderArea } from './HeroBuilderArea'

const dummyNutrition = { kcal: 120, fat: 5, carbs: 8, protein: 5 }

const dummyItem: MenuItem = {
  id: 'cappuccino',
  categoryId: 'coffee',
  name: 'Капучино',
  description: 'Эспрессо с молочной пенкой',
  composition: 'Кофе, молоко',
  badge: 'hit',
  groupIds: ['milk'],
  art: { kind: 'cup', fill: '#5e4b7e', bg: '#dcd8ec' },
  variants: [
    { id: 's', size: 'S', volume: '200 мл', price: 210, nutrition: dummyNutrition },
    { id: 'm', size: 'M', volume: '300 мл', price: 250, nutrition: dummyNutrition },
    { id: 'l', size: 'L', volume: '400 мл', price: 290, nutrition: dummyNutrition },
  ],
}

const dummyVariant: Variant = dummyItem.variants[1] // M

const dummyGroups: IngredientGroup[] = [
  {
    id: 'milk',
    name: 'Молоко',
    max: 1,
    ingredients: [
      { id: 'oat', name: 'Овсяное', price: 70, color: '#e8dcc4', nutrition: dummyNutrition },
    ],
  },
]

describe('HeroBuilderArea Adaptive Scaling', () => {
  it('renders large centered cup in State A (no toppings) with scale ~2x builder scale', () => {
    const cupRef = createRef<HTMLDivElement>()
    const artRef = createRef<SVGSVGElement>()

    const { container } = render(
      <HeroBuilderArea
        item={dummyItem}
        variant={dummyVariant}
        groups={dummyGroups}
        selection={{}}
        onRemoveAll={vi.fn()}
        cupRef={cupRef}
        artRef={artRef}
        openedWith="cappuccino"
      />,
    )

    // Stage container
    const stage = container.firstChild as HTMLElement
    expect(stage).toBeInTheDocument()

    // Transform wrapper for cup
    const transformWrapper = stage.querySelector('.will-change-transform') as HTMLElement
    expect(transformWrapper).toBeInTheDocument()

    // In State A (default fallback dimensions 390x380):
    // shiftX should be 0 (strictly centered)
    // heroScale should be around 2.2 - 2.3
    const transformStyle = transformWrapper.style.transform
    expect(transformStyle).toContain('translate3d(0px, 0, 0)')
    expect(transformStyle).toMatch(/scale\(2\.[0-9]+\)/)

    // No addons list in State A
    expect(screen.queryByRole('region', { name: 'Выбранные добавки' })).not.toBeInTheDocument()
  })

  it('transitions to cup shifted left in State B when toppings are chosen', () => {
    const cupRef = createRef<HTMLDivElement>()
    const artRef = createRef<SVGSVGElement>()

    const { container } = render(
      <HeroBuilderArea
        item={dummyItem}
        variant={dummyVariant}
        groups={dummyGroups}
        selection={{ milk: ['oat'] }}
        onRemoveAll={vi.fn()}
        cupRef={cupRef}
        artRef={artRef}
        openedWith="cappuccino"
      />,
    )

    const stage = container.firstChild as HTMLElement
    const transformWrapper = stage.querySelector('.will-change-transform') as HTMLElement

    // In State B (new concept):
    // shiftX should be negative (shifted to left margin/left third)
    // cup remains prominent and tall (scale ~2.15), filling stage height
    const transformStyle = transformWrapper.style.transform
    expect(transformStyle).toMatch(/translate3d\(-[\d.]+px, 0, 0\)/)
    expect(transformStyle).toMatch(/scale\(2\.[0-9]+\)/)

    // Addons list appears on the right
    expect(screen.getByRole('region', { name: 'Выбранные добавки' })).toBeInTheDocument()
    expect(screen.getByText('Овсяное')).toBeInTheDocument()
  })

  it('matches the left cup margin to the right list margin on desktop', () => {
    let observerCallback: (entries: unknown[]) => void = () => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: (entries: unknown[]) => void) {
        observerCallback = callback
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    })

    const cupRef = createRef<HTMLDivElement>()
    const artRef = createRef<SVGSVGElement>()

    const { container } = render(
      <HeroBuilderArea
        item={dummyItem}
        variant={dummyVariant}
        groups={dummyGroups}
        selection={{ milk: ['oat'] }}
        onRemoveAll={vi.fn()}
        cupRef={cupRef}
        artRef={artRef}
        openedWith="cappuccino"
      />,
    )

    const stage = container.firstChild as HTMLElement
    const transformWrapper = stage.querySelector('.will-change-transform') as HTMLElement

    // Mock desktop container dimensions (e.g. 700x500)
    Object.defineProperty(stage, 'clientWidth', { value: 700, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 500, configurable: true })

    act(() => {
      observerCallback([])
    })

    const desktopTransform = transformWrapper.style.transform
    const scale = Number(/scale\(([\d.]+)\)/.exec(desktopTransform)![1])
    const shift = Number(/translate3d\((-?[\d.]+)px/.exec(desktopTransform)![1])
    const visibleLeft = 700 / 2 + shift - 38 * scale
    expect(visibleLeft).toBeCloseTo(20)

    vi.unstubAllGlobals()
  })

  it('adaptively recalculates hero scale when container dimensions change via ResizeObserver', () => {
    let observerCallback: (entries: unknown[]) => void = () => {}
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: (entries: unknown[]) => void) {
        observerCallback = callback
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    })

    const cupRef = createRef<HTMLDivElement>()
    const artRef = createRef<SVGSVGElement>()

    const { container } = render(
      <HeroBuilderArea
        item={dummyItem}
        variant={dummyVariant}
        groups={dummyGroups}
        selection={{}}
        onRemoveAll={vi.fn()}
        cupRef={cupRef}
        artRef={artRef}
        openedWith="cappuccino"
      />,
    )

    const stage = container.firstChild as HTMLElement
    const transformWrapper = stage.querySelector('.will-change-transform') as HTMLElement

    // Mock small screen (e.g. iPhone SE with 260px container height)
    Object.defineProperty(stage, 'clientWidth', { value: 375, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 260, configurable: true })

    act(() => {
      observerCallback([])
    })

    // On compact screen (height 260):
    // heroScale adapts downwards to fit within container height without overflow
    const compactTransform = transformWrapper.style.transform
    expect(compactTransform).toContain('translate3d(0px, 0, 0)')
    // Height 260 - 16 = 244 -> 244 / 160 = 1.52
    expect(compactTransform).toMatch(/scale\(1\.[4-6][0-9]*\)/)

    vi.unstubAllGlobals()
  })

  describe('with toppings added', () => {
    const scaleOn = (width: number, height: number) => {
      let measure = () => {}
      vi.stubGlobal('innerWidth', width)
      vi.stubGlobal('ResizeObserver', class {
        constructor(callback: () => void) {
          measure = callback
        }
        observe() {}
        disconnect() {}
      })
      const { container, unmount } = render(
        <HeroBuilderArea
          item={dummyItem}
          variant={dummyVariant}
          groups={dummyGroups}
          selection={{ milk: ['oat'] }}
          onRemoveAll={vi.fn()}
          cupRef={createRef<HTMLDivElement>()}
          artRef={createRef<SVGSVGElement>()}
          openedWith="cappuccino"
        />,
      )
      const stage = container.firstChild as HTMLElement
      Object.defineProperty(stage, 'clientWidth', { value: width, configurable: true })
      Object.defineProperty(stage, 'clientHeight', { value: height, configurable: true })
      act(() => measure())
      const transform = stage.querySelector<HTMLElement>('.will-change-transform')!.style.transform
      unmount()
      vi.unstubAllGlobals()
      return Number(/scale\(([\d.]+)\)/.exec(transform)![1])
    }

    it('keeps the reference look on a tall phone', () => {
      expect(scaleOn(426, 349)).toBeCloseTo(2.13, 2)
    })

    it('keeps the cup in proportion to the width on a short, wide screen like a foldable', () => {
      expect(scaleOn(360, 249)).toBeCloseTo(1.8, 2) // 0.8 of the width, not the stage height
    })

    it('overflows a very short stage only by the transparent margin around the art', () => {
      expect(scaleOn(365, 200)).toBeCloseTo(1.63, 2) // 1.3 × 200 / 160
    })

    it('stays bound to the stage height on a wide screen', () => {
      expect(scaleOn(700, 291)).toBeCloseTo(1.77, 2) // (291 - 8) / 160
    })
  })
})
