import { Check, Circle, Loader2, Sparkles, Database, ShieldCheck, PenLine, SearchCheck } from 'lucide-react'
import {
  useSubStageStopwatch,
  getInlineTimeHint,
  severityTextClass,
  severityRowAccentClass,
} from './subStageTime'


// Sub-step list rendered in the left pane during PLANNING — mirrors the
// step-list pattern used during Build/Check so the user can see what's
// already happened, what's active, and what's pending. Solves the "I
// switched tabs and came back, no idea what happened" gap.

const STEP_DEFS = [
  {
    key: 'workspace_ready',
    label: 'Setting up workspace',
    tooltip: 'Sets up the workspace where this run lives.',
  },
  {
    key: 'reviewing_data',
    label: 'Reviewing data',
    tooltip: 'Looks through the available tables — schemas, key definitions, and the shape of the data. Usually 3–4 minutes.',
  },
  {
    key: 'awaiting_input',
    label: 'Input needed',
    conditional: true,
    tooltip: 'Waiting for input on configuration choices before continuing.',
  },
  {
    key: 'verifying_answers',
    label: 'Verifying answers',
    tooltip: 'Runs a quick sanity check on the configuration from the previous step. Usually 1–2 minutes.',
  },
  {
    key: 'drafting_plan',
    label: 'Drafting the plan',
    tooltip: 'Assembles the plan — which queries to run, how the data gets transformed, and what each section will show. Usually 3–4 minutes.',
  },
  {
    key: 'reviewing_plan',
    label: 'Final review of the plan',
    tooltip: 'Does a final pass to catch anything missing or vague before sending the plan for approval. Usually 1–2 minutes.',
  },
]

// Same ordering map the BE uses for forward-only progression. Mirrored
// here so the FE can decide which sub-steps to mark as completed
// without an extra round-trip.
const STAGE_ORDER = {
  workspace_ready:    1,
  reviewing_data:     2,
  awaiting_input:     3,
  followup_question:  3,
  verifying_answers:  4,
  drafting_plan:      5,
  reviewing_plan:     6,
}

// Right-pane copy + icon for each sub-state. Plain prose, no "you/your",
// distinct from the left-pane labels so the two panes carry different
// weight rather than echoing each other. Awaiting-input and
// followup_question fall through to the ClarificationCard, so they have
// no entry here.
const RIGHT_PANE_CONTENT = {
  workspace_ready: {
    icon: Sparkles,
    copy: 'Just getting started.',
  },
  reviewing_data: {
    icon: Database,
    copy: 'Looking through the available tables — schemas, key definitions, and the shape of the data. This is required to generate an appropriate plan for the final artifact.',
  },
  verifying_answers: {
    icon: ShieldCheck,
    copy: 'Running a quick sanity check on the configuration from the previous step to confirm it returns meaningful data. If anything looks off, the agent will come back with a follow-up question before drafting.',
  },
  drafting_plan: {
    icon: PenLine,
    copy: 'Assembling the plan — which queries to run, how the data gets transformed, and what the final deliverable will look like.',
  },
  reviewing_plan: {
    icon: SearchCheck,
    copy: 'Doing a final pass over the plan to catch anything missing or vague before sending it for approval.',
  },
}


function SubStepRow({ label, status, tooltip, timeHint, onCancel }) {
  let Icon = Circle
  let iconClass = 'text-[var(--text-muted)]'
  let rowClass = 'border-[var(--border-primary)] opacity-70'
  let labelClass = 'text-[var(--text-muted)]'

  if (status === 'completed') {
    Icon = Check
    iconClass = 'text-[var(--pv-success-text)]'
    rowClass = 'border-[var(--border-primary)]'
    labelClass = 'text-[var(--text-secondary)]'
  } else if (status === 'active') {
    Icon = Loader2
    iconClass = 'animate-spin text-[var(--accent)]'
    rowClass = 'bg-[var(--accent)]/5 border-[var(--accent)]/30'
    labelClass = 'text-[var(--text-primary)] font-medium'
  }

  // Overrun severity tints the row border on top of the active-state
  // chrome. Lets the user spot a slow step at a glance instead of having
  // to read the small inline text.
  const overrunAccent = status === 'active' && timeHint && timeHint.severity !== 'normal'
    ? severityRowAccentClass(timeHint.severity)
    : ''

  // The row's `title` is the long form (stage-specific copy when in
  // overrun; the per-step description otherwise) — surfaces detail on
  // hover without bloating the inline footprint.
  const rowTitle = timeHint?.tooltip || tooltip

  return (
    <li
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${rowClass} ${overrunAccent}`}
      title={rowTitle}
    >
      <Icon size={14} className={`shrink-0 ${iconClass}`} strokeWidth={status === 'completed' ? 3 : 2} />
      <span className={`flex-1 min-w-0 text-[12.5px] truncate ${labelClass}`}>
        {label}
      </span>
      {status === 'active' && timeHint?.text ? (
        <span className={`text-[10.5px] shrink-0 ${severityTextClass(timeHint.severity)}`}>
          {timeHint.text}
        </span>
      ) : null}
      {status === 'active' && timeHint?.showCancel && onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="text-[10.5px] shrink-0 underline text-[var(--pv-error-text)] hover:text-[var(--pv-error-text)]/80"
        >
          Cancel
        </button>
      ) : null}
    </li>
  )
}


export function SetupSubStepList({ setupStage, hadClarifications, paused, onCancel }) {
  const steps = STEP_DEFS.filter((s) => !s.conditional || hadClarifications)
  const currentOrder = STAGE_ORDER[setupStage] || 0

  // Header counts active+completed steps for parity with the Build pane.
  const completed = steps.filter((s) => STAGE_ORDER[s.key] < currentOrder).length
  const total = steps.length

  // Inline time hint for the active row. Stopwatch is paused on Pusher
  // disconnect AND while the planner is awaiting user input
  // (awaiting_input / followup_question — the clock there is on the
  // user, not the system).
  const userGated = setupStage === 'awaiting_input' || setupStage === 'followup_question'
  const elapsed = useSubStageStopwatch(setupStage, paused || userGated)
  const activeTimeHint = userGated ? null : getInlineTimeHint(setupStage, elapsed)

  return (
    <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 size={14} className="text-[var(--accent)] shrink-0 animate-spin" />
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
            Preparing the plan
          </h2>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] shrink-0">
          {completed} / {total}
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {steps.map((step) => {
          const order = STAGE_ORDER[step.key]
          let status
          if (order < currentOrder) status = 'completed'
          else if (order === currentOrder) status = 'active'
          else status = 'pending'
          return (
            <SubStepRow
              key={step.key}
              label={step.label}
              status={status}
              tooltip={step.tooltip}
              timeHint={status === 'active' ? activeTimeHint : null}
              onCancel={onCancel}
            />
          )
        })}
      </ul>
    </div>
  )
}


// Sub-states that get the "Running with: …" key-choices summary shown
// below the prose — these are the post-clarification states where the
// user has already configured the run and might want to re-check.
const SHOW_KEY_CHOICES_DURING = new Set([
  'verifying_answers', 'drafting_plan', 'reviewing_plan',
])


// Right-pane content for non-clarification states. Centered vertically
// and horizontally with an icon above the prose. Returns null when the
// active sub-state is awaiting_input / followup_question (caller is
// expected to render the ClarificationCard in that case).
export function SetupRightPaneCopy({ setupStage, keyChoices }) {
  if (setupStage === 'awaiting_input' || setupStage === 'followup_question') {
    return null
  }
  const content = RIGHT_PANE_CONTENT[setupStage] || RIGHT_PANE_CONTENT.workspace_ready
  const Icon = content.icon
  const showKeyChoices = SHOW_KEY_CHOICES_DURING.has(setupStage) && (keyChoices?.length || 0) > 0

  return (
    <div className="h-full flex items-center justify-center px-6 py-8">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <p className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
          {content.copy}
        </p>
        {showKeyChoices ? (
          <div className="mt-6 pt-4 border-t border-[var(--border-primary)] text-[12px] text-[var(--text-secondary)]">
            <span className="text-[var(--text-muted)]">Running with: </span>
            {keyChoices.map((c) => c.value).join(' · ')}
          </div>
        ) : null}
      </div>
    </div>
  )
}
