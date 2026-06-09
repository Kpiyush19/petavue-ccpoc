import { cn } from '../../utils/cn'

const variants = {
  success: 'text-[var(--pv-success-text)] bg-[var(--pv-success-bg)] border-[var(--pv-success-text)]/20',
  warning: 'text-[var(--pv-warning-text)] bg-[var(--pv-warning-bg)] border-[var(--pv-warning-text)]/30',
  danger: 'text-[var(--pv-error-text)] bg-[var(--pv-error-bg)] border-[var(--pv-error-text)]/20',
  muted: 'text-[var(--text-muted)] bg-[var(--bg-hover)] border-[var(--border-primary)]',
  accent: 'text-[var(--pv-primary-500)] bg-[var(--pv-primary-100)] border-[var(--pv-primary-500)]/20',
}

export function Badge({ variant = 'muted', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
