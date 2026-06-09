import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('input', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('input textarea', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn('input select', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('label', className)} {...props}>
      {children}
    </label>
  );
}
