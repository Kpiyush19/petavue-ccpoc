import { useMemo } from 'react'
import { Check, Circle, AlertCircle, Loader2 } from 'lucide-react'


// ─── Stage definitions ────────────────────────────────────────────────
// Five top-level stages. Order is fixed — the progression rule is
// "forward only" with sub-state re-entry handled inside each stage
// (e.g. round-2 clarifications stay in Plan, label changes).
//
// `tooltip` is the description + typical-time line shown when the user
// hovers a stage segment. Native `title` attribute (cheap, accessible).
const STAGES = [
  {
    key: 'setup',
    label: 'Plan',
    tooltip: 'Reviews the data and drafts the plan for the dashboard or memo — what to compute, what to show, and what to leave out. The plan is presented for approval before anything is built. Usually 8–12 minutes (excluding time spent answering clarifications).',
  },
  {
    key: 'approve',
    label: 'Approval',
    tooltip: 'Review the plan and approve to run.',
  },
  {
    key: 'build',
    label: 'Build',
    tooltip: 'Runs the queries, transforms the data, and assembles the dashboard or memo. Usually 5–6 minutes.',
  },
  {
    key: 'check',
    label: 'Quality check',
    tooltip: 'Reviews the result, refines anything that needs it, then runs a final check. Usually 5–7 minutes; a few extra minutes if a second round of refinement is needed.',
  },
  {
    key: 'ready',
    label: 'Ready',
    tooltip: 'The dashboard or memo is ready.',
  },
]

const USER_GATED_SUBSTAGES = new Set(['awaiting_input', 'followup_question'])


// ─── State derivation ──────────────────────────────────────────────────

function activeStageForPhase(phase) {
  if (!phase || phase === 'PLANNING') return 'setup'
  if (phase === 'AWAITING_CONFIRMATION') return 'approve'
  if (phase === 'EXECUTING') return 'build'
  if (phase === 'VERIFYING' || phase === 'FIXING') return 'check'
  // OPEN_CHAT is post-handoff; the run is done. Treat it like COMPLETE
  // for progress-bar purposes (all segments green, last segment shown
  // as Ready) so the bar isn't visually broken after auto-handoff.
  if (phase === 'COMPLETE' || phase === 'OPEN_CHAT') return 'ready'
  return 'setup'
}

function stageIndex(stageKey) {
  return STAGES.findIndex((s) => s.key === stageKey)
}


// ─── Visual primitives ─────────────────────────────────────────────────

function StageSegment({ stage, state, isLast, userGated }) {
  const baseDot = 'flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-all'
  let dot
  let labelClass = 'text-[12px] leading-tight tracking-wide transition-colors'

  if (state === 'completed') {
    dot = (
      <div className={`${baseDot} bg-[var(--accent)] text-white`}>
        <Check size={11} strokeWidth={3} />
      </div>
    )
    labelClass += ' text-[var(--text-secondary)]'
  } else if (state === 'active') {
    // Loader2 spin for an unambiguous "still working" signal.
    dot = (
      <div className={`${baseDot} bg-[var(--accent)] text-white`}>
        <Loader2 size={12} className="animate-spin" strokeWidth={2.5} />
      </div>
    )
    labelClass += ' text-[var(--text-primary)] font-semibold'
  } else if (state === 'blocked') {
    dot = (
      <div className={`${baseDot} bg-[var(--pv-error-bg)] text-[var(--pv-error-text)] border border-[var(--pv-error-text)]/40`}>
        <AlertCircle size={11} strokeWidth={2.5} />
      </div>
    )
    labelClass += ' text-[var(--pv-error-text)] font-medium'
  } else {
    dot = (
      <div className={`${baseDot} border border-[var(--border-primary)] text-[var(--text-muted)]`}>
        <Circle size={9} strokeWidth={2} />
      </div>
    )
    labelClass += ' text-[var(--text-muted)]'
  }

  const connectorBase = 'flex-1 h-px mx-2 transition-colors'
  const connectorActive = state === 'completed' ? 'bg-[var(--accent)]/60' : 'bg-[var(--border-primary)]'
  const connectorClass = `${connectorBase} ${connectorActive} ${userGated ? 'border-t border-dashed border-[var(--accent)]/40 bg-transparent' : ''}`

  return (
    <div className="flex items-center flex-1 min-w-0">
      {/* Native `title` tooltip — hover any stage segment to see its
          description + typical duration. No cursor-help to avoid the
          question-mark OS cursor. */}
      <div
        className="flex flex-col items-center gap-1.5 min-w-0"
        title={stage.tooltip}
      >
        {dot}
        <span className={labelClass}>{stage.label}</span>
      </div>
      {!isLast ? <div className={connectorClass} /> : null}
    </div>
  )
}


// ─── Main component ───────────────────────────────────────────────────
// Just the 5-segment stepper. The "what's happening right now" status
// + the overrun framing both live INLINE on the active row in the
// left pane (SetupSubStepList during Plan, verify-row during Check) —
// duplicating them as a caption under the bar wasted vertical space
// and forced the user to look in two places for the same info.
//
// Props kept for backwards-compat with the existing call site even
// though most aren't read anymore (buildSubStage, checkSubStage,
// outputType, onCancel, clarificationCount, paused).

export default function RunProgressBar({
  phase,
  setupStage,
  buildSubStage,
  checkSubStage,
  outputType,
  blocked,
  cancelled,
  paused,
  onCancel,
  clarificationCount,
}) {
  // Silence unused-var lint while keeping props in the public API for
  // future revival of bar-level captions.
  void buildSubStage; void outputType; void paused
  void onCancel; void clarificationCount

  const terminal = blocked || cancelled
  const liveStage = activeStageForPhase(phase)
  const activeStage = useMemo(() => {
    if (!terminal) return liveStage
    if (checkSubStage) return 'check'
    if (setupStage)    return 'setup'
    return liveStage
  }, [terminal, liveStage, setupStage, checkSubStage])

  const activeIdx = stageIndex(activeStage)

  const userGated = (
    activeStage === 'approve'
    || (activeStage === 'setup' && USER_GATED_SUBSTAGES.has(setupStage))
  )

  return (
    <div className="border-b border-[var(--border-primary)] px-6 py-2 bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center">
          {STAGES.map((stage, i) => {
            let segmentState
            if (phase === 'COMPLETE' || phase === 'OPEN_CHAT') {
              // Run is finished — Ready (and every prior stage) shows
              // a checkmark, no spinner. Without this, the activeStage
              // resolver returns 'ready' on COMPLETE/OPEN_CHAT which
              // would land the active-state spinner on the final dot.
              segmentState = 'completed'
            } else if (terminal && i === activeIdx) {
              segmentState = 'blocked'
            } else if (i < activeIdx) {
              segmentState = 'completed'
            } else if (i === activeIdx) {
              segmentState = 'active'
            } else {
              segmentState = 'pending'
            }
            return (
              <StageSegment
                key={stage.key}
                stage={stage}
                state={segmentState}
                isLast={i === STAGES.length - 1}
                userGated={userGated && i === activeIdx}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
