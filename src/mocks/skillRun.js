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
  { id: "pull_revenue", title: "Pull revenue by month", type: "query", tool: "query_athena", purpose: "Pulls the raw numbers this dashboard is built on, straight from your connected data.", result: "Pulled 12,480 rows across 92 days of spend and revenue." },
  { id: "rank_accounts", title: "Rank top accounts", type: "query", tool: "query_athena", purpose: "Finds which accounts matter most, so the dashboard leads with them.", result: "Ranked 342 accounts by ARR; the top 6 will headline the leaderboard." },
  { id: "compute_kpis", title: "Compute headline KPIs", type: "transform", tool: "execute_code", purpose: "Turns the raw data into the top-line numbers you'll see in the scorecard.", result: "Computed 8 headline KPIs, including $4.82M revenue and a 27.4% win rate." },
  { id: "build_widgets", title: "Build dashboard widgets", type: "widget", tool: "write_file", purpose: "Assembles each chart and table you approved into the dashboard.", result: "Built 5 widgets: KPI row, revenue trend, segment split, risk list, and detail table." },
  { id: "verify_values", title: "Verify every value is source-linked", type: "verify", tool: null, purpose: "Checks that every number traces back to your data, so you can trust it.", result: "Every value is source-linked and reconciled to your data." },
];

// Planned widgets/sections surfaced in the approval step's per-widget review,
// so the user can adjust or drop each one before anything is built.
const DASHBOARD_WIDGETS = [
  { id: "headline", name: "Headline KPIs", desc: "The top-line numbers for this analysis as a scorecard row." },
  { id: "trend", name: "Trend over time", desc: "How the key metric moved across the period you picked." },
  { id: "segment", name: "Breakdown by segment", desc: "The metric split across your main segments, ranked." },
  { id: "risk", name: "Where you're at risk", desc: "The areas below target, with the size of each gap." },
  { id: "table", name: "Detail table", desc: "Every value in a sortable table, each one source-linked." },
];
const MEMO_SECTIONS = [
  { id: "summary", name: "Executive summary", desc: "The headline takeaway in two or three sentences." },
  { id: "findings", name: "What the data shows", desc: "The key findings, with the numbers behind them." },
  { id: "drivers", name: "Why it's happening", desc: "The drivers behind the pattern, called out plainly." },
  { id: "actions", name: "What to do next", desc: "The recommended moves, ranked by impact." },
  { id: "method", name: "How we measured it", desc: "Definitions, sources, and any caveats." },
];

// One plain-language clarification the planner asks before drafting — kept
// deliberately jargon-free (a marketer should read it without help). Drives
// the "Input needed" step in the left pane after "Reviewing data".
const PERIOD_CLARIFICATION = {
  id: "period",
  question: "What time period should we look at?",
  help_text: "Just the window for this analysis. You can change it later in chat without rebuilding.",
  affects: "Every widget in the dashboard. It sets the time window the whole thing is built on, so \"Trend over time\" and the KPIs all use this range.",
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

// Demo trigger — any skill whose slug is in this set halts at the Plan stage
// with a GTM-style "your setup is missing data" block, so the blocked-state +
// correction UI is reachable in the prototype. Everything else runs normally.
const BLOCK_SKILLS = new Set(["buyer-journey-analysis"]);
const blockSummary = (name) => ({
  headline: `${name || "This skill"} needs a unified touch history your setup doesn't have`,
  why_blocked:
    "This skill reconstructs the order of every touch (marketing, ads, and sales) for each opportunity. Your CRM records the current stage and the last stage-change date, but not the full history of transitions between stages. There's also no single stream that puts marketing, ad, and sales touches in time order. Without that sequence, there's no journey to analyze.",
  what_you_can_do: [
    "Run a skill that works with your current data: Funnel Conversion Rates (stage-to-stage conversion), Closed-Won Journey Retrospective (winning-deal patterns), or Pipeline Coverage (pipeline by segment).",
    "If you want this analysis specifically, work with your CRM admin to expose the opportunity stage-history table (the full transition log, not just the last change) and connect a unified activity stream that combines marketing, ad, and sales touches.",
  ],
  what_system_cannot_do:
    "We can't reconstruct stage-change history from a single 'last change' timestamp, and we can't invent data sources that don't exist in your connected systems.",
});

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
    blocked_summary: run.blocked ? run.blockedSummary : null,
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
    blocked: false,
    blockedSummary: null,
    step_statuses: {},
    verification_round: 0,
    finding_count: 0,
    timers: [],
    planSummary: {
      title: skill?.name || "Skill run",
      // Short catalog blurb for the skill — shown as header context on the
      // run page so the user always knows what this skill is for.
      skill_description: skill?.description || "",
      output_type: isMemo ? "memo" : "dashboard",
      plan_outcome: skill?.overview || `Sage will build your ${(skill?.name || "output").toLowerCase()} from your connected data.`,
      plan_will_deliver: (skill?.questions || []).slice(0, 4),
      widgets: isMemo ? MEMO_SECTIONS : DASHBOARD_WIDGETS,
      // The answers/definitions produced during this run, offered for saving as
      // reusable context so future runs reuse them (the "Save answers" popup).
      saveableAnswers: [
        { id: "period", title: "Time window for this analysis", kind: "Context", target: "cohort-analysis / defaults.md" },
        { id: "qualified_lead", title: "What counts as a qualified lead", kind: "Key Definition", target: "Tenant key definitions" },
        { id: "attribution", title: "Attribution model", kind: "Key Definition", target: "Tenant key definitions" },
        { id: "segments", title: "Default segments for the breakdown", kind: "Context", target: "cohort-analysis / defaults.md" },
        { id: "targets", title: "Target thresholds", kind: "Key Definition", target: "Tenant key definitions" },
      ],
      plan_wont_deliver: [],
      plan_key_formulas: [],
      // Inputs read as "Label: detail?"; take the label before the colon.
      key_choices: (skill?.inputs || []).slice(0, 3).map((t) => ({ label: t.split(":")[0].trim(), value: t })),
      steps: steps.map(({ id, title, type, purpose, result }) => ({ id, title, type, purpose, result })),
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
    // Demo trigger: some skills discover the data they need isn't there and
    // halt at the Plan stage — exercises the blocked-state + correction UI.
    if (BLOCK_SKILLS.has(skill?.slug)) {
      run.blocked = true;
      run.blockedSummary = blockSummary(skill?.name);
      session.phase = "BLOCKED";
      session.block_reason = run.blockedSummary.why_blocked;
      ev(sid, {
        type: "skill-phase",
        phase: "BLOCKED",
        block_reason: run.blockedSummary.why_blocked,
        blocked_summary: run.blockedSummary,
      });
      return;
    }
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
