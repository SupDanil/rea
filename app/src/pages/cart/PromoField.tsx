import { useState } from 'react'

import { api } from '../../api'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { block, blockTitle, hint } from '../../components/ui'
import { normalizePromo } from '../../state/cart'
import { cx } from '../../utils/cx'
import type { AppliedPromo } from './cartPricing'

/**
 * 2026 PromoField:
 * Capsule field with "coupon snap" animation upon success, clear error guidance,
 * and warm crema accenting.
 */
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
        <TextField
           error={!!error} fieldSize="md"
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
        <Button
          className={cx('h-12.5 flex-none px-5')} variant="secondary" size="md"
          onClick={() => void apply()}
          disabled={!input.trim() || checking}
          aria-busy={checking}
        >
          {checking ? 'Проверяем…' : 'Применить'}
        </Button>
      </div>

      {applied && (
        <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-control bg-accent/10 border-(length:--stroke-width) border-accent/25 text-accent animate-[coupon-snap_0.35s_var(--spring)]">
          <span className="font-display text-compact font-bold">
            {applied.code}: {applied.label ?? `−${applied.percent}%`}
          </span>
          <span className="text-micro font-medium ml-auto">применён</span>
        </div>
      )}

      {error && <p className={hint('error')}>{error}</p>}
    </section>
  )
}
