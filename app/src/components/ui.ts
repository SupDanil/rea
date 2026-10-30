// Shared Tailwind class sets for elements that repeat across screens.
// Font sizes use text-[Npx] on purpose: Tailwind's named sizes also set
// line-height, and the design relies on the browser's normal line-height.

import { cx } from '../utils/cx'

export const roundBtn =
  'relative grid size-11 flex-none place-items-center rounded-full bg-surface shadow-card transition-[background-color] duration-300 ease-[ease]'

export const avatar = (small = false) =>
  cx(
    'grid flex-none place-items-center rounded-full bg-linear-135 from-accent-2 to-accent font-extrabold text-white',
    small ? 'size-[34px] text-[15px]' : 'size-14 text-[24px]',
  )

/** Close/back button: frosted on tinted screens, solid on sheets. */
export const iconBtn = (side: 'left' | 'right') =>
  cx(
    'grid size-10 place-items-center rounded-full backdrop-blur-[8px]',
    side === 'left' ? 'col-start-1 bg-surface shadow-card' : 'col-start-3 bg-glass-strong',
  )

export const sheet = 'fixed inset-0 z-20 mx-auto flex max-w-[480px] flex-col bg-bg animate-sheet-in'
export const sheetHead =
  'grid min-h-14 grid-cols-[44px_1fr_auto] items-center gap-2 px-3 pt-[calc(8px+env(safe-area-inset-top))] pb-1'
export const sheetTitle = 'text-[24px]'
export const sheetBody = 'flex-1 overflow-y-auto overscroll-contain px-3 pt-1 pb-6'
export const sheetDock = 'px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))]'

export const textBtn = (danger = false) =>
  cx('px-1.5 py-2 text-[14px] font-semibold disabled:opacity-60', danger ? 'text-danger' : 'text-muted')

type BtnKind = 'primary' | 'secondary' | 'danger'
export const btn = (kind: BtnKind, size: 'md' | 'sm' | 'lg' = 'md') =>
  cx(
    'rounded-full font-bold transition-[transform,scale,opacity] duration-[120ms,120ms,200ms] ease-[ease] active:scale-97',
    size === 'md' && 'h-12 px-[22px] text-[15px]',
    size === 'sm' && 'h-9 flex-none px-3.5 text-[13px]',
    size === 'lg' && 'h-14 w-full px-[22px] text-[17px]',
    kind === 'primary' && 'bg-accent text-accent-ink disabled:opacity-45',
    kind === 'secondary' && (size === 'sm' ? 'bg-surface-2 text-ink' : 'bg-surface text-ink shadow-card disabled:opacity-50'),
    kind === 'danger' && 'bg-danger text-white',
  )

/** Big green pill at the bottom of the product card and the cart. */
export const addBtn =
  'flex h-15 flex-1 items-center justify-between rounded-full bg-linear-to-b from-accent-2 to-accent px-[22px] text-[17px] font-bold text-accent-ink transition-transform duration-[120ms] ease-[ease] active:scale-98 disabled:justify-center disabled:bg-none disabled:bg-[#5f5853]'
export const addPrice = 'text-[19px] font-extrabold animate-pop'

/** `xl` is the big centered login input; `code` spreads the SMS digits. */
export const field = (error = false, size: 'md' | 'xl' | 'code' = 'md') =>
  cx(
    'w-full border-[1.5px] bg-surface text-ink shadow-card transition-[border-color] duration-200 ease-[ease] placeholder:text-faint focus:outline-none',
    size === 'md' && 'h-[50px] rounded-2xl px-4 text-[16px]',
    size !== 'md' && 'h-15 rounded-[20px] pr-4 text-center font-bold',
    size === 'xl' && 'pl-4 text-[22px] tracking-[0.02em]',
    size === 'code' && 'pl-[calc(16px+0.6em)] text-[28px] tracking-[0.6em]',
    error ? 'border-danger' : 'border-transparent focus:border-accent-soft',
  )

export const hint = (kind: 'plain' | 'error' | 'ok' = 'plain') =>
  cx(
    'mx-1 mt-2 text-[12px] leading-[1.4]',
    kind === 'plain' && 'text-muted',
    kind === 'error' && 'text-error',
    kind === 'ok' && 'font-semibold text-accent-soft',
  )

export const block = 'mt-[22px]'
export const blockTitle = 'mx-1 mb-2.5 block text-[17px] font-bold tracking-[-0.02em]'
export const panel = 'bg-surface shadow-card'

export const summary = 'mt-[22px] rounded-[20px] bg-surface px-4 py-3.5 shadow-card'
export const summaryRow = 'flex justify-between py-1 text-[14px] text-ink-2'
export const summaryDiscount = 'font-bold text-accent-soft'
export const summaryTotal =
  'flex justify-between border-t border-line mt-1.5 pt-2.5 pb-1 text-[17px] font-extrabold text-ink first:mt-0 first:border-t-0 first:pt-1'

/** Radio/switch rows: the button carries `group`, these read its aria-checked. */
export const option =
  'group flex items-center gap-3 rounded-[18px] border-[1.5px] border-transparent bg-surface px-4 py-3.5 text-left shadow-card transition-[border-color] duration-200 ease-[ease] aria-checked:border-accent-soft'
export const optionTitle = 'block text-[15px] font-semibold'
export const optionSub = 'mt-0.5 block text-[12px] text-muted'
export const radio =
  "grid size-5 flex-none place-items-center rounded-full border-2 border-faint transition-[border-color] duration-200 ease-[ease] group-aria-checked:border-accent-soft group-aria-checked:after:size-2.5 group-aria-checked:after:rounded-full group-aria-checked:after:bg-accent-soft group-aria-checked:after:animate-[pop_0.25s_var(--ease-soft)] group-aria-checked:after:content-['']"
export const toggle =
  "relative h-7 w-12 flex-none rounded-[14px] bg-faint transition-[background] duration-200 ease-[ease] after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.25)] after:transition-transform after:duration-[250ms] after:ease-soft after:content-[''] group-aria-checked:bg-accent group-aria-checked:after:translate-x-5"

export const confirmBox = 'rounded-[20px] bg-surface p-4 shadow-card animate-[fade-in_0.2s_var(--ease-soft)]'
export const confirmTitle = 'text-[17px] font-bold'
export const buttonRow = 'flex justify-center gap-2'
export const openDot = 'size-1.5 rounded-full bg-open shadow-[0_0_0_3px_rgba(63,166,107,0.18)]'
