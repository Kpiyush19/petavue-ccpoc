// Route table for the mock backend. Each entry matches an HTTP method + URL
// path (regex with capture groups) and returns the response body. Anything not
// matched here falls through to a safe default in adapter.js, so the app never
// crashes on an un-mocked endpoint.

import {
  db, currentUser, newId, TENANT_ID, USER_ID,
  DASH_SESSION_ID, DASH_RECIPE, HARDENED_STEPS,
} from "./db";
import { DASHBOARD_MANIFEST } from "./dashboardAssets";
import { makeFakeJwt } from "./jwt";
import { emit } from "./pusherBus";
import { startRun, executeRun, discardRun, getProgress, getPlanSummary, listActiveRuns, submitClarification } from "./skillRun";
import * as Goals from "./goals";

// ── Verify & Publish: widgets ─────────────────────────────────────────
function getWidgets(sessionId) {
  if (!db.dashboardWidgets[sessionId]) {
    db.dashboardWidgets[sessionId] = Object.values(DASHBOARD_MANIFEST.widgets).map((w) => ({
      id: w.id, file: w.file, name: w.name, verified: false, verified_at: null,
    }));
  }
  return db.dashboardWidgets[sessionId];
}

// ── Verify & Publish: simulated execution + hardening stream ───────────
function makeDiff(step) {
  if (step.id === "step_1") {
    return [
      "@@ recipe step query @@",
      "-WHERE order_date >= DATE '2026-04-01'",
      "+WHERE order_date >= DATE_ADD('quarter', -1, CURRENT_DATE)",
    ].join("\n");
  }
  if (step.id === "step_3") {
    return [
      "@@ recipe step code @@",
      " rev = pd.read_csv('data/revenue_by_month.csv')",
      "+if rev.empty:",
      "+    rev = pd.DataFrame({'revenue': [0]})",
      " kpis = { 'total_revenue': int(rev.revenue.sum()), ... }",
    ].join("\n");
  }
  return "@@ step @@\n- old\n+ new";
}

function streamExec(execSid, skipHardening) {
  const es = db.execSessions[execSid];
  if (!es) return;
  const channel = es.channel;
  const steps = es.recipe.steps || [];
  let t = 650;
  const gap = 360;

  steps.forEach((s, i) => {
    setTimeout(() => {
      es.statuses[s.id] = { status: "success", output_files: s.outputs || [] };
      emit(channel, "step-success", {
        step_id: s.id,
        duration_s: Math.round((0.6 + i * 0.12) * 10) / 10,
        output_files: s.outputs || [],
      });
    }, t);
    t += gap;
  });

  setTimeout(() => {
    es.phase = "executed";
    emit(channel, "all-complete", { success: true, steps_total: steps.length, steps_completed: steps.length });
  }, t);
  t += 600;

  if (skipHardening) {
    es.phase = "done";
    return;
  }

  setTimeout(() => {
    es.phase = "hardening";
    emit(channel, "hardening-started", { total_steps: steps.length, step_ids: steps.map((s) => s.id) });
  }, t);
  t += 450;

  steps.forEach((s) => {
    setTimeout(() => emit(channel, "step-reviewing", { step_id: s.id }), t);
    t += 280;
    setTimeout(() => {
      const hard = HARDENED_STEPS[s.id];
      const status = hard ? "hardened" : "reviewed";
      es.hardening[s.id] = { status, reason: hard ? hard.reason : "" };
      if (hard) {
        emit(channel, "step-diff", { step_id: s.id, field: "code", diff: makeDiff(s), diff_truncated: false });
      }
      emit(channel, "step-hardened", { step_id: s.id, status, reason: hard ? hard.reason : "" });
    }, t);
    t += 280;
  });

  setTimeout(() => {
    es.phase = "done";
    emit(channel, "hardening-complete", { success: true });
  }, t);
}

function syncSteps(es) {
  return (es.recipe.steps || []).map((s) => ({
    id: s.id,
    status: es.statuses[s.id]?.status || "pending",
    output_files: es.statuses[s.id]?.output_files || [],
    skip_reason: null,
    hardening_status: es.hardening[s.id]?.status || "pending",
    hardening_reason: es.hardening[s.id]?.reason || null,
  }));
}

// Grounded follow-up chips answering the latest turn. The first set hydrates on
// load via /recommendations; the second is emitted after a chat reply so the
// chips always follow the most recent message.
const FOLLOWUP_QUESTIONS = [
  { question: "Which at-risk accounts have the largest ARR exposure?", grounded_in: "Top Accounts", grounded_type: "widget" },
  { question: "What's driving the QoQ growth in average deal size?", grounded_in: "Avg Deal Size", grounded_type: "widget" },
  { question: "Summarize the biggest revenue risks for Q2.", grounded_in: "Q2 Revenue Dashboard", grounded_type: "dashboard" },
];
const NEXT_FOLLOWUP_QUESTIONS = [
  { question: "Break new ARR down by segment.", grounded_in: "Revenue analysis", grounded_type: "skill" },
  { question: "Compare this quarter against Q1.", grounded_in: "Q2 Revenue Dashboard", grounded_type: "dashboard" },
  { question: "Add a Q3 revenue forecast.", grounded_in: "Revenue analysis", grounded_type: "skill" },
];

// Tailored answers so clicking a follow-up reads like a real analyst reply,
// not a canned stub. Keyed by the question text (lowercased).
const FOLLOWUP_REPLIES = {
  "which at-risk accounts have the largest arr exposure?":
    "Three accounts carry most of the at-risk ARR: Northwind ($420K, renews in 28 days with no exec sponsor), Globex ($310K, usage down 22% QoQ), and Initech ($180K, two open escalations). That's $910K combined, about 12% of the renewing book. Want me to add an at-risk watchlist to the dashboard?",
  "what's driving the qoq growth in average deal size?":
    "Average deal size went from $48K to $61K (+27% QoQ). The lift is almost all Enterprise: multi-year contracts grew from 18% to 31% of new bookings, and the Platform add-on attached to 40% of those deals. SMB deal size was roughly flat. Want me to break this out by segment?",
  "summarize the biggest revenue risks for q2.":
    "Top Q2 risks: (1) $910K of renewing ARR is flagged at-risk, concentrated in 3 accounts; (2) net revenue retention slipped to 104% from 111% as expansion slowed; (3) pipeline coverage is 2.4x against a 3x target. On the upside, new-logo ARR is pacing 8% ahead of plan. Want this as a risk-summary widget?",
  "break new arr down by segment.":
    "New ARR by segment this quarter: Enterprise $1.9M (54%), Mid-Market $1.1M (31%), SMB $530K (15%). Enterprise grew fastest at +34% QoQ on larger multi-year deals, while SMB was flat. I've added a \"New ARR by Segment\" breakdown to the dashboard.",
  "compare this quarter against q1.":
    "Q2 vs Q1: revenue $7.4M vs $6.8M (+9%), new ARR $3.5M vs $3.1M (+13%), average deal size $61K vs $52K (+17%), but NRR dipped to 104% from 109%. Growth is coming from new business and larger deals, slightly offset by softer expansion. I've added a quarter-over-quarter comparison view.",
  "add a q3 revenue forecast.":
    "Added a Q3 forecast widget. Based on current pipeline (2.4x coverage), historical win rates, and committed renewals, Q3 projects to ~$8.1M (range $7.6M–$8.6M). The biggest swing factor is the $910K of at-risk renewals: closing those keeps you near the top of the range.",
};

// Per-session "code version" — bumped whenever the user sends a chat message so
// dashboard-info's code_hash changes, letting the agentic review detect edits.
const codeVersions = {};
export function bumpCodeVersion(sessionId) {
  codeVersions[sessionId] = (codeVersions[sessionId] || 1) + 1;
}
export function codeHashFor(sessionId) {
  return `code-${sessionId}-v${codeVersions[sessionId] || 1}`;
}

// Applying the agentic review's own accepted fixes back to the session is NOT a
// new code change (those fixes came from the review), so it must not bump the
// version — otherwise reopening a just-published dashboard would wrongly think
// the code changed and re-prompt for review instead of "No code change detected".
const REVIEW_SYNC_MARKER = /reviewed fixes from the agentic review/i;

// Sage (Beta) — read-only analytics chat on a published dashboard. Answers are
// grounded in the demo dashboard's numbers; it never edits the dashboard.
function sageReply(userText) {
  const t = (userText || "").toLowerCase();
  if (/risk|at.?risk|account|churn/.test(t))
    return "Two accounts are flagged at-risk: Globex Corp ($301K ARR, usage down 22% QoQ) and Umbrella Inc ($198K). That's ~$499K combined, about 10% of the top-5 book. Northwind ($412K) and Contoso ($388K) are both expanding.";
  if (/grow|qoq|trend|month|revenue/.test(t))
    return "Revenue is up 14.2% QoQ to $4.82M, with the strongest months in June and September. New ARR rose 9.6% to $1.13M, led by Enterprise deals.";
  if (/win.?rate|conversion|deal/.test(t))
    return "Win rate is 27.4%, down 1.8 pts QoQ, the only headline KPI trending down. Avg deal size is up 5.1% to $38.6K, so deals are getting larger but taking longer to close.";
  if (/summary|overview|how.*doing|tl;?dr|highlight/.test(t))
    return "Q2 at a glance: $4.82M revenue (+14.2% QoQ), $1.13M new ARR (+9.6%), win rate 27.4% (down 1.8 pts), avg deal $38.6K. Northwind and Contoso are expanding; Globex and Umbrella are at-risk.";
  return "From this dashboard: total revenue $4.82M (+14.2% QoQ), new ARR $1.13M, win rate 27.4%, avg deal $38.6K. Ask me about revenue trends, at-risk accounts, or win rate and I'll break it down.";
}

// Open (or resume) a Sage chat session for a dashboard, seeding a welcome turn.
function startSageChat(sid) {
  if (!db.history[sid] || db.history[sid].length === 0) {
    db.history[sid] = [{ type: "assistant", text: "Hi, I'm Sage. Ask me anything about this dashboard: revenue trends, at-risk accounts, win rate, and more.", timestamp: Date.now() }];
  }
  return { session_id: sid };
}

function simulateAgentReply(sessionId, userText) {
  const isSage = String(sessionId).startsWith("sage-");
  const isReviewSync = REVIEW_SYNC_MARKER.test(userText || "");
  if (!isSage && !isReviewSync) {
    bumpCodeVersion(sessionId);
  }
  const channel = `session-${sessionId}`;
  const followupReply = FOLLOWUP_REPLIES[(userText || "").trim().toLowerCase()];
  const reply = isSage
    ? sageReply(userText)
    : isReviewSync
    ? "Done. I've applied the reviewed adjustments to your dashboard so it stays accurate on every scheduled refresh."
    : followupReply ||
      "Done. I've updated your dashboard and re-ran the queries against the latest data. Let me know if you'd like any other changes.";
  const words = reply.split(" ");
  let i = 0;
  const tick = () => {
    if (i < words.length) {
      emit(channel, "agent-event", { type: "text", content: (i === 0 ? "" : " ") + words[i] });
      i += 1;
      setTimeout(tick, 30);
    } else {
      emit(channel, "agent-event", { type: "done", context_tokens: 26400, turn_count: 3 });
      // Fresh follow-ups for the turn we just answered — delayed so the
      // "Related" loading skeleton has a clear moment to shimmer first.
      setTimeout(() => emit(channel, "agent-event", { type: "suggested-questions", questions: NEXT_FOLLOWUP_QUESTIONS }), 3500);
    }
  };
  setTimeout(tick, 250);
}

const handlers = [
  // ── Petavue auth / user ────────────────────────────────────────────
  {
    method: "POST",
    pattern: /\/api\/v1\/auth\/(login|google-login)$/,
    handler: () => ({
      access_token: makeFakeJwt({ userId: USER_ID, tenantId: TENANT_ID, userRole: "admin", email: currentUser.email }),
      email: currentUser.email,
      isSelfServeUser: false,
      isSelfServeTCAccepted: true,
    }),
  },
  { method: "POST", pattern: /\/api\/v1\/auth\/logout$/, handler: () => ({ success: true }) },
  { method: "GET", pattern: /\/api\/v1\/tenant\/users\/me$/, handler: () => currentUser },
  { method: "POST", pattern: /\/api\/v1\/tenant\/users$/, handler: () => ({ users: [currentUser], total: 1 }) },

  // ── Sessions ───────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/sessions$/, handler: () => ({ sessions: db.sessions }) },
  {
    method: "POST",
    pattern: /\/api\/sessions$/,
    handler: ({ body }) => {
      const sid = newId("sess");
      const isSkillRun = !!body?.skill_id;
      const session = {
        session_id: sid, name: isSkillRun ? "Skill run" : "New Session",
        session_type: isSkillRun ? "skill_run" : "regular", status: "active",
        skill_id: body?.skill_id || null,
        provider: "anthropic", dashboard_id: body?.dashboard_id || null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        turn_count: 0, total_tokens: 0, context_tokens: 0, agent_running: false,
      };
      db.sessions.unshift(session);
      db.history[sid] = [];
      if (isSkillRun) startRun(session, body.skill_id);
      return { session };
    },
  },

  // ── Goals ──────────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/goals\/workflows$/, handler: () => ({ workflows: Goals.GOAL_WORKFLOWS }) },
  { method: "GET", pattern: /\/api\/goals\/config$/, handler: () => Goals.getConfig() },
  { method: "PUT", pattern: /\/api\/goals\/config$/, handler: ({ body }) => Goals.saveConfig(body) },
  { method: "GET", pattern: /\/api\/goals\/attention$/, handler: () => Goals.attentionFeed() },
  { method: "GET", pattern: /\/api\/goals\/recommendations$/, handler: () => Goals.allRecommendations() },
  { method: "GET", pattern: /\/api\/goals$/, handler: () => ({ goals: Goals.listGoals() }) },
  { method: "POST", pattern: /\/api\/goals$/, handler: ({ body }) => ({ goal: Goals.createGoal(body || {}) }) },
  { method: "GET", pattern: /\/api\/goals\/([^/]+)$/, handler: ({ params }) => Goals.getGoal(params[0]) || { detail: "not found" } },
  { method: "DELETE", pattern: /\/api\/goals\/([^/]+)$/, handler: ({ params }) => Goals.deleteGoal(params[0]) },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/answer$/, handler: ({ params, body }) => Goals.answerGoal(params[0], body?.answers || {}) },
  { method: "POST", pattern: /\/api\/goals\/sage$/, handler: ({ body }) => Goals.sageChat(body?.text || "") },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/sage$/, handler: ({ params, body }) => Goals.sageChatGoal(params[0], body?.text || "") },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/adjust$/, handler: ({ params, body }) => Goals.adjustGoal(params[0], body?.text || "") },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/save$/, handler: ({ params, body }) => ({ goal: Goals.saveGoal(params[0], body?.name) }) },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/check-in$/, handler: ({ params }) => Goals.runCheckIn(params[0]) },
  { method: "GET", pattern: /\/api\/goals\/([^/]+)\/runs$/, handler: ({ params }) => Goals.runHistory(params[0]) || { detail: "not found" } },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/recommendations\/([^/]+)\/act$/, handler: ({ params, body }) => Goals.actOnRecommendation(params[0], params[1], body?.action, body) },
  { method: "POST", pattern: /\/api\/goals\/([^/]+)\/notes$/, handler: ({ params, body }) => Goals.addNote(params[0], body?.text || "") },

  // ── Skills v2 run lifecycle ────────────────────────────────────────
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/skill\/progress$/, handler: ({ params }) => getProgress(params[0]) || { step_statuses: {}, clarifications_pending: [], verification_round: 0, finding_count: 0, disclosure_summary: null, blocked_summary: null, key_choices: [] } },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/skill\/plan-summary$/, handler: ({ params }) => getPlanSummary(params[0]) || {} },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/skill\/execute$/, handler: ({ params }) => { executeRun(params[0]); return { ok: true }; } },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/skill\/discard$/, handler: ({ params }) => { discardRun(params[0]); return { ok: true }; } },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/skill\/handoff$/, handler: () => ({ ok: true }) },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/skill\/clarify$/, handler: ({ params, body }) => { submitClarification(params[0], body?.answers); return { ok: true }; } },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/history$/, handler: ({ params }) => ({ messages: db.history[params[0]] || [] }) },
  // Grounded follow-up chips for the latest turn (shown under the last message).
  // Slight delay so the "Related" loading skeleton renders before they resolve.
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/recommendations$/, handler: async () => { await new Promise((r) => setTimeout(r, 3500)); return { questions: FOLLOWUP_QUESTIONS }; } },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/files$/, handler: ({ params }) => ({ files: db.fileTree[params[0]] || [], tree: db.fileTree[params[0]] || [] }) },

  // ── Verify & Publish: dashboard detection + widgets ────────────────
  {
    method: "GET",
    pattern: /\/api\/sessions\/([^/]+)\/dashboard-info$/,
    handler: ({ params }) => {
      const widgets = getWidgets(params[0]);
      return { is_react_dashboard: true, title: DASHBOARD_MANIFEST.title, widget_count: widgets.length, widgets, code_hash: codeHashFor(params[0]) };
    },
  },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/published-check$/, handler: () => ({ published: false }) },
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/widgets\/([^/]+)\/verify$/,
    handler: ({ params, body }) => {
      const widgets = getWidgets(params[0]);
      const w = widgets.find((x) => x.id === params[1]);
      const verified = body?.verified !== false;
      if (w) { w.verified = verified; w.verified_at = verified ? new Date().toISOString() : null; }
      return w || { id: params[1], verified, verified_at: verified ? new Date().toISOString() : null };
    },
  },
  {
    method: "GET",
    pattern: /\/api\/sessions\/([^/]+)\/widget-lineage$/,
    handler: () => ({
      widget_id: "revenue_trend",
      widget_file: "widgets/revenue_trend.jsx",
      main_chat_edits_count: 0,
      // LineagePanel reads `chain` (steps) + `also_feeds_into` (sibling widgets).
      chain: [
        {
          id: "step_1", tool: "query_athena", status: "success",
          summary: "Pull monthly revenue", llm_title: "Pull monthly revenue",
          llm_description: "- Aggregate order amounts by month\n- Limit to the current quarter with a dynamic date window",
          code_preview: "SELECT month, SUM(amount) AS revenue\nFROM ns_demo_orders\nGROUP BY month\nORDER BY month",
        },
        {
          id: "step_4", tool: "write_file", status: "success",
          summary: "Build the revenue chart", llm_title: "Build the revenue chart",
          llm_description: "- Render a bar per month from the query results\n- Reads from data/revenue_by_month.csv",
          code_preview: "export default function RevenueTrend({ data }) {\n  /* bar chart */\n}",
        },
      ],
      also_feeds_into: [
        { widget_name: "Scoreboard", file_path: "widgets/scoreboard.jsx" },
      ],
    }),
  },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/widget-window-preview$/, handler: () => ({ messages: [] }) },

  // ── Verify & Publish: recipe extraction ────────────────────────────
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/recipe$/,
    handler: ({ params }) => {
      const recipe = db.recipesBySession[params[0]] || DASH_RECIPE;
      db.recipesBySession[params[0]] = recipe;
      return { recipe, session_id: params[0], code_to_nl: true, step_graph: false };
    },
  },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/recipe\/verify\/draft$/, handler: () => ({ has_draft: false }) },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/recipe\/verify\/(run-all|draft-update)$/, handler: () => ({ ok: true }) },
  { method: "GET", pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/draft$/, handler: () => ({ has_draft: false }) },

  // ── Verify & Publish: exec init / start / sync / cancel ────────────
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/init$/,
    handler: ({ params, body }) => {
      const execSid = newId("exec");
      const recipe = body?.recipe || db.recipesBySession[params[0]] || DASH_RECIPE;
      db.execSessions[execSid] = {
        sessionId: params[0], recipe, channel: `recipe-exec-${execSid}`,
        statuses: {}, hardening: {}, phase: "ready",
      };
      return { exec_session_id: execSid, channel: `recipe-exec-${execSid}`, status: "ready", total_steps: recipe.steps?.length || 0 };
    },
  },
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/start$/,
    handler: ({ body }) => {
      const execSid = body?.exec_session_id;
      const es = db.execSessions[execSid];
      const skipHardening = body?.skip_hardening === true;
      if (es) {
        es.statuses = {}; es.hardening = {}; es.phase = "executing";
        streamExec(execSid, skipHardening);
      }
      return { status: "running", channel: es ? es.channel : `recipe-exec-${execSid}`, phase: "executing" };
    },
  },
  {
    method: "GET",
    pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/sync$/,
    handler: ({ query }) => {
      const es = db.execSessions[query.exec_session_id];
      if (!es) return { status: "unknown", steps: [], diffs: {} };
      const diffs = {};
      for (const [sid, h] of Object.entries(es.hardening)) {
        if (h.status === "hardened") {
          const step = es.recipe.steps.find((s) => s.id === sid);
          if (step) diffs[sid] = makeDiff(step);
        }
      }
      const status = es.phase === "hardening" ? "hardening" : es.phase === "done" ? "success" : "executing";
      return { status, steps: syncSteps(es), diffs };
    },
  },
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/cancel$/,
    handler: ({ body }) => {
      const es = db.execSessions[body?.exec_session_id];
      if (es) emit(es.channel, "agent-cancelled", {});
      return { ok: true };
    },
  },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/recipe\/exec\/feedback$/, handler: () => ({ ok: true }) },

  // ── Verify & Publish: AI preview (agent_memo) ──────────────────────
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/ai-preview\/start$/,
    handler: ({ params, body }) => {
      const channel = `session-${params[0]}-aipreview`;
      setTimeout(() => emit(channel, "agent-event", { type: "done" }), 1200);
      return { preview_session_id: newId("aiprev"), channel, memo_path: `agent_memo/${body?.filename || "memo"}.md` };
    },
  },
  {
    method: "GET",
    pattern: /\/api\/sessions\/([^/]+)\/ai-preview\/result$/,
    handler: () => ({
      has_result: true,
      content: "# Q2 Revenue Summary\n\nRevenue reached **$4.82M**, up 14.2% QoQ. Enterprise drove most of the gain; two top accounts are flagged at-risk.\n\n## Highlights\n- New ARR: $1.13M\n- Win rate: 27.4%\n",
    }),
  },
  { method: "DELETE", pattern: /\/api\/sessions\/([^/]+)\/ai-preview$/, handler: () => ({ ok: true }) },

  // ── Sessions: chat / misc ──────────────────────────────────────────
  {
    method: "POST",
    pattern: /\/api\/sessions\/([^/]+)\/chat$/,
    handler: ({ params, body }) => {
      const sid = params[0];
      (db.history[sid] ||= []).push({ type: "user", text: body?.message || "", timestamp: Date.now() });
      simulateAgentReply(sid, body?.message || "");
      return { ok: true };
    },
  },
  { method: "POST", pattern: /\/api\/sessions\/([^/]+)\/(cancel|upload|slack-test|skills\/sync)$/, handler: ({ match }) => (match[2] === "upload" ? { uploads: [] } : { ok: true, pushed: 0, pulled: 0 }) },
  {
    method: "PATCH",
    pattern: /\/api\/sessions\/([^/]+)$/,
    handler: ({ params, body }) => {
      const s = db.sessions.find((x) => x.session_id === params[0]);
      if (s && body?.name) s.name = body.name;
      return s || { ok: true };
    },
  },
  { method: "DELETE", pattern: /\/api\/sessions\/([^/]+)\/messages\/last$/, handler: () => ({ ok: true }) },
  {
    method: "DELETE",
    pattern: /\/api\/sessions\/([^/]+)$/,
    handler: ({ params }) => {
      db.sessions = db.sessions.filter((x) => x.session_id !== params[0]);
      return { archive: { archived: 0 } };
    },
  },
  {
    method: "GET",
    pattern: /\/api\/sessions\/([^/]+)$/,
    handler: ({ params }) => {
      const s = db.sessions.find((x) => x.session_id === params[0]);
      return s || { session_id: params[0], name: "Session", session_type: "regular", status: "active" };
    },
  },

  // ── Workflows ──────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/workflows\/check$/, handler: () => ({ exists: db.linkedWorkflows.length > 0, workflows: db.linkedWorkflows }) },
  // Sage (Beta) chat — open a read-only analytics chat for a dashboard.
  { method: "POST", pattern: /\/api\/workflows\/([^/]+)\/chat$/, handler: ({ params }) => startSageChat(`sage-wf-${params[0]}`) },
  { method: "POST", pattern: /\/api\/published\/([^/]+)\/chat$/, handler: ({ params }) => startSageChat(`sage-pub-${params[0]}`) },
  { method: "GET", pattern: /\/api\/workflows\/dashboards\/all$/, handler: () => ({ dashboards: db.dashboards }) },
  { method: "GET", pattern: /\/api\/workflows\/dashboards\/([^/]+)\/explanation$/, handler: ({ params }) => {
    const toolType = (t) => (t === "query_athena" ? "athena_query" : t === "execute_code" ? "python_code" : "write_file");
    return {
      workflow_name: (db.dashboards.find((d) => d.dashboard_id === params[0]) || {}).name || "Dashboard",
      explanation: {
        groups: DASH_RECIPE.groups.map((g) => ({ group_title: g.name, summary: g.summary, step_ids: g.steps })),
        steps: Object.fromEntries(DASH_RECIPE.steps.map((s) => [s.id, { title: s.summary.title, explanation: s.summary.explanation, card: s.summary.card }])),
      },
      block_meta: Object.fromEntries(DASH_RECIPE.steps.map((s) => {
        const type = toolType(s.tool);
        return [s.id, { type, label: s.summary.title, code: s.code, code_language: type === "athena_query" ? "sql" : "python" }];
      })),
    };
  } },
  { method: "PUT", pattern: /\/api\/workflows\/dashboards\/([^/]+)$/, handler: ({ params, body }) => { const d = db.dashboards.find((x) => x.dashboard_id === params[0]); if (d) { if (body?.name) { d.name = body.name; d.title = body.name; } if (typeof body?.shared === "boolean") d.shared = body.shared; } return d || { ok: true }; } },
  { method: "DELETE", pattern: /\/api\/workflows\/dashboards\/([^/]+)$/, handler: ({ params }) => { db.dashboards = db.dashboards.filter((x) => x.dashboard_id !== params[0]); return { ok: true }; } },
  { method: "GET", pattern: /\/api\/workflows\/dashboards\/([^/]+)$/, handler: ({ params }) => db.dashboards.find((d) => d.dashboard_id === params[0]) || db.dashboards[0] },
  {
    method: "GET",
    pattern: /\/api\/workflows\/([^/]+)\/publish-status$/,
    handler: ({ params }) => {
      const pub = db.publishedWorkflows[params[0]];
      return pub ? { publish_complete: true, dashboard_id: pub.dashboard_id, dashboard_url: `/dashboards/${pub.dashboard_id}` } : { publish_complete: false };
    },
  },
  { method: "GET", pattern: /\/api\/workflows\/([^/]+)\/runs$/, handler: ({ params }) => {
    const wf = db.workflows.find((w) => w.workflow_id === params[0]);
    const blocks = wf?.blocks || [];
    if (!blocks.length) return { runs: [] };
    const iso = (mins) => new Date(Date.now() - mins * 60000).toISOString();
    const mkRun = (runId, mins, failTail) => {
      const block_results = blocks.map((b, i) => ({
        block_id: b.id,
        label: b.label,
        status: failTail && i === blocks.length - 1 ? "failed" : "success",
        duration_ms: 220 + i * 180,
      }));
      const total = block_results.reduce((s, r) => s + r.duration_ms, 0);
      return {
        run_id: runId,
        status: failTail ? "failed" : "success",
        trigger_type: wf?.trigger?.type === "cron" ? "Scheduled" : "Manual",
        started_at: iso(mins),
        total_duration_ms: total,
        total_llm_tokens: { input: 1840, output: 320 },
        error: failTail ? "Slack post failed: channel not found (#revenue)" : null,
        block_results,
      };
    };
    return { runs: [mkRun("run-3", 200, false), mkRun("run-2", 1640, false), mkRun("run-1", 3080, true)] };
  } },
  { method: "GET", pattern: /\/api\/workflows$/, handler: () => ({ workflows: db.workflows }) },
  { method: "GET", pattern: /\/api\/workflows\/([^/]+)$/, handler: ({ params }) => db.workflows.find((w) => w.workflow_id === params[0]) || db.workflows[0] },
  {
    method: "POST",
    pattern: /\/api\/workflows$/,
    handler: ({ body }) => {
      const isUpdate = !!body?.workflow_id;
      const wfId = isUpdate ? body.workflow_id : newId("wf");
      const dashId = newId("dash");
      const name = body?.name || "Untitled Dashboard";
      if (!isUpdate) {
        db.workflows.unshift({
          _id: wfId, workflow_id: wfId, name, status: "active", shared: false,
          auto_refresh: body?.auto_refresh !== false, created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(), blocks: body?.extra_blocks || [], owner_id: USER_ID,
        });
        db.dashboards.unshift({
          _id: dashId, dashboard_id: dashId, id: dashId, name, title: name, shared: false,
          status: "published", source: "workflow", workflow_id: wfId, owner_id: USER_ID,
          target_file: "output/dashboard/revenue_dashboard.html", tenant_timezone: "UTC",
          latest_run: { status: "success", refreshed_at: new Date().toISOString() },
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), widgets: [],
        });
      }
      db.publishedWorkflows[wfId] = { dashboard_id: dashId };
      // Background "publish complete" notification.
      setTimeout(() => emit(`workflow-${wfId}`, "workflow-published", { dashboard_id: dashId }), 1400);
      return { workflow_id: wfId, name, status: "active", updated: isUpdate, dashboard_id: dashId };
    },
  },

  // ── Skills ─────────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/skills$/, handler: () => ({ skills: db.skills }) },
  { method: "GET", pattern: /\/api\/skills\/([^/]+)$/, handler: ({ params }) => db.skills.find((s) => s.id === params[0]) || db.skills[0] },
  { method: "GET", pattern: /\/api\/skill-runs\/active$/, handler: () => ({ active_runs: listActiveRuns() }) },

  // ── Schedules ──────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/schedules$/, handler: () => ({ schedules: db.schedules }) },
  { method: "GET", pattern: /\/api\/schedules\/([^/]+)$/, handler: ({ params }) => db.schedules.find((s) => s.schedule_id === params[0]) || db.schedules[0] },

  // ── Feature flags ──────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/(users\/me|tenant)\/feature-flags$/, handler: () => ({ flags: {}, feature_flags: {} }) },

  // ── Folders (summary destination) ──────────────────────────────────
  { method: "GET", pattern: /\/api\/folders$/, handler: () => ({ folders: ["agent_memo", "reports", "weekly-summaries"] }) },

  // ── Slack ──────────────────────────────────────────────────────────
  { method: "GET", pattern: /\/api\/slack\/connection$/, handler: () => ({ connected: true }) },
  {
    method: "GET",
    pattern: /\/api\/slack\/channels$/,
    handler: () => ({ channels: [{ id: "C1", name: "dashboards" }, { id: "C2", name: "revenue" }, { id: "C3", name: "gtm-leadership" }], next_cursor: null }),
  },
  { method: "GET", pattern: /\/api\/slack\/users$/, handler: () => ({ users: [{ id: "U1", name: "Demo User" }], next_cursor: null }) },
  { method: "GET", pattern: /\/api\/slack\/configured-alerts$/, handler: () => ({ alerts: [] }) },
];

export default handlers;
