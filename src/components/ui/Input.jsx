import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

const baseInput = [
  'w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]',
  'px-3.5 py-2.5 rounded-xl text-sm font-medium',
  'focus:outline-none focus:border-[var(--pv-primary-500)] focus:shadow-[0px_0px_0px_3px_var(--pv-primary-100),0px_2px_2px_-1px_rgba(0,0,0,0.12)]',
  'hover:border-[var(--pv-primary-300)]',
  'transition-all duration-150 placeholder:text-[var(--text-muted)]',
].join(' ')

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(baseInput, className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseInput, 'resize-y min-h-[80px]', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseInput, 'cursor-pointer', className)} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        'block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5 tracking-wider uppercase',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}
