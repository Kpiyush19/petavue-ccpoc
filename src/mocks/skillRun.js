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

export function getRun(sid) {
  return runs[sid];
}

// Build the /skill/progress snapshot from the live run record.
export function getProgress(sid) {
  const run = runs[sid];
  if (!run) return null;
  return {
    step_statuses: run.step_statuses,
    clarifications_pending: [],
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

  // ── PLANNING choreography (delayed ~1s so the client subscribes first) ──
  after(900, () => { ev(sid, { type: "setup-stage", stage: "reviewing_data" }); ev(sid, { type: "tool_call", tool: "query_athena" }); });
  after(1800, () => { ev(sid, { type: "tool_call", tool: "execute_code" }); ev(sid, { type: "setup-stage", stage: "verifying_answers" }); });
  after(2700, () => { ev(sid, { type: "setup-stage", stage: "drafting_plan" }); ev(sid, { type: "tool_call", tool: "start_plan" }); });
  after(3400, () => { ev(sid, { type: "tool_call", tool: "finalize_plan" }); ev(sid, { type: "setup-stage", stage: "reviewing_plan" }); ev(sid, { type: "self-review-running" }); });
  after(4300, () => {
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
