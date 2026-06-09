import { useMemo } from 'react'
import {
  CheckCircle2, Loader2, Circle, AlertCircle,
  Database, FunctionSquare, LayoutGrid, Wrench, Sparkles,
  ShieldCheck, Check, LayoutDashboard, FileText, Calculator, X,
  MessageSquarePlus, ShieldPlus,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import {
  useSubStageStopwatch,
  getInlineTimeHint,
  severityTextClass,
  severityRowAccentClass,
} from './subStageTime'
import HtmlViewer from '../../components/sessions/viewers/HtmlViewer'
import MarkdownViewer from '../../components/sessions/viewers/MarkdownViewer'
import DisclosureCallout from './DisclosureCallout'
import BlockedCallout from './BlockedCallout'
import { useFeatureFlagEnabled } from '../../providers/posthog'


// Hide the Publish Dashboard CTA on COMPLETE for now — the underlying
// handoff + V&P modal plumbing stays intact (still reachable via the
// artifact panel triple-dot menu post-handoff). Flip to true to bring
// the dedicated end-of-run button back.
const SHOW_PUBLISH_BUTTON = false


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


// ─── Static maps ───────────────────────────────────────────────────────
const KIND_META = {
  query: { icon: Database, label: 'Query' },
  transform: { icon: FunctionSquare, label: 'Transform' },
  widget: { icon: LayoutGrid, label: 'Widget' },
  verify: { icon: ShieldCheck, label: 'Verify' },
}

const STATUS_META = {
  running: {
    icon: Loader2,
    iconClass: 'animate-spin text-[var(--accent)]',
    rowClass: 'bg-[var(--accent)]/5 border-[var(--accent)]/30',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-[var(--pv-success-text)]',
    rowClass: 'border-[var(--border-primary)]',
  },
  failed: {
    icon: AlertCircle,
    iconClass: 'text-[var(--pv-error-text)]',
    rowClass: 'border-[var(--pv-error-text)]/30',
  },
  pending: {
    icon: Circle,
    iconClass: 'text-[var(--text-muted)]',
    rowClass: 'border-[var(--border-primary)] opacity-70',
  },
}
// Executor emits `done`; we render it the same as `success`.
STATUS_META.done = STATUS_META.success


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
function StepRow({ step, status, title }) {
  const kindMeta = KIND_META[step.kind] || { icon: Circle, label: step.kind }
  const KindIcon = kindMeta.icon
  const statusMeta = STATUS_META[status] || STATUS_META.pending
  const StatusIcon = statusMeta.icon

  return (
    <li
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${statusMeta.rowClass}`}
      title={title}
    >
      <StatusIcon size={14} className={`shrink-0 ${statusMeta.iconClass}`} />
      <KindIcon size={12} className="text-[var(--text-muted)] shrink-0" />
      <span className="flex-1 min-w-0 text-[12.5px] text-[var(--text-primary)] truncate">
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
  let Icon = Circle
  let iconClass = 'text-[var(--text-muted)]'
  let rowClass = 'border-[var(--border-primary)] opacity-70'

  if (status === 'success') {
    Icon = CheckCircle2
    iconClass = 'text-[var(--pv-success-text)]'
    rowClass = 'border-[var(--border-primary)]'
  } else if (status === 'running') {
    Icon = Loader2
    iconClass = 'animate-spin text-[var(--accent)]'
    rowClass = 'bg-[var(--accent)]/5 border-[var(--accent)]/30'
  } else if (status === 'blocked') {
    Icon = AlertCircle
    iconClass = 'text-[var(--pv-error-text)]'
    rowClass = 'border-[var(--pv-error-text)]/30'
  }

  const overrunAccent = status === 'running' && timeHint && timeHint.severity !== 'normal'
    ? severityRowAccentClass(timeHint.severity)
    : ''

  return (
    <li
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${rowClass} ${overrunAccent}`}
      title={timeHint?.tooltip || label}
    >
      <Icon size={14} className={`shrink-0 ${iconClass}`} />
      <ShieldCheck size={12} className="text-[var(--text-muted)] shrink-0" />
      <span className="flex-1 min-w-0 text-[12.5px] text-[var(--text-primary)] truncate">
        {label}
      </span>
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
    : 'Running the plan'

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
    <div className="flex-1 flex min-h-0 gap-4 h-full">
      {/* ── Left pane: step list ── */}
      <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <HeadingIcon size={15} className="text-[var(--accent)] shrink-0" />
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
              {headingLabel}
            </h2>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] shrink-0">
            {counts.success} / {total}
            {counts.failed > 0 ? ` · ${counts.failed} failed` : ''}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {rows.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              status={step._status}
              title={step._title}
            />
          ))}
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
        <div className="flex-1 min-h-0 flex flex-col bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
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
              />
            </div>
          </>
        ) : showFinalArtifact ? (
          <>
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[var(--pv-success-bg)] border-b border-[var(--pv-success-text)]/30 text-[12px] text-[var(--pv-success-text)] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={13} className="shrink-0" />
                <span className="font-medium">
                  {outputType === 'memo' ? 'Memo ready.' : 'Dashboard ready.'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Publish Dashboard — hidden in UI for now. The handoff
                    + V&P modal plumbing (onVerifyPublish, route state
                    openVerifyPublish) is intact and still reachable via
                    the artifact panel triple-dot menu post-handoff. Flip
                    SHOW_PUBLISH_BUTTON to true to bring back the CTA. */}
                {SHOW_PUBLISH_BUTTON && outputType !== 'memo' && onVerifyPublish ? (
                  <Button
                    onClick={onVerifyPublish}
                    size="sm"
                    variant="primary"
                    disabled={verifyPublishLoading || followUpLoading}
                  >
                    {verifyPublishLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-1" />
                        Opening…
                      </>
                    ) : (
                      <>
                        <ShieldPlus size={12} className="mr-1" />
                        Publish Dashboard
                      </>
                    )}
                  </Button>
                ) : null}
                {onFollowUp ? (
                  <Button
                    onClick={onFollowUp}
                    size="sm"
                    variant="primary"
                    disabled={followUpLoading || verifyPublishLoading}
                  >
                    {followUpLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-1" />
                        Opening…
                      </>
                    ) : (
                      <>
                        <MessageSquarePlus size={12} className="mr-1" />
                        {outputType === 'memo'
                          ? 'Open memo in chat'
                          : 'Open dashboard in chat'}
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-white">
              <FinalArtifactPane
                sessionId={sessionId}
                outputType={outputType}
                memoPath={memoPath}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0">
            <PlanSummaryPane summary={planSummary} />
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
