import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CaretRight,
  CaretDown,
  CaretLeft,
  ClockCountdown,
  Database,
  LockKey,
  PencilSimple,
  Sparkle,
  MagnifyingGlass,
  DotsThree,
  DotsSixVertical,
  X,
  Check,
  Buildings,
  LinkSimple,
} from '@phosphor-icons/react';

/* Last Updated icon button with tooltip */
function LastUpdatedButton({
  lastUpdated = 'Jan 31, 2026 at 10:32 AM IST',
  frequency = 'Every 24 hours',
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="dv-last-updated"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button className="dv-last-updated__btn" type="button" aria-label="Last updated info">
        <ClockCountdown size={16} weight="regular" color="var(--color-neutral-800)" />
      </button>
      {hovered && (
        <div className="dv-last-updated__tooltip">
          <span className="dv-last-updated__tooltip-bold">Last Updated:</span>
          {' '}{lastUpdated}
          <br />
          <span className="dv-last-updated__tooltip-bold">Frequency:</span>
          {' '}{frequency}
        </div>
      )}
    </div>
  );
}

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend, AreaChart, Area,
} from 'recharts';
import { MenuBar } from '@/ui/components/MenuBar';
import { Button } from '@/ui/components/Button/Button';
import { DashboardWidget } from '@/ui/components/DashboardWidget/DashboardWidget';
import { SagePane } from '@/ui/components/SagePane/SagePane';
import './DashboardView.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
  'var(--color-chart-9)',
  'var(--color-chart-10)',
];

/* ================================================================== */
/*  DASHBOARD CONFIGS — unique widgets + data per dashboard            */
/* ================================================================== */

const DASHBOARD_CONFIGS = {
  /* ---- 1. Account Health Score ---- */
  1: {
    name: 'Account Health Score',
    widgets: [
      { id: 'health-overview', title: 'Account Health Overview', defaultVisible: true, fullWidth: true },
      { id: 'health-by-category', title: 'Account Health Score by Account Category', defaultVisible: true },
      { id: 'health-by-segment', title: 'Average Account Health Score by Account Segment', defaultVisible: true },
      { id: 'at-risk', title: 'Accounts list that are at risk', defaultVisible: true },
      { id: 'health-trend', title: 'Health Score Trend (Last 6 Months)', defaultVisible: true },
      { id: 'engagement-metrics', title: 'Engagement Metrics by Account', defaultVisible: true, fullWidth: true },
    ],
    descriptions: {
      'health-overview': 'Detailed list of 213 accounts with their respective Account Health Scores, including contract dates and engagement metrics.',
      'health-by-category': 'Pie chart of average health score grouped by account category (Enterprise, SMB, Mid-Market).',
      'health-by-segment': 'Bar chart of average Account Health Score for each Account Segment.',
      'at-risk': 'Accounts identified as "at risk" based on health scores and churn probability.',
      'health-trend': 'Monthly health score trend across segments showing movement over 6 months.',
      'engagement-metrics': 'Key engagement indicators per account: login frequency, feature adoption, support tickets, and NPS.',
    },
  },

  /* ---- 2. Sales Cycle Efficiency ---- */
  2: {
    name: 'Sales Cycle Efficiency',
    widgets: [
      { id: 'cycle-by-stage', title: 'Average Deal Cycle Length by Stage', defaultVisible: true },
      { id: 'win-rate-by-rep', title: 'Win Rate by Sales Rep', defaultVisible: true },
      { id: 'deals-by-stage', title: 'Deals by Pipeline Stage', defaultVisible: true },
      { id: 'pipeline-velocity', title: 'Pipeline Velocity Tracker', defaultVisible: true },
      { id: 'stalled-deals', title: 'Stalled Deals (No Activity 14+ Days)', defaultVisible: true, fullWidth: true },
      { id: 'close-rate-trend', title: 'Monthly Close Rate Trend', defaultVisible: true },
    ],
    descriptions: {
      'cycle-by-stage': 'Average number of days deals spend in each sales pipeline stage.',
      'win-rate-by-rep': 'Win rate percentage comparison across top-performing sales representatives.',
      'deals-by-stage': 'Distribution of active deals across all pipeline stages.',
      'pipeline-velocity': 'Key metrics tracking pipeline speed: average deal size, cycle time, and conversion rates.',
      'stalled-deals': 'Deals that have had no stage movement or logged activity for 14+ days, flagged for follow-up.',
      'close-rate-trend': 'Monthly win/close rate trend over the last 6 months.',
    },
  },

  /* ---- 3. Marketing Returns ---- */
  3: {
    name: 'Marketing Returns',
    widgets: [
      { id: 'channel-roi', title: 'ROI by Marketing Channel', defaultVisible: true },
      { id: 'lead-source', title: 'Lead Source Distribution', defaultVisible: true },
      { id: 'campaign-performance', title: 'Campaign Performance', defaultVisible: true, fullWidth: true },
      { id: 'cost-per-lead', title: 'Cost Per Lead by Channel', defaultVisible: true },
      { id: 'monthly-spend-trend', title: 'Monthly Marketing Spend vs Revenue', defaultVisible: true },
    ],
    descriptions: {
      'channel-roi': 'Return on investment breakdown for each marketing channel over the past quarter.',
      'lead-source': 'Distribution of inbound leads by their originating source or channel.',
      'campaign-performance': 'Performance of recent marketing campaigns including spend, leads generated, and conversion rate.',
      'cost-per-lead': 'Average cost to acquire a single lead through each marketing channel.',
      'monthly-spend-trend': 'Monthly comparison of marketing spend against attributed revenue over 6 months.',
    },
  },

  /* ---- 4. Profitability Analysis ---- */
  4: {
    name: 'Profitability Analysis',
    widgets: [
      { id: 'revenue-vs-cost', title: 'Revenue vs Cost by Product Line', defaultVisible: true },
      { id: 'margin-by-segment', title: 'Profit Margin by Customer Segment', defaultVisible: true },
      { id: 'profitability-table', title: 'Product Profitability Breakdown', defaultVisible: true, fullWidth: true },
      { id: 'monthly-trend', title: 'Monthly Profit Trend', defaultVisible: true },
      { id: 'cost-breakdown', title: 'Operating Cost Breakdown', defaultVisible: true },
      { id: 'top-products', title: 'Top Performing Products by Net Margin', defaultVisible: true, fullWidth: true },
    ],
    descriptions: {
      'revenue-vs-cost': 'Side-by-side comparison of revenue generated versus cost incurred for each product line.',
      'margin-by-segment': 'Profit margin distribution across Enterprise, Mid-Market, and SMB customer segments.',
      'profitability-table': 'Detailed breakdown of revenue, COGS, gross margin, and net margin by product.',
      'monthly-trend': 'Monthly profit trend over the last 6 months showing revenue growth trajectory.',
      'cost-breakdown': 'Pie chart of how operating costs are distributed across key cost centers.',
      'top-products': 'Table of top products ranked by net margin percentage with revenue and growth rate.',
    },
  },

  /* ---- 5. Customer Acquisition Metrics ---- */
  5: {
    name: 'Customer Acquisition Metrics',
    widgets: [
      { id: 'cac-by-channel', title: 'Customer Acquisition Cost by Channel', defaultVisible: true },
      { id: 'conversion-funnel', title: 'Conversion Funnel', defaultVisible: true },
      { id: 'new-customers', title: 'New Customers This Quarter', defaultVisible: true, fullWidth: true },
      { id: 'acquisition-trend', title: 'Monthly Acquisition Trend', defaultVisible: true },
      { id: 'ltv-by-channel', title: 'Customer Lifetime Value by Channel', defaultVisible: true },
      { id: 'payback-period', title: 'CAC Payback Period', defaultVisible: true, fullWidth: true },
    ],
    descriptions: {
      'cac-by-channel': 'Average cost to acquire a new customer through each acquisition channel.',
      'conversion-funnel': 'Conversion rates at each stage of the customer acquisition funnel.',
      'new-customers': 'List of recently acquired customers with deal size and source attribution.',
      'acquisition-trend': 'Month-over-month trend of new customer acquisition over the past 6 months.',
      'ltv-by-channel': 'Estimated customer lifetime value comparison across acquisition channels.',
      'payback-period': 'Table showing how many months each channel takes to recoup acquisition cost.',
    },
  },

  /* ---- 6. Cost-Benefit Analysis ---- */
  6: {
    name: 'Cost-Benefit Analysis',
    widgets: [
      { id: 'initiative-roi', title: 'Initiative ROI Comparison', defaultVisible: true },
      { id: 'cost-allocation', title: 'Cost Allocation Breakdown', defaultVisible: true },
      { id: 'initiatives-table', title: 'Active Initiatives', defaultVisible: true, fullWidth: true },
      { id: 'savings-projection', title: 'Projected Annual Savings', defaultVisible: true },
      { id: 'dept-efficiency', title: 'Department Efficiency Score', defaultVisible: true },
    ],
    descriptions: {
      'initiative-roi': 'Return on investment comparison across key business initiatives and projects.',
      'cost-allocation': 'How operational costs are distributed across departments and functions.',
      'initiatives-table': 'Status and financial details of all active cost-optimization initiatives.',
      'savings-projection': 'Projected savings trajectory from all active initiatives over 6 months.',
      'dept-efficiency': 'Efficiency scores per department based on output-to-cost ratio, benchmarked against targets.',
    },
  },
};

/* ================================================================== */
/*  SAGE MESSAGES — unique conversations per dashboard                 */
/* ================================================================== */

const SAGE_MESSAGES = {
  1: [
    { type: 'user', text: 'How is "Account Pulse" determined in the at-risk accounts widget?' },
    { type: 'ai', steps: [
      { label: 'Found 3 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Account Health Scores · Account Engagement Data · Churn Risk Model', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Identify the Account Pulse column', 'Trace the scoring model', 'Map input signal weights', 'Retrieve classification thresholds'], status: 'done' },
    ], body: [
      'The Account Pulse column is a derived health classification based on a composite scoring model.',
      'It uses four input signals: <span class="text-body-1-medium">Health Score</span> (weighted at 40%), <span class="text-body-1-medium">Churn Probability</span> (30%), <span class="text-body-1-medium">NPS Response</span> (15%), and <span class="text-body-1-medium">Product Usage</span> over the last 30 days (15%).',
      'The composite score maps to three labels: Fairly Satisfied (60–100), Some Risk (35–59), and Severe Risk (0–34).',
      'Datapine ($48,670 ARR) is the only account currently flagged as <span class="text-body-1-medium">Severe Risk</span>, worth immediate attention.',
    ]},
    { type: 'divider', timestamp: 'Jan 21, 2026 at 10:32 AM PST' },
    { type: 'user', text: 'Which accounts dropped the most in health score this month?' },
    { type: 'ai', steps: [
      { label: 'Found 2 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Account Health Overview · Monthly Health Score Snapshots', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Three accounts showed the largest health score declines this month:',
      '<span class="text-body-1-medium">Rec Technologies</span> dropped 18 points (72 → 54), driven by a 40% decrease in product usage and two unresolved support tickets.',
      '<span class="text-body-1-medium">AB Company</span> dropped 12 points (61 → 49). NPS fell from 7 to 4 after a billing dispute.',
      '<span class="text-body-1-medium">Datapine</span> dropped 9 points (38 → 29). Churn probability increased to 68% after contract renewal was declined.',
      'I would recommend scheduling check-ins with all three accounts this week.',
    ]},
  ],
  2: [
    { type: 'user', text: 'Why are deals getting stuck in the Negotiation stage?' },
    { type: 'ai', steps: [
      { label: 'Found 5 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Pipeline Stages · Deal Activity Log · Rep Performance · Negotiation Outcomes · Pricing Approvals', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Analyze average time in Negotiation vs other stages', 'Identify common blockers', 'Compare stalled vs closed deals', 'Check pricing approval bottlenecks'], status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Negotiation is currently the longest stage at <span class="text-body-1-medium">14 days on average</span>, up from 9 days last quarter.',
      'The main bottlenecks are: <span class="text-body-1-medium">Pricing approval delays</span> (42% of stalled deals are waiting on finance sign-off), <span class="text-body-1-medium">Legal review</span> (28% stuck on contract redlines), and <span class="text-body-1-medium">Multi-stakeholder alignment</span> (19% involve 3+ decision makers).',
      'Deals with a single decision maker close in 8 days at this stage. Deals with 3+ stakeholders take 22 days.',
      'Consider pre-approving discount tiers up to 15% so reps can close without waiting on finance.',
    ]},
    { type: 'divider', timestamp: 'Jan 28, 2026 at 3:15 PM PST' },
    { type: 'user', text: 'Which deals have been stalled the longest right now?' },
    { type: 'ai', steps: [
      { label: 'Found 3 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Active Pipeline · Activity Logs · Stage Timestamps', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Here are the top stalled deals with no activity for 14+ days:',
      '<span class="text-body-1-medium">GlobalTech Solutions</span>: $142K, stuck in Proposal for 23 days. Last activity was an email on Jan 5.',
      '<span class="text-body-1-medium">Nexus Corp</span>: $89K, stuck in Negotiation for 19 days. Waiting on legal review since Jan 9.',
      '<span class="text-body-1-medium">Pinnacle Industries</span>: $67K, stuck in Qualification for 18 days. No response to discovery call scheduling.',
      'These three deals represent <span class="text-body-1-medium">$298K in at-risk pipeline</span>. I recommend immediate outreach.',
    ]},
  ],
  3: [
    { type: 'user', text: 'Which marketing channel gives us the best return for the money?' },
    { type: 'ai', steps: [
      { label: 'Found 4 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Channel Spend · Lead Attribution · Revenue Attribution · Campaign ROI', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Calculate ROI per channel', 'Compare cost-per-lead vs cost-per-customer', 'Factor in lead quality and conversion rates', 'Identify highest-efficiency channels'], status: 'done' },
    ], body: [
      '<span class="text-body-1-medium">Email Marketing</span> delivers the highest ROI at 520%. For every $1 spent, it generates $5.20 in attributed revenue.',
      'Content Marketing comes second at 410% ROI, though it has a longer attribution window (avg 45 days from first touch to conversion).',
      'Paid Search has a strong 320% ROI but the highest cost-per-lead at $52. Events have the lowest ROI at 180% and the highest CPL at $85.',
      'If budget allows, I would recommend shifting 15–20% of Events budget toward Email and Content. These channels also produce higher-quality leads with a 2.3x better SQL conversion rate.',
    ]},
    { type: 'user', text: 'How did the Spring Product Launch campaign perform versus target?' },
    { type: 'ai', steps: [
      { label: 'Found 2 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Campaign Performance · Campaign Targets', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'The Spring Product Launch generated <span class="text-body-1-medium">892 leads</span> against a target of 750, that is 119% of goal.',
      'Revenue attributed is $189,000 on a $45,000 spend, giving a 4.2x return. The target was 3.5x.',
      'However, the conversion rate of 4.2% was slightly below the 5% target. This suggests strong top-of-funnel performance but a nurture gap.',
      'The LinkedIn Retargeting campaign supporting it had a 3.1% conversion rate. The retargeted audience may need more middle-funnel content before converting.',
    ]},
  ],
  4: [
    { type: 'user', text: 'Why is the Support product line dragging down our overall margin?' },
    { type: 'ai', steps: [
      { label: 'Found 3 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Product Profitability · Support Cost Breakdown · Headcount Allocation', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Break down Support costs by category', 'Compare margin vs other product lines', 'Identify cost drivers', 'Suggest optimization paths'], status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Premium Support has a <span class="text-body-1-medium">32% gross margin</span> and only <span class="text-body-1-medium">18% net margin</span>, the lowest across all product lines.',
      'The primary cost drivers are: staffing (62% of COGS: support is the most labor-intensive line), after-hours coverage (adds 18% to labor costs), and escalation handling (avg 3.2 hours per escalation vs 0.8 hours for standard tickets).',
      'Enterprise accounts generate 74% of support tickets but only 45% of support revenue. The per-ticket cost for Enterprise is $48 vs $22 for SMB.',
      'Two actionable paths: implement tiered SLAs to align cost with contract value, or invest in self-service (knowledge base and chatbot) which could deflect an estimated 35% of L1 tickets.',
    ]},
    { type: 'divider', timestamp: 'Feb 12, 2026 at 9:45 AM PST' },
    { type: 'user', text: 'Show me the month-over-month revenue growth rate by product' },
    { type: 'ai', steps: [
      { label: 'Found 2 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Monthly Revenue · Product Line Breakdown', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Month-over-month growth rates for the last 3 months:',
      '<span class="text-body-1-medium">Platform Suite:</span> +5.2% → +7.1% → +8.3%, accelerating, driven by 12 new Enterprise deals.',
      '<span class="text-body-1-medium">Analytics Pro:</span> +3.8% → +2.1% → +4.5%, volatile but recovering after Q4 churn.',
      '<span class="text-body-1-medium">Integration Hub:</span> +1.2% → +3.4% → +6.8%, strong uptick after the API v3 launch.',
      '<span class="text-body-1-medium">Premium Support:</span> -0.5% → +1.1% → +0.3%, essentially flat, limited by pricing.',
      'Platform Suite and Integration Hub are your growth engines right now. Consider bundling them to accelerate cross-sell.',
    ]},
  ],
  5: [
    { type: 'user', text: 'Our CAC went up this quarter. What is driving that?' },
    { type: 'ai', steps: [
      { label: 'Found 4 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Channel Spend · New Customer Attribution · Sales Cycle Data · Marketing Budget', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Compare CAC by channel vs last quarter', 'Check for spend increases', 'Analyze conversion rate changes', 'Identify channel-specific drivers'], status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Blended CAC increased <span class="text-body-1-medium">18% quarter-over-quarter</span>, from $198 to $234.',
      'The biggest driver is <span class="text-body-1-medium">Paid Search</span>: CPC increased 32% due to competitor bidding on your brand terms, while conversion rate dropped from 2.8% to 2.1%.',
      'Social CAC also rose 22%, primarily because the new LinkedIn campaign targeted a broader (colder) audience with lower intent.',
      'Bright spots: <span class="text-body-1-medium">Referral</span> CAC actually dropped 12% to $85, and Partner channel CAC fell 8%. These are your most efficient channels this quarter.',
      'Recommendation: reallocate 20% of Paid Search budget to Referral incentives. Each $1 moved generates 2.4x more customers through referrals.',
    ]},
    { type: 'user', text: 'What does our conversion funnel look like compared to industry benchmarks?' },
    { type: 'ai', steps: [
      { label: 'Found 2 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Conversion Funnel · Industry Benchmark Data', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Your funnel conversion rates vs B2B SaaS benchmarks:',
      '<span class="text-body-1-medium">Visitor → Lead:</span> 25% (yours) vs 22% (benchmark), above average, strong content strategy.',
      '<span class="text-body-1-medium">Lead → MQL:</span> 40% (yours) vs 35% (benchmark), good lead scoring and qualification.',
      '<span class="text-body-1-medium">MQL → SQL:</span> 50% (yours) vs 48% (benchmark), in line with industry.',
      '<span class="text-body-1-medium">SQL → Customer:</span> 30% (yours) vs 38% (benchmark), <span class="text-body-1-medium">this is where you are underperforming</span>.',
      'The SQL → Customer gap suggests a sales execution issue, not a lead quality one. The top-of-funnel is healthy. Focus on sales enablement and demo-to-close processes.',
    ]},
  ],
  6: [
    { type: 'user', text: 'Which initiative is giving us the best bang for our buck?' },
    { type: 'ai', steps: [
      { label: 'Found 3 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Active Initiatives · Investment Tracking · Savings Attribution', status: 'done' },
      { label: "Here's the plan:", loadingLabel: 'Generating the plan', content: ['Calculate ROI per initiative', 'Factor in time-to-value', 'Compare completed vs in-progress', 'Rank by efficiency'], status: 'done' },
    ], body: [
      '<span class="text-body-1-medium">Process Automation</span> is the clear winner: 420% ROI on an $85K investment, already delivering $357K in annualized savings.',
      'It also had the fastest payback period at just 2.8 months. The automation covers invoice processing, employee onboarding workflows, and weekly reporting.',
      'Cloud Consolidation has the highest absolute savings potential ($700K) but requires $200K investment and won\'t fully pay back until Q3 2026.',
      'Vendor Renegotiation was a quick win: $15K investment (mostly labor) yielded $28.5K in savings by consolidating 4 SaaS subscriptions. Consider a second round of renegotiations in Q2.',
    ]},
    { type: 'divider', timestamp: 'Mar 5, 2026 at 11:20 AM PST' },
    { type: 'user', text: 'Are we on track with the projected savings targets for this quarter?' },
    { type: 'ai', steps: [
      { label: 'Found 2 relevant tables', loadingLabel: 'Picking relevant tables', content: 'Savings Projections · Actual Savings Tracker', status: 'done' },
      { label: 'Response Generated', loadingLabel: 'Generating response', status: 'done' },
    ], body: [
      'Through March, actual savings are <span class="text-body-1-medium">$110K vs a projected $115K</span>. You are at 96% of target.',
      'January and February both exceeded projections (+$3K combined). March is currently tracking slightly below (-$8K) due to a delay in the Cloud Consolidation migration.',
      'The migration delay pushed $12K of expected savings into April. Once the final workload transfer completes (estimated April 8), you will be back on track.',
      'If the remaining initiatives execute on schedule, you are on pace for <span class="text-body-1-medium">$482K in total annual savings</span>, 7% above the $450K target.',
    ]},
  ],
};

/* ================================================================== */
/*  SAMPLE DATA                                                        */
/* ================================================================== */

/* Dashboard 1 — Account Health Score */
const HEALTH_TABLE_DATA = [
  { id: 1, oppId: '006JA000002A2IVYAS', oppName: 'Schmitt Inc', date: '2022-06-08' },
  { id: 2, oppId: '006JA000002ESpoYAG', oppName: 'Kertzmann, Mills and Hackett', date: '2022-07-08' },
  { id: 3, oppId: '006JA000002byJCYAY', oppName: 'Grant - Wunsch', date: '2023-01-15' },
  { id: 4, oppId: '006JA000002dJKdYAM', oppName: 'West, Grant and Jacobi', date: '2023-01-27' },
  { id: 5, oppId: '006JA000002buPhYAI', oppName: 'Hayes, White and Hane', date: '2023-01-27' },
  { id: 6, oppId: '006JA000002ekfFYAY', oppName: 'Walter, Rowe and Powlowski', date: '2023-02-11' },
  { id: 7, oppId: '006JA000002gSVKYA2', oppName: 'Watsica, Cronin and Sporer', date: '2023-03-03' },
  { id: 8, oppId: '006JA000002gwdYAA', oppName: 'Harzer, Banich and LeRoy', date: '2023-03-08' },
];

const HEALTH_PIE_DATA = [
  { name: 'Social Media Advertising', value: 10, colorIndex: 0 },
  { name: 'Content Marketing', value: 15, colorIndex: 1 },
  { name: 'Email Marketing', value: 5, colorIndex: 2 },
  { name: 'No Source', value: 60, colorIndex: 3 },
  { name: 'Others', value: 10, colorIndex: 4 },
];

const HEALTH_BAR_DATA = [
  { segment: 'Enterprise', score: 88 },
  { segment: 'Mid-Market', score: 83 },
  { segment: 'SMB', score: 95 },
];

const AT_RISK_DATA = [
  { name: 'Tesla', category: 'Enterprise', arr: '$ 87,090', pulse: 'Fairly Satisfied' },
  { name: 'AB Company', category: 'SMB', arr: '$ 67,923', pulse: 'Some Risk' },
  { name: 'CRT Tech', category: 'Enterprise', arr: '$ 56,890', pulse: 'Fairly Satisfied' },
  { name: 'Rec Technologies', category: 'Enterprise', arr: '$ 52,678', pulse: 'Some Risk' },
  { name: 'Slack', category: 'SMB', arr: '$ 51,860', pulse: 'Fairly Satisfied' },
  { name: 'Intercom', category: 'SMB', arr: '$ 50,800', pulse: 'Fairly Satisfied' },
  { name: 'Datapine', category: 'Enterprise', arr: '$ 48,670', pulse: 'Severe Risk' },
];

const HEALTH_TREND_DATA = [
  { month: 'Oct', enterprise: 84, midMarket: 78, smb: 91 },
  { month: 'Nov', enterprise: 86, midMarket: 80, smb: 90 },
  { month: 'Dec', enterprise: 85, midMarket: 82, smb: 93 },
  { month: 'Jan', enterprise: 88, midMarket: 83, smb: 95 },
  { month: 'Feb', enterprise: 87, midMarket: 81, smb: 94 },
  { month: 'Mar', enterprise: 89, midMarket: 84, smb: 96 },
];

const ENGAGEMENT_TABLE_DATA = [
  { account: 'Schmitt Inc', logins: '142/mo', adoption: '78%', tickets: 2, nps: 9 },
  { account: 'Grant - Wunsch', logins: '98/mo', adoption: '65%', tickets: 5, nps: 7 },
  { account: 'Hayes, White and Hane', logins: '210/mo', adoption: '88%', tickets: 1, nps: 10 },
  { account: 'Walter, Rowe and Powlowski', logins: '56/mo', adoption: '42%', tickets: 8, nps: 5 },
  { account: 'Datapine', logins: '23/mo', adoption: '31%', tickets: 12, nps: 3 },
  { account: 'Tesla', logins: '187/mo', adoption: '82%', tickets: 3, nps: 8 },
];

/* Dashboard 2 — Sales Cycle Efficiency */
const CYCLE_BY_STAGE_DATA = [
  { stage: 'Prospecting', days: 8 },
  { stage: 'Qualification', days: 12 },
  { stage: 'Proposal', days: 18 },
  { stage: 'Negotiation', days: 14 },
  { stage: 'Closed Won', days: 5 },
];

const WIN_RATE_DATA = [
  { rep: 'Sarah K.', rate: 42 },
  { rep: 'James L.', rate: 38 },
  { rep: 'Maria G.', rate: 35 },
  { rep: 'David P.', rate: 31 },
  { rep: 'Anna T.', rate: 28 },
];

const DEALS_BY_STAGE_PIE = [
  { name: 'Prospecting', value: 32, colorIndex: 0 },
  { name: 'Qualification', value: 24, colorIndex: 1 },
  { name: 'Proposal', value: 18, colorIndex: 2 },
  { name: 'Negotiation', value: 15, colorIndex: 3 },
  { name: 'Closed Won', value: 11, colorIndex: 4 },
];

const PIPELINE_VELOCITY_DATA = [
  { metric: 'Average Deal Size', value: '$ 48,500', change: '+12%' },
  { metric: 'Average Cycle Length', value: '57 days', change: '-8%' },
  { metric: 'Win Rate', value: '34.8%', change: '+3.2%' },
  { metric: 'Pipeline Value', value: '$ 2.4M', change: '+18%' },
  { metric: 'Deals in Pipeline', value: '142', change: '+9%' },
  { metric: 'Avg. Time in Negotiation', value: '14 days', change: '-5%' },
];

const STALLED_DEALS_DATA = [
  { deal: 'GlobalTech Solutions', rep: 'Sarah K.', stage: 'Proposal', value: '$ 142,000', daysStalled: 23, lastActivity: 'Email, Jan 5' },
  { deal: 'Nexus Corp', rep: 'James L.', stage: 'Negotiation', value: '$ 89,000', daysStalled: 19, lastActivity: 'Call, Jan 9' },
  { deal: 'Pinnacle Industries', rep: 'Maria G.', stage: 'Qualification', value: '$ 67,000', daysStalled: 18, lastActivity: 'Meeting, Jan 10' },
  { deal: 'Orion Systems', rep: 'David P.', stage: 'Proposal', value: '$ 54,500', daysStalled: 16, lastActivity: 'Email, Jan 12' },
  { deal: 'Vertex Labs', rep: 'Anna T.', stage: 'Negotiation', value: '$ 38,200', daysStalled: 14, lastActivity: 'Call, Jan 14' },
];

const CLOSE_RATE_TREND_DATA = [
  { month: 'Oct', rate: 28 },
  { month: 'Nov', rate: 31 },
  { month: 'Dec', rate: 26 },
  { month: 'Jan', rate: 34 },
  { month: 'Feb', rate: 37 },
  { month: 'Mar', rate: 35 },
];

/* Dashboard 3 — Marketing Returns */
const CHANNEL_ROI_DATA = [
  { channel: 'Paid Search', roi: 320 },
  { channel: 'Social Media', roi: 280 },
  { channel: 'Content', roi: 410 },
  { channel: 'Email', roi: 520 },
  { channel: 'Events', roi: 180 },
];

const LEAD_SOURCE_PIE = [
  { name: 'Organic Search', value: 35, colorIndex: 0 },
  { name: 'Paid Ads', value: 25, colorIndex: 1 },
  { name: 'Referral', value: 18, colorIndex: 2 },
  { name: 'Social Media', value: 14, colorIndex: 3 },
  { name: 'Direct', value: 8, colorIndex: 4 },
];

const CAMPAIGN_TABLE_DATA = [
  { name: 'Spring Product Launch', spend: '$ 45,000', leads: 892, conversion: '4.2%', revenue: '$ 189,000' },
  { name: 'Q1 Webinar Series', spend: '$ 12,500', leads: 436, conversion: '6.8%', revenue: '$ 82,300' },
  { name: 'LinkedIn Retargeting', spend: '$ 28,000', leads: 654, conversion: '3.1%', revenue: '$ 145,600' },
  { name: 'Email Nurture Flow', spend: '$ 8,200', leads: 318, conversion: '8.4%', revenue: '$ 96,700' },
  { name: 'Industry Report Gated', spend: '$ 15,800', leads: 521, conversion: '5.5%', revenue: '$ 112,400' },
];

const COST_PER_LEAD_DATA = [
  { channel: 'Paid Search', cpl: 52 },
  { channel: 'Social Media', cpl: 38 },
  { channel: 'Content', cpl: 24 },
  { channel: 'Email', cpl: 18 },
  { channel: 'Events', cpl: 85 },
];

const MONTHLY_SPEND_TREND_DATA = [
  { month: 'Oct', spend: 95, revenue: 310 },
  { month: 'Nov', spend: 102, revenue: 345 },
  { month: 'Dec', spend: 88, revenue: 290 },
  { month: 'Jan', spend: 110, revenue: 380 },
  { month: 'Feb', spend: 115, revenue: 420 },
  { month: 'Mar', spend: 108, revenue: 395 },
];

/* Dashboard 4 — Profitability Analysis */
const REVENUE_VS_COST_DATA = [
  { product: 'Platform', revenue: 850, cost: 340 },
  { product: 'Analytics', revenue: 620, cost: 280 },
  { product: 'Integration', revenue: 410, cost: 220 },
  { product: 'Support', revenue: 280, cost: 190 },
];

const MARGIN_BY_SEGMENT_PIE = [
  { name: 'Enterprise (62%)', value: 62, colorIndex: 0 },
  { name: 'Mid-Market (24%)', value: 24, colorIndex: 1 },
  { name: 'SMB (14%)', value: 14, colorIndex: 2 },
];

const PROFITABILITY_TABLE_DATA = [
  { product: 'Platform Suite', revenue: '$ 850K', cogs: '$ 340K', gross: '60%', net: '42%' },
  { product: 'Analytics Pro', revenue: '$ 620K', cogs: '$ 280K', gross: '55%', net: '38%' },
  { product: 'Integration Hub', revenue: '$ 410K', cogs: '$ 220K', gross: '46%', net: '31%' },
  { product: 'Premium Support', revenue: '$ 280K', cogs: '$ 190K', gross: '32%', net: '18%' },
  { product: 'Custom Dev', revenue: '$ 165K', cogs: '$ 110K', gross: '33%', net: '20%' },
];

const MONTHLY_PROFIT_TREND = [
  { month: 'Oct', revenue: 380, cost: 210, profit: 170 },
  { month: 'Nov', revenue: 410, cost: 220, profit: 190 },
  { month: 'Dec', revenue: 450, cost: 230, profit: 220 },
  { month: 'Jan', revenue: 420, cost: 215, profit: 205 },
  { month: 'Feb', revenue: 480, cost: 240, profit: 240 },
  { month: 'Mar', revenue: 520, cost: 250, profit: 270 },
];

const COST_BREAKDOWN_PIE = [
  { name: 'R&D / Engineering', value: 34, colorIndex: 0 },
  { name: 'Sales & Marketing', value: 28, colorIndex: 1 },
  { name: 'Infrastructure', value: 18, colorIndex: 2 },
  { name: 'G&A / Admin', value: 12, colorIndex: 3 },
  { name: 'Support', value: 8, colorIndex: 4 },
];

const TOP_PRODUCTS_TABLE = [
  { product: 'Platform Suite', revenue: '$ 850K', netMargin: '42%', growth: '+8.3%', customers: 312 },
  { product: 'Analytics Pro', revenue: '$ 620K', netMargin: '38%', growth: '+4.5%', customers: 248 },
  { product: 'Integration Hub', revenue: '$ 410K', netMargin: '31%', growth: '+6.8%', customers: 186 },
  { product: 'Custom Dev', revenue: '$ 165K', netMargin: '20%', growth: '+2.1%', customers: 42 },
  { product: 'Premium Support', revenue: '$ 280K', netMargin: '18%', growth: '+0.3%', customers: 156 },
];

/* Dashboard 5 — Customer Acquisition Metrics */
const CAC_BY_CHANNEL_DATA = [
  { channel: 'Organic', cac: 120 },
  { channel: 'Paid Search', cac: 340 },
  { channel: 'Social', cac: 280 },
  { channel: 'Referral', cac: 85 },
  { channel: 'Partner', cac: 195 },
];

const CONVERSION_FUNNEL_DATA = [
  { stage: 'Visitors', count: 12400 },
  { stage: 'Leads', count: 3100 },
  { stage: 'MQLs', count: 1240 },
  { stage: 'SQLs', count: 620 },
  { stage: 'Customers', count: 186 },
];

const NEW_CUSTOMERS_TABLE = [
  { name: 'Acme Corp', deal: '$ 125,000', source: 'Referral', rep: 'Sarah K.', date: 'Jan 15, 2026' },
  { name: 'TechFlow Inc', deal: '$ 89,500', source: 'Paid Search', rep: 'James L.', date: 'Jan 22, 2026' },
  { name: 'DataVista', deal: '$ 67,200', source: 'Organic', rep: 'Maria G.', date: 'Feb 3, 2026' },
  { name: 'CloudSync', deal: '$ 142,000', source: 'Partner', rep: 'David P.', date: 'Feb 11, 2026' },
  { name: 'NovaBridge', deal: '$ 54,800', source: 'Social', rep: 'Anna T.', date: 'Feb 18, 2026' },
  { name: 'Apex Solutions', deal: '$ 98,300', source: 'Referral', rep: 'Sarah K.', date: 'Mar 2, 2026' },
];

const ACQUISITION_TREND_DATA = [
  { month: 'Oct', customers: 24 },
  { month: 'Nov', customers: 31 },
  { month: 'Dec', customers: 28 },
  { month: 'Jan', customers: 35 },
  { month: 'Feb', customers: 42 },
  { month: 'Mar', customers: 48 },
];

const LTV_BY_CHANNEL_DATA = [
  { channel: 'Organic', ltv: 18500 },
  { channel: 'Paid Search', ltv: 12400 },
  { channel: 'Social', ltv: 9800 },
  { channel: 'Referral', ltv: 22100 },
  { channel: 'Partner', ltv: 16300 },
];

const PAYBACK_TABLE_DATA = [
  { channel: 'Referral', cac: '$ 85', ltv: '$ 22,100', payback: '1.4 months', ratio: '260x' },
  { channel: 'Organic', cac: '$ 120', ltv: '$ 18,500', payback: '2.3 months', ratio: '154x' },
  { channel: 'Partner', cac: '$ 195', ltv: '$ 16,300', payback: '4.3 months', ratio: '84x' },
  { channel: 'Social', cac: '$ 280', ltv: '$ 9,800', payback: '10.2 months', ratio: '35x' },
  { channel: 'Paid Search', cac: '$ 340', ltv: '$ 12,400', payback: '9.8 months', ratio: '36x' },
];

/* Dashboard 6 — Cost-Benefit Analysis */
const INITIATIVE_ROI_DATA = [
  { initiative: 'CRM Migration', roi: 280 },
  { initiative: 'Process Automation', roi: 420 },
  { initiative: 'Cloud Consolidation', roi: 350 },
  { initiative: 'Vendor Renegotiation', roi: 190 },
  { initiative: 'Team Restructure', roi: 150 },
];

const COST_ALLOCATION_PIE = [
  { name: 'Engineering', value: 38, colorIndex: 0 },
  { name: 'Sales & Marketing', value: 28, colorIndex: 1 },
  { name: 'Operations', value: 18, colorIndex: 2 },
  { name: 'Support', value: 10, colorIndex: 3 },
  { name: 'Admin', value: 6, colorIndex: 4 },
];

const INITIATIVES_TABLE_DATA = [
  { name: 'CRM Migration', status: 'In Progress', investment: '$ 120K', savings: '$ 336K', timeline: 'Q1 2026' },
  { name: 'Process Automation', status: 'Completed', investment: '$ 85K', savings: '$ 357K', timeline: 'Q4 2025' },
  { name: 'Cloud Consolidation', status: 'In Progress', investment: '$ 200K', savings: '$ 700K', timeline: 'Q2 2026' },
  { name: 'Vendor Renegotiation', status: 'Completed', investment: '$ 15K', savings: '$ 28.5K', timeline: 'Q4 2025' },
  { name: 'Team Restructure', status: 'Planning', investment: '$ 45K', savings: '$ 67.5K', timeline: 'Q3 2026' },
];

const DEPT_EFFICIENCY_DATA = [
  { dept: 'Engineering', score: 92 },
  { dept: 'Sales', score: 78 },
  { dept: 'Marketing', score: 85 },
  { dept: 'Support', score: 68 },
  { dept: 'Operations', score: 88 },
];

const SAVINGS_PROJECTION_DATA = [
  { month: 'Oct', actual: 42, projected: 40 },
  { month: 'Nov', actual: 58, projected: 55 },
  { month: 'Dec', actual: 65, projected: 70 },
  { month: 'Jan', actual: 78, projected: 85 },
  { month: 'Feb', actual: 92, projected: 100 },
  { month: 'Mar', actual: 110, projected: 115 },
];

/* ================================================================== */
/*  Custom Recharts Tooltips                                           */
/* ================================================================== */

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="dv-tooltip">
      <div className="dv-tooltip__row">
        <span
          className="dv-tooltip__dot"
          style={{ backgroundColor: CHART_COLORS[payload[0].payload.colorIndex] }}
        />
        <p className="dv-tooltip__label">{name}</p>
      </div>
      <p className="dv-tooltip__value">{value}%</p>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dv-tooltip">
      <p className="dv-tooltip__label">{label}</p>
      <p className="dv-tooltip__value">{payload[0].name || payload[0].dataKey}: {payload[0].value}</p>
    </div>
  );
}

function MultiBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dv-tooltip">
      <p className="dv-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="dv-tooltip__value">{p.name}: {typeof p.value === 'number' && p.value > 100 ? `$ ${p.value}K` : p.value}</p>
      ))}
    </div>
  );
}

function LineTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dv-tooltip">
      <p className="dv-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="dv-tooltip__value">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Shared chart helpers                                               */
/* ================================================================== */

function SimplePieChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hiddenIndices, setHiddenIndices] = useState(new Set());

  function toggleIndex(i) {
    setHiddenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const visibleData = data.filter((_, i) => !hiddenIndices.has(i));

  return (
    <div className="dv-pie-wrapper">
      <ResponsiveContainer width={280} height={280}>
        <PieChart>
          <Pie
            data={visibleData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={130}
            dataKey="value"
            stroke="none"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {visibleData.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[entry.colorIndex]}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="dv-pie-legend">
        {data.map((entry, i) => {
          const hidden = hiddenIndices.has(i);
          return (
            <div
              className={`dv-pie-legend__item ${hidden ? 'dv-pie-legend__item--hidden' : ''}`}
              key={i}
              onClick={() => toggleIndex(i)}
              onMouseEnter={() => !hidden && setActiveIndex(visibleData.indexOf(entry))}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="dv-pie-legend__swatch"
                style={{
                  backgroundColor: CHART_COLORS[entry.colorIndex],
                  opacity: hidden ? 1 : (activeIndex === null || activeIndex === visibleData.indexOf(entry) ? 1 : 0.4),
                  transition: 'opacity 0.2s ease',
                }}
              />
              <span
                className="dv-pie-legend__label"
                style={{
                  opacity: hidden ? 1 : (activeIndex === null || activeIndex === visibleData.indexOf(entry) ? 1 : 0.5),
                  transition: 'opacity 0.2s ease',
                }}
              >
                {entry.name} - {entry.value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Reusable legend for multi-series line/bar/area charts */
function ChartLegend({ series, hiddenKeys, onToggle, type = 'line' }) {
  return (
    <div className="dv-chart-legend">
      {series.map((s) => {
        const hidden = hiddenKeys.has(s.key);
        return (
          <div
            key={s.key}
            className={`dv-chart-legend__item ${hidden ? 'dv-chart-legend__item--hidden' : ''}`}
            onClick={() => onToggle(s.key)}
          >
            <div
              className={`dv-chart-legend__swatch ${type === 'bar' ? 'dv-chart-legend__swatch--bar' : ''}`}
              style={{ backgroundColor: s.color }}
            />
            <span className="dv-chart-legend__label">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function useHiddenSeries() {
  const [hiddenKeys, setHiddenKeys] = useState(new Set());
  function toggle(key) {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }
  return [hiddenKeys, toggle];
}

function SimpleBarChart({ data, xKey, yKey, xLabel, yLabel, fill = 'var(--color-chart-1)', suffix = '' }) {
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">{yLabel}</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barSize={50}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-primary-50)', radius: 4 }} />
            <Bar dataKey={yKey} fill={fill} radius={[0, 0, 0, 0]} activeBar={{ fill: 'var(--color-chart-3)', cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
        <p className="dv-bar-x-label">{xLabel}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Dashboard 1 — Account Health Score widgets                         */
/* ================================================================== */

function AccountHealthTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>#</th><th>Opp ID</th><th>Opp Name</th><th>Created Date</th></tr></thead>
      <tbody>
        {HEALTH_TABLE_DATA.map((row) => (
          <tr key={row.id}><td>{row.id}.</td><td>{row.oppId}</td><td>{row.oppName}</td><td>{row.date}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function AccountPieChart() {
  return <SimplePieChart data={HEALTH_PIE_DATA} />;
}

function AccountBarChart() {
  return <SimpleBarChart data={HEALTH_BAR_DATA} xKey="segment" yKey="score" xLabel="Account Segment" yLabel="Account Health Score" />;
}

function AtRiskTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Account Name</th><th>Account Category</th><th>Account ARR</th><th>Account Pulse</th></tr></thead>
      <tbody>
        {AT_RISK_DATA.map((row, i) => (
          <tr key={i}><td>{row.name}</td><td>{row.category}</td><td>{row.arr}</td><td>{row.pulse}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function HealthTrendChart() {
  const [hidden, toggle] = useHiddenSeries();
  const series = [
    { key: 'enterprise', label: 'Enterprise', color: 'var(--color-chart-1)' },
    { key: 'midMarket', label: 'Mid-Market', color: 'var(--color-chart-3)' },
    { key: 'smb', label: 'SMB', color: 'var(--color-chart-5)' },
  ];
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Health Score</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={HEALTH_TREND_DATA}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[70, 100]} tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            {series.filter((s) => !hidden.has(s.key)).map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} name={s.label} dot={{ r: 4, fill: s.color }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <ChartLegend series={series} hiddenKeys={hidden} onToggle={toggle} />
      </div>
    </div>
  );
}

function EngagementTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Account</th><th>Logins</th><th>Feature Adoption</th><th>Open Tickets</th><th>NPS</th></tr></thead>
      <tbody>
        {ENGAGEMENT_TABLE_DATA.map((row, i) => (
          <tr key={i}><td>{row.account}</td><td>{row.logins}</td><td>{row.adoption}</td><td>{row.tickets}</td><td>{row.nps}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================== */
/*  Dashboard 2 — Sales Cycle Efficiency widgets                       */
/* ================================================================== */

function CycleByStageChart() {
  return <SimpleBarChart data={CYCLE_BY_STAGE_DATA} xKey="stage" yKey="days" xLabel="Pipeline Stage" yLabel="Average Days" />;
}

function WinRateChart() {
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Win Rate (%)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={WIN_RATE_DATA} barSize={50} layout="vertical">
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" horizontal={false} />
            <XAxis type="number" domain={[0, 50]} tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="rep" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-primary-50)', radius: 4 }} />
            <Bar dataKey="rate" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} activeBar={{ fill: 'var(--color-primary-300)', cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DealsByStagePie() {
  return <SimplePieChart data={DEALS_BY_STAGE_PIE} />;
}

function PipelineVelocityTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Metric</th><th>Value</th><th>vs Last Quarter</th></tr></thead>
      <tbody>
        {PIPELINE_VELOCITY_DATA.map((row, i) => (
          <tr key={i}>
            <td>{row.metric}</td>
            <td>{row.value}</td>
            <td className={row.change.startsWith('+') ? 'dv-positive' : 'dv-negative'}>{row.change}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StalledDealsTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Deal</th><th>Rep</th><th>Stage</th><th>Value</th><th>Days Stalled</th><th>Last Activity</th></tr></thead>
      <tbody>
        {STALLED_DEALS_DATA.map((row, i) => (
          <tr key={i}><td>{row.deal}</td><td>{row.rep}</td><td>{row.stage}</td><td>{row.value}</td><td className="dv-negative">{row.daysStalled}</td><td>{row.lastActivity}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function CloseRateTrendChart() {
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Close Rate (%)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={CLOSE_RATE_TREND_DATA}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 50]} tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            <Area type="monotone" dataKey="rate" stroke="var(--color-chart-1)" fill="var(--color-chart-2)" strokeWidth={2} name="Close Rate" dot={{ r: 4, fill: 'var(--color-chart-1)' }} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="dv-bar-x-label">Month</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Dashboard 3 — Marketing Returns widgets                            */
/* ================================================================== */

function ChannelROIChart() {
  return <SimpleBarChart data={CHANNEL_ROI_DATA} xKey="channel" yKey="roi" xLabel="Marketing Channel" yLabel="ROI (%)" />;
}

function LeadSourcePie() {
  return <SimplePieChart data={LEAD_SOURCE_PIE} />;
}

function CampaignTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Campaign</th><th>Spend</th><th>Leads</th><th>Conv. Rate</th><th>Revenue</th></tr></thead>
      <tbody>
        {CAMPAIGN_TABLE_DATA.map((row, i) => (
          <tr key={i}><td>{row.name}</td><td>{row.spend}</td><td>{row.leads}</td><td>{row.conversion}</td><td>{row.revenue}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function CostPerLeadChart() {
  return <SimpleBarChart data={COST_PER_LEAD_DATA} xKey="channel" yKey="cpl" xLabel="Channel" yLabel="Cost Per Lead ($)" />;
}

function MonthlySpendTrendChart() {
  const [hidden, toggle] = useHiddenSeries();
  const series = [
    { key: 'revenue', label: 'Revenue', color: 'var(--color-chart-1)' },
    { key: 'spend', label: 'Spend', color: 'var(--color-chart-3)' },
  ];
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Amount ($ K)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MONTHLY_SPEND_TREND_DATA}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            {series.filter((s) => !hidden.has(s.key)).map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} name={s.label} dot={{ r: 4, fill: s.color }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <ChartLegend series={series} hiddenKeys={hidden} onToggle={toggle} />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Dashboard 4 — Profitability Analysis widgets                       */
/* ================================================================== */

function RevenueVsCostChart() {
  const [hidden, toggle] = useHiddenSeries();
  const series = [
    { key: 'revenue', label: 'Revenue', color: 'var(--color-chart-1)' },
    { key: 'cost', label: 'Cost', color: 'var(--color-chart-3)' },
  ];
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Amount ($ K)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={REVENUE_VS_COST_DATA} barSize={30}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="product" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<MultiBarTooltip />} cursor={{ fill: 'var(--color-primary-50)', radius: 4 }} />
            {series.filter((s) => !hidden.has(s.key)).map((s) => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.label} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend series={series} hiddenKeys={hidden} onToggle={toggle} type="bar" />
      </div>
    </div>
  );
}

function MarginBySegmentPie() {
  return <SimplePieChart data={MARGIN_BY_SEGMENT_PIE} />;
}

function ProfitabilityTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Product</th><th>Revenue</th><th>COGS</th><th>Gross Margin</th><th>Net Margin</th></tr></thead>
      <tbody>
        {PROFITABILITY_TABLE_DATA.map((row, i) => (
          <tr key={i}><td>{row.product}</td><td>{row.revenue}</td><td>{row.cogs}</td><td>{row.gross}</td><td>{row.net}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function MonthlyProfitTrend() {
  const [hidden, toggle] = useHiddenSeries();
  const series = [
    { key: 'revenue', label: 'Revenue', color: 'var(--color-chart-1)' },
    { key: 'profit', label: 'Profit', color: 'var(--color-chart-3)' },
  ];
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Amount ($ K)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MONTHLY_PROFIT_TREND}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            {series.filter((s) => !hidden.has(s.key)).map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} name={s.label} dot={{ r: 4, fill: s.color }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <ChartLegend series={series} hiddenKeys={hidden} onToggle={toggle} />
      </div>
    </div>
  );
}

function CostBreakdownPie() {
  return <SimplePieChart data={COST_BREAKDOWN_PIE} />;
}

function TopProductsTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Product</th><th>Revenue</th><th>Net Margin</th><th>Growth</th><th>Customers</th></tr></thead>
      <tbody>
        {TOP_PRODUCTS_TABLE.map((row, i) => (
          <tr key={i}>
            <td>{row.product}</td><td>{row.revenue}</td><td>{row.netMargin}</td>
            <td className={row.growth.startsWith('+') ? 'dv-positive' : 'dv-negative'}>{row.growth}</td>
            <td>{row.customers}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================== */
/*  Dashboard 5 — Customer Acquisition Metrics widgets                 */
/* ================================================================== */

function CACByChannelChart() {
  return <SimpleBarChart data={CAC_BY_CHANNEL_DATA} xKey="channel" yKey="cac" xLabel="Acquisition Channel" yLabel="CAC ($)" />;
}

function ConversionFunnelChart() {
  const [hiddenIndices, setHiddenIndices] = useState(new Set());

  function toggleIndex(i) {
    setHiddenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const visibleData = CONVERSION_FUNNEL_DATA.filter((_, i) => !hiddenIndices.has(i));
  const funnelSeries = CONVERSION_FUNNEL_DATA.map((d, i) => ({
    key: d.stage,
    label: d.stage,
    color: CHART_COLORS[i],
  }));

  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Count</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={visibleData} barSize={50}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-primary-50)', radius: 4 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {visibleData.map((d) => {
                const origIdx = CONVERSION_FUNNEL_DATA.indexOf(d);
                return <Cell key={d.stage} fill={CHART_COLORS[origIdx]} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="dv-chart-legend">
          {funnelSeries.map((s, i) => {
            const hidden = hiddenIndices.has(i);
            return (
              <div
                key={s.key}
                className={`dv-chart-legend__item ${hidden ? 'dv-chart-legend__item--hidden' : ''}`}
                onClick={() => toggleIndex(i)}
              >
                <div className="dv-chart-legend__swatch dv-chart-legend__swatch--bar" style={{ backgroundColor: s.color }} />
                <span className="dv-chart-legend__label">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NewCustomersTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Customer</th><th>Deal Size</th><th>Source</th><th>Rep</th><th>Close Date</th></tr></thead>
      <tbody>
        {NEW_CUSTOMERS_TABLE.map((row, i) => (
          <tr key={i}><td>{row.name}</td><td>{row.deal}</td><td>{row.source}</td><td>{row.rep}</td><td>{row.date}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function AcquisitionTrendChart() {
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">New Customers</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={ACQUISITION_TREND_DATA}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            <Area type="monotone" dataKey="customers" stroke="var(--color-chart-1)" fill="var(--color-primary-50)" strokeWidth={2} name="Customers" dot={{ r: 4, fill: 'var(--color-chart-1)' }} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="dv-bar-x-label">Month</p>
      </div>
    </div>
  );
}

function LTVByChannelChart() {
  return <SimpleBarChart data={LTV_BY_CHANNEL_DATA} xKey="channel" yKey="ltv" xLabel="Acquisition Channel" yLabel="LTV ($)" />;
}

function PaybackTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Channel</th><th>CAC</th><th>LTV</th><th>Payback Period</th><th>LTV:CAC</th></tr></thead>
      <tbody>
        {PAYBACK_TABLE_DATA.map((row, i) => (
          <tr key={i}><td>{row.channel}</td><td>{row.cac}</td><td>{row.ltv}</td><td>{row.payback}</td><td>{row.ratio}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================== */
/*  Dashboard 6 — Cost-Benefit Analysis widgets                        */
/* ================================================================== */

function InitiativeROIChart() {
  return <SimpleBarChart data={INITIATIVE_ROI_DATA} xKey="initiative" yKey="roi" xLabel="Initiative" yLabel="ROI (%)" fill="var(--color-chart-1)" />;
}

function CostAllocationPie() {
  return <SimplePieChart data={COST_ALLOCATION_PIE} />;
}

function InitiativesTable() {
  return (
    <table className="dv-table">
      <thead><tr><th>Initiative</th><th>Status</th><th>Investment</th><th>Projected Savings</th><th>Timeline</th></tr></thead>
      <tbody>
        {INITIATIVES_TABLE_DATA.map((row, i) => (
          <tr key={i}><td>{row.name}</td><td>{row.status}</td><td>{row.investment}</td><td>{row.savings}</td><td>{row.timeline}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function SavingsProjectionChart() {
  const [hidden, toggle] = useHiddenSeries();
  const series = [
    { key: 'actual', label: 'Actual', color: 'var(--color-chart-1)' },
    { key: 'projected', label: 'Projected', color: 'var(--color-chart-3)', dashed: true },
  ];
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Savings ($ K)</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={SAVINGS_PROJECTION_DATA}>
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<LineTooltip />} />
            {series.filter((s) => !hidden.has(s.key)).map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} name={s.label} dot={{ r: 4, fill: s.color }} strokeDasharray={s.dashed ? '6 3' : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <ChartLegend series={series} hiddenKeys={hidden} onToggle={toggle} />
      </div>
    </div>
  );
}

function DeptEfficiencyChart() {
  return (
    <div className="dv-bar-wrapper">
      <span className="dv-bar-y-label">Efficiency Score</span>
      <div style={{ width: '100%', paddingLeft: 40 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={DEPT_EFFICIENCY_DATA} barSize={50} layout="vertical">
            <CartesianGrid strokeDasharray="0" stroke="var(--color-neutral-100)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="dept" tick={{ fontFamily: 'var(--font-family-primary)', fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--color-primary-50)', radius: 4 }} />
            <Bar dataKey="score" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} activeBar={{ fill: 'var(--color-chart-3)', cursor: 'pointer' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Widget content renderer                                            */
/* ================================================================== */

const WIDGET_COMPONENTS = {
  /* Dashboard 1 */
  'health-overview': AccountHealthTable,
  'health-by-category': AccountPieChart,
  'health-by-segment': AccountBarChart,
  'at-risk': AtRiskTable,
  'health-trend': HealthTrendChart,
  'engagement-metrics': EngagementTable,
  /* Dashboard 2 */
  'cycle-by-stage': CycleByStageChart,
  'win-rate-by-rep': WinRateChart,
  'deals-by-stage': DealsByStagePie,
  'pipeline-velocity': PipelineVelocityTable,
  'stalled-deals': StalledDealsTable,
  'close-rate-trend': CloseRateTrendChart,
  /* Dashboard 3 */
  'channel-roi': ChannelROIChart,
  'lead-source': LeadSourcePie,
  'campaign-performance': CampaignTable,
  'cost-per-lead': CostPerLeadChart,
  'monthly-spend-trend': MonthlySpendTrendChart,
  /* Dashboard 4 */
  'revenue-vs-cost': RevenueVsCostChart,
  'margin-by-segment': MarginBySegmentPie,
  'profitability-table': ProfitabilityTable,
  'monthly-trend': MonthlyProfitTrend,
  'cost-breakdown': CostBreakdownPie,
  'top-products': TopProductsTable,
  /* Dashboard 5 */
  'cac-by-channel': CACByChannelChart,
  'conversion-funnel': ConversionFunnelChart,
  'new-customers': NewCustomersTable,
  'acquisition-trend': AcquisitionTrendChart,
  'ltv-by-channel': LTVByChannelChart,
  'payback-period': PaybackTable,
  /* Dashboard 6 */
  'initiative-roi': InitiativeROIChart,
  'cost-allocation': CostAllocationPie,
  'initiatives-table': InitiativesTable,
  'savings-projection': SavingsProjectionChart,
  'dept-efficiency': DeptEfficiencyChart,
};

function WidgetContent({ widgetId }) {
  const Component = WIDGET_COMPONENTS[widgetId];
  if (Component) return <Component />;
  return <div className="dv-placeholder">Widget content</div>;
}

/* ================================================================== */
/*  Edit Panel — widget list sidebar                                   */
/* ================================================================== */

function WidgetItemMenu({ onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="dv-edit-panel__menu" ref={ref}>
      <button className="dv-edit-panel__menu-item" type="button" onClick={onClose}>
        <PencilSimple size={14} weight="regular" color="var(--color-text-secondary)" />
        Edit Widget
      </button>
      <button className="dv-edit-panel__menu-item dv-edit-panel__menu-item--danger" type="button" onClick={onClose}>
        Delete
      </button>
    </div>
  );
}

function WidgetFieldItem({ widget, checked, onToggle, onDotsClick, openMenuId, onCloseMenu }) {
  const labelRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = labelRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [widget.title]);

  return (
    <div
      className="dv-edit-panel__item"
      onClick={() => onToggle(widget.id)}
      onMouseEnter={() => isTruncated && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`dv-edit-panel__checkbox ${checked ? 'dv-edit-panel__checkbox--checked' : ''}`}
        aria-label={checked ? `Hide ${widget.title}` : `Show ${widget.title}`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span ref={labelRef} className="dv-edit-panel__item-label">{widget.title}</span>
      <div className="dv-edit-panel__item-actions">
        <button
          className="dv-edit-panel__dots-btn"
          type="button"
          onClick={(e) => { e.stopPropagation(); onDotsClick(widget.id); }}
        >
          <DotsThree size={16} weight="bold" color="var(--color-text-secondary)" />
        </button>
        {openMenuId === widget.id && (
          <WidgetItemMenu onClose={onCloseMenu} />
        )}
      </div>
      {showTooltip && (
        <div className="dv-edit-panel__item-tooltip">{widget.title}</div>
      )}
    </div>
  );
}

function EditPanel({ allWidgets, visibleIds, onToggle, search, onSearchChange }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="dv-edit-panel">
      <h3 className="dv-edit-panel__title">Widgets</h3>

      <div className="dv-edit-panel__search">
        <MagnifyingGlass size={14} weight="regular" color="var(--color-text-secondary)" />
        <input
          className="dv-edit-panel__search-input"
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="dv-edit-panel__list">
        {allWidgets
          .filter((w) => w.title.toLowerCase().includes(search.toLowerCase()))
          .map((w) => (
            <WidgetFieldItem
              key={w.id}
              widget={w}
              checked={visibleIds.includes(w.id)}
              onToggle={onToggle}
              onDotsClick={(id) => setOpenMenuId(openMenuId === id ? null : id)}
              openMenuId={openMenuId}
              onCloseMenu={() => setOpenMenuId(null)}
            />
          ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Share Dashboard Dialog                                             */
/* ================================================================== */

function ShareDialog({ onClose }) {
  const [visibility, setVisibility] = useState('private');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleCopyLink() {
    navigator.clipboard.writeText('https://app.petavue./dashboard/shared/ce57cbec-68c1-421e-9dad').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share-dialog__overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Share Dashboard">
        {/* Header */}
        <div className="share-dialog__header">
          <h3 className="share-dialog__title">Share Dashboard</h3>
          <button className="share-dialog__close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} weight="regular" color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Body — visibility options */}
        <div className="share-dialog__body">
          <div className="share-dialog__options">
            {/* Private */}
            <button
              className={`share-dialog__option ${visibility === 'private' ? 'share-dialog__option--active' : ''}`}
              type="button"
              onClick={() => setVisibility('private')}
            >
              <span className="share-dialog__option-icon">
                <LockKey size={16} weight="regular" color="var(--color-text-secondary)" />
              </span>
              <div className="share-dialog__option-text">
                <span className={`share-dialog__option-title ${visibility === 'private' ? '' : 'share-dialog__option-title--muted'}`}>
                  Private
                </span>
                <span className="share-dialog__option-desc">Only the owner can view</span>
              </div>
              {visibility === 'private' && (
                <Check size={16} weight="regular" color="var(--color-text-primary)" />
              )}
            </button>

            <div className="share-dialog__divider" />

            {/* Shared */}
            <button
              className={`share-dialog__option ${visibility === 'shared' ? 'share-dialog__option--active' : ''}`}
              type="button"
              onClick={() => setVisibility('shared')}
            >
              <span className="share-dialog__option-icon">
                <Buildings size={16} weight="regular" color="var(--color-text-secondary)" />
              </span>
              <div className="share-dialog__option-text">
                <span className={`share-dialog__option-title ${visibility === 'shared' ? '' : 'share-dialog__option-title--muted'}`}>
                  Anyone in your org can view
                </span>
                <span className="share-dialog__option-desc">Share with anyone within the organization</span>
              </div>
              {visibility === 'shared' && (
                <Check size={16} weight="regular" color="var(--color-text-primary)" />
              )}
            </button>
          </div>
        </div>

        {/* Footer — Copy Link (only when shared) */}
        {visibility === 'shared' && (
          <div className="share-dialog__footer">
            <button className="share-dialog__copy-btn" type="button" onClick={handleCopyLink}>
              <LinkSimple size={12} weight="regular" color="var(--color-white)" />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Widget grid item with resize handle                                */
/* ================================================================== */

function WidgetGridItem({
  id, isFull, dragId, dragOverId,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onToggleFullWidth, widget, description, onRemove, onNavigate,
}) {
  const itemRef = useRef(null);

  function handleResizeMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const gridEl = itemRef.current?.parentElement;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();
    const gridMid = gridRect.left + gridRect.width / 2;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(ev) {
      const pastMid = ev.clientX > gridMid;
      if (pastMid && !isFull) onToggleFullWidth(id);
      else if (!pastMid && isFull) onToggleFullWidth(id);
    }

    function onMouseUp() {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div
      ref={itemRef}
      className={[
        'dashboard-view__grid-item',
        isFull ? 'dashboard-view__grid-item--full' : '',
        dragId === id ? 'dashboard-view__grid-item--dragging' : '',
        dragOverId === id ? 'dashboard-view__grid-item--drag-over' : '',
      ].filter(Boolean).join(' ')}
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => onDragOver(e, id)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(id)}
      onDragEnd={onDragEnd}
    >
      <DashboardWidget
        title={widget.title}
        description={description}
        editing
        onRemove={onRemove}
        onNavigate={onNavigate}
      >
        <WidgetContent widgetId={id} />
      </DashboardWidget>
      {/* Right-edge resize handle */}
      <div
        className="dashboard-view__resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

/* ================================================================== */
/*  Main page                                                          */
/* ================================================================== */

export function DashboardView({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  onBack,
  dashboardId = 2,
  menuOpen,
  onMenuToggle,
}) {
  const config = DASHBOARD_CONFIGS[dashboardId] || DASHBOARD_CONFIGS[2];
  const allWidgets = config.widgets;

  const [editing, setEditing] = useState(false);
  const [sageOpen, setSageOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [visibleIds, setVisibleIds] = useState(
    allWidgets.filter((w) => w.defaultVisible).map((w) => w.id)
  );
  const [editSearch, setEditSearch] = useState('');
  const [savedIds, setSavedIds] = useState(visibleIds);
  /* Track which widgets span full width */
  const [fullWidthIds, setFullWidthIds] = useState(() => {
    return new Set(allWidgets.filter((w) => w.fullWidth).map((w) => w.id));
  });
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  /* Reset visible widgets when dashboard changes */
  useEffect(() => {
    const defaults = config.widgets.filter((w) => w.defaultVisible).map((w) => w.id);
    const defaultFull = new Set(config.widgets.filter((w) => w.fullWidth).map((w) => w.id));
    setVisibleIds(defaults);
    setSavedIds(defaults);
    setFullWidthIds(defaultFull);
    setEditing(false);
    setEditSearch('');
  }, [dashboardId]);

  const [savedFullWidth, setSavedFullWidth] = useState(new Set());

  function handleEditStart() {
    setSavedIds(visibleIds);
    setSavedFullWidth(new Set(fullWidthIds));
    setEditing(true);
  }

  function handleEditCancel() {
    setVisibleIds(savedIds);
    setFullWidthIds(savedFullWidth);
    setEditing(false);
    setEditSearch('');
  }

  function handleEditSave() {
    setSavedIds(visibleIds);
    setSavedFullWidth(new Set(fullWidthIds));
    setEditing(false);
    setEditSearch('');
  }

  function handleDragStart(id) {
    setDragId(id);
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    setVisibleIds((prev) => {
      const arr = [...prev];
      const fromIdx = arr.indexOf(dragId);
      const toIdx = arr.indexOf(targetId);
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, dragId);
      return arr;
    });
    setDragId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  function toggleFullWidth(id) {
    setFullWidthIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleWidget(id) {
    setVisibleIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function handleRemoveWidget(id) {
    setVisibleIds((prev) => prev.filter((v) => v !== id));
  }

  return (
    <div className="dashboard-view">
      <MenuBar
        items={NAV_ITEMS}
        activeId="dashboards-pv"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      {/* Edit panel — slides in from left */}
      {editing && (
        <EditPanel
          allWidgets={allWidgets}
          visibleIds={visibleIds}
          onToggle={handleToggleWidget}
          search={editSearch}
          onSearchChange={setEditSearch}
        />
      )}

      <div className="dashboard-view__body">
        {/* Header */}
        <div className="dashboard-view__header">
          {editing ? (
            <>
              <div className="dashboard-view__breadcrumb">
                <button
                  className="dashboard-view__back-btn"
                  type="button"
                  onClick={handleEditCancel}
                  aria-label="Back"
                >
                  <CaretLeft size={16} weight="regular" color="var(--color-text-primary)" />
                </button>
                <span className="dashboard-view__breadcrumb-name">
                  {config.name}
                </span>
              </div>
              <div className="dashboard-view__header-right">
                <Button variant="ghost" size="md" label="Cancel" onClick={handleEditCancel} />
                <Button variant="primary" size="md" label="Save" onClick={handleEditSave} />
              </div>
            </>
          ) : (
            <>
              <div className="dashboard-view__breadcrumb">
                <button
                  className="dashboard-view__breadcrumb-link"
                  type="button"
                  onClick={onBack}
                >
                  Dashboards
                </button>
                <CaretRight size={16} weight="regular" color="var(--color-text-disabled)" />
                <div className="dashboard-view__breadcrumb-title">
                  <span className="dashboard-view__breadcrumb-name">
                    {config.name}
                  </span>
                  <CaretDown size={16} weight="regular" color="var(--color-text-primary)" />
                </div>
              </div>

              <div className="dashboard-view__header-right">
                <LastUpdatedButton />
                <div className="dashboard-view__divider" />
                <Button variant="ghost" size="md" icon={Database} label="Data Sync" />
                <Button variant="secondary" size="md" icon={LockKey} label="Share" onClick={() => setShareOpen(true)} />
                <Button variant="secondary" size="md" icon={PencilSimple} label="Edit" onClick={handleEditStart} />
                <button
                  className="dashboard-view__sage-btn"
                  type="button"
                  onClick={() => setSageOpen(true)}
                >
                  <Sparkle size={12} weight="regular" color="var(--color-white)" />
                  Sage
                </button>
              </div>
            </>
          )}
        </div>

        {/* Widget Grid */}
        <div className={`dashboard-view__grid ${editing ? 'dashboard-view__grid--editing' : ''}`}>
          {(() => {
            /* Pre-compute effective full-width: walk through widgets tracking
               grid column. A half-width widget is forced full if it would sit
               alone — i.e. the next widget is full-width or doesn't exist. */
            const effective = new Set(fullWidthIds);
            let col = 0; // 0 = start of row, 1 = second slot
            for (let i = 0; i < visibleIds.length; i++) {
              const id = visibleIds[i];
              if (effective.has(id)) { col = 0; continue; }
              if (col === 0) {
                /* Check if there's a half-width partner after us before a full-width */
                let hasPartner = false;
                for (let j = i + 1; j < visibleIds.length; j++) {
                  if (effective.has(visibleIds[j])) break; // next is full → no partner
                  hasPartner = true; break;
                }
                if (!hasPartner) { effective.add(id); col = 0; }
                else { col = 1; }
              } else {
                col = 0;
              }
            }

            return visibleIds.map((id) => {
              const widget = allWidgets.find((w) => w.id === id);
              if (!widget) return null;
              const isFull = effective.has(id);

              if (editing) {
                return (
                  <WidgetGridItem
                    key={id}
                    id={id}
                    isFull={isFull}
                    dragId={dragId}
                    dragOverId={dragOverId}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onToggleFullWidth={toggleFullWidth}
                    widget={widget}
                    description={config.descriptions[id] || ''}
                    onRemove={() => handleRemoveWidget(id)}
                    onNavigate={onNavigate}
                  />
                );
              }

              return (
                <div key={id} className={isFull ? 'dashboard-view__grid-item--full' : ''}>
                  <DashboardWidget
                    title={widget.title}
                    description={config.descriptions[id] || ''}
                    editing={false}
                    onRemove={() => handleRemoveWidget(id)}
                    onNavigate={onNavigate}
                  >
                    <WidgetContent widgetId={id} />
                  </DashboardWidget>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Sage AI pane */}
      <SagePane open={sageOpen} onClose={() => setSageOpen(false)} messages={SAGE_MESSAGES[dashboardId]} />

      {/* Share dialog */}
      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
    </div>
  );
}
