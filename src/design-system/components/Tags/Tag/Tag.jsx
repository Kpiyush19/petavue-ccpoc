import { X } from '@phosphor-icons/react';
import './Tag.css';

/**
 * Tag — general-purpose colored chip used across the platform.
 *
 * Matches the Figma "Tag" component from the design system.
 *
 * @param {object} props
 * @param {string} props.children - Tag label text
 * @param {"pink"|"yellow"|"green"|"blue"|"purple"|"column"|"success-green"|"warning-yellow"|"error-red"|"orange"|"sea-green"|"violet"} props.color - Color variant
 * @param {"sm"|"md"|"lg"} props.size - Size variant
 * @param {React.ElementType} props.prefixIcon - Phosphor icon component for prefix
 * @param {boolean} props.suffixIcon - Show X (close) icon after label
 * @param {boolean} props.iconOnly - Show only the prefix icon, no label
 * @param {function} props.onRemove - Called when suffix X is clicked
 * @param {string} props.className - External override class
 */
export function Tag({
  children,
  color = 'blue',
  size = 'sm',
  prefixIcon: PrefixIcon = null,
  suffixIcon = false,
  iconOnly = false,
  onRemove,
  className = '',
}) {
  const classes = [
    'tag',
    `tag--${color}`,
    `tag--${size}`,
    iconOnly ? 'tag--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;

  return (
    <span className={classes}>
      {PrefixIcon && (
        <span className="tag__icon">
          <PrefixIcon size={iconSize} weight="regular" />
        </span>
      )}
      {!iconOnly && <span className="tag__label">{children}</span>}
      {suffixIcon && (
        <button
          className="tag__remove"
          onClick={onRemove}
          aria-label="Remove"
          type="button"
        >
          <X size={iconSize} weight="regular" />
        </button>
      )}
    </span>
  );
}
