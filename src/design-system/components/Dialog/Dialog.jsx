import {
  X,
  Info,
  Warning,
  XCircle,
} from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import './Dialog.css';

/**
 * Dialog — modal dialog with header (colored top border), body slot, and footer actions.
 *
 * @param {object} props
 * @param {"sm"|"md"|"lg"} props.size - Width variant (460 / 650 / 800px)
 * @param {"default"|"warning"|"error"} props.state - Visual state
 * @param {string} props.title - Dialog title text
 * @param {React.ReactNode} props.children - Body content
 * @param {string} props.cancelLabel - Cancel button text
 * @param {string} props.confirmLabel - Confirm button text
 * @param {function} props.onClose - Called when X is clicked
 * @param {function} props.onCancel - Called when Cancel is clicked
 * @param {function} props.onConfirm - Called when Confirm is clicked
 * @param {string} props.className - External override class
 */
export function Dialog({
  size = 'sm',
  state = 'default',
  title = '',
  children,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onClose,
  onCancel,
  onConfirm,
  className = '',
}) {
  const isDisabled = state === 'warning' || state === 'error';

  const classes = [
    'dialog',
    `dialog--${size}`,
    `dialog--${state}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const headerIcon =
    state === 'error' ? XCircle :
    state === 'warning' ? Warning :
    Info;

  const iconColor =
    state === 'error' ? 'var(--color-error)' :
    state === 'warning' ? 'var(--color-warning)' :
    'var(--color-primary-500)';

  const isLarge = size === 'md' || size === 'lg';

  return (
    <div className={classes}>
      {/* Header */}
      <div className="dialog__header">
        <div className="dialog__header-content">
          <div className="dialog__title-area">
            <span className="dialog__title">{title}</span>
          </div>
          <button className="dialog__close" onClick={onClose} aria-label="Close" type="button">
            <X size={16} weight="regular" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="dialog__body">
        {children}
      </div>

      {/* Footer */}
      <div className="dialog__footer">
        <div className="dialog__footer-inner">
          <Button
            variant="ghost"
            size={isLarge ? 'lg' : 'md'}
            label={cancelLabel}
            onClick={onCancel}
          />
          <Button
            variant="primary"
            size={isLarge ? 'lg' : 'md'}
            label={confirmLabel}
            disabled={isDisabled}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
