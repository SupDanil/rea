import { useCallback, useEffect, useState } from 'react'

import { EmptyState } from '../../components/EmptyState'
import { Loader } from '../../components/Loader'
import type { Promotion } from '../../domain'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useCatalog, useCatalogQuery } from '../../queries/useCatalog'
import { useShop } from '../../queries/useShop'
import { cx } from '../../utils/cx'
import { preloadCriticalImages } from '../../utils/imagePreload'
import { PAGE_ATTR } from '../../utils/morph'
import { CategoryNav } from './CategoryNav'
import { MenuHeader } from './MenuHeader'
import { CARD_SLOT, ProductCard } from './ProductCard'
import { PromoBanner } from './PromoBanner'
import { sectionId, useMenuScrollSpy } from './useMenuScrollSpy'

/** The base layer: every other screen opens on top of it. */
export function MenuPage() {
  const { go } = useAppNavigate()
  const { isPending, isError, refetch } = useCatalogQuery()
  const catalog = useCatalog()
  const shop = useShop()
  const spy = useMenuScrollSpy(catalog)

  const [imagesReady, setImagesReady] = useState(() => {
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return true
    return false
  })
  const [loaderMounted, setLoaderMounted] = useState(true)

  const mainPromo = catalog.mainPromo
  const mainPromoProduct = catalog.itemById.get(mainPromo?.targetProductId ?? mainPromo?.productIds?.[0] ?? '')

  useEffect(() => {
    if (!catalog.items.length) return
    const criticalUrls: string[] = []
    if (mainPromo?.imageUrl) criticalUrls.push(mainPromo.imageUrl)
    if (mainPromoProduct?.imageUrl) criticalUrls.push(mainPromoProduct.imageUrl)
    for (const item of catalog.items) {
      if (item.imageUrl) criticalUrls.push(item.imageUrl)
      if (criticalUrls.length >= 6) break
    }

    const isTest = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
    const minDelay = isTest ? 0 : 550

    Promise.all([
      preloadCriticalImages(criticalUrls, 1200),
      new Promise((resolve) => setTimeout(resolve, minDelay)),
    ]).finally(() => {
      setImagesReady(true)
    })
  }, [catalog.items, mainPromo?.imageUrl, mainPromoProduct?.imageUrl])

  useEffect(() => {
    if (spy.activeTop && imagesReady) {
      const timer = setTimeout(() => setLoaderMounted(false), 380)
      return () => clearTimeout(timer)
    }
  }, [spy.activeTop, imagesReady])

  const open = useCallback((id: string) => go(`/product/${id}`, { artSlot: CARD_SLOT }), [go])
  const openPromo = (promo: Promotion) => {
    if (promo.targetType === 'product' && promo.targetProductId) {
      go(`/product/${promo.targetProductId}`, { artSlot: promo.id })
    } else {
      go(`/promo/${promo.id}`)
    }
  }

  if (!spy.activeTop) {
    return (
      <div className="flex min-h-dvh flex-col">
        {isPending ? (
          <Loader />
        ) : (
          <>
            <MenuHeader />
            <EmptyState
              title={isError ? 'Меню не загрузилось' : 'Меню пока пустое'}
              text={isError ? 'Проверьте интернет и попробуйте ещё раз' : 'Скоро здесь появятся напитки и еда'}
              actionLabel="Обновить"
              onAction={() => void refetch()}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div {...{ [PAGE_ATTR]: '' }}>
      {loaderMounted && <Loader isExiting={imagesReady} />}
      <MenuHeader />
      {mainPromo && (
        <PromoBanner
          promo={mainPromo}
          product={mainPromoProduct}
          onOpen={() => openPromo(mainPromo)}
          variant="hero"
        />
      )}
      <CategoryNav
        catalog={catalog}
        navRef={spy.navRef}
        activeTop={spy.activeTop}
        activeSub={spy.activeSub}
        activeSubs={spy.activeSubs}
        showSubtabs={spy.showSubtabs}
        onSelect={spy.scrollToSub}
      />
      <main className="relative z-0">
        {spy.sections.map(({ sub }, i) => {
          const categoryPromo =
            catalog.promoByCategory.get(sub.id) ||
            (sub.parentId ? catalog.promoByCategory.get(sub.parentId) : undefined)
          const categoryPromoProduct = catalog.itemById.get(categoryPromo?.targetProductId ?? categoryPromo?.productIds?.[0] ?? '')
          const items = catalog.itemsOf(sub.id)

          return (
            <section
              key={sub.id}
              id={sectionId(sub.id)}
              className={cx(
                'scroll-mt-(--tabs-h) px-2.5 sm:px-3 pt-4 sm:pt-5 pb-1',
                // Tall enough to scroll up under the tab bar, so its tab can land on it and stay lit.
                i === spy.sections.length - 1 && 'min-h-[calc(100dvh-var(--tabs-h)-calc(var(--space-unit)*6))]',
              )}
            >
              <h2 className="mx-1 mb-3 font-display text-title-sm sm:text-title font-bold text-ink tracking-tight">
                {sub.name}
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 wide:grid-cols-3 wide:gap-3.5 lg:grid-cols-4">
                {categoryPromo && (
                  <PromoBanner
                    promo={categoryPromo}
                    product={categoryPromoProduct}
                    onOpen={() => openPromo(categoryPromo)}
                    variant="category"
                  />
                )}
                {items.map((item) => (
                  <ProductCard key={item.id} item={item} onOpen={open} />
                ))}
              </div>
            </section>
          )
        })}
        <p className="px-8 pt-7 pb-[calc(calc(var(--space-unit)*24)+env(safe-area-inset-bottom))] text-center text-caption text-muted">
          {shop ? `Цены указаны для кофейни: ${shop.address}. ` : ''}Состав и аллергены — в карточке товара.
        </p>
      </main>
    </div>
  )
}
