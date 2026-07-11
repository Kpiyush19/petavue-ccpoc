import { X } from '@phosphor-icons/react';
import './Notification.css';

/**
 * Notification component — matches Figma design system.
 * Variants: success (green), warning (yellow), error (red), info (blue).
 *
 * @param {object} props
 * @param {"success"|"warning"|"error"|"info"} props.variant
 * @param {string} props.message - Notification text
 * @param {function} props.onClose - Close handler; if omitted, no close button
 * @param {string} props.className
 */
export function Notification({
  variant = 'success',
  message = 'Notification',
  onClose,
  className = '',
  ...rest
}) {
  const classes = [
    'notification',
    `notification--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="alert" {...rest}>
      <div className="notification__content">
        <span className="notification__message">{message}</span>
      </div>
      {onClose && (
        <button
          className="notification__close"
          onClick={onClose}
          aria-label="Close notification"
          type="button"
        >
          <X size={16} weight="regular" />
        </button>
      )}
    </div>
  );
}
