import { cn } from '../../utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl',
        'transition-all duration-200',
        'hover:shadow-[var(--shadow-card)] hover:-translate-y-[2px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
