import { type CSSProperties,useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useNavigationType, useParams } from 'react-router'

import { useIsLeaving } from '../../app/leaving'
import { IconButton } from '../../components/Button'
import { CloseIcon, InfoIcon, SnowflakeIcon } from '../../components/icons'
import { Modal } from '../../components/Modal'
import { SegmentedControl } from '../../components/SegmentedControl'
import { defaultTemperature, type Ingredient, type IngredientGroup, itemImage, type MenuItem } from '../../domain'
import { useAfterFirstPaint } from '../../hooks/useAfterFirstPaint'
import { useAppNavigate } from '../../hooks/useAppNavigate'
import { useCatalog, useCatalogQuery } from '../../queries/useCatalog'
import { useApp } from '../../state/AppContext'
import { cx } from '../../utils/cx'
import { findThumb, flyArt, MORPH, settledRect, TO_CART } from '../../utils/morph'
import { bounce, pop } from '../../utils/motion'
import { AddToCartButton } from './AddToCartButton'
import { CraftDeck, CraftDeckSlot } from './CraftDeck'
import { CraftTabBar } from './CraftTabBar'
import { HeroBuilderArea } from './HeroBuilderArea'
import { NutritionBar } from './NutritionBar'
import { SizePicker } from './SizePicker'
import { useProductConfig } from './useProductConfig'

// The check stays on the button for a beat before the cup flies to the cart.
const CONFIRM_MS = 420

export function ProductPage() {
  const { id = '' } = useParams()
  const { isPending } = useCatalogQuery()
  const catalog = useCatalog()
  const item = catalog.itemById.get(id)
  // A deep link can arrive before the menu does: wait for it rather than bouncing to the menu.
  if (!item && isPending) return <div className="min-h-dvh" role="status" aria-label="Загружаем товар" />
  if (!item) return <Navigate to="/" replace />
  return <ProductView item={item} />
}

function ProductView({ item }: { item: MenuItem }) {
  const { cart } = useApp()
  const { back, artSlot } = useAppNavigate()
  const config = useProductConfig(item)
  const { variant, openGroupId, setOpenGroupId } = config
  const [showDetails, setShowDetails] = useState(false)
  const [added, setAdded] = useState(false)
  const [openedWith] = useState(item.id)
  // Remembered, not read live: on its way out the screen already sees the next route's state.
  const [slot] = useState(artSlot)
  // Only a tap flies. Reloaded on this screen, there is no tap, and a copy on the top layer would
  // show through the loader.
  const [tapped] = useState(useNavigationType() === 'PUSH')

  const isOnlyCold = item.temperatureMode === 'cold'
  const isBoth = item.temperatureMode === 'both'

  const [temperature, setTemperature] = useState(() => defaultTemperature(item))
  const effectiveHeroImage = itemImage(item, temperature)

  const cupRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const artRef = useRef<SVGSVGElement>(null)
  const toCart = useRef(false)
  const leaving = useIsLeaving()

  // The heaviest part of the screen: built once the flight is already in the air.
  const deckReady = useAfterFirstPaint()

  const activeGroupId = openGroupId ?? config.groups[0]?.id ?? null
  const activeGroup = config.groups.find((g) => g.id === activeGroupId)


  const pick = (group: IngredientGroup, ingredient: Ingredient) => {
    const landed = group.counter ? config.addOne(group, ingredient) : config.toggle(group, ingredient.id)
    if (landed && cupRef.current) {
      bounce(cupRef.current, 0.5)
    }
  }

  // Opening: the thumbnail you tapped (menu card, hero, cart line) flies into the cup's place.
  useLayoutEffect(() => {
    const art = artRef.current
    const sheet = sheetRef.current
    const thumb = findThumb(openedWith, { exclude: sheet, slot, leaving: true })
    if (!tapped || !art || !sheet || !thumb) return
    // After the commit: the hero sizes itself right behind this effect, and a flight planned
    // before that would head for the wrong size for as long as a slow phone stalls.
    queueMicrotask(() => void flyArt(thumb, art, { ...MORPH, rect: (el) => settledRect(el, sheet) }))
  }, [openedWith, slot, tapped])

  // Closing: cup flies back to menu or into cart dock.
  useLayoutEffect(() => {
    const art = artRef.current
    if (!leaving || !art) return
    if (toCart.current) {
      const badge = document.querySelector('[data-cart-badge]')
      if (badge) void flyArt(art, badge, { ...TO_CART, landFade: true }).then(() => pop(badge))
      return
    }
    const exclude = sheetRef.current
    // After the commit, like the opening: the screen coming back settles in its own layout effect.
    queueMicrotask(() => {
      const thumb = findThumb(item.id, { exclude, slot }) ?? findThumb(openedWith, { exclude, slot })
      if (thumb) void flyArt(art, thumb, MORPH)
    })
  }, [leaving, item.id, openedWith, slot])

  const add = () => {
    cart.add(item.id, variant.id, config.chosen.map((i) => i.id), 1, temperature)
    setAdded(true)
    window.setTimeout(() => {
      toCart.current = true
      back()
    }, CONFIRM_MS)
  }

  return (
    <Modal
      label={item.name}
      onClose={showDetails ? () => setShowDetails(false) : back}
      kind="screen"
      panelRef={sheetRef}
      className="brand-product tinted mesh-grain text-pd-ink"
      style={{
        '--tint': item.art.bg,
        background: 'var(--background-product)',
      } as CSSProperties}
    >
        {/* ================= 1. ШАПКА ================= */}
        <header className="flex-none z-30 grid grid-cols-[calc(var(--space-unit)*11)_1fr_calc(var(--space-unit)*11)] items-center px-4 pt-[calc(calc(var(--space-unit)*2.5)+env(safe-area-inset-top))] pb-0.5 bg-transparent wide:px-6 wide:pt-4">
          <IconButton
            className="grid bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border-(length:--stroke-width) border-pd-line transition-all"
            onClick={back}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </IconButton>

          <h1
            key={item.id}
            className="text-center font-display text-lead xs:text-title-sm wide:text-title font-bold text-pd-ink tracking-tight leading-(--leading-title) line-clamp-2 text-balance px-2"
          >
            {item.name}
          </h1>

          <IconButton
            className={cx(
              ' grid   bg-pd-glass hover:bg-pd-glass-hover text-pd-ink border-(length:--stroke-width) border-pd-line transition-all    justify-self-end',
              showDetails && 'ui-control-selected',
            )}
            onClick={() => setShowDetails((v) => !v)}
            aria-label="О напитке"
            aria-expanded={showDetails}
            aria-controls={showDetails ? 'product-details' : undefined}
          >
            <InfoIcon size={18} />
          </IconButton>
        </header>

        {/* Floating Info Popover */}
        {showDetails && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 animate-[fade-only_0.2s_ease_both]"
              onClick={() => setShowDetails(false)}
              aria-hidden="true"
            />
            <div
              className={cx(
                'absolute top-[calc(calc(var(--space-unit)*14)+env(safe-area-inset-top))] right-3 left-3 sm:right-4 sm:left-4 z-50',
                'max-h-[calc(100%-calc(var(--space-unit)*18)-env(safe-area-inset-top))] overflow-y-auto p-4 rounded-panel bg-pd-panel text-pd-ink border-(length:--stroke-width) border-pd-line shadow-lift',
                'animate-[rise_0.22s_var(--ease-soft)_both] text-compact leading-relaxed',
              )}
              id="product-details" role="region" aria-label="О напитке"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b-(length:--stroke-width) border-pd-line">
                <span className="font-display font-bold text-body">О напитке</span>
                <IconButton variant="ghost"
                  onClick={() => setShowDetails(false)}
                  aria-label="Закрыть описание"
                >
                  <CloseIcon />
                </IconButton>
              </div>
              <p className="font-medium text-pd-ink">{item.description}</p>
              <p className="mt-2 text-pd-ink-2">
                <b className="font-bold text-pd-ink">Состав:</b> {item.composition}
              </p>
              <NutritionBar nutrition={config.nutrition} />
              {item.allergens && (
                <p className="mt-1 text-pd-ink-2">
                  <b className="font-bold text-pd-ink">Аллергены:</b> {item.allergens}
                </p>
              )}
            </div>
          </>
        )}

        {/* ================= 2. СКРОЛЛИРУЕМОЕ ТЕЛО (МЕЖДУ ШАПКОЙ И ФИКСИРОВАННЫМ ФУТЕРОМ) ================= */}
        <div className="flex-1 min-h-0 flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain no-scrollbar">
          {/* Temperature and size selectors */}
          <div className="flex-none flex flex-wrap items-center justify-center gap-2 wide:gap-3 w-full pt-1 pb-1 px-4 wide:pt-2 wide:pb-1 z-30">
            {isBoth && (
              <SegmentedControl label="Температура" tone="product" cycleOnSelected value={temperature ?? 'hot'}
                onChange={(next) => { setTemperature(next); if (cupRef.current) bounce(cupRef.current, 0.4) }}
                options={[{ value: 'hot' as const, label: 'Горячий', accessibleLabel: 'Горячий' }, { value: 'cold' as const, label: 'Холодный', accessibleLabel: 'Холодный' }]} />
            )}
            {isOnlyCold && (
              <div
                className="flex items-center justify-center size-8 rounded-pill bg-pd-glass border-(length:--stroke-width) border-pd-line shadow-xs text-cold dark:text-cold-ink shrink-0 select-none"
                title="Холодный напиток"
                aria-label="Холодный напиток"
              >
                <SnowflakeIcon size={16} />
              </div>
            )}
            {item.variants.length > 1 && variant.size !== 'ONE' && (
              <SizePicker
                variants={item.variants}
                selected={config.variantIdx}
                onSelect={(idx) => {
                  config.setVariantIdx(idx)
                  if (cupRef.current) bounce(cupRef.current, 0.4)
                }}
              />
            )}
          </div>

          {/* Hero Stage: Cup + Addons List, absorbs the central space */}
          <div className="flex-1 min-h-(--product-stage-min) flex flex-col items-center justify-center w-full py-1 self-stretch">
            <HeroBuilderArea
              item={item}
              variant={variant}
              groups={config.groups}
              selection={config.selection}
              onRemoveAll={(group, ingredientId) => config.removeAll(group, ingredientId)}
              cupRef={cupRef}
              artRef={artRef}
              openedWith={openedWith}
              imageUrl={effectiveHeroImage}
              temperature={temperature}
            />
          </div>

          {/* Controls: Group Tabs + CoverFlow Carousel */}
          <div className="flex-none flex flex-col items-center w-full pt-1 wide:pt-2">
            {/* Category Tabs */}
            {config.groups.length > 0 && (
              <div className="w-full flex justify-center mb-1">
                <CraftTabBar
                  groups={config.groups}
                  selection={config.selection}
                  activeGroupId={activeGroupId}
                  onSelectGroup={(id) => setOpenGroupId(id)}
                />
              </div>
            )}

            {/* Centered CoverFlow Carousel with scale-110 active card brought forward */}
            {activeGroup && !deckReady && <CraftDeckSlot group={activeGroup} />}
            {activeGroup && deckReady && (
              <CraftDeck
                key={activeGroup.id}
                group={activeGroup}
                groupIndex={config.groups.indexOf(activeGroup)}
                qtyOf={(id) => config.qtyOf(activeGroup, id)}
                total={config.totalOf(activeGroup)}
                canAdd={(ing) => config.canAdd(activeGroup, ing)}
                onPick={(ing) => pick(activeGroup, ing)}
                onRemove={(ing) => config.removeOne(activeGroup, ing.id)}
              />
            )}
          </div>
        </div>

        {/* ================= 3. ЖЕЛЕЗНО ЗАКРЕПЛЕННЫЙ ФУТЕР (ВНЕ СКРОЛЛА) ================= */}
        <footer className="ui-product-footer flex-none z-30 w-full p-3 sm:p-4 wide:p-5 pb-[calc(calc(var(--space-unit)*3.5)+env(safe-area-inset-bottom))] wide:pb-5 bg-pd-panel/95 dark:bg-surface/95 border-t-(length:--stroke-width) border-pd-line/40">
          <AddToCartButton
            price={config.price}
            soldOut={config.soldOut}
            added={added}
            onAdd={add}
          />
        </footer>
    </Modal>
  )
}
