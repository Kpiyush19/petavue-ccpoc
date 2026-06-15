import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkle,
  X,
  ClockCounterClockwise,
  ArrowLeft,
  Plus,
} from '@phosphor-icons/react';
import { SageTextBox } from '../SageTextBox/SageTextBox';
import { ThoughtProcess } from '../ThoughtProcess/ThoughtProcess';
import './SagePane.css';

const MIN_WIDTH = 380;
const DEFAULT_WIDTH = 450;
const MAX_WIDTH = 730;

const DEFAULT_MESSAGES = [
  {
    type: 'user',
    text: 'How is "Account Pulse" determined in the at-risk accounts widget?',
  },
  {
    type: 'ai',
    steps: [
      { label: 'Found 3 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Alby New Business Pipeline Workbook (Priyanka) · Reviewed by John +2', status: 'done' },
      { label: 'Found 4 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Activity Metrics by Win Status · Activity Performance Metrics by Quarter Win Status · Activity Bucket Win Rate Analysis', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Identify the Account Pulse column in the Accounts at Risk widget', 'Trace the underlying fields and scoring model', 'Map the input signal weights', 'Retrieve the classification thresholds', 'Check which Key Definitions filter the widget', 'Flag any accounts in Severe Risk status'], status: 'done' },
    ],
    body: [
      'The Account Pulse column is a derived health classification based on a composite scoring model defined in this analysis.',
      'It uses four input signals: Health Score from accounts__HealthScore (weighted at 40%), Churn Probability from accounts__ChurnProbability (30%), NPS Response from accounts__NPS_Score__c (15%), and Product Usage over the last 30 days from accounts__UsageIndex_30d (15%).',
      'The composite score maps to three labels. <span class="text-body-1-medium">Fairly Satisfied</span> is a score between 60–100, <span class="text-body-1-medium">Some Risk</span> falls between 35–59, and <span class="text-body-1-medium">Severe Risk</span> is anything from 0–34.',
      'Of the accounts shown, Datapine ($48,670 ARR) is the only one currently flagged as Severe Risk — worth immediate attention.',
    ],
  },
  { type: 'divider', timestamp: 'Jan 21, 2026 at 10:32 AM PST' },
  {
    type: 'user',
    text: 'Are accounts with repeated activity spikes (meetings, follow-ups) more likely to convert or stall?',
  },
  {
    type: 'ai',
    steps: [
      { label: 'Found 4 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Account Health Overview · Accounts at Risk · Average Health by Segment · Sales Cycle Friction', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Scan the screen to identify distinct widgets', 'Map each widget to its source', 'Extract primary fields', 'Separate opportunity-level from account-level', 'Structure the summary'], status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ],
    body: [
      'Accounts with moderate and consistent activity show the highest conversion rates.',
      'Accounts with repeated activity spikes demonstrate lower win rates compared to moderate activity buckets, longer average sales cycles, and higher likelihood of moving into stalled or closed-lost categories.',
      'The pattern suggests that repeated spikes are often reactive behavior — increased follow-ups due to uncertainty or lack of buyer momentum — rather than a strong buying signal.',
    ],
  },
];

/**
 * SagePane — right-side overlay panel for the Sage AI chatbot.
 *
 * @param {object} props
 * @param {boolean} props.open — controls visibility
 * @param {function} props.onClose — called when the X button is clicked
 * @param {string} [props.className]
 */
export function SagePane({ open, onClose, className, messages }) {
  const paneRef = useRef(null);
  const messagesRef = useRef(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [showThreads, setShowThreads] = useState(false);
  const dragging = useRef(false);

  /* Focus pane on open */
  useEffect(() => {
    if (!open) return;
    const node = paneRef.current;
    if (node) node.focus();
  }, [open]);

  /* Scroll to bottom on open */
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const el = messagesRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [open]);

  /* Resize drag handlers */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = width;

    function onMouseMove(ev) {
      if (!dragging.current) return;
      const delta = startX - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      setWidth(newWidth);
    }

    function onMouseUp() {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width]);

  if (!open) return null;

  return (
    <div className={`sage-pane__overlay ${className || ''}`}>
      <aside
        ref={paneRef}
        className="sage-pane"
        style={{ width: `${width}px` }}
        tabIndex={-1}
        role="dialog"
        aria-label="Sage assistant"
      >
        {/* Resize handle — left edge */}
        <div
          className="sage-pane__resize-handle"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Sage panel"
        />

        {/* Header */}
        <header className="sage-pane__header">
          <div className="sage-pane__header-left">
            {showThreads ? (
              <>
                <button
                  className="sage-pane__header-icon-btn"
                  type="button"
                  onClick={() => setShowThreads(false)}
                  aria-label="Back to chat"
                >
                  <ArrowLeft size={16} weight="regular" color="var(--color-text-primary)" />
                </button>
                <span className="sage-pane__title text-h2-regular">Sage History</span>
              </>
            ) : (
              <>
                <Sparkle size={24} weight="fill" color="var(--color-primary-500)" />
                <span className="sage-pane__title text-h2-regular">Sage</span>
              </>
            )}
          </div>
          <div className="sage-pane__header-actions">
            {showThreads ? (
              <button
                className="sage-pane__new-chat-btn"
                type="button"
                aria-label="New chat"
              >
                <Plus size={14} weight="regular" color="var(--color-primary-500)" />
                <span className="text-body-2-medium sage-pane__new-chat-text">
                  New
                </span>
              </button>
            ) : (
              <div className="sage-pane__threads-btn-wrapper">
                <button
                  className="sage-pane__header-icon-btn"
                  type="button"
                  onClick={() => setShowThreads(true)}
                  aria-label="Sage History"
                >
                  <ClockCounterClockwise
                    size={16}
                    weight="regular"
                    color="var(--color-neutral-600)"
                  />
                </button>
                <div className="sage-pane__threads-tooltip text-body-2-regular">
                  History
                </div>
              </div>
            )}
            <button
              className="sage-pane__close-btn"
              type="button"
              onClick={onClose}
              aria-label="Close Sage"
            >
              <X size={12} weight="regular" color="var(--color-neutral-600)" />
            </button>
          </div>
        </header>

        {showThreads ? (
          <ThreadsView onSelectThread={() => setShowThreads(false)} />
        ) : (
          <div className="sage-pane__thread">
          {/* Scrollable message body */}
          <div className="sage-pane__messages" ref={messagesRef}>
            {/* System welcome message */}
            <SystemMessage />

            {/* Dynamic messages from prop or defaults */}
            {(messages || DEFAULT_MESSAGES).map((msg, i) => {
              if (msg.type === 'user') {
                return <UserMessage key={i} initials="AD" text={msg.text} />;
              }
              if (msg.type === 'ai') {
                return (
                  <AiResponse key={i}>
                    <ThoughtProcess
                      completed
                      defaultExpanded={false}
                      steps={msg.steps}
                    />
                    <div className="sage-pane__ai-body">
                      {msg.body.map((paragraph, j) => (
                        <p key={j} dangerouslySetInnerHTML={{ __html: paragraph }} />
                      ))}
                    </div>
                  </AiResponse>
                );
              }
              if (msg.type === 'divider') {
                return <DashboardRefreshedDivider key={i} timestamp={msg.timestamp} />;
              }
              return null;
            })}
          </div>

          {/* Text input pinned at bottom */}
          <div className="sage-pane__input-area">
            <SageTextBox
              recommendations={[]}
              onSubmit={(value, mode) => {
                /* TODO: wire up AI chat */
              }}
            />
          </div>
        </div>
        )}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  System welcome message                                             */
/* ------------------------------------------------------------------ */

function SystemMessage() {
  return (
    <div className="sage-pane__system-msg">
      <div className="sage-pane__system-msg-inner">
        <p className="sage-pane__msg-text">
          <span className="text-body-1-medium">Hi, I&apos;m Sage. </span>
          <span className="text-body-1-regular">
            I help you understand your dashboards—how they were built, what the
            numbers show, and what&apos;s driving them.
          </span>
        </p>

        <p className="sage-pane__msg-text text-body-1-regular">
          Pick a tool to get started:
        </p>

        <ul className="sage-pane__tool-list">
          <li className="sage-pane__tool-item">
            <span className="text-body-1-medium">Find Out How </span>
            <span className="text-body-1-regular">
              Trace the data sources, fields, logic, and filters behind any
              widget.{' '}
            </span>
            <span className="text-body-1-regular sage-pane__tool-example">
              &quot;How was this metric calculated?&quot; &middot; &quot;What Key
              Definitions are applied?&quot; &middot; &quot;When was the data
              last synced?&quot;
            </span>
          </li>

          <li className="sage-pane__tool-item">
            <span className="text-body-1-medium">Data Summary </span>
            <span className="text-body-1-regular">
              Get answers based on what&apos;s on your screen.{' '}
            </span>
            <span className="text-body-1-regular sage-pane__tool-example">
              &quot;Which quarter had the most closed deals?&quot; &middot;
              &quot;Who&apos;s the top-performing rep?&quot; &middot;
              &quot;What&apos;s the breakdown by region?&quot;
            </span>
          </li>

          <li className="sage-pane__tool-item">
            <span className="text-body-1-medium">Dig Deeper </span>
            <span className="text-body-1-regular">
              Query the underlying data to answer questions, find patterns, and
              surface insights (even beyond what&apos;s shown).{' '}
            </span>
            <span className="text-body-1-regular sage-pane__tool-example">
              &quot;What&apos;s driving our low win rate?&quot; &middot;
              &quot;Is there a correlation between activity levels and win
              rates?&quot; &middot; &quot;Give me overall insights on this
              analysis&quot;
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User message bubble                                                */
/* ------------------------------------------------------------------ */

function UserMessage({ initials, text }) {
  return (
    <div className="sage-pane__user-msg-wrapper">
      <div className="sage-pane__user-msg">
        <div className="sage-pane__user-avatar">
          <span className="sage-pane__user-avatar-text text-metadata-regular">
            {initials}
          </span>
        </div>
        <p className="sage-pane__user-msg-text text-body-1-regular">{text}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI response wrapper (thought process + body text)                  */
/* ------------------------------------------------------------------ */

function AiResponse({ children }) {
  return (
    <div className="sage-pane__ai-response">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard refreshed divider                                        */
/* ------------------------------------------------------------------ */

function DashboardRefreshedDivider({ timestamp }) {
  return (
    <div className="sage-pane__refresh-divider">
      <div className="sage-pane__refresh-row">
        <div className="sage-pane__refresh-line" />
        <div className="sage-pane__refresh-pill">
          <span className="text-body-2-medium sage-pane__refresh-pill-text">
            Dashboard Refreshed &bull; {timestamp}
          </span>
        </div>
        <div className="sage-pane__refresh-line" />
      </div>
      <p className="sage-pane__refresh-note text-body-2-regular">
        Dashboard refreshed. Previous responses may not reflect current data.
        Ask a new question to get the latest insights.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Threads history view                                               */
/* ------------------------------------------------------------------ */

const SAMPLE_THREADS = [
  {
    id: 1,
    title: 'Are accounts with repeated activity spikes (meetings, follow-ups) more likely to convert or stall?',
    time: '2:01 PM',
    group: 'Today',
    active: true,
  },
  {
    id: 2,
    title: 'Which deals in the pipeline have been stuck the longest without stage movement?',
    time: '12:24 PM',
    group: 'Today',
  },
  {
    id: 3,
    title: 'What percentage of forecasted revenue is at risk based on current deal health scores?',
    time: '11:31 AM',
    group: 'Today',
  },
  {
    id: 4,
    title: 'How does average contract value differ across segments in the revenue breakdown?',
    time: '6:30 PM',
    group: 'Yesterday',
  },
  {
    id: 5,
    title: 'Which reps have the highest win rate in the leaderboard this quarter?',
    time: '5:01 PM',
    group: 'Yesterday',
  },
  {
    id: 6,
    title: 'What is driving the spike in churn probability for mid-market accounts?',
    time: '6:30 AM',
    group: '10th Mar, 2026',
  },
  {
    id: 7,
    title: 'Can you break down the conversion funnel drop-off by lead source?',
    time: '5:01 PM',
    group: '10th Mar, 2026',
  },
  {
    id: 8,
    title: 'Show me the trend for average deal cycle length over the past 6 months',
    time: '5:01 PM',
    group: '9th Mar, 2026',
  },
  {
    id: 9,
    title: 'Which accounts had the biggest change in health score last week?',
    time: '5:01 PM',
    group: '9th Mar, 2026',
  },
];

function ThreadsView({ onSelectThread }) {
  /* Group threads by their date group */
  const groups = [];
  let currentGroup = null;
  for (const thread of SAMPLE_THREADS) {
    if (thread.group !== currentGroup) {
      currentGroup = thread.group;
      groups.push({ label: currentGroup, threads: [] });
    }
    groups[groups.length - 1].threads.push(thread);
  }

  return (
    <div className="sage-pane__threads">
      <div className="sage-pane__threads-list">
        {groups.map((group) => (
          <div key={group.label} className="sage-pane__thread-group">
            <span className="text-metadata-medium sage-pane__thread-group-label">
              {group.label}
            </span>
            {group.threads.map((thread) => (
              <button
                key={thread.id}
                className={`sage-pane__thread-item ${thread.active ? 'sage-pane__thread-item--active' : ''}`}
                type="button"
                onClick={() => onSelectThread(thread.id)}
              >
                <span className="text-body-1-regular sage-pane__thread-item-title">
                  {thread.title}
                </span>
                <span className="text-metadata-regular sage-pane__thread-item-time">
                  {thread.time}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
