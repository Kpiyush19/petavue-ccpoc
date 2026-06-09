import { SealCheck, Bell } from '@phosphor-icons/react';
import './IntegrationCard.css';

/**
 * IntegrationCard — displays an integration with logo, description,
 * and a status-dependent action button.
 *
 * Three visual states (matching design system):
 * - "not-connected" → blue filled "Connect" button
 * - "connected"     → blue outlined "View Details" button + green SealCheck badge
 * - "coming-soon"   → light blue "Coming Soon" button + "Notify Me" link
 *
 * @param {object} props
 * @param {string} props.name - Integration name
 * @param {string} props.description - Short description text
 * @param {string} props.category - Category label (hidden if empty)
 * @param {"connected"|"not-connected"|"coming-soon"} props.status
 * @param {string} props.logoSrc - Logo image URL
 * @param {function} props.onConnect - Called when action button is clicked
 * @param {function} props.onNotify - Called when "Notify Me" is clicked (coming-soon)
 * @param {string} props.className - External override class
 */
export function IntegrationCard({
  name = 'Slack',
  description = '',
  category = '',
  status = 'not-connected',
  logoSrc,
  onConnect,
  onNotify,
  className = '',
}) {
  const classes = [
    'integration-card',
    `integration-card--${status}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Header: logo + name + badge/notify */}
      <div className="integration-card__header">
        <div className="integration-card__header-left">
          {logoSrc && (
            <img
              src={logoSrc}
              alt={`${name} logo`}
              className="integration-card__logo"
            />
          )}
          <span className="integration-card__name">{name}</span>
          {status === 'connected' && (
            <SealCheck size={20} weight="fill" color="var(--color-success)" className="integration-card__badge" />
          )}
        </div>
        {status === 'coming-soon' && (
          <button type="button" className="integration-card__notify" onClick={onNotify}>
            <Bell size={12} weight="regular" />
            <span>Notify Me</span>
          </button>
        )}
      </div>

      {/* Category tag (hidden if empty) */}
      {category && <span className="integration-card__category">{category}</span>}

      {/* Description */}
      <p className="integration-card__desc">{description}</p>

      {/* Action button */}
      {status === 'not-connected' && (
        <button type="button" className="integration-card__btn integration-card__btn--connect" onClick={onConnect}>
          Connect
        </button>
      )}
      {status === 'connected' && (
        <button type="button" className="integration-card__btn integration-card__btn--details" onClick={onConnect}>
          View Details
        </button>
      )}
      {status === 'coming-soon' && (
        <button type="button" className="integration-card__btn integration-card__btn--soon" disabled>
          Coming Soon
        </button>
      )}
    </div>
  );
}
