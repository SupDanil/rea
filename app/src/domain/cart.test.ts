import { describe, expect, it } from 'vitest'

import { testCatalog as staticCatalog } from '../test/catalogFixture'
import { countOf, lineKey, normalizePromo, resolveLine, resolveLines, subtotalOf } from './cart'

describe('domain/cart', () => {
  it('formats lineKey with sorted ingredientIds', () => {
    expect(lineKey('latte', 'm', ['vanilla', 'oat'])).toBe('latte|m|oat|vanilla')
    expect(lineKey('latte', 'm', ['oat', 'vanilla'])).toBe('latte|m|oat|vanilla')
    expect(lineKey('latte', 'm', [])).toBe('latte|m')
  })

  it('counts total quantity correctly', () => {
    const lines = [
      { key: '1', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 2 },
      { key: '2', itemId: 'croissant', variantId: 'one', ingredientIds: [], qty: 3 },
    ]
    expect(countOf(lines)).toBe(5)
  })

  it('resolves valid line with unitPrice including ingredients', () => {
    const line = { key: '1', itemId: 'latte', variantId: 'm', ingredientIds: ['oat', 'vanilla'], qty: 1 }
    const resolved = resolveLine(line, staticCatalog)
    expect(resolved).not.toBeNull()
    expect(resolved?.item.name).toBe('Латте')
    // variant m: 230, oat: 70, vanilla: 50 -> 350
    expect(resolved?.unitPrice).toBe(350)
    expect(resolved?.ingredients).toHaveLength(2)
  })

  it('drops invalid line whose item does not exist', () => {
    const line = { key: 'bad', itemId: 'non-existent', variantId: 'm', ingredientIds: [], qty: 1 }
    expect(resolveLine(line, staticCatalog)).toBeNull()
  })

  it('calculates subtotal across resolved lines', () => {
    const lines = [
      { key: '1', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 2 }, // 230 * 2 = 460
      { key: '2', itemId: 'croissant', variantId: 'one', ingredientIds: [], qty: 1 }, // 160 * 1 = 160
    ]
    expect(subtotalOf(lines, staticCatalog)).toBe(620)
  })

  it('normalizes promo codes for the server check', () => {
    expect(normalizePromo(' shit10 ')).toBe('SHIT10')
    expect(normalizePromo('заяц')).toBe('ЗАЯЦ')
  })

  it('drops a line whose variant no longer exists on the server menu', () => {
    const line = { key: 'x', itemId: 'latte', variantId: 's', ingredientIds: [], qty: 1 }
    expect(resolveLine(line, staticCatalog)).toBeNull()
  })

  it('ignores unknown add-on ids instead of charging for them', () => {
    const line = { key: 'x', itemId: 'latte', variantId: 'm', ingredientIds: ['gone', 'vanilla', 'vanilla'], qty: 1 }
    const resolved = resolveLine(line, staticCatalog)
    expect(resolved?.unitPrice).toBe(230 + 50 * 2)
    expect(resolved?.ingredients.map((i) => i.id)).toEqual(['vanilla', 'vanilla'])
  })

  it('resolveLines filters out unresolvable lines', () => {
    const lines = [
      { key: '1', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 1 },
      { key: '2', itemId: 'ghost', variantId: 'm', ingredientIds: [], qty: 1 },
    ]
    expect(resolveLines(lines, staticCatalog).map((l) => l.key)).toEqual(['1'])
  })
})
