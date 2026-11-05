import { describe, it, expect, beforeEach } from 'vitest'
import { testCatalog } from '../test/catalogFixture'
import { renderHook, act } from '@testing-library/react'
import { useCart, resolveLine, resolveLines, subtotalOf } from './cart'

describe('useCart hook and state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty cart', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.lines).toEqual([])
  })

  it('adds an item with unique key based on item, variant and ingredients', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add('cappuccino', 'm', ['oat'])
    })

    expect(result.current.lines.length).toBe(1)
    expect(result.current.lines[0]).toEqual({
      key: 'cappuccino|m|oat',
      itemId: 'cappuccino',
      variantId: 'm',
      ingredientIds: ['oat'],
      qty: 1,
    })
  })

  it('increments quantity when adding identical item variant and ingredients', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add('cappuccino', 'm', ['oat'], 1)
      result.current.add('cappuccino', 'm', ['oat'], 2)
    })

    expect(result.current.lines.length).toBe(1)
    expect(result.current.lines[0].qty).toBe(3)
  })

  it('adds separate line when variant or ingredients differ', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add('cappuccino', 'm', ['oat'])
      result.current.add('cappuccino', 'l', ['oat'])
      result.current.add('cappuccino', 'm', ['caramel'])
    })

    expect(result.current.lines.length).toBe(3)
  })

  it('setQty() updates quantity or removes line if qty <= 0', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add('cappuccino', 'm', [])
    })

    const key = result.current.lines[0].key

    act(() => {
      result.current.setQty(key, 5)
    })
    expect(result.current.lines[0].qty).toBe(5)

    act(() => {
      result.current.setQty(key, 0)
    })
    expect(result.current.lines.length).toBe(0)
  })

  it('clear() empties the cart', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add('cappuccino', 'm', [])
      result.current.add('flat-white', 'm', [])
    })
    expect(result.current.lines.length).toBe(2)

    act(() => {
      result.current.clear()
    })
    expect(result.current.lines).toEqual([])
  })

  it('restore() restores removed line at given index', () => {
    const { result } = renderHook(() => useCart())

    const line1 = { key: '1', itemId: 'item-1', variantId: 'v1', ingredientIds: [], qty: 1 }
    const line2 = { key: '2', itemId: 'item-2', variantId: 'v2', ingredientIds: [], qty: 1 }

    act(() => {
      result.current.restore(line1, 0)
      result.current.restore(line2, 1)
    })

    expect(result.current.lines.length).toBe(2)
    expect(result.current.lines[0].key).toBe('1')
    expect(result.current.lines[1].key).toBe('2')
  })

  it('resolveLine and resolveLines calculate correct prices against catalog', () => {
    const line = {
      key: 'cappuccino|m|oat',
      itemId: 'cappuccino',
      variantId: 'm',
      ingredientIds: ['oat'],
      qty: 2,
    }

    const resolved = resolveLine(line, testCatalog)
    expect(resolved).not.toBeNull()
    expect(resolved!.item.name).toBe('Капучино')
    expect(resolved!.variant.volume).toBe('300 мл')
    expect(resolved!.unitPrice).toBe(210 + 70)
    expect(resolved!.qty).toBe(2)

    const all = resolveLines([line], testCatalog)
    expect(all.length).toBe(1)
    expect(subtotalOf([line], testCatalog)).toBe(resolved!.unitPrice * 2)
  })

  it('separates items with different temperature into distinct cart lines and collapses same temperature', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      // Add Latte M Hot
      result.current.add('latte', 'm', [], 1, 'hot')
      // Add Latte M Cold
      result.current.add('latte', 'm', [], 1, 'cold')
    })

    expect(result.current.lines.length).toBe(2)
    expect(result.current.lines[0]).toMatchObject({
      itemId: 'latte',
      variantId: 'm',
      temperature: 'hot',
      qty: 1,
    })
    expect(result.current.lines[1]).toMatchObject({
      itemId: 'latte',
      variantId: 'm',
      temperature: 'cold',
      qty: 1,
    })

    // Add another Latte M Hot -> increments qty of hot line
    act(() => {
      result.current.add('latte', 'm', [], 2, 'hot')
    })

    expect(result.current.lines.length).toBe(2)
    expect(result.current.lines[0].qty).toBe(3)
    expect(result.current.lines[1].qty).toBe(1)
  })
})
