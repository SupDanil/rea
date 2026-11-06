import { prepRange, type Shop,shopStatus } from '../domain'
import { useNow } from '../hooks/useNow'
import { useShopsQuery } from '../queries/useShop'
import { useApp } from '../state/AppContext'
import { Button } from './Button'
import { Sheet, SheetBody } from './Sheet'
import { openDot } from './ui'

interface ShopPickerSheetProps {
  onClose: () => void
}

/**
 * 2026 Liquid Glass ShopPickerSheet:
 * Large coffee shop cards with open status, waiting time, and rich crema amber selection glow.
 */
export function ShopPickerSheet({ onClose }: ShopPickerSheetProps) {
  const { data: shops = [] } = useShopsQuery()
  const { selectedShopId, setSelectedShopId, showToast } = useApp()
  const now = useNow(60_000)

  const activeId = selectedShopId || shops[0]?.id

  const handleSelect = (shop: Shop) => {
    setSelectedShopId(shop.id)
    showToast({ text: `Выбрана кофейня: ${shop.name} (${shop.address})` })
    onClose()
  }

  return (
    <Sheet label="Выбор кофейни" title="Кофейни" onBack={onClose} backLabel="Назад">
      <SheetBody>
        <div className="space-y-3.5 pb-8 pt-2">
          <p className="text-body text-muted mb-3 font-medium">
            Выберите удобное заведение, чтобы забрать свежий кофе:
          </p>

          {shops.map((shop) => {
            const isCurrent = shop.id === activeId
            const status = shopStatus(shop, now)
            const isOpen = status.kind === 'open'

            return (
              <Button
                key={shop.id}
                type="button"
                onClick={() => handleSelect(shop)}
                className={`w-full text-left p-4 sm:p-5 rounded-card transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 relative overflow-hidden active:scale-98 ${
                  isCurrent
                    ? 'bg-surface/95 border-(length:--stroke-width-strong) border-accent shadow-selected dark:shadow-selected'
                    : 'bg-surface/80 border-(length:--stroke-width) border-line hover:border-accent/40 shadow-sm'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-display font-bold text-body-lg text-ink">{shop.name}</span>
                    {isCurrent && (
                      <span className="text-micro font-display font-bold px-2.5 py-0.5 rounded-pill bg-accent text-accent-ink shadow-sm">
                        Выбрано
                      </span>
                    )}
                  </div>

                  <div className="text-body text-ink-2 font-medium mt-1 truncate">
                    {shop.address}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-caption text-muted font-medium">
                    <span className={isOpen ? openDot : 'size-2 rounded-pill bg-danger'} aria-hidden="true" />
                    <span className={isOpen ? 'text-open font-semibold' : 'text-danger font-semibold'}>
                      {status.text}
                    </span>
                    <span>·</span>
                    <span className="text-ink-2 font-semibold">~{prepRange(shop)} мин</span>
                  </div>
                </div>

                <div className="flex-none">
                  <div
                    className={`size-7 rounded-pill border-(length:--stroke-width-strong) flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'border-accent bg-accent text-accent-ink shadow-sm scale-105'
                        : 'border-faint text-transparent'
                    }`}
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-strong)" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5L6.5 12L13 4" />
                    </svg>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </SheetBody>
    </Sheet>
  )
}
