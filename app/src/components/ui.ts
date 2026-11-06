// Layout and typography recipes. Interactive controls live in their React components.
import { cx } from '../utils/cx'

export const avatar = (small = false) =>
  cx(
    'grid flex-none place-items-center rounded-pill bg-accent text-accent-ink font-display font-extrabold',
    small ? 'size-8.5 text-compact' : 'size-14 text-title shadow-action',
  )

export const sheetTitle = 'text-title-sm sm:text-title font-display font-bold tracking-tight text-ink'
export const sheetBody = 'ui-sheet-body'
export const sheetDock = 'ui-sheet-dock'

export const textBtn = (danger = false) =>
  cx('px-2 py-2 text-body font-semibold transition-colors duration-150 active:scale-96 disabled:opacity-50 cursor-pointer', danger ? 'text-danger hover:opacity-80' : 'text-muted hover:text-ink')

export const addPrice = 'text-lead font-display font-bold tracking-tight'

export const hint = (kind: 'plain' | 'error' | 'ok' = 'plain') =>
  cx(
    'mx-1 mt-2 text-caption leading-(--leading-copy)',
    kind === 'plain' && 'text-muted',
    kind === 'error' && 'text-error font-medium',
    kind === 'ok' && 'font-semibold text-accent',
  )

export const block = 'ui-section'
export const blockTitle = 'ui-section-title'

export const summaryRow = 'flex justify-between py-1.5 text-body text-ink-2'
export const summaryDiscount = 'font-semibold text-accent'
export const summaryTotal =
  'flex justify-between border-t-(length:--stroke-width) border-line mt-2 pt-3 pb-1 text-lead font-display font-bold text-ink first:mt-0 first:border-t-0 first:pt-1'

/** Radio/switch rows: the button carries `group`, these read its aria-checked. */

export const radio =
  "grid size-5 flex-none place-items-center rounded-pill border-(length:--stroke-width-strong) border-faint transition-all duration-200 group-aria-checked:border-accent group-aria-checked:after:size-2.5 group-aria-checked:after:rounded-pill group-aria-checked:after:bg-accent group-aria-checked:after:animate-[pop_0.25s_var(--spring)] group-aria-checked:after:content-['']"

export const confirmBox = 'rounded-panel bg-surface border-(length:--stroke-width) border-line p-5 shadow-lift animate-[fade-in_0.2s_var(--ease-soft)]'
export const confirmTitle = 'text-body-lg font-display font-bold text-ink'
export const buttonRow = 'flex justify-center gap-2.5'
export const openDot = 'size-2 rounded-pill bg-open shadow-open-glow'
