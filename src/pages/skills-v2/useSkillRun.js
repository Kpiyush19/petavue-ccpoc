import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '../../api'
import { usePusher } from '../../hooks/usePusher'
import { deriveStatus } from './statusMap'


// Phases where the polling fallback should NOT run. Two categories:
//   • Terminal: COMPLETE / BLOCKED / CANCELLED / OPEN_CHAT — nothing
//     will change, polling is pure waste.
//   • User-gated: AWAITING_CONFIRMATION — the agent is paused waiting
//     for the user to click Approve. No agent-side event is expected
//     while idling here, so polling every 15s indefinitely is wasted
//     load. The state will advance via /skill/execute (user click)
//     which triggers a fresh Pusher event chain.
const _POLL_SKIP_PHASES = new Set([
  'COMPLETE', 'BLOCKED', 'CANCELLED', 'OPEN_CHAT',
  'AWAITING_CONFIRMATION',
])

const POLL_INTERVAL_MS = 15_000      // Refetch cadence while stuck
const POLL_STUCK_THRESHOLD_MS = 60_000  // Wait this long before deciding we're stuck


// ─── reducer ───────────────────────────────────────────────────────────

const initialState = {
  phase: null,
  // Skills v2 progress-bar sub-state. Empty string before any setup-stage
  // event arrives (legacy sessions, or runs that started before this
  // feature shipped) → RunProgressBar falls back to phase-only derivation.
  // See `setupStageFromEvent` and the BE planner emission sites.
  setupStage: '',
  // Build/Check sub-stages are derived client-side from existing executor
  // and verifier events (no new BE events needed) — see `handleEvent`.
  buildSubStage: '',
  checkSubStage: '',
  // Latched true when clarifications first surface in this session.
  // Drives the conditional "Input needed" row in the Setup sub-step list
  // — skills with no clarifications never see that row; skills that asked
  // at least once keep showing it as ✓ for the rest of the run even after
  // the wizard array gets cleared on submit.
  setupHadClarifications: false,
  // Compact summary of the user's answered always_asked clarifications,
  // formatted server-side. Surfaced on the Setup right pane during
  // verifying_answers / drafting_plan / reviewing_plan so the user can
  // re-check their choices without flipping back. Hydrated on mount
  // from /skill/progress; live updates come from /skill/plan-summary
  // once the planner finalizes.
  keyChoices: [],
  currentStatus: 'Starting up…',
  // PLANNING-phase state — ordered list of every clarification surfaced for
  // this batch, plus a navigation cursor and a per-id answer map. Cards never
  // get popped: the user can move freely between them with Previous/Next, and
  // nothing is committed to the BE until they press Submit on the last card.
  clarifications: [],
  currentIndex: 0,
  clarificationAnswers: {},
  // EXECUTING / FIXING-phase state — keyed by step_id so the static step
  // list comes from plan-summary and the reducer only owns the dynamic
  // status overlay. Values: 'pending' | 'running' | 'success' | 'failed'.
  stepStatuses: {},
  // VERIFYING-phase state
  verificationRound: 1,
  findingCount: 0,
  // terminal
  blockReason: null,
  errorMessage: null,
  // Populated on COMPLETE-with-disclosure runs (round-2 ship policy + a
  // remaining gap the executor couldn't fix). Empty object on clean runs.
  // Schema: { headline, what_missing, what_works, suggested_followup }.
  disclosureSummary: null,
  // Populated on BLOCKED runs (planner halt, verifier block, executor halt).
  // Empty object on non-blocked runs. Schema: { headline, why_blocked,
  // what_you_can_do: string[], what_system_cannot_do }.
  blockedSummary: null,
  // Flips true once the /skill/progress endpoint has hydrated for this
  // session (or, defensively, when the query settles in any state). Used
  // by SkillsV2RunPage to gate phase-specific body content so we don't
  // flash placeholder copy ("Preparing the run", BlockedCallout fallback
  // "We couldn't finish this run.") in the ~100-300ms between session
  // load and progress hydration. Reset to false on sessionId change.
  progressHydrated: false,
  // Grounded follow-up chips for the COMPLETE screen. Set by the
  // `suggested-questions` Pusher event (fired ~1-2s after skill-phase=COMPLETE),
  // cleared only on `reset` (sessionId change / new run). Untouched by
  // phase-changed so the chips aren't wiped by the COMPLETE transition that
  // immediately precedes them.
  suggestedQuestions: [],
}


function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      // Full state reset, used when sessionId changes (e.g. "Start a
      // new run" navigates from a BLOCKED session to a fresh one).
      // Without this, the reducer keeps the old session's phase /
      // blockedSummary / step statuses and the new run page renders
      // the previous BLOCKED callout until the user hard-refreshes.
      return initialState
    case 'session-loaded': {
      const phase = action.session.phase || 'PLANNING'
      const round = action.session.verification_round || 0
      // Bootstrap checkSubStage from phase + verification_round so reload
      // mid-Check shows the right caption from frame 1. Round 2 maps to
      // `final_check` (matches the left-pane row label); round 1 maps to
      // `running_checks`. buildSubStage stays empty — there's no
      // equivalent signal on the session doc; RunProgressBar uses a
      // generic fallback when active stage is Build with no sub-state.
      let checkSubStage = state.checkSubStage
      if (!checkSubStage) {
        if (phase === 'VERIFYING') checkSubStage = round >= 2 ? 'final_check' : 'running_checks'
        else if (phase === 'FIXING') checkSubStage = 'applying_fixes'
      }
      // Latch setupHadClarifications on reload based on the persisted
      // setup_stage. If we're past `awaiting_input` (order >= 3), the
      // planner went through a clarification batch. Imperfect — a
      // no-clarification skill briefly passing through `drafting_plan`
      // would also set this latch on reload — but the live-event path
      // (`clarification-received`) is exact, so this only affects
      // reload-mid-Setup edge cases.
      const stage = action.session.setup_stage || ''
      const POST_CLARIF = new Set([
        'awaiting_input', 'followup_question', 'verifying_answers',
        'drafting_plan', 'reviewing_plan',
      ])
      return {
        ...state,
        phase,
        blockReason: action.session.block_reason || null,
        // Hydrate the persisted sub-stage so a page reload mid-Setup
        // renders the bar in the correct sub-state from frame 1 instead
        // of starting from `workspace_ready`. Empty string for legacy
        // sessions — RunProgressBar treats that as "use phase only."
        setupStage: stage || state.setupStage || '',
        checkSubStage,
        setupHadClarifications: state.setupHadClarifications || POST_CLARIF.has(stage),
      }
    }

    case 'progress-hydrated': {
      // Resume bootstrap: server-side state restored from disk on mount.
      // Pusher events that fired before reload are lost, so we replay
      // them via this snapshot. Only fills the slices that come from
      // per-run files — `phase` + `blockReason` come from the session
      // doc and were already set by `session-loaded`.
      const p = action.progress || {}
      // Merge pending clarifications into the ordered list without
      // duplicating anything already there (in the unlikely case a fresh
      // Pusher event raced ahead of hydration).
      const knownIds = new Set(state.clarifications.map((c) => c.id))
      const fresh = (p.clarifications_pending || []).filter(
        (c) => c?.id && !knownIds.has(c.id),
      )
      return {
        ...state,
        clarifications: [...state.clarifications, ...fresh],
        // Hydrated statuses are the historical baseline; live Pusher
        // events (already in state) win on conflict so a step that
        // started running just now keeps its 'running' icon.
        stepStatuses: { ...p.step_statuses, ...state.stepStatuses },
        // Take the higher round — if a fresh `verifier-started` event
        // already bumped state, keep it; if state is still the default,
        // adopt the persisted round.
        verificationRound: Math.max(
          state.verificationRound || 0,
          p.verification_round || 0,
        ) || 1,
        // Don't overwrite a higher live count with a stale hydration value.
        findingCount: Math.max(state.findingCount || 0, p.finding_count || 0),
        // Only adopt the snapshot's disclosure summary if we don't already
        // have one in state (defensive — Pusher could theoretically deliver
        // a later state, but in practice this only fires on COMPLETE).
        disclosureSummary: state.disclosureSummary || (
          p.disclosure_summary && p.disclosure_summary.headline
            ? p.disclosure_summary
            : null
        ),
        // Same defensive rule for BLOCKED runs — adopt only if not already
        // populated in state.
        blockedSummary: state.blockedSummary || (
          p.blocked_summary && (
            p.blocked_summary.headline ||
            p.blocked_summary.why_blocked ||
            (Array.isArray(p.blocked_summary.what_you_can_do) && p.blocked_summary.what_you_can_do.length)
          )
            ? p.blocked_summary
            : null
        ),
        // Key-choices summary surfaced on the Setup right pane during
        // post-clarification states. Always prefer the BE projection
        // when non-empty (canonical), falling back to existing state
        // otherwise. This lets a post-submit refetch update the
        // summary as new clarifications get answered (e.g. round 2).
        keyChoices: Array.isArray(p.key_choices) && p.key_choices.length
          ? p.key_choices
          : (state.keyChoices || []),
        progressHydrated: true,
      }
    }

    case 'progress-failed':
      // Defensive: unblock the UI even when /skill/progress errors so we
      // don't render a permanent loading state.
      return { ...state, progressHydrated: true }

    case 'phase-changed':
      return {
        ...state,
        phase: action.phase,
        // Reset finding count on (a) entering a verifier round so the
        // sweep framing starts fresh, and (b) reaching a terminal phase
        // so `FirstFindingBanner` doesn't stay stuck on the COMPLETE
        // screen when round-1 passed clean-with-disclosure (round-2
        // never fired, so its normal reset didn't kick in).
        findingCount: (
          action.phase === 'VERIFYING'
          || action.phase === 'COMPLETE'
          || action.phase === 'BLOCKED'
          || action.phase === 'CANCELLED'
        ) ? 0 : state.findingCount,
        // Setup sub-stages only apply during PLANNING. Once we move
        // forward to AWAITING_CONFIRMATION (or beyond), the active stage
        // is no longer Setup — clear so a refresh later in the run
        // doesn't show a stale sub-state under a non-Setup top-level
        // stage. Build/Check sub-stages live in their own state slots.
        setupStage: action.phase === 'PLANNING' ? state.setupStage : '',
      }

    case 'suggested-questions':
      return { ...state, suggestedQuestions: action.questions || [] }

    case 'setup-stage':
      // Forward-progress is the only guarantee from the BE planner —
      // we don't enforce a particular ordering here. The bar component
      // owns the visual "forward" rule (`followup_question` re-uses the
      // Setup top-level position even though it's logically a re-entry).
      return { ...state, setupStage: action.stage }

    case 'build-substage':
      return { ...state, buildSubStage: action.subStage }

    case 'check-substage':
      return { ...state, checkSubStage: action.subStage }

    case 'status-changed':
      return { ...state, currentStatus: action.status }

    case 'clarification-received': {
      // accept either a single clarification or a batch
      const incoming = action.batch ?? [action.clarification]
      // de-dup against ones already in the list (answers map intentionally
      // not consulted — re-receiving an id we already answered would be a
      // BE bug worth surfacing, not silently swallowing).
      const knownIds = new Set(state.clarifications.map((c) => c.id))
      const fresh = incoming.filter((c) => c?.id && !knownIds.has(c.id))
      if (!fresh.length) return state
      return {
        ...state,
        clarifications: [...state.clarifications, ...fresh],
        // Latch — once clarifications surface, they happened (even after
        // the array gets cleared on submit). Drives the conditional
        // "Input needed" row in the Setup sub-step list.
        setupHadClarifications: true,
      }
    }

    case 'clarification-recorded':
      return {
        ...state,
        clarificationAnswers: { ...state.clarificationAnswers, [action.id]: action.answer },
      }

    case 'clarification-navigate': {
      const max = Math.max(state.clarifications.length - 1, 0)
      const next = Math.max(0, Math.min(max, action.index))
      return { ...state, currentIndex: next }
    }

    case 'clarifications-submitted':
      return { ...state, clarifications: [], currentIndex: 0, clarificationAnswers: {} }

    case 'execution-started':
      // Clear the status overlay so a re-run starts fresh; the step LIST
      // continues to come from plan-summary.
      return { ...state, stepStatuses: {} }

    case 'step-updated':
      return {
        ...state,
        stepStatuses: { ...state.stepStatuses, [action.step_id]: action.status },
      }

    case 'finding-recorded':
      return { ...state, findingCount: state.findingCount + 1 }

    case 'verifier-round-started':
      return { ...state, verificationRound: action.round || 1, findingCount: 0 }

    case 'blocked':
      return {
        ...state,
        phase: 'BLOCKED',
        blockReason: action.reason,
        // Only adopt the incoming summary if it carries user-visible content;
        // otherwise keep whatever's already in state (could be a snapshot the
        // hydration path picked up first).
        blockedSummary:
          action.summary && (
            action.summary.headline ||
            action.summary.why_blocked ||
            (Array.isArray(action.summary.what_you_can_do) && action.summary.what_you_can_do.length)
          )
            ? action.summary
            : state.blockedSummary,
      }

    case 'error':
      return { ...state, errorMessage: action.message }

    default:
      return state
  }
}


// ─── hook ──────────────────────────────────────────────────────────────

export function useSkillRun(sessionId) {
  const [state, dispatch] = useReducer(reducer, initialState)
  // Track unique step-status events we've seen so we don't double-count
  const seenStepsRef = useRef(new Set())
  // Bootstrap-from-session should run exactly once. After that, Pusher
  // events drive phase/block state — a later refetch shouldn't clobber it.
  const bootstrappedRef = useRef(false)
  // Progress endpoint hydration also runs exactly once on mount.
  const progressHydratedRef = useRef(false)

  // Reset all derived state when the sessionId changes. The route pattern
  // is `/skills-v2/run/:sessionId` so React Router keeps this component
  // mounted across "Start a new run" → /skills-v2/run/<newId>; without
  // this reset the once-and-stay-true bootstrap refs would suppress the
  // new session's session-loaded + progress-hydrated dispatches and the
  // reducer would hold the old (e.g. BLOCKED) phase forever.
  useEffect(() => {
    dispatch({ type: 'reset' })
    bootstrappedRef.current = false
    progressHydratedRef.current = false
    seenStepsRef.current = new Set()
  }, [sessionId])

  // Initial session fetch
  const {
    data: session,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['skill-run-session', sessionId],
    queryFn: () => apiGet(`/api/sessions/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  })

  useEffect(() => {
    if (session?.session_id && !bootstrappedRef.current) {
      bootstrappedRef.current = true
      dispatch({ type: 'session-loaded', session })
    }
  }, [session])

  // Resume: pull the on-disk snapshot once the session is confirmed to
  // exist. Persists nothing client-side; the response just hydrates the
  // reducer slices that come from per-run files (pending clarifications,
  // step statuses, verifier finding count).
  const { data: progressSnapshot, isError: progressIsError, refetch: refetchProgress } = useQuery({
    queryKey: ['skill-run-progress', sessionId],
    queryFn: () => apiGet(`/api/sessions/${sessionId}/skill/progress`),
    enabled: !!session?.session_id && !progressHydratedRef.current,
    retry: false,
  })

  // Hydration error path — flip progressHydrated even when the fetch fails
  // so the body unblocks. Session-level data (phase, blockReason) still
  // renders; only the progress-sourced bits (blockedSummary, stepStatuses,
  // disclosureSummary) are missing. Better than spinning forever.
  useEffect(() => {
    if (progressIsError && !progressHydratedRef.current) {
      progressHydratedRef.current = true
      dispatch({ type: 'progress-failed' })
    }
  }, [progressIsError])

  useEffect(() => {
    if (progressSnapshot && !progressHydratedRef.current) {
      progressHydratedRef.current = true
      // Seed the de-dup set with the hydrated step statuses so any
      // identical `step-status` Pusher event for these states (which
      // may already be in the air on slow networks) is suppressed.
      for (const [stepId, status] of Object.entries(
        progressSnapshot.step_statuses || {},
      )) {
        seenStepsRef.current.add(`${stepId}:${status}`)
      }
      dispatch({ type: 'progress-hydrated', progress: progressSnapshot })
    }
  }, [progressSnapshot])

  // Pusher event handler
  const handleEvent = useCallback((event) => {
    if (!event || typeof event !== 'object') return

    // Status pane
    const nextStatus = deriveStatus(event, { phase: state.phase })
    if (nextStatus) {
      dispatch({ type: 'status-changed', status: nextStatus })
    }

    // Phase transitions (top-level Pusher event)
    if (event.type === 'skill-phase' && event.phase) {
      dispatch({ type: 'phase-changed', phase: event.phase })
      if (event.phase === 'BLOCKED') {
        dispatch({
          type: 'blocked',
          reason: event.block_reason || 'No reason provided',
          summary: event.blocked_summary || null,
        })
      }
      // Reset Build / Check sub-states when crossing the relevant phase
      // boundaries so a re-run doesn't carry stale labels.
      if (event.phase === 'EXECUTING' || event.phase === 'FIXING') {
        dispatch({ type: 'build-substage', subStage: '' })
      }
      if (event.phase === 'VERIFYING') {
        dispatch({ type: 'check-substage', subStage: 'running_checks' })
      }
      if (event.phase === 'FIXING') {
        dispatch({ type: 'check-substage', subStage: 'applying_fixes' })
      }
    }

    // Grounded follow-up chips for the COMPLETE screen. Fired ~1-2s after
    // skill-phase=COMPLETE (its own event so the COMPLETE banner ships first).
    if (event.type === 'suggested-questions') {
      dispatch({ type: 'suggested-questions', questions: event.questions || [] })
    }

    // Skills v2 setup-stage sub-state (planner-emitted)
    if (event.type === 'setup-stage' && event.stage) {
      dispatch({ type: 'setup-stage', stage: event.stage })
    }

    // Build sub-stage — derived from the existing tool_call events the
    // executor already emits. No new BE events needed for the Build
    // stage. Mapping is one-way (last wins): a `write_file` after a
    // `query_athena` lands us in "composing"; we don't move back to
    // "running_queries" if a later query fires.
    if (event.type === 'tool_call' && event.tool) {
      let subStage = null
      if (event.tool === 'query_athena' || event.tool === 'query_pg') {
        subStage = 'running_queries'
      } else if (event.tool === 'execute_code') {
        subStage = 'transforming_data'
      } else if (event.tool === 'write_file' || event.tool === 'edit_file') {
        subStage = 'composing'
      }
      if (subStage) {
        dispatch({ type: 'build-substage', subStage })
      }
    }

    // Clarifications — signal-only protocol (canonical).
    // Pusher carries a tiny `{type, count}` ping; the actual clarification
    // array is fetched via `/skill/progress`. Fat payloads dropped in
    // production often enough that users had to reload to see the
    // question. The disk write (skills_run/clarifications.json) is the
    // source of truth; this signal just wakes the FE to refetch.
    if (event.type === 'clarification-pending') {
      refetchProgress()
        .then((result) => {
          if (result?.data) {
            dispatch({ type: 'progress-hydrated', progress: result.data })
          }
        })
        .catch(() => {
          // Refetch failed — the 60s polling fallback will catch up.
        })
    }
    // Legacy fat-payload handlers — kept for one release cycle so
    // sessions started before this deploy continue to work. Drop once
    // production has cycled. The reducer dedupes by id, so even if a
    // legacy session somehow emits both event shapes, we don't double-add.
    if (event.type === 'clarification-requested' && event.clarification) {
      dispatch({ type: 'clarification-received', clarification: event.clarification })
    }
    if (event.type === 'clarification-batch-requested' && event.clarifications) {
      dispatch({ type: 'clarification-received', batch: event.clarifications })
    }

    // Executor
    if (event.type === 'executor-started') {
      seenStepsRef.current.clear()
      dispatch({ type: 'execution-started' })
    }
    if (event.type === 'step-status' && event.step_id) {
      const key = `${event.step_id}:${event.status}`
      if (!seenStepsRef.current.has(key)) {
        seenStepsRef.current.add(key)
        dispatch({ type: 'step-updated', step_id: event.step_id, status: event.status })
      }
    }
    if (event.type === 'executor-completed') {
      if (event.status === 'blocked') {
        dispatch({ type: 'blocked', reason: event.block_reason || event.reason || 'Executor halted' })
      }
    }

    // Verifier
    if (event.type === 'verifier-started') {
      dispatch({ type: 'verifier-round-started', round: event.round })
      // Round 2 → bar caption switches to "Final check" (matches the
      // left-pane row label). Round 1 stays on 'running_checks', already
      // set by the phase-changed handler when VERIFYING was entered.
      if (event.round >= 2) {
        dispatch({ type: 'check-substage', subStage: 'final_check' })
      }
    }
    if (event.type === 'verification-finding') {
      dispatch({ type: 'finding-recorded' })
    }
    if (event.type === 'verification-complete' && event.verdict === 'block') {
      dispatch({ type: 'blocked', reason: event.reason || 'Verifier blocked the run' })
    }

    // Terminal error
    if (event.type === 'error' && event.error) {
      dispatch({ type: 'error', message: String(event.error) })
    }
  }, [state.phase, refetchProgress])

  const { connectionStatus } = usePusher({
    sessionId,
    onEvent: handleEvent,
  })

  // ─── Polling fallback for missed Pusher events ──────────────────────
  // Production Pusher delivery is best-effort — a network blip, a browser
  // tab throttle, or a Pusher cluster hiccup can drop an event that the
  // FE never gets a second chance at. We mitigate by tracking when state
  // last "moved": phase changes, sub-stage transitions, new clarifications,
  // step status updates, finding counts. If we sit on the same indicators
  // for >60s during a non-terminal phase, we poll /skill/progress every
  // 15s until something changes. Independent of Pusher health — if events
  // ARE flowing, the timestamp keeps getting bumped and polling never
  // fires. The 15s cadence is cheap (the endpoint reads on-disk files).
  const lastStageChangeAtRef = useRef(Date.now())
  useEffect(() => {
    lastStageChangeAtRef.current = Date.now()
  }, [
    state.phase,
    state.setupStage,
    state.buildSubStage,
    state.checkSubStage,
    state.findingCount,
    state.clarifications.length,
    state.stepStatuses,
  ])

  useEffect(() => {
    // Skip on initial load (phase=null) and on terminal phases.
    if (!state.phase || _POLL_SKIP_PHASES.has(state.phase)) return
    const interval = setInterval(async () => {
      if (Date.now() - lastStageChangeAtRef.current < POLL_STUCK_THRESHOLD_MS) return
      try {
        const result = await refetchProgress()
        if (result?.data) {
          dispatch({ type: 'progress-hydrated', progress: result.data })
        }
      } catch {
        // Refetch failed — try again on the next tick.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [state.phase, refetchProgress])

  // ─── Terminal-phase final sweep ────────────────────────────────────
  // The polling effect above skips terminal phases (COMPLETE / BLOCKED /
  // OPEN_CHAT) because they don't change. But the BE may persist
  // disclosure_summary or blocked_summary in the SAME atomic write that
  // flipped the phase — and if the FE's Pusher `phase-changed` event
  // arrives before our session refetch, the reducer adopts
  // phase=COMPLETE with an empty summary, then polling never runs
  // again. Users had to hard-refresh to see the disclosure. One last
  // fetch on phase→terminal closes that gap. Cheap (single endpoint hit
  // per run) and the reducer's null-coalescing merge means re-applying
  // a no-op snapshot is harmless.
  useEffect(() => {
    if (state.phase !== 'COMPLETE' && state.phase !== 'BLOCKED') return
    refetchProgress().then((result) => {
      if (result?.data) {
        dispatch({ type: 'progress-hydrated', progress: result.data })
      }
    }).catch(() => {
      // Non-fatal — what's already in state is what the user sees.
    })
  }, [state.phase, refetchProgress])

  // ─── Plan summary (AWAITING_CONFIRMATION) ───────────────────────────
  // Only fetch once the planner has actually produced plan.md. We key off
  // phase rather than always-on so we don't 404-spam during PLANNING.
  // Enabled across the full post-plan lifecycle so a refresh mid-COMPLETE
  // can still resolve output_type + memo_path for the artifact preview.
  const planSummaryEnabled = !!sessionId && [
    'AWAITING_CONFIRMATION', 'EXECUTING', 'VERIFYING', 'FIXING', 'COMPLETE',
    // OPEN_CHAT included so the run page stays viewable post-handoff —
    // user lands on the run page via URL and we need to load the plan
    // summary to render the final artifact + Follow Up / V&P buttons.
    'OPEN_CHAT',
  ].includes(state.phase)
  const {
    data: planSummary,
    isLoading: planSummaryLoading,
    error: planSummaryError,
  } = useQuery({
    queryKey: ['skill-plan-summary', sessionId],
    queryFn: () => apiGet(`/api/sessions/${sessionId}/skill/plan-summary`),
    enabled: planSummaryEnabled,
    retry: false,
  })

  // ─── Approve plan (AWAITING_CONFIRMATION → EXECUTING) ───────────────
  const [approving, setApproving] = useState(false)
  const approvePlan = useCallback(async (keptWidgetIds) => {
    if (approving) return
    setApproving(true)
    try {
      await apiPost(`/api/sessions/${sessionId}/skill/execute`, Array.isArray(keptWidgetIds) ? { kept_widgets: keptWidgetIds } : {})
      // Backend will publish skill-phase=EXECUTING via Pusher; the reducer
      // picks it up. No optimistic phase flip here so we stay in sync.
    } catch {
      // axios interceptor toasts
    } finally {
      setApproving(false)
    }
  }, [sessionId, approving])

  // ─── Discard run (* → CANCELLED) ────────────────────────────────────
  // POST /skill/discard cancels any in-flight agent turn AND sets phase
  // to CANCELLED so the row drops off the active-runs list. The user
  // clicks "Cancel" on the plan-approval card meaning "I don't want
  // this run" — discard is the terminal move that matches that intent
  // (vs /skill/cancel which leaves the run resumable).
  const [discarding, setDiscarding] = useState(false)
  const discardRun = useCallback(async () => {
    if (discarding) return false
    setDiscarding(true)
    try {
      await apiPost(`/api/sessions/${sessionId}/skill/discard`, {})
      return true
    } catch {
      return false
    } finally {
      setDiscarding(false)
    }
  }, [sessionId, discarding])

  // ─── Handoff (COMPLETE/BLOCKED → OPEN_CHAT) ─────────────────────────
  // POST /skill/handoff converts the skill_run session back to a regular
  // chat session. Returns success so the caller can navigate.
  const [handingOff, setHandingOff] = useState(false)
  const requestHandoff = useCallback(async () => {
    if (handingOff) return false
    setHandingOff(true)
    try {
      await apiPost(`/api/sessions/${sessionId}/skill/handoff`, {})
      return true
    } catch (err) {
      // Race with the Phase 2 §1 auto-handoff: when phase=COMPLETE is
      // persisted, the executor branch fires a background task that runs
      // /skill/handoff on its own. The user can click Follow Up or
      // Verify & Publish at the same instant and lose the race. Both
      // outcomes mean the handoff is happening / has happened, so the
      // user's intended navigation is still correct — don't strand them
      // on the run page with an error toast.
      //   • 409 — auto-handoff is mid-flight (atomic lock held)
      //   • 400 "Skill is already in OPEN_CHAT — re-handoff is not allowed"
      //     — auto-handoff completed first
      // Other 400s ("only valid for skill_run sessions", "requires phase
      // in [...]") are real errors and fall through to ok=false.
      const status = err?.response?.status
      const detail = err?.response?.data?.detail || ''
      if (status === 409) return true
      if (status === 400 && detail.includes('OPEN_CHAT')) return true
      return false
    } finally {
      setHandingOff(false)
    }
  }, [sessionId, handingOff])

  // ─── Clarification flow ─────────────────────────────────────────────
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false)

  // Both onNext and onPrevious record the current card's value first so the
  // user's in-progress edits aren't lost on navigation. Only onNext at the
  // final index actually submits the batch.

  const submitClarifications = useCallback(
    async ({ id, answer }) => {
      // Build the batch from the snapshot + the just-committed answer; the
      // dispatched `clarification-recorded` action hasn't flushed to state
      // yet inside this callback.
      const merged = { ...state.clarificationAnswers, [id]: answer }
      const batch = Object.entries(merged).map(([cid, a]) => ({
        clarification_id: cid,
        answer: a,
      }))
      setClarificationSubmitting(true)
      try {
        await apiPost(`/api/sessions/${sessionId}/skill/clarify`, { answers: batch })
        dispatch({ type: 'clarifications-submitted' })
        // Pull the fresh /skill/progress snapshot — its `key_choices`
        // now includes the just-submitted answers, so the Setup right
        // pane can show "Running with: …" while the planner moves into
        // verifying_answers / drafting_plan. Fire-and-forget; the
        // existing progress query is enabled-once, so we use the
        // explicit refetch + dispatch path.
        try {
          const fresh = await refetchProgress()
          if (fresh?.data) {
            dispatch({ type: 'progress-hydrated', progress: fresh.data })
          }
        } catch {
          // Non-fatal — keyChoices simply won't update until the next
          // page reload picks up the new /skill/progress projection.
        }
      } catch {
        // axios interceptor toasts; nothing more to do here
      } finally {
        setClarificationSubmitting(false)
      }
    },
    [sessionId, state.clarificationAnswers, refetchProgress]
  )

  const goNextClarification = useCallback(
    async ({ id, answer }) => {
      dispatch({ type: 'clarification-recorded', id, answer })
      const isLast = state.currentIndex + 1 >= state.clarifications.length
      if (isLast) {
        await submitClarifications({ id, answer })
      } else {
        dispatch({ type: 'clarification-navigate', index: state.currentIndex + 1 })
      }
    },
    [state.currentIndex, state.clarifications.length, submitClarifications]
  )

  const goPreviousClarification = useCallback(
    ({ id, answer }) => {
      // Always record what the user has typed/picked so far so backing up
      // doesn't discard partial work — even if the current answer is
      // empty/invalid (they can return and fix it).
      dispatch({ type: 'clarification-recorded', id, answer })
      dispatch({ type: 'clarification-navigate', index: state.currentIndex - 1 })
    },
    [state.currentIndex]
  )

  return {
    state,
    dispatch,
    session,
    connectionStatus,
    isLoading,
    isError,
    refetch,
    // Clarification flow
    goNextClarification,
    goPreviousClarification,
    clarificationSubmitting,
    // Plan approval flow
    planSummary,
    planSummaryLoading,
    planSummaryError,
    approvePlan,
    approving,
    // Discard (Cancel button on PlanApprovalCard)
    discardRun,
    discarding,
    // Handoff
    requestHandoff,
    handingOff,
  }
}
