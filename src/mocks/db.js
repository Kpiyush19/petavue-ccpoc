// In-memory fixture store for the mock backend. Mutations (create session,
// rename, delete, etc.) persist for the lifetime of the page so the UI feels
// real. Reloading the page resets everything.

let idCounter = 1000;
export function newId(prefix = "id") {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

const now = Date.now();
const minsAgo = (m) => new Date(now - m * 60000).toISOString();

export const TENANT_ID = "tenant-demo";
export const USER_ID = "user-demo";

export const currentUser = {
  _id: USER_ID,
  userId: USER_ID,
  email: "demo@petavue.com",
  name: "Demo User",
  tenantId: TENANT_ID,
  role: "admin",
  userRole: "admin",
};

// The primary dashboard session the app lands on. Its workspace contains a
// React dashboard so the Verify & Publish flow is immediately accessible.
export const DASH_SESSION_ID = "q2-revenue-dashboard";

// Recipe extracted from the dashboard session — the steps the Verify & Publish
// flow executes and hardens. `card` sections power the "Annotated" view.
export const DASH_RECIPE = {
  version: 3,
  target_file: "output/dashboard/revenue_dashboard.html",
  dashboard_mode: "react",
  steps: [
    {
      id: "step_1",
      tool: "query_athena",
      input: { query: "SELECT month, SUM(amount) AS revenue\nFROM ns_demo_orders\nWHERE order_date >= DATE_ADD('quarter', -1, CURRENT_DATE)\nGROUP BY month\nORDER BY month" },
      code: "SELECT month, SUM(amount) AS revenue\nFROM ns_demo_orders\nWHERE order_date >= DATE_ADD('quarter', -1, CURRENT_DATE)\nGROUP BY month\nORDER BY month",
      status: "completed",
      outputs: ["data/revenue_by_month.csv"],
      summary: { title: "Pull monthly revenue", explanation: "Aggregate order amounts by month for the current quarter.", card: { instructions: ["Sum order {{amount}} grouped by {{month}}", "Limit to the last quarter via a dynamic date window"], conditions: [], outputs: ["data/revenue_by_month.csv"] } },
    },
    {
      id: "step_2",
      tool: "query_athena",
      input: { query: "SELECT account_name, SUM(arr) AS arr, health\nFROM ns_demo_accounts\nGROUP BY account_name, health\nORDER BY arr DESC\nLIMIT 5" },
      code: "SELECT account_name, SUM(arr) AS arr, health\nFROM ns_demo_accounts\nGROUP BY account_name, health\nORDER BY arr DESC\nLIMIT 5",
      status: "completed",
      outputs: ["data/top_accounts.csv"],
      summary: { title: "Rank top accounts by ARR", explanation: "Find the five highest-ARR accounts with their health status.", card: { instructions: ["Sum {{arr}} per account and order descending", "Keep the top 5"], conditions: [], outputs: ["data/top_accounts.csv"] } },
    },
    {
      id: "step_3",
      tool: "execute_code",
      input: { code: "import pandas as pd\nrev = pd.read_csv('data/revenue_by_month.csv')\nkpis = {\n  'total_revenue': int(rev.revenue.sum()),\n  'qoq_growth': 0.142,\n  'win_rate': 0.274,\n}\nimport json; json.dump(kpis, open('data/kpis.json','w'))" },
      code: "import pandas as pd\nrev = pd.read_csv('data/revenue_by_month.csv')\nkpis = {\n  'total_revenue': int(rev.revenue.sum()),\n  'qoq_growth': 0.142,\n  'win_rate': 0.274,\n}\nimport json; json.dump(kpis, open('data/kpis.json','w'))",
      status: "completed",
      outputs: ["data/kpis.json"],
      summary: { title: "Compute headline KPIs", explanation: "Derive total revenue and growth metrics for the scoreboard.", card: { instructions: ["Read the monthly revenue file", "Compute total revenue and growth rates"], conditions: [], outputs: ["data/kpis.json"] } },
    },
    {
      id: "step_4",
      tool: "write_file",
      input: { path: "output/dashboard/widgets/revenue_trend.jsx" },
      code: "export default function RevenueTrend({ data }) { /* bar chart */ }",
      status: "completed",
      outputs: ["output/dashboard/widgets/revenue_trend.jsx"],
      summary: { title: "Build Revenue-by-Month chart", explanation: "Render the monthly revenue bar chart widget.", card: { instructions: ["Render a bar per month from {{revenue_by_month}}"], conditions: [], outputs: ["widgets/revenue_trend.jsx"] } },
    },
    {
      id: "step_5",
      tool: "write_file",
      input: { path: "output/dashboard/widgets/top_accounts.jsx" },
      code: "export default function TopAccounts({ data }) { /* table */ }",
      status: "completed",
      outputs: ["output/dashboard/widgets/top_accounts.jsx"],
      summary: { title: "Build Top-Accounts table", explanation: "Render the top accounts table widget.", card: { instructions: ["Render a row per account from {{top_accounts}}", "Show a health pill per account"], conditions: [], outputs: ["widgets/top_accounts.jsx"] } },
    },
    {
      id: "step_6",
      tool: "write_file",
      input: { path: "output/dashboard/revenue_dashboard.html" },
      code: "<!DOCTYPE html> ... dashboard shell ...",
      status: "completed",
      outputs: ["output/dashboard/revenue_dashboard.html"],
      summary: { title: "Assemble dashboard shell", explanation: "Compose the widgets into the final dashboard page.", card: { instructions: ["Lay out the scoreboard, chart, and table widgets"], conditions: [], outputs: ["output/dashboard/revenue_dashboard.html"] } },
    },
  ],
  groups: [
    { id: "g_1", name: "Source data", steps: ["step_1", "step_2"], summary: "Query revenue and account data" },
    { id: "g_2", name: "Transforms", steps: ["step_3"], summary: "Compute KPIs" },
    { id: "g_3", name: "Widgets", steps: ["step_4", "step_5", "step_6"], summary: "Render widgets and assemble the page" },
  ],
  widget_map: {
    revenue_trend: { steps: ["step_1", "step_4"], widget_file: "widgets/revenue_trend.jsx", data_file: "data/revenue_by_month.csv" },
    top_accounts: { steps: ["step_2", "step_5"], widget_file: "widgets/top_accounts.jsx", data_file: "data/top_accounts.csv" },
    scoreboard: { steps: ["step_3", "step_6"], widget_file: "widgets/scoreboard.jsx", data_file: "data/kpis.json" },
  },
};

// Steps that the hardening pass "adjusts" (vs merely reviews), with the diffs
// shown in the adjustments view.
export const HARDENED_STEPS = {
  step_1: { reason: "Replaced the literal quarter boundary with a dynamic DATE_ADD window so the query stays correct on every refresh." },
  step_3: { reason: "Added a guard so KPI computation handles an empty revenue file without crashing." },
};

export const db = {
  // Runtime registries (populated during the Verify & Publish flow)
  execSessions: {},      // execSessionId -> { sessionId, recipe, channel, statuses, hardening }
  recipesBySession: { [DASH_SESSION_ID]: DASH_RECIPE },
  dashboardWidgets: {},  // sessionId -> [{ id, file, name, verified, verified_at }]
  publishedWorkflows: {},// workflowId -> { dashboard_id }

  sessions: [
    {
      session_id: DASH_SESSION_ID,
      name: "Q2 Revenue Dashboard",
      session_type: "regular",
      status: "active",
      provider: "anthropic",
      dashboard_mode: "react",
      created_at: minsAgo(45),
      updated_at: minsAgo(5),
      last_active_at: minsAgo(5),
      turn_count: 2,
      total_tokens: 26400,
      context_tokens: 26400,
      agent_running: false,
    },
  ],

  // session_id -> file tree (workspace tray)
  fileTree: {
    [DASH_SESSION_ID]: [
      {
        name: "output", path: "output", type: "folder", content_type: "folder",
        children: [
          {
            name: "dashboard", path: "output/dashboard", type: "folder", content_type: "folder",
            children: [
              { name: "revenue_dashboard.html", path: "output/dashboard/revenue_dashboard.html", type: "file", content_type: "html" },
              { name: "manifest.json", path: "output/dashboard/manifest.json", type: "file", content_type: "json" },
              {
                name: "widgets", path: "output/dashboard/widgets", type: "folder", content_type: "folder",
                children: [
                  { name: "scoreboard.jsx", path: "output/dashboard/widgets/scoreboard.jsx", type: "file", content_type: "html" },
                  { name: "revenue_trend.jsx", path: "output/dashboard/widgets/revenue_trend.jsx", type: "file", content_type: "html" },
                  { name: "top_accounts.jsx", path: "output/dashboard/widgets/top_accounts.jsx", type: "file", content_type: "html" },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "data", path: "data", type: "folder", content_type: "folder",
        children: [
          { name: "kpis.json", path: "data/kpis.json", type: "file", content_type: "json" },
          { name: "revenue_by_month.csv", path: "data/revenue_by_month.csv", type: "file", content_type: "csv" },
          { name: "top_accounts.csv", path: "data/top_accounts.csv", type: "file", content_type: "csv" },
        ],
      },
    ],
  },

  // session_id -> history messages
  history: {
    [DASH_SESSION_ID]: [
      { type: "user", text: "Hey — can you build me a dashboard for Q2 revenue? I want to see how we're tracking and which accounts matter most.", timestamp: now - 46 * 60000 },
      {
        type: "assistant",
        text: "Happy to help. I'll pull monthly revenue and your top accounts from the warehouse, compute a few headline KPIs (total revenue, QoQ growth), and assemble a React dashboard you can publish. Let me start by querying the data.",
        timestamp: now - 46 * 60000 + 20000,
      },
      { type: "tool_call", tool: "query_athena", input_summary: "SELECT month, SUM(amount) AS revenue FROM ns_demo_orders … GROUP BY month" },
      { type: "tool_call", tool: "query_athena", input_summary: "SELECT account_name, SUM(arr) AS arr, health FROM ns_demo_accounts … ORDER BY arr DESC LIMIT 5" },
      {
        type: "assistant",
        text: "Revenue is trending up nicely — **$4.82M** for the quarter, **+14.2% QoQ**, with September the strongest month. On the account side, Northwind and Contoso are expanding. A couple of accounts look like they're softening. Do you want me to flag at-risk accounts and add a win-rate metric?",
        timestamp: now - 44 * 60000,
      },
      { type: "user", text: "Yes — flag anything at risk, and add a win-rate KPI to the scoreboard.", timestamp: now - 43 * 60000 },
      {
        type: "assistant",
        text: "Got it. I'll add a **win rate** KPI (27.4% this quarter) and a health flag on each account, then build the widgets and assemble the page.",
        timestamp: now - 43 * 60000 + 15000,
      },
      { type: "tool_call", tool: "execute_code", input_summary: "Compute headline KPIs → data/kpis.json" },
      { type: "tool_call", tool: "write_file", input_summary: "output/dashboard/widgets/revenue_trend.jsx" },
      { type: "tool_call", tool: "write_file", input_summary: "output/dashboard/widgets/top_accounts.jsx" },
      { type: "tool_call", tool: "write_file", input_summary: "output/dashboard/revenue_dashboard.html" },
      {
        type: "assistant",
        text: "Your **Q2 Revenue Dashboard** is ready. It has a scoreboard (total revenue, new ARR, win rate, avg deal size), a revenue-by-month chart, and a top-accounts table with health flags — Globex and Umbrella are marked **at risk**. It's open in the preview panel on the right. When you're happy with it, use **Verify & Publish** to validate every step and schedule automatic refreshes.",
        timestamp: now - 42 * 60000,
      },
      { type: "outputs", outputs: [{ path: "output/dashboard/revenue_dashboard.html", name: "Q2 Revenue Dashboard", type: "html" }] },
    ],
  },

  workflows: [
    {
      _id: "wf-demo-1",
      workflow_id: "wf-demo-1",
      name: "Daily Revenue Snapshot",
      status: "active",
      shared: true,
      auto_refresh: true,
      created_at: minsAgo(5000),
      updated_at: minsAgo(200),
      blocks: [],
      owner_id: USER_ID,
    },
    {
      _id: "wf-demo-2",
      workflow_id: "wf-demo-2",
      name: "Weekly Pipeline Health",
      status: "active",
      shared: false,
      auto_refresh: false,
      created_at: minsAgo(9000),
      updated_at: minsAgo(1200),
      blocks: [],
      owner_id: USER_ID,
    },
  ],

  // Workflows already linked to the dashboard session — surfaced by
  // /api/workflows/check so the "Edit existing workflow" path is demoable.
  // Shape mirrors what PublishView's updateMode-populate effect expects:
  // blocks[] (ai_summarize / send_slack / publish_dashboard) + schedule.
  linkedWorkflows: [
    {
      workflow_id: "wf-q2-weekly",
      name: "Q2 Revenue — Weekly",
      dashboard_name: "Q2 Revenue Dashboard",
      dashboard_id: "dash-demo-1",
      blocks: [
        { type: "publish_dashboard", config: { name: "Q2 Revenue Dashboard", shared: false, include_link: true, message: "" } },
        { type: "ai_summarize", config: { prompt: "Summarize the week's revenue movement and flag at-risk accounts.", output_file: "agent_memo/weekly_summary.md", save_memo: true } },
        { type: "send_slack", config: { channels: ["C2"], dm_users: [], mode: "content_from", content_from: "agent_memo/weekly_summary.md" } },
      ],
      schedule: { type: "custom", cron: "0 9 * * 1", timezone: "America/New_York" },
    },
    {
      workflow_id: "wf-q2-sync",
      name: "Q2 Revenue — On data sync",
      dashboard_name: "Q2 Revenue Dashboard",
      dashboard_id: "dash-demo-1",
      blocks: [
        { type: "publish_dashboard", config: { name: "Q2 Revenue Dashboard", shared: true, include_link: true, message: "" } },
      ],
      schedule: { type: "data_sync" },
    },
  ],

  dashboards: [
    {
      _id: "dash-demo-1",
      dashboard_id: "dash-demo-1",
      id: "dash-demo-1",
      name: "Revenue Overview",
      title: "Revenue Overview",
      shared: true,
      status: "published",
      source: "workflow",
      workflow_id: "wf-demo-1",
      owner_id: USER_ID,
      target_file: "output/dashboard/revenue_dashboard.html",
      tenant_timezone: "UTC",
      latest_run: { status: "success", refreshed_at: minsAgo(200) },
      created_at: minsAgo(5000),
      updated_at: minsAgo(200),
      widgets: [],
    },
    {
      _id: "dash-demo-2",
      dashboard_id: "dash-demo-2",
      id: "dash-demo-2",
      name: "Pipeline Health",
      title: "Pipeline Health",
      shared: false,
      status: "published",
      source: "workflow",
      workflow_id: "wf-demo-2",
      owner_id: USER_ID,
      target_file: "output/dashboard/revenue_dashboard.html",
      tenant_timezone: "UTC",
      latest_run: { status: "success", refreshed_at: minsAgo(1200) },
      created_at: minsAgo(9000),
      updated_at: minsAgo(1200),
      widgets: [],
    },
  ],

  skills: [
    {
      _id: "skill-demo-1",
      id: "skill-demo-1",
      name: "Cohort Retention Analysis",
      description: "Build retention curves by signup cohort.",
      category: "Analytics",
      tier: "global",
      active: true,
      output_type: "dashboard",
    },
    {
      _id: "skill-demo-2",
      id: "skill-demo-2",
      name: "Churn Risk Scoring",
      description: "Score accounts by churn likelihood from usage signals.",
      category: "Predictive",
      tier: "tenant",
      active: true,
      output_type: "report",
    },
  ],

  schedules: [
    {
      schedule_id: "sched-demo-1",
      name: "Daily Revenue Snapshot",
      cron: "0 9 * * *",
      timezone: "America/New_York",
      status: "active",
      enabled: true,
      created_at: minsAgo(5000),
      next_run: minsAgo(-600),
      recent_runs: [],
    },
  ],
};
