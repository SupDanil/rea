import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { formatPrice, groupById, itemById, type Ingredient, type MenuItem, type Nutrition } from '../data/menu'
import { addBtn, addPrice, cx, iconBtn } from '../ui'
import { IngredientArt, ItemArt } from './ItemArt'

export type AddRequest = { itemId: string; variantId: string; ingredientIds: string[]; price: number }

type Props = {
  item: MenuItem
  onClose: () => void
  onAdd: (request: AddRequest) => void
  onOpenItem: (item: MenuItem) => void
}

type Selection = Record<string, string[]>

const sizeLabel = { S: 'S', M: 'M', L: 'L', ONE: '' } as const

const addNutrition = (a: Nutrition, b: Nutrition): Nutrition => ({
  kcal: a.kcal + b.kcal,
  fat: a.fat + b.fat,
  carbs: a.carbs + b.carbs,
  protein: a.protein + b.protein,
})

const chipTitle = 'text-[12px] leading-[1.2] font-semibold'
const chip = (open: boolean, related = false) =>
  cx(
    'flex min-h-[106px] flex-[0_0_98px] flex-col items-center gap-[5px] rounded-[20px] px-1.5 py-2.5 text-center backdrop-blur-[8px] [transition:background_0.2s,scale_0.18s_var(--ease-soft)] active:scale-96',
    related ? 'justify-between' : 'justify-center',
    open ? 'bg-surface shadow-card' : 'bg-glass',
  )

const fmt = (v: number) => Math.max(0, v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })

const firstAvailable = (item: MenuItem) => Math.max(0, item.variants.findIndex((v) => !v.stopped))

export function ProductScreen({ item, onClose, onAdd, onOpenItem }: Props) {
  const [variantIdx, setVariantIdx] = useState(() => firstAvailable(item))
  const [selection, setSelection] = useState<Selection>({})
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [showInside, setShowInside] = useState(false)
  const [shownItem, setShownItem] = useState(item)

  // Switching hot ↔ iced swaps the item in place: keep the size and every
  // add-on the twin also offers, instead of starting the card over.
  if (shownItem !== item) {
    const size = shownItem.variants[variantIdx]?.size
    const sameSize = item.variants.findIndex((v) => v.size === size && !v.stopped)
    setVariantIdx(sameSize >= 0 ? sameSize : firstAvailable(item))
    setSelection((prev) => {
      const kept: Selection = {}
      for (const groupId of item.groupIds) {
        const group = groupById.get(groupId)
        const ids = (prev[groupId] ?? []).filter((id) => group?.ingredients.some((i) => i.id === id && !i.stopped))
        if (ids.length) kept[groupId] = ids
      }
      return kept
    })
    setOpenGroupId((prev) => (prev && item.groupIds.includes(prev) ? prev : null))
    setShownItem(item)
  }

  const variant = item.variants[variantIdx] ?? item.variants[0]
  const groups = item.groupIds.map((id) => groupById.get(id)!).filter(Boolean)
  const openGroup = openGroupId ? groupById.get(openGroupId) : undefined
  const related = item.related && itemById.get(item.related.itemId)

  const chosen: Ingredient[] = useMemo(
    () => groups.flatMap((g) => (selection[g.id] ?? []).map((id) => g.ingredients.find((i) => i.id === id)!)),
    [groups, selection],
  )
  const price = variant.price + chosen.reduce((sum, i) => sum + i.price, 0)
  const nutrition = chosen.reduce((acc, i) => addNutrition(acc, i.nutrition), variant.nutrition)
  const soldOut = item.variants.every((v) => v.stopped)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openGroupId) setOpenGroupId(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openGroupId, onClose])

  const toggle = (groupId: string, max: number, ingredientId: string) => {
    setSelection((prev) => {
      const current = prev[groupId] ?? []
      if (current.includes(ingredientId)) return { ...prev, [groupId]: current.filter((id) => id !== ingredientId) }
      if (max === 1) return { ...prev, [groupId]: [ingredientId] }
      // Over the limit: drop the oldest pick so the tap always does something.
      const next = [...current, ingredientId]
      return { ...prev, [groupId]: next.length > max ? next.slice(next.length - max) : next }
    })
  }

  return (
    <div
      className="tinted fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col overflow-hidden bg-[linear-gradient(180deg,var(--tinted)_0%,var(--tinted)_55%,var(--bg)_100%)] animate-[sheet-in_0.36s_var(--ease-soft)]"
      style={{ '--tint': item.art.bg } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-3 pt-[calc(10px+env(safe-area-inset-top))] pb-0.5">
        <h1 className="col-start-2 text-center text-[24px]">{item.name}</h1>
        <button className={iconBtn('right')} onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <dl className="mx-4 mt-3 grid grid-cols-4 divide-x divide-line rounded-[18px] bg-glass px-1 py-2.5 text-center" aria-live="polite">
        {(
          [
            ['энергия', `${fmt(Math.round(nutrition.kcal))} ккал`],
            ['жиры', `${fmt(nutrition.fat)} г`],
            ['углеводы', `${fmt(nutrition.carbs)} г`],
            ['белки', `${fmt(nutrition.protein)} г`],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="mt-px text-[11px] text-muted">{label}</dt>
            <dd className="text-[15px] font-bold tracking-[-0.01em]">{value}</dd>
          </div>
        ))}
      </dl>

      {/* The details float over the stage so opening them never shifts the product art. */}
      <div className="relative z-4 mt-2.5 flex justify-center">
        <button
          className="self-center rounded-full bg-glass px-3.5 py-[7px] text-[13px] font-semibold"
          aria-expanded={showInside} aria-controls="inside" onClick={() => setShowInside((v) => !v)}>
          что внутри <span aria-hidden="true">{showInside ? '▴' : '▾'}</span>
        </button>
        {showInside && (
          <div
            className="absolute top-[calc(100%+8px)] right-4 left-4 space-y-1.5 rounded-[18px] bg-surface px-4 py-3.5 text-[13px] leading-[1.5] shadow-lift animate-fade-in"
            id="inside"
          >
            <p>{item.description}</p>
            <p><b>Состав:</b> {item.composition}</p>
            {item.allergens && <p><b>Аллергены:</b> {item.allergens}</p>}
          </div>
        )}
      </div>

      <div
        className="relative grid min-h-0 flex-1 place-items-center py-2 before:absolute before:aspect-square before:w-[78%] before:rounded-full before:bg-[radial-gradient(circle,var(--glow)_0%,transparent_68%)] before:content-['']"
        onClick={() => {
          setOpenGroupId(null)
          setShowInside(false)
        }}
      >
        <div
          className="relative grid h-full max-h-[360px] place-items-center transition-transform duration-[450ms] ease-soft"
          style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}>
          <ItemArt
            key={item.id}
            art={item.art}
            className="h-full w-auto max-w-[80vw] animate-[art-in_0.35s_var(--ease-soft),float_6s_ease-in-out_0.35s_infinite]"
          />
        </div>
      </div>

      <div className="relative">
        {openGroup && (
          <div
            className="absolute right-2 bottom-[calc(100%+8px)] left-2 max-h-[52dvh] overflow-y-auto rounded-[26px] bg-panel px-3 pt-3.5 pb-3 text-white shadow-lift backdrop-blur-[18px] backdrop-saturate-130 animate-[rise_0.24s_var(--ease-soft)]"
            role="group" aria-label={openGroup.name}>
            <div className="flex items-baseline justify-between px-1 pb-3 text-[15px] font-bold">
              <span>{openGroup.name}</span>
              <span className="text-[13px] font-medium text-muted opacity-65">{openGroup.max === 1 ? 'выберите одно' : `до ${openGroup.max} шт.`}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {openGroup.ingredients.map((ing) => {
                const selected = (selection[openGroup.id] ?? []).includes(ing.id)
                return (
                  <button
                    key={ing.id}
                    className={cx(
                      'flex flex-col items-center gap-1 rounded-[20px] px-1.5 pt-3 pb-2.5 text-center [transition:background_0.18s,color_0.18s,scale_0.18s_var(--ease-soft)] not-disabled:active:scale-95 disabled:opacity-35',
                      selected ? 'bg-white text-[#1d1916]' : 'bg-white/9 text-white',
                    )}
                    disabled={ing.stopped}
                    aria-pressed={selected}
                    onClick={() => toggle(openGroup.id, openGroup.max, ing.id)}
                  >
                    <IngredientArt color={ing.color} className="size-[46px]" />
                    <span className="flex min-h-[29px] items-center text-[12px] leading-[1.2] font-semibold">{ing.name}</span>
                    <span className="text-[11px] opacity-65">{ing.stopped ? 'нет в наличии' : `+${formatPrice(ing.price)}`}</span>
                    <span
                      className={cx(
                        'mt-0.5 grid size-6 place-items-center rounded-full text-[15px] leading-none',
                        selected ? 'bg-accent text-white animate-pop' : 'bg-white/14',
                      )}
                      aria-hidden="true"
                    >{selected ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {(related || groups.length > 0) && (
          <div className="no-scrollbar flex items-stretch gap-2 overflow-x-auto px-3 pb-3">
            {related && (
              <>
                <button className={chip(false, true)} onClick={() => onOpenItem(related)}>
                  <span className={chipTitle}>{item.related!.label}</span>
                  <ItemArt art={related.art} className="h-[60px] w-14" />
                </button>
                {groups.length > 0 && <span className="my-5 flex-[0_0_1px] bg-line" aria-hidden="true" />}
              </>
            )}
            {groups.map((g) => {
              const picks = (selection[g.id] ?? []).map((id) => g.ingredients.find((i) => i.id === id)!)
              const isOpen = openGroupId === g.id
              return (
                <button key={g.id} className={chip(isOpen)} aria-expanded={isOpen} onClick={() => setOpenGroupId(isOpen ? null : g.id)}>
                  {picks.length ? (
                    <>
                      <IngredientArt color={picks[0].color} className="block size-9" />
                      <span className={chipTitle}>{picks.map((p) => p.name).join(', ')}</span>
                      <span className="text-[11px] text-muted">+{formatPrice(picks.reduce((s, p) => s + p.price, 0))}</span>
                    </>
                  ) : (
                    <>
                      <span className="grid size-[34px] place-items-center rounded-full bg-surface text-[22px] leading-none shadow-card" aria-hidden="true">+</span>
                      <span className={chipTitle}>{g.name}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <footer className="mx-2 mb-[calc(10px+env(safe-area-inset-bottom))] flex items-center gap-2 rounded-full bg-dock p-[7px] shadow-lift backdrop-blur-[12px]">
          {variant.size !== 'ONE' && (
            <div className="flex rounded-full bg-white/10 p-1" role="radiogroup" aria-label="Размер">
              {item.variants.map((v, idx) => (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={idx === variantIdx}
                  disabled={v.stopped}
                  className="flex h-[52px] min-w-12 flex-col items-center justify-center rounded-full px-2.5 text-white/85 [transition:background_0.25s,color_0.25s,min-width_0.25s_var(--ease-soft)] disabled:opacity-30 aria-checked:min-w-[66px] aria-checked:bg-white aria-checked:text-[#1d1916]"
                  onClick={() => setVariantIdx(idx)}
                >
                  <span className="text-[18px] leading-none font-extrabold">{sizeLabel[v.size]}</span>
                  {idx === variantIdx && v.volume && <span className="mt-[3px] text-[10px] font-semibold opacity-70">{v.volume}</span>}
                </button>
              ))}
            </div>
          )}
          <button
            className={addBtn}
            disabled={soldOut}
            onClick={() => onAdd({ itemId: item.id, variantId: variant.id, ingredientIds: chosen.map((i) => i.id), price })}
          >
            {soldOut ? (
              'Закончилось'
            ) : (
              <>
                <span>Добавить</span>
                <span className={addPrice} key={price}>{formatPrice(price)}</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
