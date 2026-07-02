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
  { id: "wf-rev-snapshot", name: "Daily Revenue Snapshot", schedule: "Daily · 6:00 AM", lastRun: "last run 3h ago" },
  { id: "wf-cpl-monitor", name: "Paid Media CPL Monitor", schedule: "Weekly · Mon", lastRun: "last run 2d ago" },
  { id: "wf-churn-signals", name: "Account Churn Signals", schedule: "On data sync", lastRun: "last run 6h ago" },
  { id: "wf-ssl-expiry", name: "Expiring SSL Certificates", schedule: "Daily · 9:00 AM", lastRun: "last run 11h ago" },
  { id: "wf-deal-hygiene", name: "Pipeline Hygiene — Stale Deals", schedule: "Custom schedule", lastRun: "last run 4d ago" },
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

// A goal typically surfaces several recommendations per check-in — one per
// condition that fired. Each is grounded in a specific deal/number and carries
// an impact estimate so the card grid reads like a real recommendations board.
function makeRecommendations() {
  const base = [
    {
      category: "Stale close date", iconKey: "stale", severity: "act-now", tier: 1, age: "New · day 1",
      title: '"D3 - test 2" close date is 211 days overdue',
      tldr: "Confirm the deal is live and set a realistic new close date.",
      body: '"D3 - test 2" ($250,000, owner 79182818) sits at decisionmakerboughtin with $200,000 weighted (80%). Its close date is ~211 days in the past, so it is effectively un-dated and corrupts the forecast every day it stays open.',
      evidence: "Largest open deal, 211 days overdue — $200K of weighted forecast pinned to a date that already passed.",
      impact: { label: "Forecast exposure", value: "$250K", sub: "211 days overdue" },
      metrics: [
        { label: "Amount", value: "$250K", note: "largest open deal" },
        { label: "Weighted", value: "$200K", note: "80% confidence" },
        { label: "Close date", value: "211 days overdue", note: "2025-11-30" },
        { label: "Stage", value: "decisionmakerboughtin", note: "no change in 30 days" },
      ],
      trigger: "Fires when an open high-value deal (> $20K) has a close date on/before today",
      steps: ["Have the owner confirm with the buyer whether it's still live", "Set a realistic new close date or move it to closed-lost"],
      derivation: [
        "Deal fields pulled from `raw_deals.csv` (497 rows), deduplicated on deal history (CDC).",
        "Overdue = today − `closedate`, giving **211 days** past on this record.",
        "High-value bar (**> $20K**) derived from this account's own amount distribution — no external benchmark.",
        "Verified: stage unchanged for 30 days and weighted still **$200K**, ruling out a record that already closed.",
      ],
    },
    {
      category: "Unowned pipeline", iconKey: "owner", severity: "act-now", tier: 2, age: "New · day 1",
      title: "Northwind Retail ($42K) has no owner",
      tldr: "Assign an owner so this high-value deal gets actively worked.",
      body: "Northwind Retail ($42,000) crossed the high-value bar 6 days ago but has no hubspot_owner_id, so no one is accountable for advancing it. Unowned deals in your history close at less than half the rate of owned ones.",
      evidence: "1 high-value deal, no owner for 6 days — sitting idle in the queue.",
      impact: { label: "At risk", value: "$42K", sub: "no owner · 6 days" },
      metrics: [
        { label: "Amount", value: "$42K", note: "above $20K bar" },
        { label: "Owner", value: "None", note: "6 days unassigned" },
        { label: "Close rate (unowned)", value: "< 0.5×", note: "vs owned deals" },
      ],
      trigger: "Fires when an open high-value deal (> $20K) has an empty hubspot_owner_id",
      steps: ["Assign or reassign an owner", "Confirm the owner has a next step scheduled"],
      derivation: [
        "Open deals pulled from `raw_deals.csv`, filtered on `is_closed = 0`.",
        "Ownership read from `hubspot_owner_id` — empty for **6 days** on this deal.",
        "‘Unowned closes at < 0.5×’ derived from this account's own 90-day win rates — no external benchmark.",
        "Verified: no owner-assignment event in the activity log across the window, isolating a true gap.",
      ],
    },
    {
      category: "Stalled early stage", iconKey: "stuck", severity: "watch", tier: 2, age: "Day 3",
      title: "Acme Logistics ($88K) stalled 34 days early-stage",
      tldr: "Drive the stalled deal to its next stage with a concrete next step.",
      body: "Acme Logistics ($88,000) has been in appointmentscheduled for 34 days with no stage change and weighted pipeline below 0.3× amount — the pattern your history associates with slippage.",
      evidence: "34 days in one stage, weighted well under 0.3× amount.",
      impact: { label: "Slipping", value: "$88K", sub: "34 days, no movement" },
      metrics: [
        { label: "Amount", value: "$88K", note: "" },
        { label: "Days in stage", value: "34", note: "appointmentscheduled" },
        { label: "Weighted", value: "< 0.3×", note: "low stage probability" },
      ],
      trigger: "Fires when a high-value deal's weighted_pipeline < 0.3 × amount",
      steps: ["Book the next customer touch", "Set a concrete next step to advance the stage"],
      derivation: [
        "Stage history from `raw_deals.csv`, deduplicated on deal history (CDC).",
        "Days-in-stage = today − last change on `appointmentscheduled`, giving **34 days**.",
        "The **< 0.3×** slippage band derived from this account's own stage-probability curve.",
        "Verified: no stage change across the 34-day window, ruling out normal progression.",
      ],
    },
    {
      category: "Pipeline concentration", iconKey: "concentration", severity: "watch", tier: 1, age: "Day 5",
      title: "One deal is 82% of open high-value pipeline",
      tldr: "Add coverage so one deal isn't your entire high-value pipeline.",
      body: "One deal makes up 82% of open high-value value. If it slips, the goal misses regardless of everything else — worth building a second and third viable path now.",
      evidence: "Largest single deal = 82% of open high-value pipeline.",
      impact: { label: "Concentration", value: "82%", sub: "1 deal = most value" },
      metrics: [
        { label: "Concentration", value: "82%", note: "largest deal / open book" },
        { label: "Open high-value deals", value: "3", note: "" },
      ],
      trigger: "Fires when the largest single open deal ≥ $250K dominates the open book",
      steps: ["Build a second and third viable path", "Rebalance the queue / add coverage"],
      derivation: [
        "Open high-value book aggregated from `raw_deals.csv` (`amount > $20K`, `is_closed = 0`).",
        "Concentration = largest single `amount` ÷ open high-value total = **82%**.",
        "No external benchmark — measured directly on this account's current open book.",
        "Verified: recomputed across the last 3 runs; the single-deal share held above **80%**.",
      ],
    },
    {
      category: "Approaching threshold", iconKey: "threshold", severity: "watch", tier: 3, age: "Day 5",
      title: "2 deals about to cross the high-value bar",
      tldr: "Nurture two deals about to cross into high-value tracking.",
      body: "Two open deals sit between $18K and $20K — just under the high-value bar. A small push tips them into the tracked set and grows qualified high-value pipeline.",
      evidence: "2 deals at $18K–$20K, one nudge from the threshold.",
      impact: { label: "Upside", value: "+$38K", sub: "2 deals near bar" },
      metrics: [
        { label: "Deals near bar", value: "2", note: "$18K–$20K" },
        { label: "Potential add", value: "+$38K", note: "if both cross" },
      ],
      trigger: "Fires when open deals sit between $10K and the $20K high-value bar",
      steps: ["Prioritize a touch on both deals", "Track whether they cross the bar next run"],
      derivation: [
        "Open deals pulled from `raw_deals.csv`, filtered on `is_closed = 0`.",
        "Near-bar band = `amount` between **$18K and $20K**, just under the high-value cutoff.",
        "The **$20K** cutoff is this account's own high-value bar — not an external benchmark.",
        "Verified: both deals held in-band across the last 2 runs, ruling out one-off spikes.",
      ],
    },
  ];
  return base.map((r) => ({ id: nid("rec"), status: "open", groupLabel: r.category, ...r }));
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
    const recs = makeRecommendations();
    goal.checkIns = [{
      id: nid("ci"),
      at: "Just now",
      flaggedCount: recs.filter((r) => r.severity === "act-now").length,
      summary:
        `${recs.length} recommendations across your high-value pipeline — ${recs.filter((r) => r.severity === "act-now").length} need action now, the rest are worth watching. Start with the stale $250K deal whose close date is 211 days overdue.`,
      recommendations: recs,
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
          category: rec.category || rec.groupLabel,
          iconKey: rec.iconKey || null,
          impact: rec.impact || null,
          severity: rec.severity,
          at: last.at,
        });
      }
    }
  }
  return { items };
}
// Every recommendation across goals — for the Recommendations tab (master list).
export function allRecommendations() {
  const items = [];
  for (const g of goals) {
    const last = g.checkIns[0];
    if (!last) continue;
    for (const rec of last.recommendations) {
      items.push({
        goalId: g.id, goalName: g.name, recId: rec.id,
        title: rec.title, tldr: rec.tldr, category: rec.category || rec.groupLabel,
        severity: rec.severity, status: rec.status, impact: rec.impact || null, age: rec.age || null,
        at: last.at,
      });
    }
  }
  const rank = (r) => (r.status !== "open" ? 2 : r.severity === "act-now" ? 0 : 1);
  return { items: items.sort((a, b) => rank(a) - rank(b)) };
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

// Calibration only loads workflows/history, then pauses for the user's
// decisions. The goal config (targets/conditions/moves) is NOT built yet — that
// happens after the questions are answered (see answerGoal).
function startCalibration(goal) {
  if (!goal) return;
  goal.timers = goal.timers || [];
  goal.progress = 0;
  goal.timers.push(setTimeout(() => {
    goal.questions = defaultQuestions();
    goal.status = "decisions";
  }, 2600));
}

export function answerGoal(id, answers) {
  const g = find(id);
  if (!g) return null;
  g.answers = { ...g.answers, ...answers };
  // Now that the decisions are in, build the config, then walk a short "building"
  // phase (targets → conditions → moves) before landing on review.
  Object.assign(g, highValueGoalConfig());
  g.buildProgress = 0;
  g.status = "building";
  startBuilding(g);
  return g;
}

// Advance the three build sub-steps, then move to review.
function startBuilding(goal) {
  if (!goal) return;
  goal.timers = goal.timers || [];
  const advance = (to, ms) => goal.timers.push(setTimeout(() => { goal.buildProgress = to; }, ms));
  advance(1, 900);   // targets ready
  advance(2, 1900);  // conditions ready
  advance(3, 2900);  // moves ready
  goal.timers.push(setTimeout(() => { goal.status = "review"; }, 3600));
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
  const recs = makeRecommendations();
  const ci = {
    id: nid("ci"),
    at: "Just now",
    flaggedCount: recs.filter((r) => r.severity === "act-now").length,
    summary:
      `${recs.length} recommendations across your high-value pipeline — ${recs.filter((r) => r.severity === "act-now").length} need action now, the rest are worth watching. Start with the stale $250K deal whose close date is 211 days overdue.`,
    recommendations: recs,
  };
  // mark a couple of conditions as fired
  g.conditions.forEach((c, i) => { if (i >= g.conditions.length - 2) { c.state = "fired"; c.count = 1; } });
  g.checkIns.unshift(ci);
  return g;
}

// ── Run history ──
// Token usage per agent/task within a run, so the run-history screen can show
// cost per agent and drill into transcripts. Raw numbers; the UI formats them.
const tok = (input, cacheRead, cacheWrite, out) => ({ input, cacheRead, cacheWrite, out });

function runAgents() {
  return [
    { name: "Analyst", kind: "agent", tokens: tok(222, 1400000, 41200, 27100) },
    { name: "Strategist", kind: "agent", tokens: tok(180, 1300000, 108700, 27200) },
    { name: "Critic", kind: "agent", tokens: tok(168, 784700, 48100, 14500) },
    { name: "Deep diagnosis", via: "Analyst", index: 1, kind: "task", tokens: tok(427, 35800, 9400, 2100) },
    { name: "Deep diagnosis", via: "Analyst", index: 2, kind: "task", tokens: tok(485, 99400, 15000, 7600) },
    { name: "Deep diagnosis", via: "Analyst", index: 3, kind: "task", tokens: tok(554, 183200, 23000, 7800) },
    { name: "Signal scan", via: "Strategist", index: 1, kind: "task", tokens: tok(312, 220400, 18200, 5400) },
    { name: "Signal scan", via: "Strategist", index: 2, kind: "task", tokens: tok(298, 140900, 11700, 4300) },
    { name: "Evidence pull", via: "Critic", index: 1, kind: "task", tokens: tok(341, 96500, 8800, 3600) },
    { name: "Evidence pull", via: "Critic", index: 2, kind: "task", tokens: tok(276, 71200, 6400, 2900) },
    { name: "Threshold check", via: "Analyst", index: 4, kind: "task", tokens: tok(198, 44100, 5200, 1800) },
    { name: "Owner lookup", via: "Strategist", index: 3, kind: "task", tokens: tok(164, 33800, 4100, 1400) },
    { name: "Concentration model", via: "Analyst", index: 5, kind: "task", tokens: tok(389, 128700, 13900, 6100) },
    { name: "Recommendation draft", via: "Strategist", index: 4, kind: "task", tokens: tok(512, 210300, 22400, 9200) },
    { name: "Recommendation review", via: "Critic", index: 3, kind: "task", tokens: tok(233, 88600, 7300, 3100) },
    { name: "Synthesis", via: "Strategist", index: 5, kind: "task", tokens: tok(447, 156800, 19600, 8400) },
  ];
}

export function runHistory(id) {
  const g = find(id);
  if (!g) return null;
  const source = g.checkIns.length ? g.checkIns : [null];
  const runs = source.map((ci, i) => ({
    id: ci?.id || `run-${i}`,
    at: ci && ci.at !== "Just now" ? ci.at : `${1 - i} Jul, 04:${22 - i * 7}`.replace("0 Jul", "30 Jun"),
    status: "success",
    duration: i === 0 ? "40m 30s" : "37m 12s",
    recCount: ci?.recommendations?.length ?? 6,
    sessionId: "57b619356c59464c",
    models: [{ name: "claude-opus-4-8", agents: runAgents() }],
  }));
  return {
    goalName: g.name,
    calibration: { duration: "4m 37s", tokens: tok(234, 430800, 36400, 20700) },
    runs,
  };
}

export function actOnRecommendation(id, recId, action, payload) {
  const g = find(id);
  if (!g) return null;
  for (const ci of g.checkIns) {
    const rec = ci.recommendations.find((r) => r.id === recId);
    if (rec) {
      rec.status = action; // acted | rejected | snoozed
      if (payload?.note) rec.actionNote = payload.note;
      if (action === "snoozed") rec.snoozeLabel = payload?.snooze || "until next run";
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
