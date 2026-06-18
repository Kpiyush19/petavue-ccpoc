// Self-contained dashboard assets served by the mock file-serving layer.
// The dashboard HTML is fully inline (no external scripts/links) so it renders
// inside an iframe via `srcdoc` with no network dependency.

export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Q2 Revenue Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f8fa; color: #1a2233; padding: 24px; }
  .head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
  .head h1 { font-size: 20px; font-weight: 700; }
  .head .sub { font-size: 12px; color: #6b7280; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 14px; }
  .kpi { background: #fff; border: 1px solid #eceef1; border-radius: 12px; padding: 16px; }
  .kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #8b93a1; margin-bottom: 8px; }
  .kpi .val { font-size: 24px; font-weight: 700; }
  .kpi .delta { font-size: 12px; font-weight: 600; margin-top: 4px; }
  .delta.up { color: #16a34a; } .delta.down { color: #dc2626; } .delta.flat { color: #6b7280; }
  .grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 14px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .card { background: #fff; border: 1px solid #eceef1; border-radius: 12px; padding: 18px; }
  .card h3 { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .card .cap { font-size: 11px; color: #8b93a1; margin-bottom: 14px; }
  .bars { display: flex; align-items: flex-end; gap: 12px; height: 180px; padding-top: 10px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
  .bar .col { width: 100%; max-width: 46px; background: linear-gradient(180deg, #6366f1, #818cf8); border-radius: 6px 6px 0 0; }
  .bar .m { font-size: 10px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; color: #8b93a1; font-weight: 600; padding: 8px 6px; border-bottom: 1px solid #eceef1; text-transform: uppercase; font-size: 10px; letter-spacing: .03em; }
  td { padding: 9px 6px; border-bottom: 1px solid #f1f2f4; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .pill { font-size: 10px; padding: 2px 7px; border-radius: 999px; font-weight: 600; }
  .pill.win { background: #dcfce7; color: #166534; } .pill.risk { background: #fef3c7; color: #92400e; } .pill.neu { background: #e0e7ff; color: #3730a3; }
  .hbars { display: flex; flex-direction: column; gap: 13px; padding-top: 4px; }
  .hrow { display: flex; align-items: center; gap: 10px; font-size: 11px; }
  .hrow .lbl { width: 92px; color: #6b7280; flex-shrink: 0; }
  .hrow .track { flex: 1; height: 10px; background: #f1f2f4; border-radius: 999px; overflow: hidden; }
  .hrow .fill { height: 100%; background: linear-gradient(90deg, #6366f1, #818cf8); border-radius: 999px; }
  .hrow .v { width: 56px; text-align: right; font-variant-numeric: tabular-nums; color: #1a2233; font-weight: 600; }
  .donut-wrap { display: flex; align-items: center; gap: 20px; padding-top: 6px; }
  .donut { width: 124px; height: 124px; border-radius: 50%; flex-shrink: 0; background: conic-gradient(#4f46e5 0 52%, #818cf8 52% 83%, #c7d2fe 83% 100%); position: relative; }
  .donut::after { content: ""; position: absolute; inset: 24px; background: #fff; border-radius: 50%; }
  .donut .ctr { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1; }
  .donut .ctr .b { font-size: 18px; font-weight: 700; } .donut .ctr .s { font-size: 9px; color: #8b93a1; text-transform: uppercase; letter-spacing: .04em; }
  .legend { display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
  .legend .li { display: flex; align-items: center; gap: 8px; }
  .legend .dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .legend .ln { flex: 1; color: #4b5563; } .legend .lv { font-weight: 600; font-variant-numeric: tabular-nums; }
  .spark { width: 100%; height: 150px; display: block; }
  .gauges { display: flex; flex-direction: column; gap: 16px; padding-top: 4px; }
  .gauge .gtop { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
  .gauge .gtop .gl { color: #6b7280; } .gauge .gtop .gv { font-weight: 700; }
  .gauge .gtrack { height: 8px; background: #f1f2f4; border-radius: 999px; overflow: hidden; }
  .gauge .gfill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #4f46e5, #818cf8); }
  .gauge .gfill.ok { background: linear-gradient(90deg, #16a34a, #4ade80); }
  .gauge .gfill.warn { background: linear-gradient(90deg, #d97706, #fbbf24); }
</style>
</head>
<body>
  <div id="root">
    <div class="head">
      <div>
        <h1>Q2 Revenue Dashboard</h1>
        <div class="sub">Fiscal Q2 2026 · refreshed automatically on data sync</div>
      </div>
      <div class="sub">Generated by Analytics Agent</div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="label">Total Revenue</div><div class="val">$4.82M</div><div class="delta up">▲ 14.2% QoQ</div></div>
      <div class="kpi"><div class="label">New ARR</div><div class="val">$1.13M</div><div class="delta up">▲ 9.6% QoQ</div></div>
      <div class="kpi"><div class="label">Win Rate</div><div class="val">27.4%</div><div class="delta down">▼ 1.8 pts</div></div>
      <div class="kpi"><div class="label">Avg Deal Size</div><div class="val">$38.6K</div><div class="delta up">▲ 5.1% QoQ</div></div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="label">Pipeline Coverage</div><div class="val">3.2x</div><div class="delta up">▲ 0.4x QoQ</div></div>
      <div class="kpi"><div class="label">Net Revenue Retention</div><div class="val">112%</div><div class="delta up">▲ 3 pts</div></div>
      <div class="kpi"><div class="label">Avg Sales Cycle</div><div class="val">48 days</div><div class="delta up">▼ 6 days</div></div>
      <div class="kpi"><div class="label">Quota Attainment</div><div class="val">86%</div><div class="delta flat">— vs plan</div></div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Revenue by Month</h3>
        <div class="cap">Closed-won bookings, trailing 6 months ($K)</div>
        <div class="bars">
          <div class="bar"><div class="col" style="height:58%"></div><div class="m">Apr</div></div>
          <div class="bar"><div class="col" style="height:72%"></div><div class="m">May</div></div>
          <div class="bar"><div class="col" style="height:91%"></div><div class="m">Jun</div></div>
          <div class="bar"><div class="col" style="height:64%"></div><div class="m">Jul</div></div>
          <div class="bar"><div class="col" style="height:80%"></div><div class="m">Aug</div></div>
          <div class="bar"><div class="col" style="height:100%"></div><div class="m">Sep</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Top Accounts</h3>
        <div class="cap">By annual recurring revenue</div>
        <table>
          <thead><tr><th>Account</th><th class="num">ARR</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Northwind Traders</td><td class="num">$412K</td><td><span class="pill win">Expanding</span></td></tr>
            <tr><td>Contoso Ltd</td><td class="num">$388K</td><td><span class="pill win">Expanding</span></td></tr>
            <tr><td>Globex Corp</td><td class="num">$301K</td><td><span class="pill risk">At risk</span></td></tr>
            <tr><td>Initech</td><td class="num">$276K</td><td><span class="pill neu">Stable</span></td></tr>
            <tr><td>Umbrella Inc</td><td class="num">$198K</td><td><span class="pill risk">At risk</span></td></tr>
            <tr><td>Soylent Corp</td><td class="num">$164K</td><td><span class="pill win">Expanding</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid3">
      <div class="card">
        <h3>Pipeline by Stage</h3>
        <div class="cap">Open opportunities ($)</div>
        <div class="hbars">
          <div class="hrow"><span class="lbl">Prospecting</span><span class="track"><span class="fill" style="width:100%"></span></span><span class="v">$2.1M</span></div>
          <div class="hrow"><span class="lbl">Qualification</span><span class="track"><span class="fill" style="width:76%"></span></span><span class="v">$1.6M</span></div>
          <div class="hrow"><span class="lbl">Proposal</span><span class="track"><span class="fill" style="width:57%"></span></span><span class="v">$1.2M</span></div>
          <div class="hrow"><span class="lbl">Negotiation</span><span class="track"><span class="fill" style="width:40%"></span></span><span class="v">$840K</span></div>
          <div class="hrow"><span class="lbl">Commit</span><span class="track"><span class="fill" style="width:25%"></span></span><span class="v">$520K</span></div>
        </div>
      </div>
      <div class="card">
        <h3>Revenue by Segment</h3>
        <div class="cap">Share of closed-won ARR</div>
        <div class="donut-wrap">
          <div class="donut"><div class="ctr"><div class="b">$4.82M</div><div class="s">Total</div></div></div>
          <div class="legend">
            <div class="li"><span class="dot" style="background:#4f46e5"></span><span class="ln">Enterprise</span><span class="lv">52%</span></div>
            <div class="li"><span class="dot" style="background:#818cf8"></span><span class="ln">Mid-Market</span><span class="lv">31%</span></div>
            <div class="li"><span class="dot" style="background:#c7d2fe"></span><span class="ln">SMB</span><span class="lv">17%</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>Win Rate Trend</h3>
        <div class="cap">Closed-won %, trailing 6 months</div>
        <svg class="spark" viewBox="0 0 300 150" preserveAspectRatio="none">
          <defs><linearGradient id="wr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity="0.22"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
          <path d="M0,104 L60,86 L120,96 L180,64 L240,72 L300,48 L300,150 L0,150 Z" fill="url(#wr)"/>
          <polyline points="0,104 60,86 120,96 180,64 240,72 300,48" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="300" cy="48" r="3.5" fill="#6366f1"/>
        </svg>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>Rep Leaderboard</h3>
        <div class="cap">Closed-won this quarter vs quota</div>
        <table>
          <thead><tr><th>Rep</th><th class="num">Closed Won</th><th class="num">Quota</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Priya Nair</td><td class="num">$642K</td><td class="num">118%</td><td><span class="pill win">Ahead</span></td></tr>
            <tr><td>Marcus Lee</td><td class="num">$571K</td><td class="num">104%</td><td><span class="pill win">Ahead</span></td></tr>
            <tr><td>Dana White</td><td class="num">$498K</td><td class="num">91%</td><td><span class="pill neu">On track</span></td></tr>
            <tr><td>Tom Alvarez</td><td class="num">$402K</td><td class="num">73%</td><td><span class="pill risk">Behind</span></td></tr>
            <tr><td>Sara Kim</td><td class="num">$355K</td><td class="num">65%</td><td><span class="pill risk">Behind</span></td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>Pipeline by Source</h3>
        <div class="cap">Sourced pipeline mix this quarter</div>
        <div class="hbars">
          <div class="hrow"><span class="lbl">Outbound</span><span class="track"><span class="fill" style="width:100%"></span></span><span class="v">34%</span></div>
          <div class="hrow"><span class="lbl">Inbound</span><span class="track"><span class="fill" style="width:79%"></span></span><span class="v">27%</span></div>
          <div class="hrow"><span class="lbl">Partner</span><span class="track"><span class="fill" style="width:53%"></span></span><span class="v">18%</span></div>
          <div class="hrow"><span class="lbl">Events</span><span class="track"><span class="fill" style="width:38%"></span></span><span class="v">13%</span></div>
          <div class="hrow"><span class="lbl">Product-led</span><span class="track"><span class="fill" style="width:24%"></span></span><span class="v">8%</span></div>
        </div>
        <div class="gauges" style="margin-top:18px">
          <div class="gauge"><div class="gtop"><span class="gl">Quarterly target</span><span class="gv">86%</span></div><div class="gtrack"><div class="gfill warn" style="width:86%"></div></div></div>
          <div class="gauge"><div class="gtop"><span class="gl">Forecast confidence</span><span class="gv">High</span></div><div class="gtrack"><div class="gfill ok" style="width:78%"></div></div></div>
        </div>
      </div>
    </div>
  </div>
  <!-- runtime hook for React-dashboard detection: ./runtime/app.js -->
</body>
</html>`;

// Rendered, self-contained previews for each widget — served for `?preview=1`
// so the Verify view shows the actual widget instead of its source.
const WIDGET_SHELL = (inner) => `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f8fa; color: #1a2233; padding: 16px; }
  .card { background: #fff; border: 1px solid #eceef1; border-radius: 12px; padding: 16px; }
  .card h3 { font-size: 13px; font-weight: 700; margin-bottom: 14px; }
  .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .kpi { background: #fff; border: 1px solid #eceef1; border-radius: 12px; padding: 14px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #8b93a1; margin-bottom: 6px; }
  .kpi .val { font-size: 20px; font-weight: 700; }
  .kpi .delta { font-size: 11px; font-weight: 600; margin-top: 4px; }
  .delta.up { color: #16a34a; } .delta.down { color: #dc2626; }
  .bars { display: flex; align-items: flex-end; gap: 12px; height: 180px; padding-top: 10px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
  .bar .col { width: 100%; max-width: 40px; background: linear-gradient(180deg, #6366f1, #818cf8); border-radius: 6px 6px 0 0; }
  .bar .m { font-size: 10px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; color: #8b93a1; font-weight: 600; padding: 8px 6px; border-bottom: 1px solid #eceef1; text-transform: uppercase; font-size: 10px; letter-spacing: .03em; }
  td { padding: 9px 6px; border-bottom: 1px solid #f1f2f4; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .pill { font-size: 10px; padding: 2px 7px; border-radius: 999px; font-weight: 600; }
  .pill.win { background: #dcfce7; color: #166534; } .pill.risk { background: #fef3c7; color: #92400e; }
</style></head><body>${inner}</body></html>`;

export const WIDGET_PREVIEWS = {
  "output/dashboard/widgets/scoreboard.jsx": WIDGET_SHELL(`
    <div class="kpis">
      <div class="kpi"><div class="label">Total Revenue</div><div class="val">$4.82M</div><div class="delta up">▲ 14.2% QoQ</div></div>
      <div class="kpi"><div class="label">New ARR</div><div class="val">$1.13M</div><div class="delta up">▲ 9.6% QoQ</div></div>
      <div class="kpi"><div class="label">Win Rate</div><div class="val">27.4%</div><div class="delta down">▼ 1.8 pts</div></div>
      <div class="kpi"><div class="label">Avg Deal Size</div><div class="val">$38.6K</div><div class="delta up">▲ 5.1% QoQ</div></div>
    </div>`),
  "output/dashboard/widgets/revenue_trend.jsx": WIDGET_SHELL(`
    <div class="card">
      <h3>Revenue by Month</h3>
      <div class="bars">
        <div class="bar"><div class="col" style="height:58%"></div><div class="m">Apr</div></div>
        <div class="bar"><div class="col" style="height:72%"></div><div class="m">May</div></div>
        <div class="bar"><div class="col" style="height:91%"></div><div class="m">Jun</div></div>
        <div class="bar"><div class="col" style="height:64%"></div><div class="m">Jul</div></div>
        <div class="bar"><div class="col" style="height:80%"></div><div class="m">Aug</div></div>
        <div class="bar"><div class="col" style="height:100%"></div><div class="m">Sep</div></div>
      </div>
    </div>`),
  "output/dashboard/widgets/top_accounts.jsx": WIDGET_SHELL(`
    <div class="card">
      <h3>Top Accounts</h3>
      <table>
        <thead><tr><th>Account</th><th class="num">ARR</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Northwind Traders</td><td class="num">$412K</td><td><span class="pill win">Expanding</span></td></tr>
          <tr><td>Contoso Ltd</td><td class="num">$388K</td><td><span class="pill win">Expanding</span></td></tr>
          <tr><td>Globex Corp</td><td class="num">$301K</td><td><span class="pill risk">At risk</span></td></tr>
          <tr><td>Initech</td><td class="num">$276K</td><td><span class="pill win">Stable</span></td></tr>
          <tr><td>Umbrella Inc</td><td class="num">$198K</td><td><span class="pill risk">At risk</span></td></tr>
        </tbody>
      </table>
    </div>`),
};

export const DASHBOARD_MANIFEST = {
  version: "2.0",
  title: "Q2 Revenue Dashboard",
  created_at: "2026-06-01T10:00:00Z",
  widgets: {
    scoreboard: { id: "scoreboard", file: "widgets/scoreboard.jsx", name: "Scoreboard", data_source: "data/kpis.json", verified: false, verified_at: null },
    revenue_trend: { id: "revenue_trend", file: "widgets/revenue_trend.jsx", name: "Revenue by Month", data_source: "data/revenue_by_month.csv", verified: false, verified_at: null },
    top_accounts: { id: "top_accounts", file: "widgets/top_accounts.jsx", name: "Top Accounts", data_source: "data/top_accounts.csv", verified: false, verified_at: null },
  },
};

// Extra workspace files the viewers/tree may request.
export const DASHBOARD_FILES = {
  "output/dashboard/revenue_dashboard.html": { content: DASHBOARD_HTML, contentType: "text/html" },
  "output/dashboard/index.html": { content: DASHBOARD_HTML, contentType: "text/html" },
  "output/dashboard/manifest.json": { content: JSON.stringify(DASHBOARD_MANIFEST, null, 2), contentType: "application/json" },
  "output/dashboard/runtime/app.js": { content: "/* mock dashboard runtime */", contentType: "application/javascript" },
  "output/dashboard/widgets/scoreboard.jsx": { content: "export default function Scoreboard({ data }) {\n  return <div className=\"scoreboard\">{/* KPI cards */}</div>\n}\n", contentType: "text/plain" },
  "output/dashboard/widgets/revenue_trend.jsx": { content: "export default function RevenueTrend({ data }) {\n  return <div className=\"revenue-trend\">{/* bar chart */}</div>\n}\n", contentType: "text/plain" },
  "output/dashboard/widgets/top_accounts.jsx": { content: "export default function TopAccounts({ data }) {\n  return <table>{/* top accounts */}</table>\n}\n", contentType: "text/plain" },
  "data/kpis.json": { content: JSON.stringify({ total_revenue: 4820000, new_arr: 1130000, win_rate: 0.274, avg_deal: 38600 }, null, 2), contentType: "application/json" },
  "data/revenue_by_month.csv": { content: "month,revenue\nApr,612000\nMay,758000\nJun,961000\nJul,672000\nAug,840000\nSep,1052000\n", contentType: "text/csv" },
  "data/top_accounts.csv": { content: "account,arr,status\nNorthwind Traders,412000,Expanding\nContoso Ltd,388000,Expanding\nGlobex Corp,301000,At risk\nInitech,276000,Stable\nUmbrella Inc,198000,At risk\n", contentType: "text/csv" },
};
