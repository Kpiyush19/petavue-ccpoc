import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const variants = {
  primary:
    'bg-[var(--pv-primary-500)] text-white hover:bg-[var(--pv-primary-800)] shadow-sm',
  secondary:
    'bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover-strong)] hover:border-[var(--border-secondary)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--pv-error-text)] text-white hover:brightness-110',
  // Destructive, but quiet — outline + red text. For low-frequency destructive
  // actions (Cancel run, Delete) that shouldn't shout with a solid red fill.
  'danger-ghost':
    'bg-transparent text-[var(--pv-error-text)] border border-[var(--pv-error-text)]/40 hover:bg-[var(--pv-error-bg)] hover:border-[var(--pv-error-text)]',
  success:
    'bg-[var(--pv-success-text)] text-white hover:brightness-110',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-[13px] rounded-xl gap-2',
  lg: 'h-11 px-6 text-sm rounded-xl gap-2',
  xl: 'h-12 px-8 text-sm rounded-xl gap-2',
  icon: 'h-8 w-8 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-lg',
}

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold cursor-pointer',
        'transition-all duration-150 border-none whitespace-nowrap',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pv-primary-500)]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

Button.displayName = 'Button'
