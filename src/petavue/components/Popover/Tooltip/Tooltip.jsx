import { Info } from '@phosphor-icons/react';
import './Tooltip.css';

/**
 * Tooltip — small floating label with optional icon.
 *
 * @param {object} props
 * @param {string} props.name - Tooltip text
 * @param {"sm"|"lg"} props.size - Size variant
 * @param {boolean} props.icon - Show Info icon
 * @param {boolean} props.text - Show text label
 * @param {string} props.className - External override class
 */
export function Tooltip({
  name = 'Tooltip',
  size = 'lg',
  icon = true,
  text = true,
  className = '',
}) {
  const classes = [
    'tooltip',
    `tooltip--${size}`,
    !text && icon ? 'tooltip--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className={classes} role="tooltip">
      {icon && (
        <span className="tooltip__icon">
          <Info size={iconSize} weight="regular" />
        </span>
      )}
      {text && <span className="tooltip__text">{name}</span>}
    </div>
  );
}
