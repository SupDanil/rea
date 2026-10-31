import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OrderStatusCard } from './OrderStatusCard'
import { ShopPickerSheet } from '../../components/ShopPickerSheet'
import { AppProvider } from '../../state/AppProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Order } from '../../domain'
import { api } from '../../api'

const mockOrder: Order = {
  id: 'ord-smart-123',
  number: 42,
  createdAt: Date.now() - 60000,
  readyAt: Date.now() - 10000,
  status: 'ready',
  lines: [],
  subtotal: 350,
  discount: 0,
  total: 350,
  name: 'Данил',
  pickup: { kind: 'asap' },
  payment: 'card',
}

describe('Smart Pickup & QR flow (Luckin Coffee logic)', () => {
  it('renders order number and QR code for ready order', async () => {
    const onRate = vi.fn()

    render(
      <OrderStatusCard
        order={mockOrder}
        status="ready"
        now={Date.now()}
        onRate={onRate}
      />
    )

    // Should display order number
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Заказ готов')).toBeInTheDocument()
    expect(screen.getByText('Покажите QR-код сканеру на стойке')).toBeInTheDocument()

    // Wait for async QR svg render
    await waitFor(() => {
      expect(document.querySelector('svg')).toBeInTheDocument()
    })

    // In production, the customer cannot prematurely close the order — only the counter scanner or barista KDS completes it
    expect(screen.queryByRole('button', { name: /Заказ забрал/i })).not.toBeInTheDocument()
  })

  it('renders pleasant completion state when order is completed', () => {
    render(
      <OrderStatusCard
        order={{ ...mockOrder, status: 'completed' }}
        status="completed"
        now={Date.now()}
        onRate={vi.fn()}
      />
    )

    expect(screen.getByText('Заказ выдан')).toBeInTheDocument()
    expect(screen.getByText(/Заказ выдан. Приятного кофепития!/i)).toBeInTheDocument()
    // QR code is hidden once completed
    expect(screen.queryByText('Покажите QR-код сканеру на стойке')).not.toBeInTheDocument()
  })

  it('ShopPickerSheet lists coffee shops and allows selection', async () => {
    const shops = [
      {
        id: 'shop-nevsky',
        name: 'shit кофе на Невском',
        slug: 'nevsky',
        address: 'Невский, 12',
        phone: '+7 999 000-11-22',
        isAccepting: true,
        hours: { opensAt: '08:00', closesAt: '22:00' },
        basePrepMinutes: 6,
      },
      {
        id: 'shop-konyushennaya',
        name: 'shit кофе на Конюшенной',
        slug: 'konyushennaya',
        address: 'Большая Конюшенная, 4',
        phone: '+7 999 333-44-55',
        isAccepting: true,
        hours: { opensAt: '09:00', closesAt: '23:00' },
        basePrepMinutes: 8,
      },
    ]

    vi.spyOn(api, 'getShops').mockResolvedValue(shops as any)
    const onClose = vi.fn()
    const qc = new QueryClient()

    render(
      <QueryClientProvider client={qc}>
        <AppProvider>
          <ShopPickerSheet onClose={onClose} />
        </AppProvider>
      </QueryClientProvider>
    )

    // Should list both coffee shops
    expect(await screen.findByText('shit кофе на Невском')).toBeInTheDocument()
    expect(screen.getByText('Большая Конюшенная, 4')).toBeInTheDocument()

    // Click on the second shop to select it
    fireEvent.click(screen.getByText('Большая Конюшенная, 4'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
