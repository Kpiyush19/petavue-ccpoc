import { useMemo, useState, Fragment } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, Loader2, Circle, AlertCircle,
  Wrench, Sparkles, ShieldCheck, Check, LayoutDashboard, FileText, Calculator, X,
} from 'lucide-react'
import { Button as PvButton } from '../../petavue'
import {
  useSubStageStopwatch,
  getInlineTimeHint,
  severityTextClass,
} from './subStageTime'
import { StepIndicator } from './SetupProgress'
import { SchematicBody } from './WidgetSchematic'
import HtmlViewer from '../../components/sessions/viewers/HtmlViewer'
import MarkdownViewer from '../../components/sessions/viewers/MarkdownViewer'
import DisclosureCallout from './DisclosureCallout'
import BlockedCallout from './BlockedCallout'
import { useFeatureFlagEnabled } from '../../providers/posthog'


// ─── Display title ─────────────────────────────────────────────────────
// Planner-authored `**Title:**` wins. For legacy plans without a title we
// strip the kind prefix off the step id (e.g. `q01_channel_sessions` →
// "Channel sessions"). Never returns empty.
function getDisplayTitle(step) {
  if (!step) return ''
  if (step.title) return step.title
  if (!step.id) return ''
  const stripped = step.id
    .replace(/^[a-z]\d+_/, '')
    .replace(/^widget_\d+_/, '')
  const words = stripped.replace(/_/g, ' ').trim()
  if (!words) return step.id
  return words.charAt(0).toUpperCase() + words.slice(1)
}


// Human-readable phase names for the build step groups. The raw steps are
// engine operations (query / transform / widget); grouping them under these
// headers turns a wall of 20+ technical rows into a few phases an operator
// recognizes.
const GROUP_LABEL = {
  query: 'Pull your data',
  transform: 'Apply your definitions',
  widget: 'Build the widgets',
  verify: 'Quality check',
}

function GroupHeader({ kind }) {
  return (
    <li className="px-2 pt-3 pb-1 first:pt-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
      {GROUP_LABEL[kind] || kind}
    </li>
  )
}

// ─── Verify section (multi-row) ───────────────────────────────────────
// The verify section is UI-only — no corresponding plan steps. Rather
// than one row that mutates label as the phase changes (the old
// implementation), we render separate sequential rows that build up as
// the run progresses through quality-check phases. This gives the user
// a visible "this is what happened" history instead of a single shifting
// label. Positive framing throughout — no finding counts surfaced, no
// "issues found" language.
//
// Row appearance rules (derived from phase + verificationRound):
//   - 'reviewing'   shown once we enter VERIFYING for the first time.
//   - 'polishing'   shown once we enter FIXING (or once round >= 2,
//                   which implies FIXING ran between rounds).
//   - 'final_check' shown once round >= 2 (round-2 VERIFYING).
// Status of each row: completed (past), active (current), blocked
// (terminal-with-failure on this row), pending (never reached).
function buildVerifyRows({ phase, round }) {
  const terminal = phase === 'COMPLETE' || phase === 'BLOCKED'
  const blocked = phase === 'BLOCKED'

  // Decide which rows are visible.
  const visible = []
  // 'reviewing' first appears the moment we cross from EXECUTING into
  // any verify-related phase (VERIFYING / FIXING / terminal).
  if (phase !== 'EXECUTING') visible.push('reviewing')
  if (phase === 'FIXING' || round >= 2 || (terminal && round >= 2)) visible.push('polishing')
  if (round >= 2) visible.push('final_check')

  if (!visible.length) {
    // Pre-verify (still EXECUTING): show a single pending placeholder
    // so the verify section's existence is visible. Total count uses
    // 1 to keep "N / N" stable.
    return [{
      key: 'reviewing',
      label: 'Reviewing the result',
      status: 'pending',
    }]
  }

  // Determine which visible row is "active" right now.
  let activeKey = null
  if (!terminal) {
    if (phase === 'VERIFYING' && round <= 1) activeKey = 'reviewing'
    else if (phase === 'FIXING') activeKey = 'polishing'
    else if (phase === 'VERIFYING' && round >= 2) activeKey = 'final_check'
  }

  const labelOf = {
    reviewing: 'Reviewing the result',
    polishing: 'Refining the result',
    final_check: 'Final check',
  }

  return visible.map((key) => {
    let status
    if (terminal && blocked && key === activeKeyForBlocked({ phase, round })) {
      status = 'blocked'
    } else if (terminal) {
      status = 'success'
    } else if (key === activeKey) {
      status = 'running'
    } else {
      // Visible but not active and not terminal — must be a past phase.
      status = 'success'
    }
    return { key, label: labelOf[key], status }
  })
}

// Pick which row should carry the "blocked" red state when the run
// halts in a quality-check phase. We can't tell post-hoc which sub-row
// was active when BLOCKED fired (verifier might have blocked round 1
// outright, or round 2 might have blocked). Heuristic: if round=1 and
// no polishing/final_check rows were ever visible, blame 'reviewing'.
// If round=2 was reached, blame 'final_check' (round 2 is what carried
// the block verdict).
function activeKeyForBlocked({ round }) {
  if (round >= 2) return 'final_check'
  return 'reviewing'
}


// ─── Step row (status-only, not clickable) ─────────────────────────────
// "Save answers as reusable context" popup — opened from the completed run's
// "Review & save answers" action. Lists the answers/definitions this run
// produced; the user picks which to save so future runs reuse them.
function SaveAnswersModal({ answers, onClose }) {
  const [selected, setSelected] = useState(() => new Set(answers.map((a) => a.id)))
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const count = selected.size
  const save = () => {
    onClose()
    toast.success(`Saved ${count} ${count === 1 ? 'answer' : 'answers'} as reusable context.`)
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] max-h-[80vh] flex flex-col bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl shadow-[0_24px_60px_-12px_rgba(16,24,40,0.4)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={15} className="text-[var(--accent)] shrink-0" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">Save answers as reusable context</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border-none bg-transparent cursor-pointer transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
          <p className="text-[12px] text-[var(--text-secondary)] leading-snug px-1 mb-1">
            These are the definitions and settings you confirmed for this run. Save the ones you want future runs to reuse automatically.
          </p>
          {answers.map((a) => {
            const on = selected.has(a.id)
            const isKD = a.kind === 'Key Definition'
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                className="flex items-start gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2.5 text-left cursor-pointer hover:border-[var(--text-muted)]/40 transition-colors"
              >
                <span className={`mt-0.5 shrink-0 w-8 h-[18px] rounded-full p-0.5 flex items-center transition-colors ${on ? 'bg-[var(--accent)] justify-end' : 'bg-[var(--border-primary)] justify-start'}`}>
                  <span className="w-[14px] h-[14px] rounded-full bg-white shadow-sm" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12.5px] font-medium text-[var(--text-primary)]">{a.title}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isKD ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>{a.kind}</span>
                  </span>
                  <span className="block text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{a.target}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 shrink-0 border-t border-[var(--border-primary)]">
          <PvButton onClick={onClose} size="sm" variant="ghost" label="Cancel" />
          <span className="text-[11.5px] text-[var(--text-muted)]">{count} of {answers.length} selected</span>
          <PvButton onClick={save} size="sm" variant="primary" disabled={count === 0} label={`Save ${count}`} />
        </div>
      </div>
    </div>
  )
}


// Per-step results shown on the RIGHT during the build/verify phases: each
// completed step surfaces what it produced (r.result), the active one shows
// its goal (r.purpose), so the run reads as outcomes, not bare tool calls.
// A single widget tile in the building-dashboard preview: a skeleton while
// pending/building, the schematic once its turn has completed.
function BuildTile({ widget, status }) {
  return (
    <div className={`rounded-xl border p-3.5 transition-all ${status === 'done' ? 'border-[var(--border-primary)] bg-white' : status === 'building' ? 'border-[var(--accent)]/40 bg-[var(--accent)]/[0.03]' : 'border-[var(--border-primary)] bg-[var(--bg-primary)]'}`}>
      <div className="flex items-center gap-1.5 mb-2.5">
        {status === 'done' ? (
          <CheckCircle2 size={13} className="text-[var(--pv-success-text)] shrink-0" />
        ) : status === 'building' ? (
          <Loader2 size={13} className="animate-spin text-[var(--accent)] shrink-0" />
        ) : (
          <Circle size={11} className="text-[var(--text-muted)] shrink-0" />
        )}
        <span className={`text-[12px] font-medium truncate ${status === 'pending' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{widget.name}</span>
      </div>
      {status === 'done' ? (
        <SchematicBody id={widget.id} />
      ) : (
        <div className={`flex flex-col gap-1.5 ${status === 'building' ? 'animate-pulse' : 'opacity-50'}`}>
          {(status === 'building' ? [100, 82, 90, 64] : [100, 68]).map((w, i) => (
            <div key={i} className="h-2.5 rounded bg-[var(--bg-primary)]" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}

// The build's right pane: the planned widgets rendered as sample-layout tiles
// that fill in as the run progresses — so you watch the dashboard take shape
// instead of reading a text log, and it flows into the real artifact on
// completion. Reveal count tracks completed plan steps.
function BuildingDashboardPane({ widgets, rows, isMemo }) {
  const done = rows.filter((r) => r._status === 'success').length
  const total = rows.length || 1
  const revealed = Math.min(widgets.length, Math.floor((done / total) * widgets.length))
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className={`grid gap-3 ${isMemo ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {widgets.map((w, i) => {
          const status = i < revealed ? 'done' : i === revealed ? 'building' : 'pending'
          return <BuildTile key={w.id} widget={w} status={status} />
        })}
      </div>
    </div>
  )
}


function StepResultsPane({ rows }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const done = r._status === 'success'
          const running = r._status === 'running'
          return (
            <div
              key={r.id}
              className={`rounded-lg border p-3 transition-colors ${done ? 'border-[var(--border-primary)] bg-[var(--bg-primary)]' : running ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5' : 'border-[var(--border-primary)] opacity-45'}`}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 size={14} className="text-[var(--pv-success-text)] shrink-0" />
                ) : running ? (
                  <Loader2 size={14} className="animate-spin text-[var(--accent)] shrink-0" />
                ) : (
                  <Circle size={11} className="text-[var(--text-muted)] shrink-0" />
                )}
                <span className="text-[12.5px] font-medium text-[var(--text-primary)]">{r._title}</span>
              </div>
              {done && r.result ? (
                <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-1.5 pl-[22px]">{r.result}</p>
              ) : running ? (
                <p className="text-[12px] text-[var(--text-muted)] leading-snug mt-1.5 pl-[22px]">{r.purpose || 'Working…'}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}


function StepRow({ step, status, title }) {
  // Same vocabulary as the plan steps: the running (or failed) step lifts
  // into a white sub-card showing its purpose inline; done / pending rows
  // stay compact with just the circle + label.
  const expanded = status === 'running' || status === 'failed'

  if (expanded) {
    return (
      <li className={`rounded-xl border bg-white px-3.5 py-3${status === 'failed' ? 'border-[var(--pv-error-text)]/40' : 'border-[var(--pv-neutral-grey-200)]'}`}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5"><StepIndicator status={status} /></span>
          <div className="flex-1 min-w-0">
            <span className="block text-[13.5px] font-semibold text-[var(--text-primary)]">{title}</span>
            {step.purpose ? (
              <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-1">{step.purpose}</p>
            ) : null}
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2.5 px-2 py-2" title={step.purpose || title}>
      <StepIndicator status={status} />
      <span className={`flex-1 min-w-0 text-[13px] truncate ${status === 'success' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
        {title}
      </span>
    </li>
  )
}


// Verify row — one per visible quality-check phase. No sublabel (no
// finding counts), no error styling on intermediate rows. Status drives
// the icon (running spinner, success check, blocked alert, pending
// hollow). Same visual vocabulary as the plan-step rows above.
function VerifyRow({ label, status, timeHint, onCancel }) {
  // Quality-check rows share the plan/build vocabulary: the running row lifts
  // into a white sub-card, the rest stay compact circle + label.
  const expanded = status === 'running' || status === 'blocked'

  if (expanded) {
    return (
      <li className={`rounded-xl border bg-white px-3.5 py-3${status === 'blocked' ? 'border-[var(--pv-error-text)]/40' : 'border-[var(--pv-neutral-grey-200)]'}`}>
        <div className="flex items-center gap-2.5">
          <StepIndicator status={status} />
          <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-[var(--text-primary)]">{label}</span>
          {status === 'running' && timeHint?.text ? (
            <span className={`text-[10.5px] shrink-0 ${severityTextClass(timeHint.severity)}`}>
              {timeHint.text}
            </span>
          ) : null}
          {status === 'running' && timeHint?.showCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-[10.5px] shrink-0 underline text-[var(--pv-error-text)] hover:text-[var(--pv-error-text)]/80"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2.5 px-2 py-2" title={timeHint?.tooltip || label}>
      <StepIndicator status={status} />
      <span className={`flex-1 min-w-0 text-[13px] truncate ${status === 'success' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
    </li>
  )
}


// ─── Right pane: plan summary while running, final artifact on COMPLETE ─

function PlanSummaryPane({ summary }) {
  const isMemo = summary?.output_type === 'memo'
  const HeaderIcon = isMemo ? FileText : LayoutDashboard
  const headerLabel = isMemo ? 'Memo · in progress' : 'Dashboard · in progress'
  const willDeliver = summary?.plan_will_deliver || []
  const wontDeliver = summary?.plan_wont_deliver || []
  const keyFormulas = Array.isArray(summary?.plan_key_formulas) ? summary.plan_key_formulas : []
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-3">
          <HeaderIcon size={12} />
          {headerLabel}
        </div>
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)] leading-tight mb-2">
          {summary?.title || 'Your run'}
        </h2>
        {summary?.plan_outcome ? (
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
            {summary.plan_outcome}
          </p>
        ) : null}

        {(willDeliver.length || wontDeliver.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-5">
            {willDeliver.length ? (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Includes
                </div>
                <ul className="space-y-1.5">
                  {willDeliver.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] text-[var(--text-primary)] leading-snug"
                    >
                      <Check size={13} className="shrink-0 mt-0.5 text-[var(--pv-success-text)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {wontDeliver.length ? (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Won't include
                </div>
                <ul className="space-y-1.5">
                  {wontDeliver.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] text-[var(--text-primary)] leading-snug"
                    >
                      <X size={13} className="shrink-0 mt-0.5 text-[var(--text-muted)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {keyFormulas.length ? (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
              <Calculator size={11} />
              Key formulas applied
            </div>
            <ul className="space-y-2 border border-[var(--border-primary)] rounded-lg p-3 bg-[var(--bg-primary)]">
              {keyFormulas.map((f, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-0.5 pb-2 last:pb-0 last:border-0 border-b border-[var(--border-primary)]/60"
                >
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">
                    {f.name}
                  </span>
                  <span className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-mono">
                    {f.formula}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Running-with summary — same one-line surface as on the plan
            approval card, so the user can re-check the chosen filters
            mid-run without flipping back to the approval screen. */}
        {summary?.key_choices?.length ? (
          <div className="text-[12px] text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--border-primary)]">
            <span className="text-[var(--text-muted)]">Running with: </span>
            {summary.key_choices.map((c) => c.value).join(' · ')}
          </div>
        ) : null}
      </div>
    </div>
  )
}


function FinalArtifactPane({ sessionId, outputType, memoPath }) {
  if (outputType === 'memo') {
    if (!memoPath) {
      return (
        <div className="h-full flex items-center justify-center p-8 text-center">
          <p className="text-[13px] text-[var(--text-secondary)]">
            Your memo will appear here when ready.
          </p>
        </div>
      )
    }
    return <MarkdownViewer sessionId={sessionId} path={memoPath} />
  }
  return <HtmlViewer sessionId={sessionId} path="output/dashboard/index.html" />
}


// ─── Main component ────────────────────────────────────────────────────
export default function ExecutionProgress({
  sessionId,
  phase,
  steps,
  stepStatuses,
  outputType,
  memoPath,
  verificationRound,
  findingCount,
  checkSubStage,
  planSummary,
  disclosureSummary,
  blockedSummary,
  blockReason,
  onUseDisclosureFollowup,
  onFollowUp,
  followUpLoading,
  onVerifyPublish,
  verifyPublishLoading,
  onRerun,
  rerunning,
  paused,
  onCancel,
}) {
  // findingCount kept as a prop for backwards-compat; the multi-row
  // verify build-up replaces the finding-count pill, so we no longer
  // read it.
  void findingCount
  const [saveOpen, setSaveOpen] = useState(false)
  // Augment each plan step with its display title + a normalized status.
  const rows = useMemo(() => (
    (steps || []).map((s) => {
      let status = stepStatuses?.[s.id] || 'pending'
      if (status === 'done') status = 'success'
      return {
        ...s,
        _title: getDisplayTitle(s),
        _status: status,
      }
    })
  ), [steps, stepStatuses])

  // Verify rows — build-up pattern, see buildVerifyRows() for the rule.
  const verifyRows = buildVerifyRows({ phase, round: verificationRound })
  // Inline time hint for the active verify row. Stopwatch tracks the
  // current checkSubStage (running_checks / applying_fixes /
  // final_check); pause on Pusher disconnect.
  const verifyElapsed = useSubStageStopwatch(checkSubStage || '', paused)
  const verifyTimeHint = getInlineTimeHint(checkSubStage || '', verifyElapsed)

  // Header counts. Each visible verify row contributes 1 to the total —
  // the count grows as Refining and Final check materialize so the
  // "N / M" matches what the user actually sees in the list. Previously
  // verify collapsed to a single conceptual step to avoid mid-run jumps,
  // but that left "16 / 17" stuck even as three verify rows were
  // rendered below — visually inconsistent.
  const counts = { success: 0, running: 0, failed: 0, pending: 0 }
  for (const r of rows) {
    counts[r._status] = (counts[r._status] || 0) + 1
  }
  for (const vr of verifyRows) {
    // VerifyRow vocabulary is 'success' / 'running' / 'blocked' / 'pending'.
    // Map 'blocked' onto the 'failed' bucket so counts.failed surfaces it
    // in the "· N failed" tail.
    const bucket = vr.status === 'blocked' ? 'failed' : vr.status
    counts[bucket] = (counts[bucket] || 0) + 1
  }
  const total = rows.length + verifyRows.length

  // Header label tracks the phase. Short and Ops-friendly. Positive
  // copy for the quality-check phases — no "applying fixes" alarm.
  // OPEN_CHAT is post-handoff: the run is done, session_type is now
  // 'regular', but the user can still revisit the run page in read-only
  // mode. We render it identical to COMPLETE so the artifact is
  // visible and Follow Up / V&P buttons stay clickable (those use the
  // same handoff endpoint which is idempotent — see useSkillRun.js).
  const isExecuting = phase === 'EXECUTING'
  const isFixing = phase === 'FIXING'
  const isVerifying = phase === 'VERIFYING'
  const isComplete = phase === 'COMPLETE' || phase === 'OPEN_CHAT'
  const isBlocked = phase === 'BLOCKED'

  // Gate the disclosure callout behind a PostHog flag. Lets us roll the
  // refreshed UX out incrementally without coupling to a backend deploy:
  // the BE still computes and persists disclosure_summary, the FE just
  // hides the amber callout when the flag is off. `undefined` (flag not
  // yet loaded) is treated as off so we don't briefly show then hide it
  // during the PostHog bootstrap.
  const disclosureEnabled = useFeatureFlagEnabled('skills-v2-disclosure-summary')
  const HeadingIcon = isFixing ? Wrench : isComplete ? CheckCircle2 : Sparkles
  const headingLabel = isFixing
    ? 'Refining the result'
    : isVerifying && verificationRound >= 2
    ? 'Final check'
    : isVerifying
    ? 'Reviewing the result'
    : isComplete
    ? 'Done'
    : isBlocked
    ? 'Run blocked'
    : `Building your ${outputType === 'memo' ? 'memo' : 'dashboard'}`

  // Final-artifact preview — only on COMPLETE / OPEN_CHAT. We used to
  // render the artifact early during VERIFYING/FIXING (and even on the
  // last EXECUTING tick) but the dashboard manifest is written LAST,
  // after every widget JSX file, so the iframe loaded into a "No
  // dashboard manifest found" error for ~30s before the agent finalized
  // it. Right pane stays on plan summary until the run is fully done.
  const showFinalArtifact = isComplete

  if (!rows.length) {
    // BLOCKED with no plan steps = planner halted before authoring plan.md.
    // Show the GTM callout full-width instead of a misleading "Preparing…".
    if (isBlocked) {
      return (
        <div className="max-w-2xl mx-auto mt-8">
          <BlockedCallout
            summary={blockedSummary}
            fallbackReason={blockReason}
            onRerun={onRerun}
            rerunning={rerunning}
            onCorrect={onUseDisclosureFollowup}
            correcting={followUpLoading}
          />
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-center text-sm text-[var(--text-muted)]">
        Preparing steps…
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-h-0 h-full">
      {/* ── Left pane: step list ── */}
      <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between h-12 px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <HeadingIcon size={15} className="text-[var(--accent)] shrink-0" />
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
              {headingLabel}
            </h2>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] shrink-0 tabular-nums">
            {counts.success} / {total}
            {counts.failed > 0 ? ` · ${counts.failed} failed` : ''}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {rows.map((step, i) => {
            // Emit a phase header whenever the kind changes, so the flat list
            // reads as a few recognizable phases rather than 20+ ops.
            const showHeader = i === 0 || rows[i - 1].kind !== step.kind
            return (
              <Fragment key={step.id}>
                {showHeader ? <GroupHeader kind={step.kind} /> : null}
                <StepRow step={step} status={step._status} title={step._title} />
              </Fragment>
            )
          })}
          {verifyRows.length > 0 ? <GroupHeader kind="verify" /> : null}
          {verifyRows.map((r) => (
            <VerifyRow
              key={r.key}
              label={r.label}
              status={r.status}
              timeHint={r.status === 'running' ? verifyTimeHint : null}
              onCancel={onCancel}
            />
          ))}
        </ul>
        {/* Trust line — Petavue's core promise, made visible right where the
            numbers are being built. */}
        <div className="flex items-start gap-1.5 px-3.5 py-2.5 shrink-0 border-t border-[var(--pv-neutral-grey-150)]">
          <ShieldCheck size={12} className="text-[var(--accent)] mt-0.5 shrink-0" />
          <span className="text-[10.5px] leading-snug text-[var(--text-muted)]">
            Every value is source-linked to your data and computed with your team&apos;s definitions.
          </span>
        </div>
      </div>

      {/* ── Right pane: blocked callout | final artifact | plan summary ──
          Structure changed: outer wrapper is now a flex column so the
          disclosure callout can sit ABOVE the artifact card as a
          free-standing banner rather than embedded inside the artifact
          chrome. The artifact card preserves its own bg/border/rounded
          styling; the disclosure brings its own. `gap-3` gives the two
          visual separation. */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0 gap-3">
        {disclosureEnabled && disclosureSummary && !isBlocked ? (
          <DisclosureCallout
            summary={disclosureSummary}
            onUseFollowup={onUseDisclosureFollowup}
          />
        ) : null}
        <div className="flex-1 min-h-0 flex flex-col bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl overflow-hidden">
        {isBlocked ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--pv-error-bg)] border-b border-[var(--pv-error-text)]/30 text-[12px] text-[var(--pv-error-text)] shrink-0">
              <AlertCircle size={13} className="shrink-0" />
              <span className="font-medium">Run blocked.</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <BlockedCallout
                summary={blockedSummary}
                fallbackReason={blockReason}
                onRerun={onRerun}
                rerunning={rerunning}
                onCorrect={onUseDisclosureFollowup}
                correcting={followUpLoading}
              />
            </div>
          </>
        ) : showFinalArtifact ? (
          <>
            {/* Slim one-line status. The primary "Verify & refine in chat" is in
                the run-page footer; Review & save answers is a quiet secondary
                link here. (Publish stays parked behind SHOW_PUBLISH_BUTTON — the
                onVerifyPublish plumbing is intact via the artifact panel menu.) */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--pv-success-bg)] border-b border-[var(--pv-success-text)]/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-[12px] text-[var(--pv-success-text)]">
                <CheckCircle2 size={14} className="shrink-0" />
                <span className="truncate">
                  <span className="font-semibold">{outputType === 'memo' ? 'Draft memo built' : 'Draft dashboard built'}.</span>{' '}
                  <span className="text-[var(--pv-success-text)]/80">Not final until you verify it in chat.</span>
                </span>
              </div>
              {planSummary?.saveableAnswers?.length ? (
                <button
                  type="button"
                  onClick={() => setSaveOpen(true)}
                  className="shrink-0 text-[12px] font-medium text-[var(--pv-success-text)] hover:underline bg-transparent border-none cursor-pointer whitespace-nowrap"
                >
                  Review &amp; save answers
                </button>
              ) : null}
            </div>
            <div className="flex-1 min-h-0 bg-white">
              <FinalArtifactPane
                sessionId={sessionId}
                outputType={outputType}
                memoPath={memoPath}
              />
            </div>
          </>
        ) : (isExecuting || isVerifying || isFixing) && rows.length ? (
          <>
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--border-primary)] text-[12px] text-[var(--text-secondary)] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={13} className="text-[var(--accent)] shrink-0" />
                <span className="font-medium truncate">Your {outputType === 'memo' ? 'memo' : 'dashboard'}, taking shape</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] shrink-0">Sample layout</span>
            </div>
            <div className="flex-1 min-h-0">
              {planSummary?.widgets?.length ? (
                <BuildingDashboardPane
                  widgets={planSummary.widgets}
                  rows={rows}
                  isMemo={outputType === 'memo'}
                />
              ) : (
                <StepResultsPane rows={rows} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0">
            <PlanSummaryPane summary={planSummary} />
          </div>
        )}
        </div>
      </div>

      {saveOpen && planSummary?.saveableAnswers?.length ? (
        <SaveAnswersModal answers={planSummary.saveableAnswers} onClose={() => setSaveOpen(false)} />
      ) : null}
    </div>
  )
}
