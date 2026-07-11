import { forwardRef } from 'react';
import './Button.css';

/**
 * Button component — matches Figma design system.
 *
 * @param {object} props
 * @param {"primary"|"secondary"|"blueGhost"|"ghost"|"secondaryGhost"|"red"|"green"} props.variant - Style variant
 *        (secondaryGhost = Ghost with a border; red = destructive/error; green = positive/success)
 * @param {"sm"|"md"|"lg"} props.size - Size variant
 * @param {string} props.label - Button text (omit for icon-only). `children` also works.
 * @param {React.ElementType} props.icon - Phosphor icon component
 * @param {"prefix"|"suffix"} props.iconPosition - Where the icon appears relative to label
 * @param {boolean} props.disabled
 * @param {function} props.onClick
 * @param {"button"|"submit"|"reset"} props.type
 * @param {"regular"|"bold"|"fill"|"duotone"|"thin"|"light"} props.iconWeight - Phosphor icon weight
 * @param {string} props.className - External override class
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    label = '',
    icon: Icon = null,
    iconPosition = 'prefix',
    iconWeight = 'regular',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const isIconOnly = Icon && !label && !children;

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
      ref={ref}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {Icon && !isIconOnly && iconPosition === 'prefix' && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}

      {isIconOnly && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}

      {/* Prefer explicit label; fall back to children for drop-in use. */}
      {label ? <span>{label}</span> : children}

      {Icon && !isIconOnly && iconPosition === 'suffix' && (
        <span className="btn__icon">
          <Icon size={iconSize} weight={iconWeight} />
        </span>
      )}
    </button>
  );
});

export default Button;
