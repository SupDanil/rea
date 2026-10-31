import { useState } from 'react'
import { api } from '../../api'
import { block, blockTitle, btn, field, hint } from '../../components/ui'
import { normalizePromo } from '../../state/cart'
import { cx } from '../../utils/cx'
import type { AppliedPromo } from './cartPricing'

/** Code input; asks the server whether the code is valid and reports it (or null) to the cart. */
export function PromoField({ applied, onApply }: { applied: AppliedPromo | null; onApply: (promo: AppliedPromo | null) => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const apply = async () => {
    const code = normalizePromo(input)
    if (!code || checking) return
    setChecking(true)
    try {
      const res = await api.checkPromo(code)
      if (res.valid && res.percent) {
        onApply({ code: res.code, percent: res.percent, label: res.label })
        setError(null)
      } else {
        onApply(null)
        setError('Такого промокода нет')
      }
    } catch {
      setError('Не удалось проверить промокод — попробуйте ещё раз')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className={block}>
      <h2 className={blockTitle}>Промокод</h2>
      <div className="flex gap-2">
        <input
          className={field(!!error)}
          value={input}
          placeholder="Например, ЗЕРНО10"
          autoCapitalize="characters"
          aria-label="Промокод"
          onChange={(e) => {
            setInput(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && void apply()}
        />
        <button className={cx(btn('secondary'), 'h-[50px] flex-none')} onClick={() => void apply()} disabled={!input.trim() || checking} aria-busy={checking}>
          {checking ? 'Проверяем…' : 'Применить'}
        </button>
      </div>
      {applied && (
        <p className={hint('ok')}>
          {applied.code}: {applied.label ?? `−${applied.percent}%`}
        </p>
      )}
      {error && <p className={hint('error')}>{error}</p>}
    </section>
  )
}
