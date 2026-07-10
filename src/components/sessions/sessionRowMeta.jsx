// Shared visual + routing metadata for session rows in the Sidebar and
// the Sessions list page. Single source of truth so both surfaces stay
// in lockstep when phase/badge rules evolve.
//
// Inputs: a session row from `GET /api/sessions` (must have `session_type`,
// `skill_id`, `phase`).
//
// Outputs:
//   • `isSkillRun`          — boolean. True for any session that originated
//                              from a skill_run (in-flight OR post-handoff).
//                              Detected via `skill_id` truthiness, which
//                              persists across the session_type=regular flip
//                              that the handoff endpoint applies.
//   • `route`               — string. Where row click should navigate.
//                              In-flight skill runs → `/skills-v2/run/:id`,
//                              everything else → `/session/:id`.
//   • `badge`               — { kind, ariaLabel } | null. Visual state badge:
//                              kind ∈ 'awaiting' | 'progress' | 'blocked' | null.
//                              The CSS for each kind is owned by the caller
//                              (Sidebar/Sessions row), keeping this file
//                              JSX-free for trivial unit testing.
//   • `iconMuted`           — boolean. CANCELLED skill runs render the
//                              flask in a muted/desaturated style. Other
//                              states keep the regular muted-foreground tone.

const IN_PROGRESS_PHASES = new Set([
  'PLANNING', 'EXECUTING', 'VERIFYING', 'FIXING',
])

// During PLANNING, the planner can be in one of two states:
//   • Agent-working — running queries, drafting plan, etc.
//   • User-gated — waiting on clarification answers
// The setup_stage field distinguishes them. When user-gated we promote
// the badge to "awaiting" (amber notification dot) since the user is
// the actor; in-progress pulse is misleading when the agent is idle.
const PLANNING_USER_GATED_SUBSTAGES = new Set([
  'awaiting_input', 'followup_question',
])

export function getSessionRowMeta(session) {
  const skillId = session?.skill_id || ''
  const sessionType = session?.session_type || ''
  const phase = session?.phase || ''
  const sessionId = session?.session_id || ''
  const setupStage = session?.setup_stage || ''
  const turnCount = session?.turn_count || 0
  const handoffTurnCount = session?.handoff_turn_count || 0

  const isSkillRun = !!skillId

  // Did the user chat post-handoff? Subtract the snapshot taken at handoff
  // time. Negative or zero → no post-handoff activity yet. Used for both
  // routing and the green "ready" badge below.
  const postHandoffTurns = Math.max(0, turnCount - handoffTurnCount)
  const isCompletedSkillRun = (
    isSkillRun && phase === 'OPEN_CHAT' && sessionType === 'regular'
  )

  // Routing:
  //   • In-flight skill_run (phase != OPEN_CHAT) → run page
  //   • Completed skill_run with ≤1 post-handoff turn → run page (user
  //     hasn't really started chatting; let them review the artifact)
  //   • Completed skill_run with >1 post-handoff turns → regular session
  //     page (active chat thread)
  //   • Anything else → regular session page
  // Legacy data: session_type=skill_run with phase=OPEN_CHAT (pre auto-
  // handoff) is treated as completed and routes by the same delta rule.
  const inFlightSkillRun = sessionType === 'skill_run' && phase !== 'OPEN_CHAT'
  const legacyOpenChatSkillRun = sessionType === 'skill_run' && phase === 'OPEN_CHAT'
  const completedNoChat = (
    (isCompletedSkillRun || legacyOpenChatSkillRun)
    && postHandoffTurns <= 1
  )
  const route = (inFlightSkillRun || completedNoChat)
    ? `/skills/run/${sessionId}`
    : `/session/${sessionId}`

  // Badge — only for in-flight skill_run rows. Post-handoff (regular) and
  // completed (OPEN_CHAT) get no badge per design decision: flask icon
  // alone communicates "this was a skill run"; absence of badges means
  // it's done. Awaiting/progress/blocked actively call for attention.
  let badge = null
  let iconMuted = false
  if (inFlightSkillRun) {
    if (phase === 'AWAITING_CONFIRMATION') {
      badge = { kind: 'awaiting', ariaLabel: 'Awaiting your approval' }
    } else if (phase === 'PLANNING' && PLANNING_USER_GATED_SUBSTAGES.has(setupStage)) {
      // PLANNING with a user-gated sub-stage (clarification surfaced and
      // waiting for the user) → amber, same as AWAITING_CONFIRMATION.
      // Without this, planning rows would show the in-progress pulse
      // even when the agent is idle and the user is the actor.
      badge = { kind: 'awaiting', ariaLabel: 'Awaiting your input' }
    } else if (IN_PROGRESS_PHASES.has(phase)) {
      badge = { kind: 'progress', ariaLabel: 'Running' }
    } else if (phase === 'BLOCKED') {
      badge = { kind: 'blocked', ariaLabel: 'Blocked' }
    } else if (phase === 'CANCELLED') {
      // No badge — but mute the icon so cancelled runs visually
      // recede in the list. Users can still click in to re-run.
      iconMuted = true
    }
  } else if (isSkillRun && (isCompletedSkillRun || legacyOpenChatSkillRun) && postHandoffTurns === 0) {
    // Completed skill run that the user hasn't chatted on yet — surface
    // a green "done" dot so they know it finished and is ready to
    // review. Once they send a chat message (post_handoff_turns > 0)
    // the badge disappears since the row is no longer a fresh result.
    badge = { kind: 'done', ariaLabel: 'Ready to review' }
  }

  return { isSkillRun, route, badge, iconMuted, sessionType, phase, skillId }
}


// Tailwind classnames for the corner badge dot. Centralized so Sidebar
// and Sessions page stay visually identical. Each kind:
//   awaiting — solid amber, no animation. Pulls attention without alarming.
//   progress — solid accent, animate-pulse. "Alive."
//   blocked  — solid error, no animation. "Stop and look."
//   done     — solid success green, no animation. "Finished, ready to
//              review." Shown only on post-handoff skill runs the user
//              hasn't chatted on yet; disappears after their first chat.
const BADGE_DOT_CLASSES = {
  awaiting: 'bg-[var(--pv-warning-text)]',
  progress: 'bg-[var(--accent)] animate-pulse',
  blocked: 'bg-[var(--pv-error-text)]',
  done: 'bg-[var(--pv-success-text)]',
}

export function badgeDotClassname(kind) {
  return BADGE_DOT_CLASSES[kind] || ''
}
