import './Button.css';

/**
 * Button component — matches Figma design system.
 *
 * @param {object} props
 * @param {"primary"|"secondary"|"blueGhost"|"ghost"} props.variant - Style variant
 * @param {"sm"|"md"|"lg"} props.size - Size variant
 * @param {string} props.label - Button text (omit for icon-only)
 * @param {React.ElementType} props.icon - Phosphor icon component
 * @param {"prefix"|"suffix"} props.iconPosition - Where the icon appears relative to label
 * @param {boolean} props.disabled
 * @param {function} props.onClick
 * @param {"regular"|"bold"|"fill"|"duotone"|"thin"|"light"} props.iconWeight - Phosphor icon weight
 * @param {string} props.className - External override class
 */
export function Button({
  variant = 'primary',
  size = 'md',
  label = '',
  icon: Icon = null,
  iconPosition = 'prefix',
  iconWeight = 'regular',
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  const isIconOnly = Icon && !label;

  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    isIconOnly ? 'btn--icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /* Determine icon size based on button size */
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type="button"
      {...rest}
    >
      {/* Icon prefix */}
      {Icon && !isIconOnly && iconPosition === 'prefix' && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}

      {/* Icon only */}
      {isIconOnly && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}

      {/* Label */}
      {label && <span>{label}</span>}

      {/* Icon suffix */}
      {Icon && !isIconOnly && iconPosition === 'suffix' && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}
    </button>
  );
}
