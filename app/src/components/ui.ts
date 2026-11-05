// Shared Tailwind class sets for elements that repeat across screens.
// Font sizes use text-[Npx] on purpose: Tailwind's named sizes also set
// line-height, and the design relies on the browser's normal line-height.

import { cx } from '../utils/cx'

export const roundBtn =
  'relative grid size-10 sm:size-11 flex-none place-items-center rounded-full bg-surface/90 border border-line shadow-card backdrop-blur-md transition-all duration-150 active:scale-96 hover:bg-surface text-ink'

export const avatar = (small = false) =>
  cx(
    'grid flex-none place-items-center rounded-full bg-accent text-accent-ink font-display font-extrabold shadow-[0_4px_16px_rgba(196,91,36,0.25)]',
    small ? 'size-[34px] text-[13px]' : 'size-14 text-[22px]',
  )

/** Close/back button: frosted on tinted screens, solid on sheets. */
export const iconBtn = (side: 'left' | 'right') =>
  cx(
    'grid size-10 place-items-center rounded-full border border-glass-border transition-all duration-150 active:scale-96 cursor-pointer',
    side === 'left' ? 'col-start-1 bg-surface/90 shadow-card text-ink' : 'col-start-3 bg-glass-strong text-ink',
  )

export const sheetTitle = 'text-[20px] sm:text-[22px] font-display font-bold tracking-tight text-ink'
export const sheetBody = 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 sm:px-6 pt-1 pb-6'
export const sheetDock = 'px-3 sm:px-6 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))]'

export const textBtn = (danger = false) =>
  cx('px-2 py-2 text-[14px] font-semibold transition-colors duration-150 active:scale-96 disabled:opacity-50 cursor-pointer', danger ? 'text-danger hover:opacity-80' : 'text-muted hover:text-ink')

type BtnKind = 'primary' | 'secondary' | 'danger'
export const btn = (kind: BtnKind, size: 'md' | 'sm' | 'lg' = 'md') =>
  cx(
    'rounded-full font-semibold transition-all duration-150 active:scale-96 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer',
    size === 'md' && 'h-12 px-6 text-[15px]',
    size === 'sm' && 'h-9 flex-none px-4 text-[13px]',
    size === 'lg' && 'h-14 w-full px-6 text-[16px]',
    kind === 'primary' && 'bg-accent text-accent-ink shadow-[0_4px_18px_rgba(196,91,36,0.28)] dark:shadow-[0_4px_18px_rgba(224,125,62,0.25)] hover:bg-accent-2 disabled:opacity-45',
    kind === 'secondary' && (size === 'sm' ? 'bg-surface-2 text-ink hover:bg-surface-2/80' : 'bg-surface/90 text-ink border border-line shadow-card hover:bg-surface disabled:opacity-50'),
    kind === 'danger' && 'bg-danger text-white shadow-sm hover:opacity-95',
  )

/** Signature shit кофе rabbit amber crema liquid action button. */
export const addBtn =
  'flex h-15 flex-1 items-center justify-between rounded-full bg-accent hover:bg-accent-2 text-accent-ink px-6 text-[16px] font-display font-semibold shadow-[0_8px_28px_rgba(196,91,36,0.32)] dark:shadow-[0_8px_28px_rgba(224,125,62,0.28)] border border-white/25 transition-all duration-150 active:scale-96 cursor-pointer disabled:justify-center disabled:bg-surface-2 disabled:text-muted disabled:border-line disabled:shadow-none'
export const addPrice = 'text-[18px] font-display font-bold tracking-tight'

/** `xl` is the big centered login input; `code` spreads the SMS digits. */
export const field = (error = false, size: 'md' | 'xl' | 'code' = 'md') =>
  cx(
    'w-full border bg-surface text-ink shadow-sm transition-all duration-200 placeholder:text-faint focus:outline-none',
    size === 'md' && 'h-[50px] px-4 text-[15px] rounded-[16px]',
    size === 'xl' && 'h-[54px] sm:h-[60px] px-2.5 sm:px-4 text-center font-bold font-display rounded-[18px] text-[18px] sm:text-[22px] tracking-normal sm:tracking-[0.02em]',
    size === 'code' && 'h-15 pr-4 pl-[calc(16px+0.6em)] text-center font-bold font-display rounded-[16px] text-[28px] tracking-[0.6em]',
    error ? 'border-danger focus:ring-2 focus:ring-danger/20' : 'border-line focus:border-accent focus:ring-2 focus:ring-accent/15',
  )

export const hint = (kind: 'plain' | 'error' | 'ok' = 'plain') =>
  cx(
    'mx-1 mt-2 text-[12px] leading-[1.4]',
    kind === 'plain' && 'text-muted',
    kind === 'error' && 'text-error font-medium',
    kind === 'ok' && 'font-semibold text-accent',
  )

export const block = 'mt-[24px]'
export const blockTitle = 'mx-1 mb-2.5 block text-[17px] font-display font-bold tracking-tight text-ink'
export const panel = 'bg-surface/90 border border-line rounded-[20px] shadow-card'

export const summary = 'mt-[22px] rounded-[20px] bg-surface/90 border border-line p-4 shadow-card'
export const summaryRow = 'flex justify-between py-1.5 text-[14px] text-ink-2'
export const summaryDiscount = 'font-semibold text-accent'
export const summaryTotal =
  'flex justify-between border-t border-line mt-2 pt-3 pb-1 text-[18px] font-display font-bold text-ink first:mt-0 first:border-t-0 first:pt-1'

/** Radio/switch rows: the button carries `group`, these read its aria-checked. */
export const option =
  'group flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4 text-left shadow-card transition-all duration-200 active:scale-98 cursor-pointer aria-checked:border-accent aria-checked:bg-accent/[0.04]'
export const optionTitle = 'block text-[15px] font-semibold text-ink'
export const optionSub = 'mt-0.5 block text-[12px] text-muted'
export const radio =
  "grid size-5 flex-none place-items-center rounded-full border-2 border-faint transition-all duration-200 group-aria-checked:border-accent group-aria-checked:after:size-2.5 group-aria-checked:after:rounded-full group-aria-checked:after:bg-accent group-aria-checked:after:animate-[pop_0.25s_var(--spring)] group-aria-checked:after:content-['']"
export const toggle =
  "relative h-7 w-12 flex-none rounded-full bg-faint/60 transition-all duration-200 after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-250 after:ease-soft after:content-[''] group-aria-checked:bg-accent group-aria-checked:after:translate-x-5"

export const confirmBox = 'rounded-[24px] bg-surface border border-line p-5 shadow-lift animate-[fade-in_0.2s_var(--ease-soft)]'
export const confirmTitle = 'text-[17px] font-display font-bold text-ink'
export const buttonRow = 'flex justify-center gap-2.5'
export const openDot = 'size-2 rounded-full bg-open shadow-[0_0_0_3px_rgba(63,191,127,0.22)]'
