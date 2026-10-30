import { describe, expect, it } from 'vitest'
import { countOf, lineKey, normalizePromo, promoCodes, resolveLine, subtotalOf } from './cart'
import { staticCatalog } from '../queries/useCatalog'

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

  it('normalizes promo codes and finds valid discounts', () => {
    expect(normalizePromo(' shit10 ')).toBe('SHIT10')
    expect(promoCodes[normalizePromo('заяц')].percent).toBe(15)
    expect(promoCodes[normalizePromo('rabbit')].percent).toBe(15)
  })
})
