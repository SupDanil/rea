import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { formatPrice, groupById, itemById, type Ingredient, type MenuItem, type Nutrition } from '../data/menu'
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
    <div className="product" style={{ '--tint': item.art.bg } as CSSProperties} role="dialog" aria-modal="true" aria-label={item.name}>
      <header className="product-head">
        <h1>{item.name}</h1>
        <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <dl className="nutrition" aria-live="polite">
        <div><dt>энергия</dt><dd>{fmt(Math.round(nutrition.kcal))} ккал</dd></div>
        <div><dt>жиры</dt><dd>{fmt(nutrition.fat)} г</dd></div>
        <div><dt>углеводы</dt><dd>{fmt(nutrition.carbs)} г</dd></div>
        <div><dt>белки</dt><dd>{fmt(nutrition.protein)} г</dd></div>
      </dl>

      {/* The details float over the stage so opening them never shifts the product art. */}
      <div className="inside-wrap">
        <button className="inside-toggle" aria-expanded={showInside} aria-controls="inside" onClick={() => setShowInside((v) => !v)}>
          что внутри <span aria-hidden="true">{showInside ? '▴' : '▾'}</span>
        </button>
        {showInside && (
          <div className="inside" id="inside">
            <p>{item.description}</p>
            <p><b>Состав:</b> {item.composition}</p>
            {item.allergens && <p><b>Аллергены:</b> {item.allergens}</p>}
          </div>
        )}
      </div>

      <div
        className="product-stage"
        onClick={() => {
          setOpenGroupId(null)
          setShowInside(false)
        }}
      >
        <div className="product-float" style={{ transform: `scale(${variant.size === 'L' ? 1.08 : variant.size === 'S' ? 0.88 : 1})` }}>
          <ItemArt key={item.id} art={item.art} className="product-art" />
        </div>
      </div>

      <div className="product-bottom">
        {openGroup && (
          <div className="ingredients" role="group" aria-label={openGroup.name}>
            <div className="ingredients-head">
              <span>{openGroup.name}</span>
              <span className="muted">{openGroup.max === 1 ? 'выберите одно' : `до ${openGroup.max} шт.`}</span>
            </div>
            <div className="ingredients-grid">
              {openGroup.ingredients.map((ing) => {
                const selected = (selection[openGroup.id] ?? []).includes(ing.id)
                return (
                  <button
                    key={ing.id}
                    className={`ingredient${selected ? ' is-selected' : ''}`}
                    disabled={ing.stopped}
                    aria-pressed={selected}
                    onClick={() => toggle(openGroup.id, openGroup.max, ing.id)}
                  >
                    <IngredientArt color={ing.color} />
                    <span className="ingredient-name">{ing.name}</span>
                    <span className="ingredient-price">{ing.stopped ? 'нет в наличии' : `+${formatPrice(ing.price)}`}</span>
                    <span className="ingredient-mark" aria-hidden="true">{selected ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {(related || groups.length > 0) && (
          <div className="chips">
            {related && (
              <>
                <button className="chip chip-related" onClick={() => onOpenItem(related)}>
                  <span className="chip-title">{item.related!.label}</span>
                  <ItemArt art={related.art} className="chip-art" />
                </button>
                {groups.length > 0 && <span className="chips-divider" aria-hidden="true" />}
              </>
            )}
            {groups.map((g) => {
              const picks = (selection[g.id] ?? []).map((id) => g.ingredients.find((i) => i.id === id)!)
              const isOpen = openGroupId === g.id
              return (
                <button key={g.id} className={`chip${isOpen ? ' is-open' : ''}`} aria-expanded={isOpen} onClick={() => setOpenGroupId(isOpen ? null : g.id)}>
                  {picks.length ? (
                    <>
                      <span className="chip-ing"><IngredientArt color={picks[0].color} /></span>
                      <span className="chip-title">{picks.map((p) => p.name).join(', ')}</span>
                      <span className="chip-sub">+{formatPrice(picks.reduce((s, p) => s + p.price, 0))}</span>
                    </>
                  ) : (
                    <>
                      <span className="chip-plus" aria-hidden="true">+</span>
                      <span className="chip-title">{g.name}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <footer className="product-foot">
          {variant.size !== 'ONE' && (
            <div className="sizes" role="radiogroup" aria-label="Размер">
              {item.variants.map((v, idx) => (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={idx === variantIdx}
                  disabled={v.stopped}
                  className="size"
                  onClick={() => setVariantIdx(idx)}
                >
                  <span className="size-letter">{sizeLabel[v.size]}</span>
                  {idx === variantIdx && v.volume && <span className="size-volume">{v.volume}</span>}
                </button>
              ))}
            </div>
          )}
          <button
            className="add-btn"
            disabled={soldOut}
            onClick={() => onAdd({ itemId: item.id, variantId: variant.id, ingredientIds: chosen.map((i) => i.id), price })}
          >
            {soldOut ? (
              'Закончилось'
            ) : (
              <>
                <span>Добавить</span>
                <span className="add-price" key={price}>{formatPrice(price)}</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
