import { useState } from 'react'
import { block, blockTitle, btn, field, hint } from '../../components/ui'
import { normalizePromo, promoCodes } from '../../state/cart'
import { cx } from '../../utils/cx'

/** Code input; reports the applied code (or null) to the cart. */
export function PromoField({ applied, onApply }: { applied: string | null; onApply: (code: string | null) => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const apply = () => {
    const code = normalizePromo(input)
    if (!code) return
    if (promoCodes[code]) {
      onApply(code)
      setError(null)
    } else {
      onApply(null)
      setError('Такого промокода нет')
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
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
        <button className={cx(btn('secondary'), 'h-[50px] flex-none')} onClick={apply} disabled={!input.trim()}>
          Применить
        </button>
      </div>
      {applied && (
        <p className={hint('ok')}>
          {applied}: {promoCodes[applied].label}
        </p>
      )}
      {error && <p className={hint('error')}>{error}</p>}
    </section>
  )
}
