// Mock store + engine for the Goals experience (/goals).
// Goal lifecycle: calibrating → decisions → review → active.
// Calibration auto-advances on timers (server-driven, like skillRun) so the
// detail page can poll and animate the progress checklist.

let SEQ = 700;
const nid = (p) => `${p}-${(SEQ++).toString(16)}${Math.floor((SEQ * 97) % 9999).toString(16)}`;

// Workflows available to feed a goal (the dashboard flows that refresh daily).
export const GOAL_WORKFLOWS = [
  { id: "wf-hubspot-gap", name: "HubSpot Data Gap Audit Dashboard", schedule: "Custom schedule", lastRun: "last run 18d ago" },
  { id: "wf-row-count", name: "HubSpot Table Row Count Comparison — Weekly", schedule: "On data sync", lastRun: "last run 5d ago" },
  { id: "wf-pipeline-health", name: "Sales Pipeline Health", schedule: "On data sync", lastRun: "last run 21d ago" },
];

// Calibration checklist (right rail). The driver advances `progress` through these.
export const CALIBRATION_STEPS = [
  { key: "workflows", label: "Loaded your workflows" },
  { key: "history", label: "Read your history" },
  { key: "targets", label: "Targets" },
  { key: "conditions", label: "Conditions" },
  { key: "moves", label: "Recommended moves" },
  { key: "review", label: "Ready for your review" },
];

const config = {
  company: "B2B SaaS GTM analytics platform for mid-market revenue teams. Series C, ARR ~$30M, HubSpot CRM, sales-led motion.",
  process: "",
  icp: "",
  additional: "",
};

// ── Reusable proposed config for a "high-value deal" goal ──
function highValueGoalConfig() {
  return {
    targets: [
      {
        id: nid("tgt"),
        label: "Flag every open high-value deal — amount > $20,000 (is_closed = 0), one tracked recommendation per deal so each gets actively worked",
        target: "$20K",
        why: "Searched 38 history files. raw_deals.csv (497 rows) shows deals above $20K are where revenue concentrates; flagging each keeps them from rotting unworked.",
      },
    ],
    conditions: [
      { id: nid("cnd"), label: "High-value open deal with no owner — count of deals where amount > $20,000, is_closed = 0 and hubspot_owner_id is empty", state: "quiet", count: 0 },
      { id: nid("cnd"), label: "High-value open deal stuck early-stage — count where amount > $20,000, is_closed = 0 and weighted_pipeline < 0.3 × amount", state: "quiet", count: 0 },
      { id: nid("cnd"), label: "Deal approaching the high-value threshold — open deals with amount between $10,000 and $20,000", state: "quiet", count: 0 },
      { id: nid("cnd"), label: "Open high-value workload — count of deals with amount > $20,000 and is_closed = 0", state: "quiet", count: 0 },
      { id: nid("cnd"), label: "High-value open deal past its close date — count where amount > $20,000, is_closed = 0 and closedate is on/before today", state: "fired", count: 1 },
      { id: nid("cnd"), label: "Open-pipeline concentration in one high-value deal — largest single open deal amount ≥ $250,000", state: "fired", count: 1 },
    ],
    moves: [
      { id: nid("mv"), label: "Assign or reassign an owner to an unowned high-value deal so it's actively worked" },
      { id: nid("mv"), label: "Escalate the high-value deal to sales leadership / deal desk for hands-on help" },
      { id: nid("mv"), label: "Schedule the next customer touch (call/meeting) to advance the deal" },
      { id: nid("mv"), label: "Drive a stalled early-stage deal to its next pipeline stage with a concrete next step" },
      { id: nid("mv"), label: "Build a mutual close plan (champion, decision criteria, timeline) for the high-value deal" },
      { id: nid("mv"), label: "Rebalance the high-value queue / add coverage to reduce concentration in a single deal" },
      { id: nid("mv"), label: "Flag for manager review" },
    ],
  };
}

function defaultQuestions() {
  return [
    {
      id: nid("q"),
      text: "Your goal targets the MQL→SQL conversion rate (sqls / mqls), defined on hubspot_contacts.lifecyclestage. But the only history copied for the linked 'Sales Pipeline Health' workflow is deal-stage data — there is NO contact/lifecyclestage pool in the copied history to bind this rate to. How should I anchor the target?",
      found: "Searched all 38 history files: zero matches for lifecyclestage/mql/sql. raw_deals.csv (497 rows) starts at deal stages 'appointmentscheduled'/'qualifiedtobuy' — already past the MQL→SQL marketing handoff.",
      options: [
        { id: "a", label: "Keep the true metric: author MQL→SQL rate = sqls/mqls (lifecyclestage) as an UNVERIFIED custom target at ≥40% — badged unverified until contact lifecycle data is linked.", recommended: true },
        { id: "b", label: "Re-anchor to a bindable deal-funnel proxy in raw_deals.csv (e.g. share of deals advancing past the earliest stage) — a DIFFERENT metric, not true MQL→SQL.", recommended: false },
        { id: "c", label: "Hold targets — I plan to link a contacts/lifecyclestage workflow so the rate can bind to real copied history.", recommended: false },
      ],
    },
    {
      id: nid("q"),
      text: "What time window should we measure the target over?",
      found: "raw_deals.csv spans the last 92 days of activity; the trailing 30 days has the densest, most representative volume (213 of 497 rows).",
      options: [
        { id: "a", label: "Trailing 30 days — densest, most current signal.", recommended: true },
        { id: "b", label: "Trailing 90 days — smoother but slower to react.", recommended: false },
        { id: "c", label: "Quarter-to-date — aligns to the sales quarter.", recommended: false },
      ],
    },
  ];
}

function makeRecommendation() {
  return {
    id: nid("rec"),
    groupLabel: "High-value deals with stale/past close dates",
    groupNote: "Close date is in the past while deal remains open — forecast is unreliable and the deal needs re-dating",
    severity: "act-now",
    status: "open", // open | acted | rejected | snoozed
    title: "D3 - test 2",
    body:
      '"D3 - test 2" ($250,000, owner 79182818) is the single open high-value deal and the largest in the pipeline, sitting at the decisionmakerboughtin stage with $200,000 weighted (80% confidence). Its close date of 2025-11-30 is ~211 days in the past as of 2026-06-29, so the forecast date is stale and the deal is effectively un-dated.',
    evidence:
      "A $250,000 deal — the entire open high-value pipeline — has a close date 211 days overdue. At 80% weighted confidence it is being counted as $200,000 of forecast against a date that already passed, which corrupts the forecast every day it stays un-dated.",
    tldr: "Have the owner confirm the deal is still live and set a realistic new close date now.",
  };
}

function seedActiveGoal(name, statement, target, withCheckIn) {
  const cfg = highValueGoalConfig();
  const goal = {
    id: nid("goal"),
    name,
    statement,
    status: "active",
    workflowIds: ["wf-pipeline-health"],
    progress: CALIBRATION_STEPS.length,
    ...cfg,
    questions: [],
    answers: {},
    checkIns: [],
    notes: [],
    target,
    createdAt: Date.now(),
  };
  if (withCheckIn) {
    const rec = makeRecommendation();
    goal.checkIns = [{
      id: nid("ci"),
      at: "Just now",
      flaggedCount: 1,
      summary:
        "1 deal flagged: your entire open high-value pipeline is a single $250,000 deal whose close date is 211 days overdue. Have its owner confirm with the buyer whether it's still live and set a realistic new close date now.",
      recommendations: [rec],
    }];
  }
  return goal;
}

const goals = [
  (() => {
    const g = seedActiveGoal("Deal tracking v2", "Flag every high-value deal — amount > $25,000 (each flagged deal is one tracked recommendation to actively work)", "$25K", true);
    return g;
  })(),
  (() => {
    const g = seedActiveGoal("Risk deal tracking", "Flag every at-risk high-value deal so each one gets actively worked", "$25K", true);
    g.name = "Risk deal tracking";
    return g;
  })(),
  {
    id: nid("goal"),
    name: "Improve our MQL-to-SQL conversion rate to 40%.",
    statement: "Improve our MQL-to-SQL conversion rate to 40%.",
    status: "calibrating",
    workflowIds: ["wf-pipeline-health"],
    progress: 1,
    targets: [], conditions: [], moves: [],
    questions: [], answers: {}, checkIns: [], notes: [],
    createdAt: Date.now(),
  },
];

// Kick the seeded calibrating goal forward so it has somewhere to go.
startCalibration(goals.find((g) => g.status === "calibrating"));

// ── API ──
// Internal live reference (mutations operate on this).
function find(id) {
  return goals.find((g) => g.id === id) || null;
}
// Serializable clone for reads, so react-query sees a new reference each poll
// (the live object is mutated in place by timers/mutations).
function clone(g) {
  if (!g) return null;
  const { timers, ...rest } = g;
  return JSON.parse(JSON.stringify(rest));
}

export function listGoals() {
  return goals.map((g) => summarize(g));
}
export function getGoal(id) {
  return clone(find(id));
}

// Cross-goal "needs attention" feed — every open act-now recommendation, with
// the goal it belongs to, so the home can be a command center.
export function attentionFeed() {
  const items = [];
  for (const g of goals) {
    const last = g.checkIns[0];
    if (!last) continue;
    for (const rec of last.recommendations) {
      if (rec.severity === "act-now" && rec.status === "open") {
        items.push({
          goalId: g.id,
          goalName: g.name,
          recId: rec.id,
          tldr: rec.tldr,
          title: rec.title,
          groupLabel: rec.groupLabel,
          at: last.at,
        });
      }
    }
  }
  return { items };
}
export function getConfig() {
  return { ...config };
}
export function saveConfig(patch) {
  Object.assign(config, patch || {});
  return { ...config };
}

function summarize(g) {
  const last = g.checkIns[0];
  const actNow = last ? last.recommendations.filter((r) => r.severity === "act-now" && r.status === "open").length : 0;
  const health = g.status !== "active" ? "setup" : actNow > 0 ? "attention" : "ontrack";
  return {
    id: g.id,
    name: g.name,
    statement: g.statement,
    status: g.status,
    health,
    targetSummary: g.targets?.[0]?.target || null,
    workflowCount: g.workflowIds.length,
    recommendationCount: last ? last.recommendations.length : 0,
    actNow,
    flaggedCount: last?.flaggedCount || 0,
    lastCheckIn: last?.at || null,
  };
}

export function createGoal({ statement, workflowIds }) {
  const goal = {
    id: nid("goal"),
    name: statement?.slice(0, 60) || "New goal",
    statement: statement || "",
    status: "calibrating",
    workflowIds: workflowIds || [],
    progress: 0,
    targets: [], conditions: [], moves: [],
    questions: [], answers: {}, checkIns: [], notes: [],
    createdAt: Date.now(),
  };
  goals.unshift(goal);
  startCalibration(goal);
  return goal;
}

// Advance the calibration checklist on a timer; at the end, move to decisions.
function startCalibration(goal) {
  if (!goal) return;
  goal.timers = goal.timers || [];
  const advance = (to, ms) => goal.timers.push(setTimeout(() => { goal.progress = to; }, ms));
  // workflows(1) → history(2) → targets(3) → conditions(4) → moves(5)
  advance(1, 600);
  advance(2, 1600);
  advance(3, 2900);
  advance(4, 4200);
  advance(5, 5500);
  goal.timers.push(setTimeout(() => {
    Object.assign(goal, highValueGoalConfig());
    goal.questions = defaultQuestions();
    goal.status = "decisions";
  }, 6800));
}

export function answerGoal(id, answers) {
  const g = find(id);
  if (!g) return null;
  g.answers = { ...g.answers, ...answers };
  g.status = "review";
  return g;
}

export function adjustGoal(id, text) {
  const g = find(id);
  if (!g) return null;
  // Naive mock: if the user asks to remove something, drop the last move.
  if (/remove|delete|drop/i.test(text) && g.moves.length > 1) {
    const removed = g.moves.pop();
    return { goal: g, reply: `Removed "${removed.label}". ${g.moves.length} moves left. Targets and conditions are unchanged.` };
  }
  return { goal: g, reply: "Got it — noted. Tell me a threshold or scope to change (e.g. “track $1M instead of $1.5M”) and I'll update it." };
}

export function saveGoal(id, name) {
  const g = find(id);
  if (!g) return null;
  if (name) g.name = name;
  g.status = "active";
  return g;
}

export function runCheckIn(id) {
  const g = find(id);
  if (!g) return null;
  const rec = makeRecommendation();
  const ci = {
    id: nid("ci"),
    at: "Just now",
    flaggedCount: 1,
    summary:
      "1 deal flagged: your entire open high-value pipeline is a single $250,000 deal whose close date is 211 days overdue. Have its owner confirm with the buyer whether it's still live and set a realistic new close date now.",
    recommendations: [rec],
  };
  // mark a couple of conditions as fired
  g.conditions.forEach((c, i) => { if (i >= g.conditions.length - 2) { c.state = "fired"; c.count = 1; } });
  g.checkIns.unshift(ci);
  return g;
}

export function actOnRecommendation(id, recId, action, payload) {
  const g = find(id);
  if (!g) return null;
  for (const ci of g.checkIns) {
    const rec = ci.recommendations.find((r) => r.id === recId);
    if (rec) {
      rec.status = action; // acted | rejected | snoozed
      if (payload?.note) rec.actionNote = payload.note;
      break;
    }
  }
  return g;
}

export function addNote(id, text) {
  const g = find(id);
  if (!g) return null;
  g.notes.unshift({ id: nid("note"), text, at: "Just now" });
  return g;
}
