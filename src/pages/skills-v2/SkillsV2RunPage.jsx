import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle, Info,
  ChevronRight, X,
} from 'lucide-react'
import RunSageOverlay from './RunSageOverlay'
import { useSkillRun } from './useSkillRun'
import ClarificationCard from './ClarificationCard'
import PlanApprovalCard from './PlanApprovalCard'
import ExecutionProgress from './ExecutionProgress'
import BlockedCallout from './BlockedCallout'
import RunProgressBar from './RunProgressBar'
import { SetupSubStepList, SetupRightPaneCopy } from './SetupProgress'
import { Button } from '../../components/ui/Button'
import { Button as PvButton } from '../../petavue'
import { Sparkle, ArrowRight, Check } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/Spinner'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../../components/ui/Dialog'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { apiPost } from '../../api'
import { SKILLS_CATALOG } from '../../skills/skillsCatalog'


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

// Every in-progress phase (planning, approval, build, verify). The resumability
// reassurance shows across all of these — always present until the run is done.
const IN_PROGRESS_PHASES = new Set(['PLANNING', 'AWAITING_CONFIRMATION', 'EXECUTING', 'VERIFYING', 'FIXING'])

// Phases where numbers exist on screen — building through done. Marks the
// output a draft (verify & publish in chat to finalize) where it counts.
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

// Short catalog blurb for the running skill — header context so the user
// always knows what this skill is for. Prefer the plan's copy; fall back to
// the catalog by slug (available from the session before the plan drafts).
function resolveSkillDescription({ planSummary, session }) {
  if (planSummary?.skill_description) return planSummary.skill_description
  const id = session?.skill_id
  if (!id) return ''
  const s = SKILLS_CATALOG.find((x) => x.slug === id || x.name === id)
  return s?.description || ''
}


// Human labels for the plan sub-steps — drives the right-pane "where you
// are" header during PLANNING.
const SETUP_STEP_LABELS = {
  workspace_ready: 'Setting up workspace',
  reviewing_data: 'Reviewing data',
  awaiting_input: 'A few questions',
  followup_question: 'A few questions',
  verifying_answers: 'Verifying answers',
  drafting_plan: 'Drafting the plan',
  reviewing_plan: 'Final review of the plan',
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
  onReviewProgress,
  skillQuestions,
  skillOutcome,
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
        onRequestChanges={onUseDisclosureFollowup}
        requesting={handingOff}
        onReviewProgress={onReviewProgress}
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
      <div className="flex-1 flex min-h-0 h-full">
        <SetupSubStepList
          setupStage={state.setupStage}
          hadClarifications={state.setupHadClarifications}
          paused={pusherPaused}
          onCancel={onCancelPlan}
        />
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-r-2xl overflow-hidden">
          {/* Current-step header so you know where you are in the plan. */}
          <div className="flex items-center h-12 px-4 shrink-0">
            <span className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
              {SETUP_STEP_LABELS[state.setupStage] || 'Preparing the plan'}
            </span>
          </div>
          {current ? (
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
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
              questions={skillQuestions}
              outcome={skillOutcome}
            />
          )}
        </div>
      </div>
    )
  }

  // Plan-stage block — the planner halted before authoring any plan steps.
  // Keep the "Preparing the plan" panel visible (frozen where it stopped) and
  // show the block message BESIDE it, so the user never loses the record of
  // what ran and how far it got — exactly when that context matters most.
  if (phase === 'BLOCKED' && !(planSummary?.steps?.length)) {
    return (
      <div className="flex-1 flex min-h-0 h-full">
        <SetupSubStepList
          setupStage={state.setupStage}
          hadClarifications={state.setupHadClarifications}
          paused
          blocked
        />
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-r-2xl overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <BlockedCallout
              summary={state.blockedSummary}
              fallbackReason={state.blockReason}
              onRerun={onRerun}
              rerunning={rerunning}
              onCorrect={onUseDisclosureFollowup}
              correcting={handingOff}
            />
          </div>
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
          <Spinner size={20} className="mr-2 align-[-4px]" />
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
  // Keep the browser tab title static — the run stage should never leak into
  // the page's meta title.
  useDocumentTitle('Petavue')

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
      if (newSessionId) navigate(`/skills/run/${newSessionId}`)
    } catch {
      // axios interceptor surfaces error toast
    } finally {
      setRerunning(false)
    }
  }

  // Top-right Cancel button — opens a confirm dialog before discarding
  // (destructive action, no undo, multi-minute investment).
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  // Per-widget review progress reported up by the approval card, used to gate
  // the footer's Build it until every widget is Approved or Dropped.
  const [reviewProgress, setReviewProgress] = useState(null)
  const [sageOpen, setSageOpen] = useState(false)
  const onConfirmCancel = async () => {
    setCancelConfirmOpen(false)
    await cancelPlan()
  }
  const showCancelButton = CANCELLABLE_PHASES.has(state.phase)

  // Resumability reassurance. Present across the whole in-progress run —
  // planning, approval, build, and verify — so it never disappears mid-run.
  // It drops only at terminal states (done/blocked/cancelled), where "you can
  // leave and it keeps running" no longer applies.
  const showResumeHint = IN_PROGRESS_PHASES.has(state.phase)
  const skillDescription = resolveSkillDescription({ planSummary, session })
  // Catalog entry for the running skill — feeds the plan pane's "what you'll
  // get + questions it answers" (available from the session before the plan).
  const runSkill = SKILLS_CATALOG.find((s) => s.slug === session?.skill_id || s.name === session?.skill_id) || null
  // Build it is gated on the plan review: every widget must be Approved or
  // Dropped first. Default to gated when there are widgets but no report yet.
  const buildGated = state.phase === 'AWAITING_CONFIRMATION'
    && (planSummary?.widgets?.length > 0)
    && (!reviewProgress || !reviewProgress.allReviewed)
  const buildRemaining = reviewProgress?.remaining ?? (planSummary?.widgets?.length || 0)

  // The two-pane execution view needs a full-bleed body. The PLANNING /
  // AWAITING / BLOCKED / etc. screens still want the padded narrow column.
  const bodyIsTwoPane = RUN_LAYOUT_PHASES.has(state.phase)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header — app-standard 60px white bar, matching the skill detail page
          and Dashboards / Goals so Activate → run reads as one continuous
          product instead of a jump between two. */}
      <div className="flex w-full px-6 items-center justify-between gap-4 h-[60px] shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/skills')}
            className="shrink-0 text-[16px] leading-[24px] font-medium text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Skills
          </button>
          <ChevronRight size={14} className="text-[var(--pv-neutral-grey-400)] shrink-0" />
          <span
            title={skillDescription || undefined}
            className="flex-1 min-w-0 truncate text-[16px] leading-[24px] font-medium text-pv-neutral-grey-900"
          >
            {resolveRunTitle({ planSummary, session })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {PROTOTYPE_PHASES.has(state.phase) ? (
            <span
              title="This is a draft built on your data. Verify & publish it in chat to finalize. That's the version you can trust and share."
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#757A97]"
            >
              <Info size={13} className="shrink-0" />
              Draft · verify to publish
            </span>
          ) : null}
          <PvButton
            onClick={() => setSageOpen(true)}
            aria-label="Ask Sage about this step"
            size="md"
            variant="secondary"
            icon={Sparkle}
            iconWeight="fill"
            label="Ask Sage"
            // .btn--secondary collides with the design-system CSS; force blue.
            className="!text-[var(--accent)] !border-[var(--accent)] !bg-white"
          />
        </div>
      </div>

      {/* Resumability + hand-off reassurance — shown only during the long,
          hands-off build phases. Tells the user leaving is safe (the run
          keeps going and is resumable) and that completion hands off to an
          editable chat, so neither the wait nor the transition surprises
          them. */}
      {showResumeHint && (
        <div className="px-6 py-2 shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
          <p className="flex items-start gap-2 text-[12px] leading-snug text-[var(--text-secondary)]">
            <Info size={14} className="shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>
              This usually takes a few minutes. <span className="font-medium text-[var(--text-primary)]">You can leave and it keeps running</span>; pick it up anytime from your sessions. When it&apos;s ready, <span className="font-medium text-[var(--text-primary)]">it opens as a chat</span> where you can edit the result and ask follow-ups.
            </span>
          </p>
        </div>
      )}

      {/* Body — grey-50 frame so the white cards read as one product with the
          white shell, matching the skill detail page. */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
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
            <Spinner size={24} />
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
            <div className="flex-1 flex flex-col min-h-0 p-4">
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
                onReviewProgress={setReviewProgress}
                skillQuestions={runSkill?.questions}
                skillOutcome={runSkill?.description}
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
                onReviewProgress={setReviewProgress}
                skillQuestions={runSkill?.questions}
                skillOutcome={runSkill?.description}
              />
            </div>
          )
        )}
      </div>

      {/* Footer — persistent run chrome, mirroring the verify-&-publish flow:
          Cancel run on the left, the 4-stage stepper centered, and the phase's
          primary action on the right. */}
      {!isLoading && !isError && state.progressHydrated ? (
        <div className="flex items-center gap-4 px-6 py-2.5 shrink-0 border-t border-[var(--pv-neutral-grey-150)] bg-white">
          <div className="w-[240px] shrink-0 flex justify-start">
            {showCancelButton ? (
              <PvButton
                onClick={() => setCancelConfirmOpen(true)}
                size="md"
                variant="secondary"
                disabled={discarding}
                aria-label="Cancel run"
                label="Cancel run"
                // A second global `.btn--secondary` (design-system Button.css)
                // collides with petavue's and greys this out; force the blue.
                className="!text-[var(--accent)] !border-[var(--accent)] !bg-white"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-center gap-0.5 overflow-x-auto">
            <RunProgressBar
              bare
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
          </div>
          <div className="w-[240px] shrink-0 flex justify-end">
            {state.phase === 'AWAITING_CONFIRMATION' && planSummary ? (
              <PvButton
                onClick={approvePlan}
                size="md"
                variant="primary"
                disabled={approving || discarding || buildGated}
                label={approving ? 'Starting…' : buildGated ? `Approve ${buildRemaining} more` : 'Build it'}
                icon={approving ? Spinner : buildGated ? null : ArrowRight}
                iconPosition="suffix"
                iconWeight={approving ? 'regular' : 'bold'}
              />
            ) : (state.phase === 'COMPLETE' || state.phase === 'OPEN_CHAT') && onFollowUp ? (
              <PvButton
                onClick={onFollowUp}
                size="md"
                variant="primary"
                disabled={handingOff}
                label={handingOff ? 'Opening…' : 'Verify & refine in chat'}
                icon={handingOff ? Spinner : Check}
                iconPosition="suffix"
                iconWeight={handingOff ? 'regular' : 'bold'}
              />
            ) : state.phase === 'PLANNING' ? (
              // Proceed sits in the footer through the whole Plan stage, but
              // only enables once the plan reaches its final review sub-step.
              <PvButton
                onClick={() => {}}
                size="md"
                variant="primary"
                disabled={state.setupStage !== 'reviewing_plan'}
                label="Proceed"
                icon={state.setupStage === 'reviewing_plan' ? Sparkle : null}
                iconWeight="fill"
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Handoff-in-progress overlay. Shown when the user clicks Follow Up
          or Publish Dashboard and we're about to navigate to the chat
          session. Backdrop blocks interaction; the card carries the
          spinner + a short copy explaining what's happening. Auto-clears
          via the navigate() at the end of _runHandoffWithOverlay. */}
      {redirectingTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[6px]">
          <div className="max-w-sm mx-4 px-6 py-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-float text-center">
            <Spinner size={28} className="mx-auto mb-3" />
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

      {/* Ask Sage — context-aware overlay for the current step. */}
      <RunSageOverlay phase={state.phase} open={sageOpen} onClose={() => setSageOpen(false)} />


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
                <Spinner size={13} className="mr-1 align-[-2px]" />
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
