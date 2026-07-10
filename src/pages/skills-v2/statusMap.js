// Ops-friendly status copy for Skills v2 run events.
//
// Returns a string to display in the status pane, or `null` to leave the
// previous status visible (keeps the pane from strobing).
//
// Keyed loosely by phase + event.type + (tool || subtype). Falls through to
// generic defaults for unknown events so we never go silent on something
// real.

export const PHASE_LABEL = {
  PLANNING: 'Planning',
  AWAITING_CONFIRMATION: 'Plan ready for review',
  EXECUTING: 'Running',
  VERIFYING: 'Verifying',
  FIXING: 'Refining',
  COMPLETE: 'Done',
  BLOCKED: 'Blocked',
  OPEN_CHAT: 'Chat',
  CANCELLED: 'Cancelled',
}


// ─── tool_call → status ────────────────────────────────────────────────

const TOOL_STATUS_PLANNING = {
  query_athena: () => 'Reviewing your data',
  query_pg: () => 'Reviewing your data',
  execute_code: () => 'Analysing the data',
  start_plan: () => 'Drafting the plan',
  add_plan_step: () => 'Drafting the plan',
  update_plan: () => 'Refining the plan',
  finalize_plan: () => 'Finalising the plan',
}

const TOOL_STATUS_EXECUTING = {
  query_athena: (ev) => stepLabel('Running query', ev),
  query_pg: (ev) => stepLabel('Running query', ev),
  execute_code: (ev) => stepLabel('Computing', ev),
  write_file: (ev) => stepLabel('Building widget', ev),
  edit_file: (ev) => stepLabel('Updating widget', ev),
}


// ─── event.type → status ───────────────────────────────────────────────

const TYPE_STATUS = {
  // planner stream
  'self-review-running': () => 'Reviewing the draft plan',
  'self-review-complete': (ev) =>
    ev.status === 'complete'
      ? 'Plan ready for review.'
      : 'Revising the plan',
  'clarification-requested': () => 'Capturing your configuration',
  'clarification-batch-requested': (ev) => {
    const n = ev.clarifications?.length || 0
    return n > 1 ? `Capturing ${n} configuration details` : 'Capturing your configuration'
  },
  // executor stream
  'executor-started': () => 'Starting',
  'step-status': (ev) => {
    if (ev.status === 'running') return null  // tool_call covers this
    if (ev.status === 'failed') return 'Step failed. Retrying'
    return null  // success/pending → silent (row icon handles it)
  },
  'executor-completed': (ev) =>
    ev.status === 'success' ? 'Run complete. Reviewing the result' : null,
  // verifier stream
  'verifier-started': (ev) => {
    const r = ev.round
    return r && r > 1 ? 'Reviewing fixes' : 'Reviewing the result'
  },
  'verification-complete': (ev) => {
    if (ev.verdict === 'pass') return 'All checks passed'
    if (ev.verdict === 'retry') return 'Found items to fix. Handling them automatically'
    return null  // 'block' transitions to BLOCKED screen
  },
  // fixing
  'fixing-started': () => 'Applying fixes',
  'fixing-completed': (ev) =>
    ev.status === 'submitted' ? 'Fixes applied. Reviewing again' : null,
  // top-level
  'skill-phase': (ev) => {
    if (ev.phase === 'COMPLETE') return 'Done.'
    if (ev.phase === 'BLOCKED') return null  // BlockedScreen takes over
    return null
  },
  'stopped': () => 'Cancelled.',
  'cancelled': () => 'Cancelled.',
  'error': (ev) => `Something went wrong: ${ev.error || 'unknown'}`,
}


// ─── public API ────────────────────────────────────────────────────────

/**
 * Derive a user-facing status string from a Pusher event.
 *
 * @param {object} event — the parsed Pusher payload
 * @param {object} ctx
 * @param {string} ctx.phase — current phase
 * @param {object} ctx.planSteps — { [step_id]: title } if known
 * @returns {string | null} — string to display, or null to keep previous
 */
export function deriveStatus(event, ctx = {}) {
  if (!event || typeof event !== 'object') return null
  const { phase } = ctx

  if (event.type === 'tool_call') {
    const table =
      phase === 'EXECUTING' || phase === 'FIXING'
        ? TOOL_STATUS_EXECUTING
        : TOOL_STATUS_PLANNING
    const fn = table[event.tool]
    return fn ? fn(event, ctx) : null
  }

  const fn = TYPE_STATUS[event.type]
  return fn ? fn(event, ctx) : null
}


// ─── helpers ───────────────────────────────────────────────────────────

function stepLabel(prefix, ev) {
  const stepId = ev.step_id || ev.input?.step_id
  const title = ev._stepTitle || (stepId ? stepId : null)
  return title ? `${prefix}: ${title}` : `${prefix}…`
}
