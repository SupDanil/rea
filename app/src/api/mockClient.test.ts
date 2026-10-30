import { beforeEach, describe, expect, it } from 'vitest'
import { MockApiClient } from './mockClient'

describe('api/mockClient', () => {
  let client: MockApiClient

  beforeEach(() => {
    localStorage.clear()
    client = new MockApiClient()
  })

  it('loads catalog data with items, categories, and ingredientGroups', async () => {
    const catalog = await client.getCatalog()
    expect(catalog.items.length).toBeGreaterThan(0)
    expect(catalog.categories.length).toBeGreaterThan(0)
    expect(catalog.ingredientGroups.length).toBeGreaterThan(0)
  })

  it('manages profile authentication and updates', async () => {
    expect(await client.getProfile()).toBeNull()

    const { profile } = await client.verifySmsCode('+7 999 000-11-22', '1234', 'Алиса')
    expect(profile.phone).toBe('+7 999 000-11-22')
    expect(profile.name).toBe('Алиса')

    const updated = await client.updateProfile({ name: 'Алиса К.' })
    expect(updated.name).toBe('Алиса К.')

    await client.signOut()
    expect(await client.getProfile()).toBeNull()
  })

  it('manages order creation and updates', async () => {
    const created = await client.createOrder({
      lines: [{ key: 'latte|m', itemId: 'latte', variantId: 'm', ingredientIds: [], qty: 1 }],
      subtotal: 280,
      discount: 0,
      total: 280,
      name: 'Алиса',
      pickup: { kind: 'asap' },
      payment: 'card',
    })

    expect(created.id).toBeDefined()
    expect(created.number).toBeGreaterThan(0)

    const orders = await client.getOrders()
    expect(orders).toHaveLength(1)
    expect(orders[0].id).toBe(created.id)

    const updated = await client.updateOrder(created.id, { rating: 'good' })
    expect(updated.rating).toBe('good')
  })

  it('validates promo codes', async () => {
    const valid = await client.checkPromo('SHIT10')
    expect(valid.valid).toBe(true)
    expect(valid.percent).toBe(10)

    const invalid = await client.checkPromo('UNKNOWN_PROMO')
    expect(invalid.valid).toBe(false)
  })
})
