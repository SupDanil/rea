import { EmptyState } from '../../components/EmptyState'
import { useCatalog, useCatalogQuery } from '../../queries/useCatalog'
import { useShop } from '../../queries/useShop'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { cx } from '../../utils/cx'
import { CategoryNav } from './CategoryNav'
import { HeroBanner } from './HeroBanner'
import { MenuHeader } from './MenuHeader'
import { ProductCard } from './ProductCard'
import { sectionId, useMenuScrollSpy } from './useMenuScrollSpy'

/** The base layer: every other screen opens on top of it. */
export function MenuPage() {
  const { go } = useAppNavigate()
  const { isPending, isError, refetch } = useCatalogQuery()
  const catalog = useCatalog()
  const shop = useShop()
  const spy = useMenuScrollSpy(catalog)
  const hero = catalog.itemById.get(spy.activeTop?.heroItemId ?? '')
  const open = (id: string) => go(`/product/${id}`)

  if (!spy.activeTop) {
    return (
      <div className="flex min-h-dvh flex-col">
        <MenuHeader />
        {isPending ? (
          <MenuSkeleton />
        ) : (
          <EmptyState
            title={isError ? 'Меню не загрузилось' : 'Меню пока пустое'}
            text={isError ? 'Проверьте интернет и попробуйте ещё раз' : 'Скоро здесь появятся напитки и еда'}
            actionLabel="Обновить"
            onAction={() => void refetch()}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <MenuHeader />
      {hero && <HeroBanner item={hero} onOpen={() => open(hero.id)} />}
      <CategoryNav
        catalog={catalog}
        navRef={spy.navRef}
        activeTop={spy.activeTop}
        activeSub={spy.activeSub}
        activeSubs={spy.activeSubs}
        showSubtabs={spy.showSubtabs}
        onSelect={spy.scrollToSub}
      />
      <main>
        {spy.sections.map(({ sub }, i) => (
          <section
            key={sub.id}
            id={sectionId(sub.id)}
            className={cx(
              'scroll-mt-(--tabs-h) px-2.5 sm:px-3 pt-4 sm:pt-5 pb-1',
              // Tall enough to scroll up under the tab bar, so its tab can land on it and stay lit.
              i === spy.sections.length - 1 && 'min-h-[calc(100dvh-var(--tabs-h)-24px)]',
            )}
          >
            <h2 className="mx-1 mb-3 font-display text-[20px] sm:text-[22px] font-bold text-ink tracking-tight">
              {sub.name}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 wide:grid-cols-3 wide:gap-3.5 lg:grid-cols-4">
              {(() => {
                const items = catalog.itemsOf(sub.id)
                return items.map((item, idx) => {
                  const isWide = Boolean(item.badge) || (idx === 0 && items.length >= 3)
                  return <ProductCard key={item.id} item={item} onOpen={() => open(item.id)} isWide={isWide} />
                })
              })()}
            </div>
          </section>
        ))}
        <p className="px-8 pt-7 pb-[calc(96px+env(safe-area-inset-bottom))] text-center text-[12px] text-muted">
          {shop ? `Цены указаны для кофейни: ${shop.address}. ` : ''}Состав и аллергены — в карточке товара.
        </p>
      </main>
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="px-2.5 sm:px-3 pt-4" role="status" aria-label="Загружаем меню">
      <div className="mb-4 flex gap-3.5 px-1">
        {[72, 96, 64].map((w) => (
          <div key={w} className="h-6 rounded-lg bg-surface-2 animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 wide:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[220px] rounded-[22px] bg-surface-2 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
