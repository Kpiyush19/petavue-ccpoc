// Mock skill-run engine for the Skills v2 run page (/skills-v2/run/:id).
// Drives a believable end-to-end run by mutating the session's `phase` and a
// per-run progress record, and emitting the Pusher `agent-event` choreography
// the run page's reducer listens for: Plan → Approval → Build → Quality check
// → Ready (COMPLETE).

import { emit } from "./pusherBus";
import { SKILLS_CATALOG } from "../skills/skillsCatalog";

const runs = {}; // sessionId -> run record

const chan = (sid) => `session-${sid}`;
const ev = (sid, payload) => emit(chan(sid), "agent-event", payload);

// Generic plan steps for a dashboard skill. type drives the row icon.
const DEFAULT_STEPS = [
  { id: "pull_revenue", title: "Pull revenue by month", type: "query", tool: "query_athena" },
  { id: "rank_accounts", title: "Rank top accounts", type: "query", tool: "query_athena" },
  { id: "compute_kpis", title: "Compute headline KPIs", type: "transform", tool: "execute_code" },
  { id: "build_widgets", title: "Build dashboard widgets", type: "widget", tool: "write_file" },
  { id: "verify_values", title: "Verify every value is source-linked", type: "verify", tool: null },
];

// One plain-language clarification the planner asks before drafting — kept
// deliberately jargon-free (a marketer should read it without help). Drives
// the "Input needed" step in the left pane after "Reviewing data".
const PERIOD_CLARIFICATION = {
  id: "period",
  question: "What time period should we look at?",
  help_text: "Just the window for this analysis — you can change it later in chat without rebuilding.",
  answer_type: "single_select",
  required: true,
  default: "last_quarter",
  surfaced_reason: null,
  allow_custom: true,
  options: [
    { value: "last_90", label: "Last 90 days" },
    { value: "last_quarter", label: "Last quarter" },
    { value: "last_4q", label: "Last 4 quarters" },
    { value: "ytd", label: "Year to date" },
    { value: "__custom__", label: "Other (please specify)" },
  ],
};
const PERIOD_LABEL = {
  last_90: "Last 90 days",
  last_quarter: "Last quarter",
  last_4q: "Last 4 quarters",
  ytd: "Year to date",
};

export function getRun(sid) {
  return runs[sid];
}

// Feed for the global runs dock. The real backend's /skill-runs/active
// returns only resumable (non-terminal) runs; here we ALSO surface
// COMPLETE ones so the dock can show a "Ready" entry the user opens or
// dismisses (real backends would learn of completion via the sessions
// list). CANCELLED runs are dropped so discarding clears them.
export function listActiveRuns() {
  return Object.values(runs)
    .filter((r) => r.session && r.session.phase !== "CANCELLED")
    .map((r) => ({
      session_id: r.sessionId,
      skill_id: r.skill?.slug || r.skill?.name || null,
      skill_title: r.planSummary?.title || "Skill run",
      output_type: r.planSummary?.output_type || "dashboard",
      phase: r.session.phase,
      created_at: r.createdAt,
      last_active_at: r.createdAt,
    }));
}

// Build the /skill/progress snapshot from the live run record.
export function getProgress(sid) {
  const run = runs[sid];
  if (!run) return null;
  return {
    step_statuses: run.step_statuses,
    clarifications_pending: run.awaiting ? [run.clarification] : [],
    verification_round: run.verification_round,
    finding_count: run.finding_count,
    disclosure_summary: null,
    blocked_summary: null,
    key_choices: run.planSummary.key_choices,
  };
}

export function getPlanSummary(sid) {
  return runs[sid]?.planSummary || null;
}

// Start a run for a freshly created skill_run session. `session` is the stored
// db.sessions object — we mutate session.phase so GET /api/sessions/:id reflects
// live state on reload/poll.
export function startRun(session, skillId) {
  const sid = session.session_id;
  const skill = SKILLS_CATALOG.find((s) => s.slug === skillId || s.name === skillId) || null;
  const isMemo = skill?.type === "memo";
  const steps = DEFAULT_STEPS.map((s) => ({ ...s }));

  const run = {
    sessionId: sid,
    session,
    skill,
    createdAt: session.created_at,
    clarification: PERIOD_CLARIFICATION,
    awaiting: false,
    step_statuses: {},
    verification_round: 0,
    finding_count: 0,
    timers: [],
    planSummary: {
      title: skill?.name || "Skill run",
      output_type: isMemo ? "memo" : "dashboard",
      plan_outcome: skill?.overview || `Sage will build your ${(skill?.name || "output").toLowerCase()} from your connected data.`,
      plan_will_deliver: (skill?.questions || []).slice(0, 4),
      plan_wont_deliver: [],
      plan_key_formulas: [],
      key_choices: (skill?.inputs || []).slice(0, 3).map((t) => ({ label: t.split("—")[0].trim(), value: t })),
      steps: steps.map(({ id, title, type }) => ({ id, title, type })),
      memo_path: isMemo ? "output/memo.md" : "",
    },
    steps,
  };
  runs[sid] = run;
  session.phase = "PLANNING";
  session.setup_stage = "workspace_ready";

  const after = (ms, fn) => run.timers.push(setTimeout(fn, ms));

  // ── PLANNING choreography (delayed ~1s so the client subscribes first).
  // Reviews the data, then PAUSES on a plain clarification ("Input needed").
  // The rest of the plan (verify → draft → review → approval) resumes in
  // submitClarification once the user answers. ──
  after(900, () => { ev(sid, { type: "setup-stage", stage: "reviewing_data" }); ev(sid, { type: "tool_call", tool: "query_athena" }); });
  after(1800, () => { ev(sid, { type: "tool_call", tool: "execute_code" }); });
  after(2600, () => {
    run.awaiting = true;
    session.setup_stage = "awaiting_input";
    ev(sid, { type: "setup-stage", stage: "awaiting_input" });
    ev(sid, { type: "clarification-requested", clarification: run.clarification });
  });
}

// User answered the clarification → resume the plan and land on approval.
export function submitClarification(sid, answers) {
  const run = runs[sid];
  if (!run || !run.awaiting) return;
  run.awaiting = false;

  // Record the chosen period as a key choice so the plan + "Running with"
  // summary reflect what the user picked.
  const entry = Array.isArray(answers) ? answers[0] : answers;
  const raw = entry?.answer ?? entry?.value ?? entry;
  const label = PERIOD_LABEL[raw] || (typeof raw === "string" && raw ? raw : "Last quarter");
  run.planSummary.key_choices = [
    { label: "Period", value: label },
    ...run.planSummary.key_choices.filter((c) => c.label !== "Period"),
  ];

  const { session } = run;
  const after = (ms, fn) => run.timers.push(setTimeout(fn, ms));
  session.setup_stage = "verifying_answers";
  ev(sid, { type: "setup-stage", stage: "verifying_answers" });
  after(1000, () => { ev(sid, { type: "setup-stage", stage: "drafting_plan" }); ev(sid, { type: "tool_call", tool: "start_plan" }); });
  after(1900, () => { ev(sid, { type: "tool_call", tool: "finalize_plan" }); ev(sid, { type: "setup-stage", stage: "reviewing_plan" }); ev(sid, { type: "self-review-running" }); });
  after(2800, () => {
    ev(sid, { type: "self-review-complete", status: "complete" });
    session.phase = "AWAITING_CONFIRMATION";
    ev(sid, { type: "skill-phase", phase: "AWAITING_CONFIRMATION" });
  });
}

// User approved the plan → run the build, quality check, then complete.
export function executeRun(sid) {
  const run = runs[sid];
  if (!run) return;
  const { session, steps } = run;
  const after = (ms, fn) => run.timers.push(setTimeout(fn, ms));

  session.phase = "EXECUTING";
  ev(sid, { type: "skill-phase", phase: "EXECUTING" });
  ev(sid, { type: "executor-started" });

  let t = 400;
  const buildSteps = steps.filter((s) => s.type !== "verify");
  buildSteps.forEach((s) => {
    after(t, () => {
      run.step_statuses[s.id] = "running";
      ev(sid, { type: "step-status", step_id: s.id, status: "running" });
      if (s.tool) ev(sid, { type: "tool_call", tool: s.tool });
    });
    after(t + 900, () => {
      run.step_statuses[s.id] = "success";
      ev(sid, { type: "step-status", step_id: s.id, status: "success" });
    });
    t += 1300;
  });

  // ── Quality check ──
  after(t, () => {
    ev(sid, { type: "executor-completed", status: "success" });
    session.phase = "VERIFYING";
    ev(sid, { type: "skill-phase", phase: "VERIFYING" });
    run.verification_round = 1;
    ev(sid, { type: "verifier-started", round: 1 });
    const verifyStep = steps.find((s) => s.type === "verify");
    if (verifyStep) {
      run.step_statuses[verifyStep.id] = "running";
      ev(sid, { type: "step-status", step_id: verifyStep.id, status: "running" });
    }
  });
  after(t + 1800, () => {
    const verifyStep = steps.find((s) => s.type === "verify");
    if (verifyStep) {
      run.step_statuses[verifyStep.id] = "success";
      ev(sid, { type: "step-status", step_id: verifyStep.id, status: "success" });
    }
    ev(sid, { type: "verification-complete", verdict: "pass" });
  });

  // ── Ready ──
  after(t + 2600, () => {
    session.phase = "COMPLETE";
    ev(sid, { type: "skill-phase", phase: "COMPLETE" });
  });
  after(t + 3600, () => {
    ev(sid, {
      type: "suggested-questions",
      questions: [
        "Which accounts are most at risk?",
        "Break this down by segment.",
        "Compare against last quarter.",
      ],
    });
  });
}

export function discardRun(sid) {
  const run = runs[sid];
  if (!run) return;
  run.timers.forEach(clearTimeout);
  if (run.session) run.session.phase = "CANCELLED";
}
