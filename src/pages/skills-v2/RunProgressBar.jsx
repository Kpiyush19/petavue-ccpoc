import { useMemo } from 'react'
import {
  NumberCircleOne, NumberCircleTwo, NumberCircleThree, NumberCircleFour,
  CheckCircle, WarningCircle,
} from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/Spinner'

// Numbered-circle glyph per stage index — the "number icon then step name"
// treatment used by the verify-&-publish step nav.
const NUMBER_ICONS = [NumberCircleOne, NumberCircleTwo, NumberCircleThree, NumberCircleFour]


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
    tooltip: 'Reviews the data and drafts the plan for the dashboard or memo: what to compute, what to show, and what to leave out. The plan is presented for approval before anything is built. Usually 8–12 minutes (excluding time spent answering questions).',
  },
  {
    key: 'approve',
    label: 'Review',
    tooltip: 'Review the plan Sage drafted and build it when it looks right. Nothing runs until you say so.',
  },
  {
    key: 'build',
    label: 'Build',
    tooltip: 'Runs the queries, assembles the dashboard or memo, then quality-checks every value: reviews the result, refines anything that needs it, and runs a final check. Usually 10–13 minutes.',
  },
  {
    key: 'ready',
    label: 'Ready',
    tooltip: 'The draft dashboard or memo is built and ready to take into chat.',
  },
]

const USER_GATED_SUBSTAGES = new Set(['awaiting_input', 'followup_question'])


// ─── State derivation ──────────────────────────────────────────────────

function activeStageForPhase(phase) {
  if (!phase || phase === 'PLANNING') return 'setup'
  if (phase === 'AWAITING_CONFIRMATION') return 'approve'
  // Quality check (VERIFYING/FIXING) is the tail of Build, not its own stage.
  if (phase === 'EXECUTING' || phase === 'VERIFYING' || phase === 'FIXING') return 'build'
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

function StageSegment({ stage, state, index, isLast, userGated }) {
  const isDone = state === 'completed'
  const isActive = state === 'active'
  const isBlocked = state === 'blocked'
  const accent = isDone || isActive

  const color = isBlocked
    ? 'text-[var(--pv-error-text)]'
    : accent
    ? 'text-[var(--accent)]'
    : 'text-[var(--text-muted)]'

  // Icon: check (done), spinner (active/working), warning (blocked),
  // numbered circle (pending) — number icon then step name, in a row.
  let icon
  if (isDone) {
    icon = <CheckCircle weight="fill" size={18} className="shrink-0 text-[var(--accent)]" />
  } else if (isActive) {
    icon = <Spinner size={16} className="shrink-0" />
  } else if (isBlocked) {
    icon = <WarningCircle weight="fill" size={18} className="shrink-0 text-[var(--pv-error-text)]" />
  } else {
    const NumIcon = NUMBER_ICONS[index] || NumberCircleOne
    icon = <NumIcon size={18} className="shrink-0 text-[var(--text-muted)]" />
  }

  return (
    <div className="flex items-center shrink-0">
      {/* Native `title` tooltip — hover for the stage description + timing. */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5"
        title={stage.tooltip}
        aria-current={isActive ? 'step' : undefined}
      >
        {icon}
        <span className={`text-[12px] whitespace-nowrap transition-colors ${color} ${isActive ? 'font-semibold' : 'font-medium'}`}>
          {stage.label}
        </span>
      </div>
      {!isLast ? (
        <div className={`w-6 h-px mx-0.5 shrink-0 ${isDone ? 'bg-[var(--accent)]/50' : 'bg-[var(--border-primary)]'} ${userGated ? 'border-t border-dashed border-[var(--accent)]/50 bg-transparent' : ''}`} />
      ) : null}
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
  bare = false,
}) {
  // Silence unused-var lint while keeping props in the public API for
  // future revival of bar-level captions.
  void buildSubStage; void outputType; void paused
  void onCancel; void clarificationCount

  const terminal = blocked || cancelled
  const liveStage = activeStageForPhase(phase)
  const activeStage = useMemo(() => {
    if (!terminal) return liveStage
    if (checkSubStage) return 'build'
    if (setupStage)    return 'setup'
    return liveStage
  }, [terminal, liveStage, setupStage, checkSubStage])

  const activeIdx = stageIndex(activeStage)

  const userGated = (
    activeStage === 'approve'
    || (activeStage === 'setup' && USER_GATED_SUBSTAGES.has(setupStage))
  )

  const segments = (
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
                index={i}
                isLast={i === STAGES.length - 1}
                userGated={userGated && i === activeIdx}
              />
            )
          })}
    </div>
  )

  // Bare: just the segments, for embedding in the run-page footer bar.
  if (bare) return segments

  return (
    <div className="border-b border-[var(--pv-neutral-grey-150)] px-6 py-2.5 bg-white">
      <div className="max-w-3xl mx-auto">{segments}</div>
    </div>
  )
}
