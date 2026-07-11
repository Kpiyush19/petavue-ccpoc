import './TabToggle.css';

/**
 * TabToggle — small pill-style tab button with icon + label.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon - Phosphor icon element (size 12)
 * @param {string} props.label - Tab label text
 * @param {boolean} props.active - Whether this tab is selected
 * @param {boolean} props.disabled - Whether this tab is disabled
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - External override class
 */
export function TabToggle({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
  className = '',
}) {
  const classes = [
    'tab-toggle',
    active ? 'tab-toggle--active' : '',
    disabled ? 'tab-toggle--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      role="tab"
      aria-selected={active}
    >
      {icon && <span className="tab-toggle__icon">{icon}</span>}
      {label && <span className="tab-toggle__label">{label}</span>}
    </button>
  );
}
