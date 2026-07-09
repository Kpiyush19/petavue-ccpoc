import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Loader2, AlertCircle, Info,
  X,
} from 'lucide-react'
import { useSkillRun } from './useSkillRun'
import ClarificationCard from './ClarificationCard'
import PlanApprovalCard from './PlanApprovalCard'
import ExecutionProgress from './ExecutionProgress'
import RunProgressBar from './RunProgressBar'
import { SetupSubStepList, SetupRightPaneCopy } from './SetupProgress'
import { Button } from '../../components/ui/Button'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../../components/ui/Dialog'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { apiPost } from '../../api'


// Phases where Cancel is a meaningful action — the run is in motion (or
// awaiting input) and progress can still be discarded. Terminal phases
// (COMPLETE/BLOCKED/CANCELLED) are excluded so the header doesn't offer
// to cancel something that's already finished.
const CANCELLABLE_PHASES = new Set([
  'PLANNING', 'AWAITING_CONFIRMATION', 'EXECUTING', 'VERIFYING', 'FIXING',
])


// Long, hands-off phases where the run is actively working and the user
// may be tempted to wait or cancel. Here we reassure them the run is
// resumable and that it hands off to an editable chat on completion.
const RUNNING_PHASES = new Set(['EXECUTING', 'VERIFYING', 'FIXING'])

// Phases where numbers exist on screen — building through done. This is the
// moment "the numbers look off" happens, so we mark the output a prototype
// (verify & publish in chat to finalize) exactly where it counts.
const PROTOTYPE_PHASES = new Set(['EXECUTING', 'VERIFYING', 'FIXING', 'COMPLETE', 'OPEN_CHAT'])


// Build the artifact descriptor consumed by WorkspacePage on handoff —
// dashboard runs always land on output/dashboard/index.html; memo runs
// land on the planner-emitted memo_path (with a sensible fallback).
function buildHandoffArtifact(planSummary) {
  if (!planSummary) return null
  if (planSummary.output_type === 'memo') {
    return {
      path: planSummary.memo_path || 'output/memo.md',
      title: 'Memo',
      contentType: 'markdown',
    }
  }
  return {
    path: 'output/dashboard/index.html',
    title: 'Dashboard',
    contentType: 'html',
  }
}


// Title fallback chain — never returns empty. Used in the header AND for
// the browser tab title so the run page never shows a generic placeholder.
function resolveRunTitle({ planSummary, session }) {
  return (
    planSummary?.title
    || session?.skill_title
    || session?.skill_id
    || 'Starting your run…'
  )
}


// Phases that use the full-bleed body layout (no outer padding, no
// outer scroll — the inner content manages its own scroll regions).
// PLANNING uses two-pane (Setup checklist + clarif/prose).
// EXECUTING/VERIFYING/FIXING/COMPLETE/BLOCKED use two-pane (step list +
// plan summary / artifact / callout).
// AWAITING_CONFIRMATION uses single-card layout but needs full-bleed
// so the card can manage its own sticky header + scrollable middle +
// sticky footer.
// OPEN_CHAT (post-handoff) is included so the run page stays viewable
// after auto-handoff (Phase 2 §1). The user can still browse steps,
// view the final artifact, and click Follow Up / Verify & Publish to
// navigate to the chat session — auto-handoff doesn't lock them out.
const RUN_LAYOUT_PHASES = new Set([
  'PLANNING', 'AWAITING_CONFIRMATION',
  'EXECUTING', 'VERIFYING', 'FIXING', 'COMPLETE', 'BLOCKED',
  'OPEN_CHAT',
])


function PhaseContent({
  sessionId,
  phase,
  state,
  onNextClarification,
  onPreviousClarification,
  clarificationSubmitting,
  planSummary,
  planSummaryLoading,
  planSummaryError,
  onApprovePlan,
  onCancelPlan,
  approving,
  discarding,
  onUseDisclosureFollowup,
  onFollowUp,
  handingOff,
  onVerifyPublish,
  onRerun,
  rerunning,
  pusherPaused,
}) {
  if (state.errorMessage) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <AlertCircle size={36} className="text-[var(--pv-error-text)] mx-auto mb-3" />
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Something went wrong</h2>
        <p className="text-sm text-[var(--text-secondary)]">{state.errorMessage}</p>
      </div>
    )
  }

  // AWAITING_CONFIRMATION renders the plan approval card. It uses the
  // full-bleed body wrapper (the card manages its own sticky header /
  // scrollable middle / sticky footer internally) but is NOT the
  // ExecutionProgress two-pane layout — must branch before the
  // RUN_LAYOUT_PHASES check below.
  if (phase === 'AWAITING_CONFIRMATION') {
    return (
      <PlanApprovalCard
        summary={planSummary}
        loading={planSummaryLoading}
        error={planSummaryError}
        onApprove={onApprovePlan}
        onCancel={onCancelPlan}
        approving={approving}
        discarding={discarding}
      />
    )
  }

  // PLANNING uses its own two-pane layout: Setup sub-step list on the
  // left, clarification card OR descriptive prose on the right. This
  // gives the user a stable "what's already happened" view that
  // survives tab switches and navigation away.
  if (phase === 'PLANNING') {
    const current = state.clarifications[state.currentIndex]
    return (
      <div className="flex-1 flex min-h-0 gap-4 h-full">
        <SetupSubStepList
          setupStage={state.setupStage}
          hadClarifications={state.setupHadClarifications}
          paused={pusherPaused}
          onCancel={onCancelPlan}
        />
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          {current ? (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <ClarificationCard
                key={current.id}
                clarification={current}
                existingAnswer={state.clarificationAnswers[current.id]}
                index={state.currentIndex}
                total={state.clarifications.length}
                onNext={onNextClarification}
                onPrevious={onPreviousClarification}
                submitting={clarificationSubmitting}
              />
            </div>
          ) : (
            <SetupRightPaneCopy
              setupStage={state.setupStage}
              keyChoices={state.keyChoices}
            />
          )}
        </div>
      </div>
    )
  }

  if (RUN_LAYOUT_PHASES.has(phase)) {
    return (
      <ExecutionProgress
        sessionId={sessionId}
        phase={phase}
        steps={planSummary?.steps || []}
        stepStatuses={state.stepStatuses}
        outputType={planSummary?.output_type || 'dashboard'}
        memoPath={planSummary?.memo_path || ''}
        verificationRound={state.verificationRound}
        findingCount={state.findingCount}
        checkSubStage={state.checkSubStage}
        planSummary={planSummary}
        disclosureSummary={state.disclosureSummary}
        blockedSummary={state.blockedSummary}
        blockReason={state.blockReason}
        onUseDisclosureFollowup={onUseDisclosureFollowup}
        onFollowUp={onFollowUp}
        followUpLoading={handingOff}
        onVerifyPublish={onVerifyPublish}
        verifyPublishLoading={handingOff}
        onRerun={onRerun}
        rerunning={rerunning}
        paused={pusherPaused}
        onCancel={onCancelPlan}
      />
    )
  }

  switch (phase) {
    case null:
    case undefined:
      return (
        <div className="text-center mt-16 text-sm text-[var(--text-muted)]">
          <Loader2 size={20} className="inline animate-spin mr-2" />
          Loading session…
        </div>
      )

    case 'CANCELLED':
      return <Placeholder title="Cancelled" note="" />

    default:
      return <Placeholder title={String(phase)} note="(unknown phase)" />
  }
}


function Placeholder({ title, note }) {
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h2>
      {note ? <p className="text-xs text-[var(--text-muted)]">{note}</p> : null}
    </div>
  )
}


export default function SkillsV2RunPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backUrl = location.state?.backUrl || '/home'
  const {
    state,
    session,
    isLoading,
    isError,
    connectionStatus,
    goNextClarification,
    goPreviousClarification,
    clarificationSubmitting,
    planSummary,
    planSummaryLoading,
    planSummaryError,
    approvePlan,
    approving,
    discardRun,
    discarding,
    requestHandoff,
    handingOff,
  } = useSkillRun(sessionId)

  // Browser tab title — reflects the resolved skill name so users with
  // many tabs can find the right one without clicking through.
  useDocumentTitle(resolveRunTitle({ planSummary, session }))

  // Cancel on the plan-approval card discards the run (CANCELLED phase,
  // dropped from active-runs list) — leaves no orphaned in-progress
  // session — then navigates back to the list. We navigate even if the
  // discard call fails so the user isn't stuck on the approval screen
  // for a transient BE error; axios interceptor toasts on failure.
  const cancelPlan = async () => {
    await discardRun()
    navigate(backUrl)
  }

  // "Opening your chat..." overlay shown when the user clicks Follow Up
  // or Publish Dashboard. The current behavior used to be: button briefly
  // shows "Opening…" then page abruptly switches and the V&P modal pops up,
  // confusing users about what just happened. We now show a clear
  // transition card (title + subtitle + spinner) while the handoff
  // completes in the background, with a minimum visible time so the user
  // can read the message before navigation lands them on the session
  // page. Auto-handoff usually means the actual handoff call is a no-op,
  // so the minimum-time guard is what gives visual continuity.
  const [redirectingTo, setRedirectingTo] = useState(null) // { title, subtitle } | null

  const _runHandoffWithOverlay = async ({ title, subtitle, openArtifact, openVerifyPublish }) => {
    setRedirectingTo({ title, subtitle })
    // Held visible for 1.5s minimum so the user registers the
    // transition before landing on the chat session, without making
    // the wait feel like a stall. Auto-handoff usually makes the
    // handoff call near-instant; this overlay carries the perceived
    // continuity.
    const MIN_VISIBLE_MS = 1500
    const start = Date.now()
    // Skip the /skill/handoff POST when the session is already in
    // OPEN_CHAT — auto-handoff (Phase 2 §1) has already completed.
    // Without this guard the backend returns 400 "already in OPEN_CHAT"
    // (which we treat as idempotent success, but it shows up as a 400 in
    // network logs / error monitoring for no reason). We only POST
    // when the session might still need flipping (e.g. user clicks the
    // very moment phase becomes COMPLETE, before auto-handoff fires) —
    // the atomic lock keeps that race safe.
    if (state.phase !== 'OPEN_CHAT') {
      const ok = await requestHandoff()
      if (!ok) {
        setRedirectingTo(null)
        return
      }
    }
    // Hold the overlay long enough to register visually even when handoff
    // is instant (the auto-handoff already-completed case).
    const elapsed = Date.now() - start
    if (elapsed < MIN_VISIBLE_MS) {
      await new Promise((r) => setTimeout(r, MIN_VISIBLE_MS - elapsed))
    }
    // Named `routeState` to avoid colliding with the `state` closure from
    // useSkillRun (a `const state` here triggered a TDZ ReferenceError on
    // the `state.phase` check above, which left the overlay stuck open).
    const routeState = {
      ...(openArtifact && { openArtifact }),
      ...(openVerifyPublish && { openVerifyPublish: true }),
    }
    // Note: no `replace: true` — the run page remains viewable after
    // handoff (see SkillsV2RunPage's OPEN_CHAT layout support), so it's
    // a valid back-stack entry. Users who hit Back land on the run page
    // with the final artifact + step list still visible.
    navigate(`/session/${sessionId}`, {
      ...(Object.keys(routeState).length ? { state: routeState } : {}),
    })
    // No need to clear redirectingTo — the component will unmount on nav.
  }

  const onFollowUp = async () => {
    // Pre-compute the artifact descriptor BEFORE the handoff fires — the
    // descriptor is derived from planSummary which is still in scope here.
    // The WorkspacePage consumer opens this in the artifact panel as soon
    // as the resumed regular session reaches `active` status.
    const openArtifact = buildHandoffArtifact(planSummary)
    const isMemo = planSummary?.output_type === 'memo'
    await _runHandoffWithOverlay({
      title: isMemo
        ? 'Opening your memo chat session...'
        : 'Opening your dashboard chat session...',
      subtitle: 'We\'re setting up a chat session so you can ask follow-ups.',
      openArtifact,
    })
  }

  // Publish Dashboard — dashboard-only. Auto-handoff (Phase 2 §1) should
  // already have flipped this session to regular/OPEN_CHAT by the time
  // COMPLETE is rendered, but the explicit `requestHandoff()` here is a
  // safety net: the atomic lock makes it idempotent if it already fired.
  // The WorkspacePage consumer sees `openVerifyPublish: true` in route
  // state and instructs ArtifactPanel to auto-open the V&P modal once
  // the dashboard tab is active.
  const onVerifyPublish = async () => {
    const openArtifact = buildHandoffArtifact(planSummary)
    await _runHandoffWithOverlay({
      title: 'Opening your dashboard chat session...',
      subtitle: 'Setting up the verify & publish flow in chat.',
      openArtifact,
      openVerifyPublish: true,
    })
  }

  // Disclosure-callout "ask the agent" chip: stash the suggested prompt in
  // sessionStorage under a per-session key, transition to handoff (which
  // creates the OPEN_CHAT session), then navigate. Composer.jsx reads the
  // key on mount and pre-fills the textarea — the user can edit before
  // sending or hit Enter immediately. We pre-fill (not auto-send) so an
  // accidental chip click doesn't post a message they didn't review.
  const onUseDisclosureFollowup = async (text) => {
    if (!text) return
    try {
      sessionStorage.setItem(`skill-followup-prefill:${sessionId}`, text)
    } catch {
      // Storage quota or private-mode — fall through; the chip still gets
      // them to chat, they just have to type the prompt themselves.
    }
    const openArtifact = buildHandoffArtifact(planSummary)
    await _runHandoffWithOverlay({
      title: 'Opening your chat session...',
      subtitle: 'We\'ll bring your suggested follow-up along.',
      openArtifact,
    })
  }

  // Re-run skill — fresh session, same skill_id. Old session is preserved
  // untouched (BLOCKED state, archivable from the list). Used by the
  // "Start a new run" button on the BLOCKED screen.
  const [rerunning, setRerunning] = useState(false)
  const onRerun = async () => {
    if (rerunning) return
    const skillId = session?.skill_id
    if (!skillId) return
    setRerunning(true)
    try {
      const res = await apiPost('/api/sessions', { skill_id: skillId })
      const newSessionId = res?.session?.session_id
      if (newSessionId) navigate(`/skills-v2/run/${newSessionId}`)
    } catch {
      // axios interceptor surfaces error toast
    } finally {
      setRerunning(false)
    }
  }

  // Top-right Cancel button — opens a confirm dialog before discarding
  // (destructive action, no undo, multi-minute investment).
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const onConfirmCancel = async () => {
    setCancelConfirmOpen(false)
    await cancelPlan()
  }
  const showCancelButton = CANCELLABLE_PHASES.has(state.phase)

  // The two-pane execution view needs a full-bleed body. The PLANNING /
  // AWAITING / BLOCKED / etc. screens still want the padded narrow column.
  const bodyIsTwoPane = RUN_LAYOUT_PHASES.has(state.phase)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
              {resolveRunTitle({ planSummary, session })}
            </h1>
            {session?.skill_description ? (
              <p
                className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={session.skill_description}
              >
                {session.skill_description}
              </p>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono truncate">
                {sessionId}
              </p>
            )}
          </div>
          {PROTOTYPE_PHASES.has(state.phase) ? (
            // Prototype marker — sits with the output, not on the marketing
            // page. Tells the user this is a draft on their data and the
            // trusted version comes from verify & publish in chat.
            <span
              title="This is a prototype built on your data. Verify & publish it in chat to finalize — that's the version you can trust and share."
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/25 shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Prototype · verify to finalize
            </span>
          ) : null}
          {state.phase === 'BLOCKED' ? (
            // Header stays empty on BLOCKED. The progress bar already
            // shows the blocked state (red exclamation on the failing
            // stage), and the BlockedCallout in the body carries the
            // explanation + "Start a new run". A pill here would be
            // redundant chrome.
            null
          ) : showCancelButton ? (
            // Red-outline styling so it reads as a real, destructive
            // button — the prior ghost variant was too quiet against the
            // header background. Border + red text without the solid
            // `danger` fill keeps it from competing with the progress bar.
            <Button
              onClick={() => setCancelConfirmOpen(true)}
              size="sm"
              variant="secondary"
              disabled={discarding}
              aria-label="Cancel run"
              className="border-[var(--pv-error-text)]/50 text-[var(--pv-error-text)] hover:bg-[var(--pv-error-bg)] hover:border-[var(--pv-error-text)] hover:text-[var(--pv-error-text)]"
            >
              <X size={13} className="mr-1" />
              Cancel run
            </Button>
          ) : null}
        </div>
      </div>

      {/* Run progress bar — persistent across all phases. Reads the
          sub-state slices from the reducer; the bar's own stopwatch
          handles overrun framing without any extra orchestration here. */}
      <RunProgressBar
        phase={state.phase}
        setupStage={state.setupStage}
        buildSubStage={state.buildSubStage}
        checkSubStage={state.checkSubStage}
        outputType={planSummary?.output_type}
        blocked={state.phase === 'BLOCKED'}
        cancelled={state.phase === 'CANCELLED'}
        paused={connectionStatus !== 'connected'}
        onCancel={cancelPlan}
        clarificationCount={state.clarifications.length}
      />

      {/* Resumability + hand-off reassurance — shown only during the long,
          hands-off build phases. Tells the user leaving is safe (the run
          keeps going and is resumable) and that completion hands off to an
          editable chat, so neither the wait nor the transition surprises
          them. */}
      {RUNNING_PHASES.has(state.phase) && (
        <div className="px-6 py-2 shrink-0 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <p className="flex items-start gap-2 text-[12px] leading-snug text-[var(--text-secondary)]">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>
              This can take a few minutes — <span className="font-medium text-[var(--text-primary)]">you can leave this page and it keeps running</span>; pick it back up anytime from your sessions. When it finishes, it opens as a chat where you can edit the result and ask follow-ups.
            </span>
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hydration gate. We hold the body on a neutral spinner until
            both the session fetch AND the /skill/progress endpoint have
            settled. Without this, in-progress and BLOCKED runs flash
            generic placeholder copy ("Preparing the run", BlockedCallout
            fallback "We couldn't finish this run.") for the ~100-300ms
            between session-loaded and progress-hydrated — which feels
            wrong because the placeholders claim a state that's already
            stale. progressHydrated also flips on /skill/progress error
            (see useSkillRun.js) so a hung endpoint won't strand us. */}
        {(isLoading || !state.progressHydrated) && !isError && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
          </div>
        )}
        {isError && (
          <div className="max-w-md mx-auto mt-16 text-center">
            <AlertCircle size={36} className="text-[var(--pv-error-text)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">
              Couldn&apos;t load this session.
            </p>
          </div>
        )}
        {!isLoading && !isError && state.progressHydrated && (
          bodyIsTwoPane ? (
            <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
              <PhaseContent
                sessionId={sessionId}
                phase={state.phase}
                state={state}
                onNextClarification={goNextClarification}
                onPreviousClarification={goPreviousClarification}
                clarificationSubmitting={clarificationSubmitting}
                planSummary={planSummary}
                planSummaryLoading={planSummaryLoading}
                planSummaryError={planSummaryError}
                onApprovePlan={approvePlan}
                onCancelPlan={cancelPlan}
                approving={approving}
                discarding={discarding}
                onUseDisclosureFollowup={onUseDisclosureFollowup}
                onFollowUp={onFollowUp}
                handingOff={handingOff}
                onVerifyPublish={onVerifyPublish}
                onRerun={onRerun}
                rerunning={rerunning}
                pusherPaused={connectionStatus !== 'connected'}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <PhaseContent
                sessionId={sessionId}
                phase={state.phase}
                state={state}
                onNextClarification={goNextClarification}
                onPreviousClarification={goPreviousClarification}
                clarificationSubmitting={clarificationSubmitting}
                planSummary={planSummary}
                planSummaryLoading={planSummaryLoading}
                planSummaryError={planSummaryError}
                onApprovePlan={approvePlan}
                onCancelPlan={cancelPlan}
                approving={approving}
                discarding={discarding}
                onUseDisclosureFollowup={onUseDisclosureFollowup}
                onFollowUp={onFollowUp}
                handingOff={handingOff}
                onVerifyPublish={onVerifyPublish}
                onRerun={onRerun}
                rerunning={rerunning}
                pusherPaused={connectionStatus !== 'connected'}
              />
            </div>
          )
        )}
      </div>

      {/* Handoff-in-progress overlay. Shown when the user clicks Follow Up
          or Publish Dashboard and we're about to navigate to the chat
          session. Backdrop blocks interaction; the card carries the
          spinner + a short copy explaining what's happening. Auto-clears
          via the navigate() at the end of _runHandoffWithOverlay. */}
      {redirectingTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[6px]">
          <div className="max-w-sm mx-4 px-6 py-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-float text-center">
            <Loader2 size={28} className="animate-spin text-[var(--accent)] mx-auto mb-3" />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">
              {redirectingTo.title}
            </h3>
            {redirectingTo.subtitle ? (
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                {redirectingTo.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Cancel-run confirm dialog. Destructive action — discards the
          run and signals every agent to halt at the next safe point. */}
      <Dialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}>
        <DialogHeader onClose={() => setCancelConfirmOpen(false)}>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
            Cancel this run?
          </h2>
        </DialogHeader>
        <DialogContent>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            Your progress will be discarded and the run will stop. This can&apos;t be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setCancelConfirmOpen(false)}
            disabled={discarding}
          >
            Keep running
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmCancel}
            disabled={discarding}
          >
            {discarding ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1" />
                Cancelling…
              </>
            ) : (
              'Cancel run'
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
