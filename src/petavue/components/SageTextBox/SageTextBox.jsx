import { useState, useRef, useEffect, useCallback } from 'react';
import {
  CaretDown,
  CaretUp,
  ArrowUp,
  ArrowClockwise,
  ArrowBendUpRight,
  Question,
  Compass,
  TreeStructure,
  MagnifyingGlass,
  Check,
  Stop,
} from '@phosphor-icons/react';
import './SageTextBox.css';

const MODES = [
  {
    id: 'find-out-how',
    label: 'Find Out How',
    icon: Compass,
    description: 'Understand how any widget was built',
  },
  {
    id: 'data-summary',
    label: 'Data Summary',
    icon: TreeStructure,
    description: "Summarize what's visible on screen",
  },
  {
    id: 'dig-deeper',
    label: 'Dig Deeper',
    icon: MagnifyingGlass,
    description: 'Query data, find patterns, get insights',
  },
];

const MODE_ICONS = {
  'find-out-how': Question,
  'data-summary': TreeStructure,
  'dig-deeper': MagnifyingGlass,
};

export function SageTextBox({
  className,
  disabled = false,
  generating = false,
  recommendations = [],
  onSubmit,
  onStop,
  onRefreshRecommendations,
  onSelectRecommendation,
}) {
  const [value, setValue] = useState('');
  const [selectedMode, setSelectedMode] = useState('find-out-how');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);

  const isTyping = value.length > 0 && !generating && !disabled;
  const currentMode = MODES.find((m) => m.id === selectedMode);
  const ModeIcon = MODE_ICONS[selectedMode];

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled || generating) return;
    onSubmit && onSubmit(value, selectedMode);
  }, [value, selectedMode, disabled, generating, onSubmit]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleModeSelect = useCallback((modeId) => {
    setSelectedMode(modeId);
    setDropdownOpen(false);
  }, []);

  /* Derive visual state */
  let state = 'rest';
  if (disabled) state = 'disabled';
  else if (generating) state = 'generating';
  else if (isTyping || isFocused) state = 'typing';

  return (
    <div className={`sage-text-box ${className || ''}`}>
      {/* Recommendations panel */}
      {recommendations.length > 0 && (
        <div className="sage-text-box__recommendations">
          <div className="sage-text-box__recommendations-inner">
            <button
              className="sage-text-box__recommendations-header"
              type="button"
              onClick={() => setRecommendationsOpen((prev) => !prev)}
            >
              <div className="sage-text-box__recommendations-label">
                {recommendationsOpen ? (
                  <CaretDown size={12} weight="regular" color="var(--color-neutral-600)" />
                ) : (
                  <CaretUp size={12} weight="regular" color="var(--color-neutral-600)" />
                )}
                <span className="text-body-2-medium sage-text-box__recommendations-text">
                  Recommendations
                </span>
              </div>
              <button
                className="sage-text-box__refresh-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshRecommendations && onRefreshRecommendations();
                }}
              >
                <ArrowClockwise
                  size={12}
                  weight="regular"
                  color="var(--color-primary-500)"
                />
                <span className="text-body-2-regular sage-text-box__refresh-text">
                  Refresh
                </span>
              </button>
            </button>

            {recommendationsOpen && (
              <div className="sage-text-box__recommendations-list">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    className="sage-text-box__recommendation-item"
                    type="button"
                    onClick={() => onSelectRecommendation && onSelectRecommendation(rec)}
                  >
                    <span className="text-body-2-regular sage-text-box__recommendation-text">
                      {rec}
                    </span>
                    <ArrowBendUpRight
                      size={16}
                      weight="regular"
                      color="var(--color-neutral-400)"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main text box */}
      <div
        className={`sage-text-box__box sage-text-box__box--${state}`}
      >
        <textarea
          ref={textareaRef}
          className="sage-text-box__textarea text-body-1-regular"
          placeholder={currentMode.description}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled || generating}
          rows={3}
          aria-label={`Sage ${currentMode.label} input`}
        />

        <div className="sage-text-box__actions">
          {/* Mode selector pill */}
          <div className="sage-text-box__mode-wrapper" ref={dropdownRef}>
            <button
              className={`sage-text-box__mode-pill sage-text-box__mode-pill--${state}`}
              type="button"
              onClick={() => !disabled && !generating && setDropdownOpen((prev) => !prev)}
              disabled={disabled || generating}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <ModeIcon
                size={12}
                weight="regular"
                color={
                  disabled || generating
                    ? 'var(--color-text-disabled)'
                    : 'var(--color-primary-500)'
                }
              />
              <span className="text-body-2-regular sage-text-box__mode-label">
                {currentMode.label}
              </span>
              <CaretDown
                size={12}
                weight="regular"
                color={
                  disabled || generating
                    ? 'var(--color-text-disabled)'
                    : 'var(--color-primary-500)'
                }
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="sage-text-box__dropdown" role="listbox">
                {MODES.map((mode) => {
                  const IconComp = mode.icon;
                  const isSelected = mode.id === selectedMode;
                  return (
                    <button
                      key={mode.id}
                      className={`sage-text-box__dropdown-item ${isSelected ? 'sage-text-box__dropdown-item--selected' : ''}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleModeSelect(mode.id)}
                    >
                      <div className="sage-text-box__dropdown-icon">
                        <IconComp
                          size={12}
                          weight="regular"
                          color={
                            isSelected
                              ? 'var(--color-primary-500)'
                              : 'var(--color-text-primary)'
                          }
                        />
                      </div>
                      <div className="sage-text-box__dropdown-content">
                        <span
                          className={`text-body-2-medium sage-text-box__dropdown-label ${isSelected ? 'sage-text-box__dropdown-label--selected' : ''}`}
                        >
                          {mode.label}
                        </span>
                        <span className="sage-text-box__dropdown-desc text-metadata-regular">
                          {mode.description}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="sage-text-box__dropdown-check">
                          <Check
                            size={12}
                            weight="regular"
                            color="var(--color-primary-500)"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit / Stop button */}
          {generating ? (
            <button
              className="sage-text-box__submit-btn sage-text-box__submit-btn--stop"
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Stop size={12} weight="fill" color="var(--color-white)" />
            </button>
          ) : (
            <button
              className={`sage-text-box__submit-btn ${isTyping ? 'sage-text-box__submit-btn--active' : 'sage-text-box__submit-btn--default'}`}
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              aria-label="Submit"
            >
              <ArrowUp
                size={12}
                weight="bold"
                color={isTyping ? 'var(--color-white)' : 'var(--color-neutral-400)'}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
