import { useState, useRef, useEffect } from 'react';
import {
  Sparkle, LinkSimple, Camera, DotsSixVertical, PencilSimple, X,
  Link as LinkIcon, Copy, Info, CaretUp, CaretDown, EyeSlash, Eye,
  ArrowUpRight,
} from '@phosphor-icons/react';
import './DashboardWidget.css';

/* ================================================================== */
/*  Widget Access Dialog                                               */
/* ================================================================== */

function WidgetAccessDialog({ onClose, onNavigate }) {
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const dialogRef = useRef(null);
  const dummyLink = 'https://app.petavue./share/ce57cbec-68c1-421e-9dad-b6c9ab21386f';
  const dummyKey = 'ptv_k8x2mN9qLwR4jP7vT1bY3hF6';

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(dummyLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyKey() {
    navigator.clipboard.writeText(dummyKey).catch(() => {});
  }

  return (
    <div className="widget-access-overlay" onClick={onClose}>
      <div
        className="widget-access-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Access widget data"
      >
        {/* Header */}
        <div className="widget-access-dialog__header">
          <h3 className="widget-access-dialog__title">
            Access widget data outside Petavue
          </h3>
          <button
            className="widget-access-dialog__close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} weight="regular" color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div className="widget-access-dialog__body">
          <p className="widget-access-dialog__desc">
            The link you generate lets you access the latest refreshed output of
            this widget for use in downstream workflow automations.
          </p>

          {!linkGenerated ? (
            /* State 1: Generate Link */
            <button
              className="widget-access-dialog__primary-btn"
              type="button"
              onClick={() => setLinkGenerated(true)}
            >
              <LinkIcon size={12} weight="regular" color="var(--color-white)" />
              <span>Generate Link</span>
            </button>
          ) : (
            /* State 2: Link generated */
            <div className="widget-access-dialog__generated">
              <div className="widget-access-dialog__link-box">
                <span className="widget-access-dialog__link-text">
                  {dummyLink}
                </span>
              </div>
              <button
                className="widget-access-dialog__primary-btn"
                type="button"
                onClick={handleCopy}
              >
                <Copy size={12} weight="regular" color="var(--color-white)" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {/* Additional information accordion */}
              <div className="widget-access-dialog__accordion">
                <button
                  className="widget-access-dialog__accordion-trigger"
                  type="button"
                  onClick={() => setInfoOpen(!infoOpen)}
                >
                  <div className="widget-access-dialog__accordion-left">
                    <Info size={12} weight="regular" color="var(--color-neutral-600)" />
                    <span className="widget-access-dialog__accordion-label">
                      Additional information
                    </span>
                  </div>
                  {infoOpen
                    ? <CaretUp size={12} weight="regular" color="var(--color-neutral-600)" />
                    : <CaretDown size={12} weight="regular" color="var(--color-neutral-600)" />
                  }
                </button>

                <div className={`widget-access-dialog__accordion-content ${infoOpen ? 'widget-access-dialog__accordion-content--open' : ''}`}>
                  <div className="widget-access-dialog__accordion-inner">
                    <div className="widget-access-dialog__accordion-body">
                      <div className="widget-access-dialog__info-link-row">
                        <span className="widget-access-dialog__info-link">
                          Know more about how you can use this link
                        </span>
                        <ArrowUpRight size={12} weight="regular" color="var(--color-primary-500)" />
                      </div>

                      <p className="widget-access-dialog__info-text">
                        The link returns data in different formats based on widget type:
                        tables as <span className="widget-access-dialog__code-tag">.csv</span>,
                        charts as <span className="widget-access-dialog__code-tag">.png</span> and
                        an error if the widget execution fails.
                      </p>

                      <div className="widget-access-dialog__divider" />

                      <p className="widget-access-dialog__info-text">
                        The generated API is <span className="text-body-2-medium">authenticated using an API key</span>,
                        which is <span className="text-body-2-medium">unique to each user</span>.
                        You can also find this information in the{' '}
                        <span className="widget-access-dialog__profile-link" onClick={() => { onClose(); onNavigate && onNavigate('profile'); }}>Profile</span> section.
                      </p>

                      <div className="widget-access-dialog__api-key-section">
                        <span className="widget-access-dialog__api-key-label">Your API Key</span>
                        <div className="widget-access-dialog__api-key-box">
                          <span className="widget-access-dialog__api-key-value">
                            {keyVisible ? dummyKey : '••••••••••••••••••••••••••'}
                          </span>
                          <button
                            className="widget-access-dialog__api-key-action"
                            type="button"
                            onClick={() => setKeyVisible(!keyVisible)}
                            aria-label={keyVisible ? 'Hide key' : 'Show key'}
                          >
                            {keyVisible
                              ? <Eye size={16} weight="regular" color="var(--color-text-secondary)" />
                              : <EyeSlash size={16} weight="regular" color="var(--color-text-secondary)" />
                            }
                          </button>
                          <button
                            className="widget-access-dialog__api-key-action"
                            type="button"
                            onClick={handleCopyKey}
                            aria-label="Copy key"
                          >
                            <Copy size={16} weight="regular" color="var(--color-text-secondary)" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DashboardWidget                                                    */
/* ================================================================== */

export function DashboardWidget({
  title = '',
  description = '',
  children,
  editing = false,
  onRemove,
  onNavigate,
  className = '',
}) {
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, [description]);

  return (
    <div className={`dashboard-widget ${editing ? 'dashboard-widget--editing' : ''} ${className}`}>
      <div className="dashboard-widget__header">
        {editing && (
          <span className="dashboard-widget__drag-handle">
            <DotsSixVertical size={16} weight="bold" color="var(--color-neutral-300)" />
          </span>
        )}
        <h2 className="dashboard-widget__title">{title}</h2>
        {editing ? (
          <div className="dashboard-widget__edit-actions">
            <button className="dashboard-widget__action-btn" type="button" aria-label="Edit widget">
              <PencilSimple size={16} weight="regular" />
            </button>
            <button
              className="dashboard-widget__action-btn"
              type="button"
              aria-label="Remove widget"
              onClick={onRemove}
            >
              <X size={16} weight="regular" />
            </button>
          </div>
        ) : (
          <div className="dashboard-widget__actions">
            <button className="dashboard-widget__sage-btn" type="button">
              <Sparkle size={12} weight="regular" />
              Sage
            </button>
            <div className="dashboard-widget__link-wrapper">
              <button
                className="dashboard-widget__action-btn"
                type="button"
                aria-label="Access widget link"
                onClick={() => setAccessOpen(true)}
                onMouseEnter={() => setLinkHovered(true)}
                onMouseLeave={() => setLinkHovered(false)}
              >
                <LinkSimple size={16} weight="regular" />
              </button>
              {linkHovered && !accessOpen && (
                <div className="dashboard-widget__link-tooltip">
                  Access widget link
                </div>
              )}
            </div>
            <button className="dashboard-widget__action-btn" type="button" aria-label="Screenshot">
              <Camera size={16} weight="regular" />
            </button>
          </div>
        )}
      </div>

      {description && (
        <div
          className="dashboard-widget__description-wrapper"
          onMouseEnter={() => isTruncated && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <p ref={descRef} className="dashboard-widget__description">
            {description}
          </p>
          {showTooltip && (
            <div className="dashboard-widget__tooltip">
              {description}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-widget__body">
        {children}
      </div>

      {accessOpen && (
        <WidgetAccessDialog onClose={() => setAccessOpen(false)} onNavigate={onNavigate} />
      )}
    </div>
  );
}
