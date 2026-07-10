import { Check, CheckCircle2, Loader2, Sparkles, AlertOctagon } from 'lucide-react'
import {
  useSubStageStopwatch,
  getInlineTimeHint,
  severityTextClass,
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
    tooltip: 'Looks through the available tables: schemas, key definitions, and the shape of the data. Usually 3–4 minutes.',
  },
  {
    key: 'awaiting_input',
    label: 'Input needed',
    // Always shown (not conditional) so the step is stable in place and
    // doesn't pop into the list mid-run when a clarification appears.
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
    tooltip: 'Assembles the plan: which queries to run, how the data gets transformed, and what each section will show. Usually 3–4 minutes.',
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



// Circle status indicator — filled accent check (done), spinner (active),
// error mark (blocked), hollow ring (pending). Shared so the whole list
// reads as one clean vertical stepper.
export function StepIndicator({ status }) {
  if (status === 'completed' || status === 'success') {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent)] shrink-0">
        <Check size={12} className="text-white" strokeWidth={3} />
      </span>
    )
  }
  if (status === 'active' || status === 'running') {
    return (
      <span className="flex items-center justify-center w-5 h-5 shrink-0">
        <Loader2 size={17} className="animate-spin text-[var(--accent)]" strokeWidth={2.5} />
      </span>
    )
  }
  if (status === 'blocked' || status === 'failed') {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--pv-error-bg)] shrink-0">
        <AlertOctagon size={12} className="text-[var(--pv-error-text)]" strokeWidth={2.5} />
      </span>
    )
  }
  return <span className="w-5 h-5 rounded-full border-[1.5px] border-[var(--pv-neutral-grey-300)] shrink-0" />
}


function SubStepRow({ label, status, tooltip, timeHint, onCancel }) {
  // The active (or blocked) step lifts into a bordered white sub-card that
  // shows its description inline; completed / pending rows stay compact with
  // just the circle + label (description on the `title` tooltip).
  const expanded = status === 'active' || status === 'blocked'
  const inlineDesc = timeHint?.tooltip || tooltip

  if (expanded) {
    return (
      <li className={`rounded-xl border bg-white px-3.5 py-3${status === 'blocked' ? 'border-[var(--pv-error-text)]/40' : 'border-[var(--pv-neutral-grey-200)]'}`}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5"><StepIndicator status={status} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-[var(--text-primary)]">
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
            </div>
            {inlineDesc ? (
              <p className={`text-[12px] leading-snug mt-1 ${status === 'blocked' ? 'text-[var(--pv-error-text)]/90' : 'text-[var(--text-secondary)]'}`}>
                {inlineDesc}
              </p>
            ) : null}
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2.5 px-2 py-2" title={tooltip}>
      <StepIndicator status={status} />
      <span className={`flex-1 min-w-0 text-[13px] truncate ${status === 'completed' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
    </li>
  )
}


export function SetupSubStepList({ setupStage, hadClarifications, paused, onCancel, blocked }) {
  const steps = STEP_DEFS.filter((s) => !s.conditional || hadClarifications)
  const currentOrder = STAGE_ORDER[setupStage] || 0

  // Header counts active+completed steps for parity with the Build pane.
  const completed = steps.filter((s) => STAGE_ORDER[s.key] < currentOrder).length
  const total = steps.length

  // Inline time hint for the active row. Stopwatch is paused on Pusher
  // disconnect, while the planner is awaiting user input (awaiting_input /
  // followup_question — the clock there is on the user, not the system),
  // and when the run has blocked (it halted — the clock shouldn't run).
  const userGated = setupStage === 'awaiting_input' || setupStage === 'followup_question'
  const elapsed = useSubStageStopwatch(setupStage, paused || userGated || blocked)
  const activeTimeHint = userGated || blocked ? null : getInlineTimeHint(setupStage, elapsed)

  return (
    <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--pv-neutral-grey-150)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {blocked ? (
            <AlertOctagon size={15} className="text-[var(--pv-error-text)] shrink-0" />
          ) : (
            <Loader2 size={15} className="text-[var(--accent)] shrink-0 animate-spin" />
          )}
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
            {blocked ? 'Plan halted' : 'Preparing the plan'}
          </h2>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] shrink-0 tabular-nums">
          {completed} / {total}
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {steps.map((step) => {
          const order = STAGE_ORDER[step.key]
          let status
          if (order < currentOrder) status = 'completed'
          else if (order === currentOrder) status = blocked ? 'blocked' : 'active'
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


// Right-pane content for non-clarification states. Returns null when the
// active sub-state is awaiting_input / followup_question (caller is
// expected to render the ClarificationCard in that case).
// Right pane during PLANNING. The left step list owns "what's happening now";
// this pane owns the DESTINATION — what you'll get and the assumptions being
// locked in — so the two panes divide labor instead of paraphrasing each other.
export function SetupRightPaneCopy({ setupStage, keyChoices, questions, outcome }) {
  if (setupStage === 'awaiting_input' || setupStage === 'followup_question') {
    return null
  }
  const hasKeyChoices = (keyChoices?.length || 0) > 0
  const qs = Array.isArray(questions) ? questions.slice(0, 5) : []

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          <Sparkles size={12} className="text-[var(--accent)]" />
          While Sage plans this
        </div>

        {outcome ? (
          <p className="text-[14px] text-[var(--text-primary)] leading-relaxed mb-6">{outcome}</p>
        ) : null}

        {qs.length ? (
          <div className="mb-6">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Questions it&apos;ll answer</div>
            <ul className="flex flex-col gap-2">
              {qs.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--text-secondary)] leading-snug">
                  <CheckCircle2 size={14} className="text-[var(--accent)] mt-0.5 shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasKeyChoices ? (
          <div className="pt-4 border-t border-[var(--border-primary)]">
            <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Assumptions so far</div>
            <div className="flex flex-col gap-1.5">
              {keyChoices.map((c, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="text-[var(--text-muted)] shrink-0">{c.label}</span>
                  <span className="font-medium text-[var(--text-primary)] text-right">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
