import { useState } from 'react';
import {
  Sparkle,
  CaretRight,
  CaretDown,
  CaretUp,
  CheckCircle,
} from '@phosphor-icons/react';
import spinnerGif from '../../assets/spinner.gif';
import './ThoughtProcess.css';

/*
  Steps data model:
  Each step has:
    - label: string (e.g. "Picking relevant tables" while loading, "Found 4 relevant tables" when done)
    - content: string | string[] | null — sub-content shown below the step
      - string = plain text (table names, separated by ·)
      - string[] = bullet list (plan items)
      - null = no sub-content
    - status: 'pending' | 'loading' | 'done'
*/

/**
 * ThoughtProcess — shows AI reasoning steps with progressive loading states.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {Array<{label: string, loadingLabel?: string, content?: string|string[]|null, status: 'pending'|'loading'|'done'}>} props.steps
 * @param {boolean} [props.completed=false] — all steps done, enables collapse/expand
 * @param {boolean} [props.defaultExpanded=true]
 */
export function ThoughtProcess({
  className,
  steps = [],
  completed = false,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  /* When still loading (not completed), always show content */
  const isLoading = !completed;
  const showContent = isLoading || expanded;

  return (
    <div className={`thought-process ${className || ''}`}>
      {/* Header */}
      <button
        className="thought-process__header"
        type="button"
        onClick={() => completed && setExpanded((prev) => !prev)}
        aria-expanded={showContent}
        style={{ cursor: completed ? 'pointer' : 'default' }}
      >
        <div className="thought-process__header-left">
          <Sparkle size={16} weight="fill" color="var(--color-primary-500)" />
          <span className="thought-process__title text-body-1-regular">
            Thought process
          </span>
        </div>
        <div className="thought-process__header-right">
          {isLoading ? (
            <>
              <img
                src={spinnerGif}
                alt="Loading"
                className="thought-process__spinner-gif"
                width={16}
                height={16}
              />
              <CaretRight size={16} weight="regular" color="var(--color-primary-300)" />
            </>
          ) : (
            <>
              <CheckCircle size={16} weight="regular" color="var(--color-success)" />
              {expanded ? (
                <CaretUp size={16} weight="regular" color="var(--color-neutral-600)" />
              ) : (
                <CaretDown size={16} weight="regular" color="var(--color-neutral-600)" />
              )}
            </>
          )}
        </div>
      </button>

      {/* Steps content */}
      {showContent && (
        <div className="thought-process__body">
          <div className="thought-process__steps">
            {steps.map((step, i) => {
              if (step.status === 'pending') return null;

              const isDone = step.status === 'done';
              const isActive = step.status === 'loading';
              const hasContent = step.content != null;
              const showSub = isDone && hasContent;

              return (
                <div className="thought-process__step" key={i}>
                  {/* Step row */}
                  <div className="thought-process__step-row">
                    {isDone ? (
                      <CheckCircle
                        size={16}
                        weight="regular"
                        color="var(--color-success)"
                        className="thought-process__step-icon"
                      />
                    ) : (
                      <img
                        src={spinnerGif}
                        alt="Loading"
                        className="thought-process__spinner-gif thought-process__step-icon"
                        width={16}
                        height={16}
                      />
                    )}
                    <span className="thought-process__step-label text-body-2-regular">
                      {isDone ? step.label : (step.loadingLabel || step.label)}
                    </span>
                  </div>

                  {/* Sub-content with vertical connector line */}
                  {(showSub || (isActive && hasContent)) && (
                    <div className="thought-process__step-content">
                      <div className="thought-process__connector">
                        <div className="thought-process__connector-line" />
                      </div>
                      <div className="thought-process__step-detail">
                        {isActive && !isDone ? (
                          /* Skeleton loading */
                          <div className="thought-process__skeleton-group">
                            <div className="thought-process__skeleton thought-process__skeleton--wide" />
                            <div className="thought-process__skeleton thought-process__skeleton--narrow" />
                          </div>
                        ) : typeof step.content === 'string' ? (
                          <p className="thought-process__step-text text-body-2-regular">
                            {step.content}
                          </p>
                        ) : Array.isArray(step.content) ? (
                          <ul className="thought-process__step-list">
                            {step.content.map((item, j) => (
                              <li key={j} className="thought-process__step-list-item text-body-2-regular">
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Skeleton for loading step with content expected */}
                  {isActive && !hasContent && step._expectContent && (
                    <div className="thought-process__step-content">
                      <div className="thought-process__connector">
                        <div className="thought-process__connector-line" />
                      </div>
                      <div className="thought-process__step-detail">
                        <div className="thought-process__skeleton-group">
                          <div className="thought-process__skeleton thought-process__skeleton--wide" />
                          <div className="thought-process__skeleton thought-process__skeleton--narrow" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
