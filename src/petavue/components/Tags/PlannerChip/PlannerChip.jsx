import { Table, X } from '@phosphor-icons/react';
import './PlannerChip.css';

/**
 * PlannerChip — inline code-style token chip used in the Planner UI.
 *
 * Matches the Figma "Tag" component from the design system.
 *
 * @param {object} props
 * @param {string} props.children - Chip label text
 * @param {"sm"|"md"|"lg"} props.size - Size variant
 * @param {boolean} props.prefixIcon - Show Table icon before label
 * @param {boolean} props.suffixIcon - Show X (close) icon after label
 * @param {function} props.onRemove - Called when suffix X is clicked
 * @param {string} props.className - External override class
 */
export function PlannerChip({
  children,
  size = 'sm',
  prefixIcon = false,
  suffixIcon = false,
  onRemove,
  className = '',
}) {
  const classes = [
    'planner-chip',
    `planner-chip--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 12;

  return (
    <span className={classes}>
      {prefixIcon && (
        <span className="planner-chip__icon">
          <Table size={iconSize} weight="regular" />
        </span>
      )}
      <span className="planner-chip__label">{children}</span>
      {suffixIcon && (
        <button
          className="planner-chip__remove"
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
