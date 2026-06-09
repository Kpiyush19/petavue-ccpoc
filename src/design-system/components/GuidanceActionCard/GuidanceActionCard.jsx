import { CaretRight, ListMagnifyingGlass, Play, Pause, CheckCircle } from '@phosphor-icons/react';
import spinnerGif from '../../assets/spinner.gif';
import './GuidanceActionCard.css';

/**
 * GuidanceActionCard — displays an action item with type icon, status, and title.
 *
 * @param {object} props
 * @param {string} props.title - Card title text
 * @param {"plan"|"chart"|"memo"|"dashboard"|"analysis"} props.type - Icon type label
 * @param {string} props.version - Version string (e.g. "v1")
 * @param {"loading"|"playing"|"paused"|"done"} props.status - Current status
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - External override class
 */
export function GuidanceActionCard({
  title = '',
  type = 'plan',
  version = 'v1',
  status = 'loading',
  onClick,
  className = '',
}) {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <button
      className={`guidance-action-card ${className}`}
      type="button"
      onClick={onClick}
    >
      {/* Left icon container */}
      <div className="guidance-action-card__icon-frame">
        <div className="guidance-action-card__icon-container">
          <ListMagnifyingGlass size={36} weight="regular" color="var(--color-neutral-600)" />
        </div>
      </div>

      {/* Content */}
      <div className="guidance-action-card__content">
        <div className="guidance-action-card__meta">
          <StatusIcon status={status} />
          <span className="text-body-2-regular guidance-action-card__meta-text">
            {typeLabel} | {version}
          </span>
        </div>
        <p className="text-body-1-regular guidance-action-card__title">{title}</p>
      </div>

      {/* Right caret */}
      <div className="guidance-action-card__caret">
        <CaretRight size={16} weight="regular" color="var(--color-neutral-600)" />
      </div>
    </button>
  );
}

function StatusIcon({ status }) {
  if (status === 'loading') {
    return (
      <img
        src={spinnerGif}
        alt="Loading"
        className="guidance-action-card__spinner"
        width={12}
        height={12}
      />
    );
  }
  if (status === 'playing') {
    return <Play size={12} weight="fill" color="var(--color-primary-500)" />;
  }
  if (status === 'paused') {
    return <Pause size={12} weight="fill" color="var(--color-text-secondary)" />;
  }
  if (status === 'done') {
    return <CheckCircle size={12} weight="fill" color="var(--color-success)" />;
  }
  return null;
}
