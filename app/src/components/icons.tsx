// Small stroke icons; size and colour come from the surrounding text.

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" />
  </svg>
)

export const BagIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M6 7h12l-1 13H7L6 7Z M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinejoin="round" />
  </svg>
)

export const PersonIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" />
    <path d="M5 19.5c1.2-3.2 3.8-4.8 7-4.8s5.8 1.6 7 4.8" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" />
  </svg>
)

export const PlusIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" />
  </svg>
)

export const TrashIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinejoin="round" />
  </svg>
)

export const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const RabbitIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg className={className} viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">
    <ellipse cx="16" cy="13" rx="5" ry="12" transform="rotate(-12 16 13)" fill="currentColor" />
    <ellipse cx="31" cy="13" rx="5" ry="11" transform="rotate(14 31 13)" fill="currentColor" />
    <ellipse cx="24" cy="31" rx="17" ry="14" fill="currentColor" />
    <circle cx="18" cy="30" r="2.5" fill="var(--bg)" />
    <circle cx="30" cy="30" r="2.5" fill="var(--bg)" />
  </svg>
)

export const InfoIcon = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

export const SnowflakeIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
  </svg>
)
