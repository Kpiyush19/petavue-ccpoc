import { Tag } from '../Tags/Tag/Tag';

/** Badge — thin wrapper over Tag (Badge is retired in favor of Tag). */
const COLOR_MAP = { success: 'success-green', warning: 'warning-yellow', danger: 'error-red', muted: 'column', accent: 'blue' };
export function Badge({ variant = 'muted', className, children }) {
  return <Tag color={COLOR_MAP[variant] || 'column'} className={className}>{children}</Tag>;
}
