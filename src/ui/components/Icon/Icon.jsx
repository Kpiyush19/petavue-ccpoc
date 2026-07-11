import * as PhosphorIcons from '@phosphor-icons/react';
import './Icon.css';

/*
 * Petavue Icon Component
 * Wraps Phosphor Icons with variant support matching the Figma design system.
 *
 * Usage:
 *   <Icon name="House" />
 *   <Icon name="ArrowRight" weight="bold" size={24} />
 *   <Icon name="Heart" weight="fill" color="var(--color-primary)" />
 *
 * Available weights (from Figma):
 *   "regular" (default), "thin", "light", "bold", "fill", "duotone"
 *
 * Available sizes (px):
 *   16, 20, 24 (default), 32, 48
 */

const WEIGHT_MAP = {
  regular: 'regular',
  thin: 'thin',
  light: 'light',
  bold: 'bold',
  fill: 'fill',
  duotone: 'duotone',
};

export function Icon({
  name,
  weight = 'regular',
  size = 24,
  color = 'currentColor',
  className = '',
  mirrored = false,
  alt,
  ...rest
}) {
  const IconComponent = PhosphorIcons[name];

  if (!IconComponent) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Icon] "${name}" is not a valid Phosphor icon name.`);
    }
    return null;
  }

  const resolvedWeight = WEIGHT_MAP[weight] || 'regular';

  return (
    <span
      className={`icon ${className}`}
      role={alt ? 'img' : 'presentation'}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      {...rest}
    >
      <IconComponent
        size={size}
        weight={resolvedWeight}
        color={color}
        mirrored={mirrored}
      />
    </span>
  );
}
