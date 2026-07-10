import { Check, Sparkles, AlertOctagon, Database, ShieldCheck, PenLine, SearchCheck } from 'lucide-react'
import { CheckCircle, Circle } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/Spinner'
import {
  useSubStageStopwatch,
  getInlineTimeHint,
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
    label: 'A few questions',
    // Always shown (not conditional) so the step is stable in place and
    // doesn't pop into the list mid-run when a question appears.
    tooltip: 'Sage needs a few answers from you before it can continue.',
  },
  {
    key: 'verifying_answers',
    label: 'Verifying answers',
    tooltip: 'Runs a quick sanity check on your answers from the previous step. Usually 1–2 minutes.',
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
    return <CheckCircle size={16} weight="fill" className="text-[var(--accent)] shrink-0" />
  }
  if (status === 'active' || status === 'running') {
    return <Spinner size={16} className="shrink-0" />
  }
  if (status === 'blocked' || status === 'failed') {
    return (
      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--pv-error-bg)] shrink-0">
        <AlertOctagon size={11} className="text-[var(--pv-error-text)]" strokeWidth={2.5} />
      </span>
    )
  }
  return <Circle size={16} className="text-[var(--pv-neutral-grey-300)] shrink-0" />
}


function SubStepRow({ label, status, tooltip, timeHint, onCancel }) {
  // The active (or blocked) step lifts into a bordered white sub-card that
  // shows its description inline; completed / pending rows stay compact with
  // just the circle + label (description on the `title` tooltip).
  const expanded = status === 'active' || status === 'blocked'
  const inlineDesc = timeHint?.tooltip || tooltip

  if (expanded) {
    return (
      <li className="px-2 py-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5"><StepIndicator status={status} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 text-[14px] font-semibold text-[var(--color-primary-500)]">
                {label}
              </span>
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
              <p className={`text-[12px] leading-snug mt-1 ${status === 'blocked' ? 'text-[var(--pv-error-text)]/90' : 'text-[var(--color-text-secondary)]'}`}>
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
      <span className={`flex-1 min-w-0 text-[14px] truncate ${status === 'completed' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--color-text-disabled)]'}`}>
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
    <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] border-r-0 rounded-l-2xl overflow-hidden">
      <div className="flex items-center justify-between h-12 px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {blocked ? (
            <AlertOctagon size={15} className="text-[var(--pv-error-text)] shrink-0" />
          ) : null}
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
            {blocked ? 'Plan halted' : 'Preparing the plan'}
          </h2>
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
// Per-stage empty state for the right pane during PLANNING. There's no data
// to show yet, so we just explain, in one line, what the current step is doing.
const STAGE_EMPTY = {
  workspace_ready: { icon: Sparkles, copy: 'Setting up the workspace where this run lives.' },
  reviewing_data: { icon: Database, copy: 'Looking through your connected data — the tables, schemas, and how your metrics are defined — to shape the right plan.' },
  verifying_answers: { icon: ShieldCheck, copy: 'Running a quick sanity check on your answers to make sure they return meaningful data before drafting.' },
  drafting_plan: { icon: PenLine, copy: 'Assembling the plan: which queries to run, how the data gets transformed, and what each part will show.' },
  reviewing_plan: { icon: SearchCheck, copy: 'Doing a final pass over the plan to catch anything missing or vague before it comes to you for review.' },
}

// Right pane during PLANNING (when there's no clarification to answer). A
// simple centered empty state describing the current step.
export function SetupRightPaneCopy({ setupStage }) {
  if (setupStage === 'awaiting_input' || setupStage === 'followup_question') {
    return null
  }
  const content = STAGE_EMPTY[setupStage] || STAGE_EMPTY.workspace_ready
  const Icon = content.icon

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-xs text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-3.5">
          <Icon size={20} strokeWidth={1.8} />
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{content.copy}</p>
      </div>
    </div>
  )
}
