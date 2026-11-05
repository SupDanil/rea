import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type { Promotion } from '../../domain'
import { catalogData } from '../../test/catalogFixture'
import { renderApp } from '../../test/renderApp'
import { flyArt } from '../../utils/morph'

vi.mock('../../utils/morph', async (original) => ({
  ...(await original<typeof import('../../utils/morph')>()),
  flyArt: vi.fn(() => Promise.resolve()),
}))

const artOf = (id: string, inside: ParentNode) => inside.querySelector(`[data-art-of="${id}"]`)

describe('Menu card ↔ product screen flight', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(flyArt).mockClear()
    // jsdom has no layout: give the hero stage the size a phone would.
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(426)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(350)
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 120, 132))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const openCappuccino = async () => {
    const app = renderApp('/')
    fireEvent.click(await screen.findByRole('button', { name: /^Капучино, от/ }))
    await screen.findByRole('dialog', { name: 'Капучино' })
    return app
  }

  const openSheet = async () => {
    await openCappuccino()
    return screen.getByRole('dialog', { name: 'Капучино' })
  }

  it('opens by flying the tapped thumbnail onto the live cup, not a rect measured once', async () => {
    const sheet = await openSheet()
    const cup = artOf('cappuccino', sheet)
    const thumb = artOf('cappuccino', document.querySelector('main')!)

    expect(flyArt).toHaveBeenCalledWith(thumb, cup, expect.objectContaining({ rect: expect.any(Function) }))
  })

  it('takes off only after the hero has measured itself, so the flight is planned for the real size', async () => {
    let stageAtTakeOff: string | undefined
    vi.mocked(flyArt).mockImplementation((_from, to) => {
      stageAtTakeOff = (to as Element).closest<HTMLElement>('.will-change-transform')?.style.transform
      return Promise.resolve()
    })

    await openSheet()

    expect(stageAtTakeOff).toContain('scale(2.04)')
  })

  it('sizes the cup from the measured stage before the first paint, not from the fallback', async () => {
    const sheet = await openSheet()
    const stage = artOf('cappuccino', sheet)!.closest<HTMLElement>('.will-change-transform')!

    expect(stage.style.transform).toContain('scale(2.04)')
  })

  it('does not start the cup floating until the flight has landed', async () => {
    const sheet = await openSheet()

    expect(artOf('cappuccino', sheet)!.closest('[class*="float-soft"]')!.className).toContain('float-soft_6s_ease-in-out_1s')
  })

  it('does not blur the cup shadow on the element that keeps moving', async () => {
    const sheet = await openSheet()
    const float = artOf('cappuccino', sheet)!.closest('[class*="float-soft"]')!

    expect(float.className).not.toContain('drop-shadow')
    expect(float.querySelector('[class*="drop-shadow"]')).toContainElement(artOf('cappuccino', sheet) as HTMLElement)
  })

  it('swaps the slot for the toppings deck once the screen is up', async () => {
    const sheet = await openSheet()

    await waitFor(() => expect(sheet.querySelector('section[role="dialog"]')).toBeInTheDocument())
    expect(sheet.querySelector('.h-\\[188px\\]')).toBeNull()
  })

  it('holds the menu still under the product screen', async () => {
    await openCappuccino()
    expect(document.documentElement).toHaveAttribute('data-scroll-lock')

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.documentElement).not.toHaveAttribute('data-scroll-lock')
  })

  it('keeps the next product open when it is tapped while the last one is still leaving', async () => {
    const { router } = await openCappuccino()

    await act(() => router.navigate('/'))
    await act(() => router.navigate('/product/latte'))
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)))

    expect(screen.getByRole('dialog', { name: 'Латте' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Капучино' })).not.toBeInTheDocument()
  })

  describe('with the same product in a promo and in the feed', () => {
    const promo: Promotion = {
      id: 'promo-capp',
      title: 'Попробуй капучино',
      targetType: 'product',
      targetProductId: 'cappuccino',
      placement: 'main',
      sort: 0,
    }
    const catalog = (): typeof catalogData => ({
      ...catalogData,
      promos: [promo],
    })
    const openFrom = async (name: RegExp | string) => {
      renderApp('/', { getCatalog: async () => catalog() })
      const target = typeof name === 'string' ? await screen.findByText(name) : await screen.findByRole('button', { name })
      fireEvent.click(target)
      return screen.findByRole('dialog', { name: 'Капучино' })
    }
    const inSlot = (slot: string) => document.querySelector(`[data-art-of="cappuccino"][data-art-slot="${slot}"]`)

    it('leaves from and returns to the feed card when that is what was tapped', async () => {
      const sheet = await openFrom(/^Капучино, от/)
      const cup = artOf('cappuccino', sheet)
      expect(flyArt).toHaveBeenCalledWith(inSlot('card'), cup, expect.anything())
      vi.mocked(flyArt).mockClear()

      fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

      await waitFor(() => expect(flyArt).toHaveBeenCalledWith(cup, inSlot('card'), expect.anything()))
    })

    it('leaves from and returns to the promo when that is what was tapped', async () => {
      const sheet = await openFrom('Попробуй капучино')
      const cup = artOf('cappuccino', sheet)
      expect(flyArt).toHaveBeenCalledWith(inSlot('promo-capp'), cup, expect.anything())
      vi.mocked(flyArt).mockClear()

      fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

      await waitFor(() => expect(flyArt).toHaveBeenCalledWith(cup, inSlot('promo-capp'), expect.anything()))
    })
  })

  it('closes by flying the cup back onto its card', async () => {
    const sheet = await openSheet()
    const cup = artOf('cappuccino', sheet)
    const thumb = artOf('cappuccino', document.querySelector('main')!)
    vi.mocked(flyArt).mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }))

    await waitFor(() => expect(flyArt).toHaveBeenCalledWith(cup, thumb, expect.anything()))
  })
})
