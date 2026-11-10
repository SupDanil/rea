import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import { api } from '../../api'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { block, blockTitle, hint } from '../../components/ui'
import { promoSchema } from '../../forms/schemas'
import { normalizePromo } from '../../state/cart'
import { cx } from '../../utils/cx'
import type { AppliedPromo } from './cartPricing'

/**
 * 2026 PromoField:
 * Capsule field with "coupon snap" animation upon success, clear error guidance,
 * and warm crema accenting.
 */
export function PromoField({ applied, onApply }: { applied: AppliedPromo | null; onApply: (promo: AppliedPromo | null) => void }) {
  const check = useMutation({
    mutationFn: (code: string) => api.checkPromo(code),
    onSuccess: (res) => onApply(res.valid && res.percent ? { code: res.code, percent: res.percent, label: res.label } : null),
  })

  const form = useForm({
    defaultValues: { code: '' },
    validators: { onSubmit: promoSchema },
    onSubmit: async ({ value }) => {
      await check.mutateAsync(normalizePromo(value.code)).catch(() => {})
    },
  })

  const checking = check.isPending
  const error = check.isError
    ? 'Не удалось проверить промокод — попробуйте ещё раз'
    : check.data && !(check.data.valid && check.data.percent)
      ? 'Такого промокода нет'
      : null
  const apply = () => {
    if (!checking) void form.handleSubmit()
  }

  return (
    <section className={block}>
      <h2 className={blockTitle}>Промокод</h2>
      <div className="flex gap-2">
        <form.Field name="code">
          {(field) => (
            <TextField
              error={!!error}
              fieldSize="md"
              value={field.state.value}
              placeholder="Например, ЗЕРНО10"
              autoCapitalize="characters"
              aria-label="Промокод"
              onBlur={field.handleBlur}
              onChange={(e) => {
                field.handleChange(e.target.value)
                // The verdict belonged to the previous code.
                check.reset()
              }}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.code.trim().length > 0}>
          {(hasCode) => (
            <Button
              className={cx('h-12.5 flex-none px-5')}
              variant="secondary"
              size="md"
              onClick={apply}
              disabled={!hasCode || checking}
              aria-busy={checking}
            >
              {checking ? 'Проверяем…' : 'Применить'}
            </Button>
          )}
        </form.Subscribe>
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
