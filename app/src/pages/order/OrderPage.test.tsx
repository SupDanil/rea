import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '../../api'
import * as AppNavigateModule from '../../hooks/useAppNavigate'
import { queryKeys } from '../../queries/keys'
import * as AppContextModule from '../../state/AppContext'
import type { Order } from '../../state/orders'
import { catalogData, testShop } from '../../test/catalogFixture'
import { OrderPage } from './OrderPage'

/** Minimal EventSource stand-in so the SSE path can be driven from the test. */
class FakeEventSource {
  static instances: FakeEventSource[] = []
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  closed = false
  url: string
  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }
  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
  }
  close() {
    this.closed = true
  }
}

describe('OrderPage real-time order tracking', () => {
  const mockBack = vi.fn()
  const mockUpdate = vi.fn()
  const mockMerge = vi.fn()
  const mockUpsert = vi.fn()
  const mockShowToast = vi.fn()

  const sampleOrder: Order = {
    id: 'ord-test-456',
    number: 88,
    createdAt: Date.now() - 60_000,
    readyAt: Date.now() + 300_000,
    lines: [{ key: 'cappuccino|m', itemId: 'cappuccino', variantId: 'm', ingredientIds: ['vanilla'], qty: 1 }],
    subtotal: 260,
    discount: 0,
    total: 260,
    name: 'Данил',
    pickup: { kind: 'asap' },
    payment: 'card',
    status: 'accepted',
  }

  const mockApp = (orders: Order[], profile: any = { phone: sampleOrder.phone, name: sampleOrder.name }) =>
    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      orders: { orders, update: mockUpdate, merge: mockMerge, upsert: mockUpsert },
      showToast: mockShowToast,
      profile,
    } as any)

  const renderPage = (orderId = 'ord-test-456') => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    queryClient.setQueryData(queryKeys.catalog, catalogData)
    queryClient.setQueryData(queryKeys.shops, [testShop])
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/order/${orderId}`]}>
          <Routes>
            <Route path="/order/:id" element={<OrderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockUpdate.mockReset().mockResolvedValue(sampleOrder)
    mockMerge.mockReset()
    mockUpsert.mockReset()
    mockShowToast.mockReset()
    FakeEventSource.instances = []
    vi.stubGlobal('EventSource', FakeEventSource)
    vi.spyOn(AppNavigateModule, 'useAppNavigate').mockReturnValue({ go: vi.fn(), back: mockBack, replace: vi.fn() } as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders order details and its lines resolved against the live catalog', () => {
    mockApp([sampleOrder])
    renderPage()
    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByText('Данил')).toBeInTheDocument()
    expect(screen.getByText('shit кофе на Невском · Невский проспект, 12')).toBeInTheDocument()
    expect(screen.getByText('Капучино')).toBeInTheDocument()
    expect(screen.getByText(/Ваниль/)).toBeInTheDocument()
  })

  it('subscribes to the server SSE stream and merges pushed statuses', () => {
    mockApp([sampleOrder])
    const { unmount } = renderPage()
    const es = FakeEventSource.instances[0]
    expect(es.url).toBe(api.orderEventsUrl('ord-test-456'))

    act(() => es.emit({ id: 'ord-test-456', status: 'making' }))
    expect(mockMerge).toHaveBeenCalledWith('ord-test-456', { id: 'ord-test-456', status: 'making' })

    unmount()
    expect(es.closed).toBe(true)
  })

  it('ignores malformed SSE frames', () => {
    mockApp([sampleOrder])
    renderPage()
    act(() => FakeEventSource.instances[0].onmessage?.({ data: 'not json' } as MessageEvent))
    expect(mockMerge).not.toHaveBeenCalled()
  })

  it('falls back to polling GET /orders/:id when the stream errors', async () => {
    vi.useFakeTimers()
    try {
      mockApp([sampleOrder])
      const getOrder = vi.spyOn(api, 'getOrder').mockResolvedValue({ ...sampleOrder, status: 'ready' })
      renderPage()
      act(() => FakeEventSource.instances[0].onerror?.())
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })
      expect(getOrder).toHaveBeenCalledWith('ord-test-456')
      expect(mockMerge).toHaveBeenCalledWith('ord-test-456', expect.objectContaining({ status: 'ready' }))
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not open a stream for a cancelled order', () => {
    mockApp([{ ...sampleOrder, status: 'cancelled', cancelledAt: Date.now() }])
    renderPage()
    expect(FakeEventSource.instances).toHaveLength(0)
  })

  it('cancelling asks the server and shows an error when it is too late', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('409'))
    mockApp([sampleOrder])
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Отменить заказ' }))
    fireEvent.click(screen.getByRole('button', { name: 'Отменить' }))
    expect(mockUpdate).toHaveBeenCalledWith('ord-test-456', { cancelledAt: expect.any(Number) })
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith({ text: expect.stringContaining('отменить не получилось') }))
  })

  it('fetches the order from the API if it is not in state yet', async () => {
    mockApp([])
    const getOrder = vi.spyOn(api, 'getOrder').mockResolvedValue(sampleOrder)
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем заказ')
    await waitFor(() => expect(mockUpsert).toHaveBeenCalledWith(sampleOrder))
    expect(getOrder).toHaveBeenCalledWith('ord-test-456')
  })

  it('shows "not found" when the server has no such order', async () => {
    mockApp([])
    vi.spyOn(api, 'getOrder').mockResolvedValue(null)
    renderPage()
    expect(await screen.findByRole('heading', { level: 2, name: 'Заказ не найден' })).toBeInTheDocument()
  })

  it('shows a load error (not "not found") when the server is unreachable', async () => {
    mockApp([])
    vi.spyOn(api, 'getOrder').mockRejectedValue(new Error('offline'))
    renderPage()
    expect(await screen.findByRole('heading', { level: 2, name: 'Не удалось загрузить заказ' })).toBeInTheDocument()
  })

  it('signed out, the order route shows the login', async () => {
    mockApp([sampleOrder], null)
    renderPage()
    expect(await screen.findByText('Вход по номеру')).toBeInTheDocument()
  })

  it('shows not found when order belongs to a different phone', async () => {
    const orderWithPhone = { ...sampleOrder, phone: '+79991112233' }
    mockApp([orderWithPhone], { phone: '+79998887766', name: 'Чужой' })
    renderPage()
    expect(await screen.findByText('Этот заказ был сделан другим пользователем')).toBeInTheDocument()
  })
})
