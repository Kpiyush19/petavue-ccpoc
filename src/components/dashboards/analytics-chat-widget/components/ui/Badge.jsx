import { cn } from '../../utils/cn';

export function Badge({ variant = 'muted', className, children }) {
  return (
    <span className={cn('badge', `badge--${variant}`, className)}>
      {children}
    </span>
  );
}
