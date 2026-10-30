import { itemById, itemsOf } from '../../data/menu'
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
  const spy = useMenuScrollSpy()
  const hero = itemById.get(spy.activeTop.heroItemId ?? '')
  const open = (id: string) => go(`/product/${id}`)

  return (
    <div>
      <MenuHeader />
      {hero && <HeroBanner item={hero} onOpen={() => open(hero.id)} />}
      <CategoryNav
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
              'scroll-mt-(--tabs-h) px-2.5 sm:px-3 pt-3.5 sm:pt-[18px] pb-1',
              // Tall enough to scroll up under the tab bar, so its tab can land on it and stay lit.
              i === spy.sections.length - 1 && 'min-h-[calc(100dvh-var(--tabs-h)-24px)]',
            )}
          >
            <h2 className="mx-1 mb-2.5 sm:mb-3 text-[20px] sm:text-[22px]">{sub.name}</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {itemsOf(sub.id).map((item) => (
                <ProductCard key={item.id} item={item} onOpen={() => open(item.id)} />
              ))}
            </div>
          </section>
        ))}
        <p className="px-8 pt-7 pb-[calc(96px+env(safe-area-inset-bottom))] text-center text-[12px] text-muted">
          Цены указаны для кофейни на Невском. Состав и аллергены — в карточке товара.
        </p>
      </main>
    </div>
  )
}
