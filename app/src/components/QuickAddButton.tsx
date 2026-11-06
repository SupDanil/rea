import { IconButton,type IconButtonProps } from './Button'
import { PlusIcon } from './icons'

/** Identical quick-add affordance in the catalogue, promo banner and promo article. */
export function QuickAddButton({ added, ...props }: Omit<IconButtonProps, 'children' | 'variant'> & { added: boolean }) {
  return <IconButton {...props} size="sm" variant={added ? 'primary' : 'secondary'}>
    {added ? <svg key="done" className="animate-pop size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-strong)" strokeLinecap="round" strokeLinejoin="round" />
    </svg> : <PlusIcon />}
  </IconButton>
}
