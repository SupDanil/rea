import { Sheet, SheetBody } from './Sheet'
import { prepRange, shopStatus, type Shop } from '../domain'
import { useNow } from '../hooks/useNow'
import { useShopsQuery } from '../queries/useShop'
import { useApp } from '../state/AppContext'
import { openDot } from './ui'

interface ShopPickerSheetProps {
  onClose: () => void
}

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
        <div className="space-y-3 pb-8">
          <p className="text-[14px] text-muted mb-4">
            Выберите удобное заведение, чтобы забрать свежий кофе:
          </p>

          {shops.map((shop) => {
            const isCurrent = shop.id === activeId
            const status = shopStatus(shop, now)
            const isOpen = status.kind === 'open'

            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => handleSelect(shop)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-accent/10 border-accent/40 shadow-sm'
                    : 'bg-surface border-line hover:border-accent/30'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[16px] text-ink">{shop.name}</span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent text-white">
                        Выбрано
                      </span>
                    )}
                  </div>

                  <div className="text-[13px] text-ink font-medium mt-0.5 truncate">
                    {shop.address}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                    <span className={isOpen ? openDot : 'size-1.5 rounded-full bg-danger'} aria-hidden="true" />
                    <span>{status.text}</span>
                    <span>·</span>
                    <span>~{prepRange(shop)} мин</span>
                  </div>
                </div>

                <div className="flex-none">
                  <div
                    className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'border-accent bg-accent text-white'
                        : 'border-line text-transparent'
                    }`}
                  >
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5L6.5 12L13 4" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </SheetBody>
    </Sheet>
  )
}
