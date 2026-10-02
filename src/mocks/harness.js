/**
 * The chat-first harness — mock data + scripted conversation.
 *
 * UX concept (voice notes, Sep 29): nothing starts from a dashboard. The
 * marketer lands on campaigns + findings that are already there, acts on them
 * from the main chat (every destination is a tool with checks), and only
 * promotes an action to an automation when they want it repeated.
 *
 * Every number here is grounded in the existing mock story so the demo holds
 * together end to end: $84,210/30d spend and the Google tracking break come
 * from the Creative & Ad Performance dashboard; 3.61× true vs 0.96× reported
 * ROAS, G_Search_NonBrand_Automation at 0.31×, the $2K/wk Meta→Google shift
 * and the 12 ICP accounts ($666K) come from the Paid Media ROI dashboard;
 * $1.12M open pipeline comes from Target Account Journey.
 */
import { currentUser } from "./db";

/* ── Campaigns ──────────────────────────────────────────────────────────
   The campaign list IS the home surface — no dashboard to build first.
   Spend sums to $84,210/30d to match the Creative & Ad Performance story. */
const CAMPAIGNS = [
  {
    id: "li-abm-tier1",
    name: "LI_ABM_Tier1_Sponsored",
    channel: "LinkedIn Ads",
    objective: "Tier-1 ABM · opportunity creation",
    status: "live",
    spend30d: 11200, leads: 38, opps: 11, pipeline: 404000, icpMatch: 91, trend: 9,
    platformConv: 64, crmOpps: 11,
    narrative:
      "Your strongest paid program. 91% of delivery lands on the Tier-1 ICP list, and it creates opportunities at 3× the account-average rate — the $404K pipeline it holds is the single best paid-to-CRM record this quarter.",
    findings: [],
    // One influenced deal, told as a timeline — the account-journey view.
    // Ad touches land before AND after the deal is created; direct
    // attribution would only ever count the form fill.
    journey: {
      account: "Fitzgerald Group",
      deal: "$96K · Proposal",
      note: "1 of 11 influenced deals — every touch matched person-by-person between LinkedIn and HubSpot.",
      events: [
        { date: "Jul 18", label: "First ad touch", detail: "Sponsored content · 3 people at the account", when: "before" },
        { date: "Jul 18 – Aug 20", label: "26 impressions · 4 clicks", detail: "5 buying-committee members matched", when: "before" },
        { date: "Aug 22", label: "Demo form filled", detail: "VP Marketing Ops — the only touch direct attribution counts", when: "before" },
        { date: "Aug 25", label: "Deal created", detail: "$96K · owner assigned in HubSpot", when: "deal" },
        { date: "Since Aug 25", label: "9 touches during the cycle", detail: "2 new committee members engaged last week", when: "after" },
      ],
    },
  },
  {
    id: "li-broad-awareness",
    name: "LI_Broad_Awareness_Q3",
    channel: "LinkedIn Ads",
    objective: "Demand gen · awareness → MQL",
    status: "live",
    spend30d: 8100, leads: 96, opps: 3, pipeline: 92000, icpMatch: 62, trend: -6,
    platformConv: 118, crmOpps: 3,
    narrative:
      "This campaign is leaking. 38% of its impressions reach titles outside your ICP — students, interns and job seekers — and it double-pays for 214 accounts the Tier-1 ABM campaign already covers. LinkedIn reports 118 conversions; HubSpot shows 3 opportunities.",
    findings: ["audience-leak", "abm-overlap"],
  },
  {
    id: "li-retargeting-dm",
    name: "LI_Retargeting_Decision_Makers",
    channel: "LinkedIn Ads",
    objective: "Retargeting · consideration → demo",
    status: "live",
    spend30d: 5000, leads: 41, opps: 5, pipeline: 176000, icpMatch: 71, trend: -11,
    platformConv: 52, crmOpps: 5,
    narrative:
      "The audience is right but the creative is exhausted: frequency has climbed to 9.4 and CTR is down 38% in three weeks. The people you most want to reach are seeing the same two ads nine times.",
    findings: ["creative-fatigue"],
  },
  {
    id: "g-display-prospecting",
    name: "G_Display_Prospecting",
    channel: "Google Ads",
    objective: "Prospecting · display",
    status: "live",
    spend30d: 14800, leads: 112, opps: 14, pipeline: 388000, icpMatch: 78, trend: 36,
    platformConv: 0, crmOpps: 14,
    narrative:
      "Your best return per dollar — 4.81× true ROAS and +36% week over week since the September budget shift. Google's own reporting shows 0 conversions for 30 days (the account-wide tag break), so judge it from the CRM column, not the platform one.",
    findings: ["tracking-break"],
  },
  {
    id: "g-search-brand",
    name: "G_Search_Brand",
    channel: "Google Ads",
    objective: "Brand search · capture",
    status: "live",
    spend30d: 12100, leads: 88, opps: 9, pipeline: 244000, icpMatch: 84, trend: 2,
    platformConv: 0, crmOpps: 9,
    narrative:
      "Steady brand capture at an 84% ICP match. Affected by the same conversion-tag break as the rest of the Google account — spend and clicks are normal, reported conversions are 0.",
    findings: ["tracking-break"],
  },
  {
    id: "g-search-nonbrand",
    name: "G_Search_NonBrand_Automation",
    channel: "Google Ads",
    objective: "Non-brand search · automated bidding",
    status: "live",
    spend30d: 8300, leads: 64, opps: 1, pipeline: 18000, icpMatch: 41, trend: -50,
    platformConv: 0, crmOpps: 1,
    narrative:
      "This week's clearest waste: $0.31 back per $1 in, down 50% week over week, and only 41% of its delivery matches your ICP. Automated bidding is buying queries your CRM history says never convert.",
    findings: ["pause-candidate"],
  },
  {
    id: "meta-summer-promo",
    name: "Meta_Summer_Promo_V3",
    channel: "Meta Ads",
    objective: "Promo · conversion",
    status: "live",
    spend30d: 13900, leads: 201, opps: 6, pipeline: 128000, icpMatch: 55, trend: -85,
    platformConv: 310, crmOpps: 6,
    narrative:
      "Meta says this campaign works (1.18× reported); your CRM says it barely breaks even (0.98× true). It's −85% week over week — but it still touches $805K of open pipeline, so it's a hold-test candidate, not a blind cut.",
    findings: ["creative-fatigue"],
  },
  {
    id: "fb-prospecting-video",
    name: "FB_Prospecting_Video_Q3",
    channel: "Meta Ads",
    objective: "Prospecting · video views → leads",
    status: "live",
    spend30d: 10810, leads: 164, opps: 4, pipeline: 96000, icpMatch: 60, trend: 4,
    platformConv: 228, crmOpps: 4,
    narrative:
      "Your biggest reach engine — 381K impressions, and video carries 76.8% of all engagement. CPL is creeping up (+34.5% portfolio-wide on Facebook) as the older ad sets fatigue; the video and carousel formats are still cheap.",
    findings: [],
  },
];

/* Context rail — the campaign's goals and ICP, each with a source and
   freshness, so every AI-filled value shows where it came from. */
const CONTEXT_FIELDS = [
  { key: "objective", label: "Optimization objective", source: "Set in chat · Sep 12", updated: "20d ago" },
  { key: "icp", label: "Target ICP", value: "B2B SaaS · 200–2,000 employees · VP+ Marketing, RevOps", source: "Onboarding chat · confirmed by you", updated: "20d ago" },
  { key: "goal", label: "Pipeline goal (quarter)", value: "$1.2M from paid", source: "HubSpot pipeline targets", updated: "4d ago" },
  { key: "window", label: "Sales cycle assumed", value: "~90 days · opportunity = Demo Scheduled", source: "Learned from 312 HubSpot outcomes", updated: "7d ago" },
];

/* Seeded change log — proof that pushes land on the campaign's own record. */
const SEED_CHANGES = {
  "li-abm-tier1": [
    { at: "Sep 18, 9:40 AM", by: "Maya Iyer", change: "Weekly budget +$2,000 — approved in chat", tool: "LinkedIn Campaign Manager" },
  ],
  "g-display-prospecting": [
    { at: "Sep 12, 8:05 AM", by: "Maya Iyer", change: "Received the $2K/wk shifted out of Meta (spend-reallocation plan)", tool: "Google Ads" },
  ],
};

/* This is a frontend-only prototype — there is no backend and never will be.
   Demo state (approvals, change logs, created automations) persists in
   localStorage so a mid-demo refresh doesn't lose the story; "Reset demo" on
   Home starts it over. */
const LS_KEY = "harness-demo-v1";

const makeDefaultState = () => ({
  changes: structuredClone(SEED_CHANGES),
  applied: {}, // actionId -> receipt
  automations: [
    {
      id: "auto-scan",
      name: "Wasted-spend & performance scan",
      origin: "Built-in · always on",
      produces: "Feeds the findings on Home and the Recommendations queue, across all channels.",
      schedule: "Daily · 6:00 AM",
      lastRun: "Today, 6:00 AM",
      status: "live",
      builtIn: true,
    },
    {
      id: "auto-digest",
      name: "Monday spend digest → #revenue",
      origin: "From chat · Sep 22",
      quote: "Send me a Monday spend digest in #revenue",
      produces: "One Slack post: spend, true ROAS and the week's biggest mover.",
      schedule: "Mondays · 8:00 AM",
      lastRun: "Mon, 8:02 AM · posted",
      status: "live",
    },
  ],
});

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge over defaults so new fields in the code survive old saves.
      return { ...makeDefaultState(), ...saved };
    }
  } catch { /* private mode etc. — run without persistence */ }
  return makeDefaultState();
}

const state = loadState();

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* best effort */ }
}

export function resetDemo() {
  try { localStorage.removeItem(LS_KEY); } catch { /* best effort */ }
  Object.assign(state, makeDefaultState());
  return { ok: true };
}

/* ── Actions — every destination is a tool, and every push shows its
      checks before anything fires. ─────────────────────────────────── */
const ACTIONS = {
  "act-li-fix": {
    id: "act-li-fix",
    title: "3 changes to LinkedIn Campaign Manager",
    destination: "LinkedIn Ads",
    changes: [
      {
        campaignId: "li-broad-awareness", campaign: "LI_Broad_Awareness_Q3",
        change: "Exclude 11 non-ICP titles (intern, student, job seeker…)",
        before: "38% of impressions outside ICP", after: "Delivery restricted to ICP titles",
        saves: "$4,210/mo",
      },
      {
        campaignId: "li-retargeting-dm", campaign: "LI_Retargeting_Decision_Makers",
        change: "Cap frequency at 4 · rotate in the 2 unused creatives",
        before: "Frequency 9.4 · CTR −38% in 3 wks", after: "Frequency ≤ 4 · fresh rotation",
        saves: "$1,380/mo",
      },
      {
        campaignId: "li-broad-awareness", campaign: "LI_Broad_Awareness_Q3",
        change: "Exclude the Tier-1 ABM audience (214 accounts)",
        before: "Double-paying for accounts ABM covers", after: "Broad reach excludes ABM list",
        saves: "$1,150/mo",
      },
    ],
    checks: [
      "Budgets untouched — no campaign gains or loses spend",
      "All 11 excluded titles checked against 90 days of converting titles: zero conversions",
      "The ABM exclusion can't touch the Tier-1 campaign itself",
      "Reversible in one click for 30 days",
    ],
    impact: "≈ $6,740/mo redirected to ICP titles · no reach lost on any converting audience",
  },
  // The generative action — campaigns get created from chat too, not only
  // fixed. Grounded in the catalog's Live-Deal Air Cover workflow (#16).
  "act-create-campaign": {
    id: "act-create-campaign",
    title: "1 new campaign — LinkedIn Campaign Manager",
    destination: "LinkedIn Ads",
    changes: [
      {
        campaignId: null, campaign: "LI_AirCover_OpenDeals (new)",
        change: "Create the campaign, paused: sponsored content to the buying committees of your 9 open deals",
        before: "—", after: "Draft in Campaign Manager · serves only when you flip it on",
        saves: "",
      },
      {
        campaignId: null, campaign: "Audience",
        change: "37 people across 9 accounts, synced from HubSpot deal contacts · refreshed daily",
        before: "—", after: "Committee-only — no broad targeting",
        saves: "",
      },
      {
        campaignId: null, campaign: "Budget",
        change: "$1,500/mo cap, taken from the unallocated NonBrand hold",
        before: "—", after: "Capped — can't creep",
        saves: "",
      },
    ],
    checks: [
      "Created paused — nothing serves until you turn it on",
      "Audience is deal-committee only; Tier-1 ABM and broad campaigns are excluded from overlap",
      "6 proof-point creatives drafted from your top closed-won stories, staged for your review",
    ],
    impact: "Air cover for $1.12M of open pipeline while sales works the deals",
  },
  // The "keep Microsoft" moment from the Nick call: the user overrides one
  // exclusion, the agent saves it as a standing rule and revises the draft.
  "act-li-keep-sdr": {
    id: "act-li-keep-sdr",
    title: "3 changes to LinkedIn Campaign Manager",
    destination: "LinkedIn Ads",
    changes: [
      {
        campaignId: "li-broad-awareness", campaign: "LI_Broad_Awareness_Q3",
        change: "Exclude 10 non-ICP titles (SDRs kept, per your rule)",
        before: "38% of impressions outside ICP", after: "Delivery restricted to ICP titles + SDRs",
        saves: "$3,500/mo",
      },
      {
        campaignId: "li-retargeting-dm", campaign: "LI_Retargeting_Decision_Makers",
        change: "Cap frequency at 4 · rotate in the 2 unused creatives",
        before: "Frequency 9.4 · CTR −38% in 3 wks", after: "Frequency ≤ 4 · fresh rotation",
        saves: "$1,380/mo",
      },
      {
        campaignId: "li-broad-awareness", campaign: "LI_Broad_Awareness_Q3",
        change: "Exclude the Tier-1 ABM audience (214 accounts)",
        before: "Double-paying for accounts ABM covers", after: "Broad reach excludes ABM list",
        saves: "$1,150/mo",
      },
    ],
    checks: [
      "Learning saved: SDR titles are never proposed for exclusion again",
      "Budgets untouched — no campaign gains or loses spend",
      "All 10 excluded titles checked against 90 days of converting titles: zero conversions",
      "Reversible in one click for 30 days",
    ],
    impact: "≈ $6,030/mo redirected to ICP titles · SDRs stay, per your rule",
  },
  "act-li-audience-only": {
    id: "act-li-audience-only",
    title: "1 change to LinkedIn Campaign Manager",
    destination: "LinkedIn Ads",
    changes: [
      {
        campaignId: "li-broad-awareness", campaign: "LI_Broad_Awareness_Q3",
        change: "Exclude 11 non-ICP titles (intern, student, job seeker…)",
        before: "38% of impressions outside ICP", after: "Delivery restricted to ICP titles",
        saves: "$4,210/mo",
      },
    ],
    checks: [
      "Budgets untouched",
      "All 11 titles checked against 90 days of converting titles: zero conversions",
      "Reversible in one click for 30 days",
    ],
    impact: "≈ $4,210/mo redirected to ICP titles",
  },
  "act-pause-nonbrand": {
    id: "act-pause-nonbrand",
    title: "1 change to Google Ads",
    destination: "Google Ads",
    changes: [
      {
        campaignId: "g-search-nonbrand", campaign: "G_Search_NonBrand_Automation",
        change: "Pause the campaign · hold its $8.3K/mo budget unallocated",
        before: "0.31× true ROAS · −50% WoW", after: "Paused · budget held for review",
        saves: "$8,300/mo",
      },
    ],
    checks: [
      "Budget is held, not reallocated — moving it is a separate decision",
      "Brand and Display campaigns untouched; winning journeys that start on Google Search all start on Brand",
      "Un-pausing restores the exact bidding state",
    ],
    impact: "Stops the clearest $8.3K/mo of waste while you decide where it goes",
  },
  "act-handoff": {
    id: "act-handoff",
    title: "2 actions: HubSpot + Slack",
    destination: "HubSpot · Slack",
    changes: [
      {
        campaignId: null, campaign: "HubSpot",
        change: "Create the list “Paid-engaged, no open opp” with the 12 accounts, owner-assigned",
        before: "12 ICP accounts invisible to sales", after: "Call sheet live in HubSpot",
        saves: "$666K potential",
      },
      {
        campaignId: null, campaign: "Slack #gtm-leadership",
        change: "Post the prioritized sheet — Walter Edwards and Rios, Rodriguez LLC, Jones Inc, Novak PLC on top",
        before: "—", after: "Sales pinged with context, not a CSV",
        saves: "",
      },
    ],
    checks: [
      "Read-only on the CRM except the one new list — no fields overwritten",
      "Accounts matched on domain; 0 ambiguous matches",
      "Owners assigned from existing account ownership",
    ],
    impact: "12 warm accounts ($666K potential) put in front of sales this morning",
  },
  "act-fatigue": {
    id: "act-fatigue",
    title: "3 changes to Meta Ads",
    destination: "Meta Ads",
    changes: [
      {
        campaignId: "meta-summer-promo", campaign: "Meta_Summer_Promo_V3",
        change: "Start a 2-week hold test (it's −85% WoW but touches $805K open pipeline)",
        before: "Spending with no incrementality proof", after: "Hold test running · verdict in 14 days",
        saves: "TBD by test",
      },
      {
        campaignId: "fb-prospecting-video", campaign: "FB_Prospecting_Video_Q3",
        change: "Retire the 3 oldest static ad sets · weight budget to video + carousel",
        before: "CPL +34.5% · leads −23%", after: "Budget on the formats still converting",
        saves: "≈ $1,900/mo",
      },
      {
        campaignId: "g-display-prospecting", campaign: "→ G_Display_Prospecting",
        change: "Shift $2K/wk of the freed Meta budget to Google Display (4.81× true ROAS)",
        before: "0.98× blended Meta return", after: "Projected +$41.4K pipeline / 30d",
        saves: "",
      },
    ],
    checks: [
      "The hold test is a pause with a measurement plan, not a cut — $805K pipeline stays monitored",
      "No audience or bid changes on the ad sets that keep running",
      "The budget shift mirrors the already-approved September reallocation pattern",
    ],
    impact: "Fatigued formats stop burning ≈ $1.9K/mo · projected +$41.4K pipeline from the shift",
  },
  "act-tracking": {
    id: "act-tracking",
    title: "2 actions: Slack + HubSpot",
    destination: "Slack · HubSpot",
    changes: [
      {
        campaignId: null, campaign: "Slack #revenue",
        change: "Post the diagnosis: gtag conversion snippet stopped firing Sep 2 (site deploy), with the 3-step fix",
        before: "Google judged on broken numbers", after: "Team sees it's a tag break, not performance",
        saves: "",
      },
      {
        campaignId: null, campaign: "HubSpot task",
        change: "Create a RevOps task: restore the conversion tag, verify with a test conversion",
        before: "—", after: "Owner + due Friday",
        saves: "",
      },
    ],
    checks: [
      "No change to the Google Ads account itself — bidding still has 90 days of history",
      "Petavue keeps scoring Google from HubSpot outcomes, so nothing downstream is blind",
    ],
    impact: "Stops a working channel being judged on a broken tag",
  },
};

/* What the assistant says right after each approval lands. */
const FOLLOWUPS = {
  "act-li-fix": {
    text: "Done — all three are live in Campaign Manager. Want me to watch for this every week? It runs in the background and you only hear from it when there's something worth approving.",
    chips: ["Run this check every Monday", "Show me what changed on the campaign", "Done for now"],
  },
  "act-li-keep-sdr": {
    text: "Done — all three are live in Campaign Manager, with SDRs kept in targeting. The rule is saved, so every future scan starts from it. Want me to watch for this every week?",
    chips: ["Run this check every Monday", "Show me what changed on the campaign", "Done for now"],
  },
  "act-create-campaign": {
    text: "Created — LI_AirCover_OpenDeals is in Campaign Manager, paused, with the 6 creatives staged for your review. Flip it live when you're happy with them; once it serves, its influence on those 9 deals shows up in each deal's journey.",
    chips: ["Done for now"],
  },
  "act-li-audience-only": {
    text: "Done — the exclusions are live. The fatigue and ABM-overlap findings stay on Home for when you want them. Want this checked weekly?",
    chips: ["Run this check every Monday", "Done for now"],
  },
  "act-pause-nonbrand": {
    text: "Paused. The $8.3K/mo stays unallocated until you decide where it goes — I'd revisit once the Google conversion tag is fixed, so the decision is made on clean numbers. Want me to guard every campaign's true ROAS this way?",
    chips: ["Guard ROAS like this weekly", "Why is Google reporting 0 conversions?", "Done for now"],
  },
  "act-handoff": {
    text: "Posted. The HubSpot list is live with owners assigned, and #gtm-leadership has the prioritized sheet. I'll flag any of the 12 that opens an opportunity. New accounts go warm like this every week — want the sweep to repeat?",
    chips: ["Watch for new accounts like this weekly", "Find where my LinkedIn ads are leaking spend", "Done for now"],
  },
  "act-fatigue": {
    text: "Applied. The hold test reports its verdict in 14 days — it'll land on Home, not in a dashboard you have to remember to check. Fatigue builds back up in 4–6 weeks; want this checked on a schedule?",
    chips: ["Repeat this check weekly", "Done for now"],
  },
  "act-tracking": {
    text: "Sent. RevOps has the task with a Friday due date, and #revenue has the context so nobody judges Google on a broken tag meanwhile. I'll keep scoring it from HubSpot outcomes. Want a daily cross-check so the next break surfaces same-day, not 30 days later?",
    chips: ["Keep checking this daily", "Should I pause G_Search_NonBrand_Automation?", "Done for now"],
  },
};

export function followUpFor(id) {
  return FOLLOWUPS[id] || null;
}

const now = () => {
  const d = new Date();
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
};

/* ── Public API ─────────────────────────────────────────────────────── */

export function overview(recsOpen) {
  const liFixed = !!state.applied["act-li-fix"] || !!state.applied["act-li-audience-only"] || !!state.applied["act-li-keep-sdr"];
  // `stat` is the one number that earns the card its place — it sits in the
  // top-right slot (where the skills cards show build time), so titles stay
  // clean of figures. `channels` drive the footer's platform logos.
  const opportunities = [
    {
      id: "opp-waste", tag: "Wasted spend", tone: "rose", stat: "$6.7K/mo",
      title: "LinkedIn spend isn't reaching your ICP",
      cause: "Non-ICP titles take 38% of broad delivery, retargeting creative is fatigued, and one campaign double-pays for 214 ABM accounts.",
      scope: "3 campaigns · last 34 days", channels: ["LinkedIn Ads"],
      campaignId: "li-broad-awareness",
      prompt: "Find where my LinkedIn ads are leaking spend",
      fixed: liFixed, fixedLabel: "Fixed — 3 changes pushed to LinkedIn",
    },
    {
      id: "opp-tracking", tag: "Check your data", tone: "amber", stat: "0 conversions · 30d",
      title: "Google's conversion tag broke on Sep 2",
      cause: "Spend and clicks are normal (clicks +64%) against 8,704 historic conversions — a tag break, not performance. Verify before judging Google.",
      scope: "Whole Google account · $35.2K/mo", channels: ["Google Ads"],
      campaignId: "g-display-prospecting",
      prompt: "Why is Google reporting 0 conversions?",
      fixed: !!state.applied["act-tracking"], fixedLabel: "Escalated — fix steps with RevOps",
    },
    {
      id: "opp-pause", tag: "Pause candidate", tone: "rose", stat: "$0.31 per $1",
      title: "G_Search_NonBrand_Automation is burning its budget",
      cause: "Down 50% week over week and only 41% ICP match — automated bidding is buying queries that never convert in your CRM.",
      scope: "1 campaign · $8.3K/mo", channels: ["Google Ads"],
      campaignId: "g-search-nonbrand",
      prompt: "Should I pause G_Search_NonBrand_Automation?",
      fixed: !!state.applied["act-pause-nonbrand"], fixedLabel: "Paused — budget held for review",
    },
    {
      id: "opp-handoff", tag: "Hand-off", tone: "blue", stat: "$666K potential",
      title: "12 ICP accounts are ad-engaged with no open opp",
      cause: "All LinkedIn-touched, all matching your winning-journey pattern — sales hasn't seen any of them yet.",
      scope: "12 accounts · ready to call", channels: ["LinkedIn Ads", "HubSpot"],
      campaignId: "li-abm-tier1",
      prompt: "Draft the call sheet for the 12 ICP accounts with no open opp",
      fixed: !!state.applied["act-handoff"], fixedLabel: "Pushed to HubSpot + #gtm-leadership",
    },
    {
      id: "opp-fatigue", tag: "Creative fatigue", tone: "amber", stat: "CPL +34.5%",
      title: "Facebook's older ad sets are wearing out",
      cause: "Leads fell 23% while CPL climbed — the fatigue sits in the static sets; video and carousel still convert at a fraction of the cost.",
      scope: "2 campaigns · Meta", channels: ["Meta Ads"],
      campaignId: "fb-prospecting-video",
      prompt: "Fix the Facebook creative fatigue",
      fixed: !!state.applied["act-fatigue"], fixedLabel: "Fixed — budget moved to live formats",
    },
  ];
  return {
    greetingName: (currentUser?.name || "there").split(" ")[0],
    checkedAgo: "2h ago",
    kpis: [
      // viz: a small drawing per tile — weekly bars, a trend line, or the
      // platform-vs-CRM comparison pair (our signature stat, drawn).
      { label: "Spend · 30d", value: "$84.2K", delta: "+16.1%", dir: "up", sub: "all channels", viz: { type: "bars", data: [52, 58, 63, 71, 84] } },
      { label: "Open pipeline", value: "$1.12M", delta: "−9%", dir: "down", sub: "vs prior 30d", viz: { type: "area", data: [1.36, 1.31, 1.28, 1.2, 1.16, 1.12] } },
      { label: "True ROAS", value: "3.61×", delta: "", dir: "flat", sub: "platforms say 0.96×", viz: { type: "compare", a: 0.96, b: 3.61 } },
      { label: "Cost per opportunity", value: "$2.1K", delta: "+6%", dir: "up", sub: "41 opps · 30d", viz: { type: "bars", data: [1.82, 1.9, 2.02, 1.96, 2.1] } },
    ],
    waiting: { recommendations: recsOpen, approvals: Object.keys(state.applied).length === 0 ? 1 : 0 },
    opportunities,
  };
}

export function listCampaigns() {
  return CAMPAIGNS.map((c) => ({ ...c, openFindings: c.findings.length, changes: undefined }));
}

export function getCampaign(id) {
  const c = CAMPAIGNS.find((x) => x.id === id);
  if (!c) return null;
  const objectiveValue = c.objective;
  return {
    ...c,
    changes: state.changes[c.id] || [],
    context: CONTEXT_FIELDS.map((f) => (f.key === "objective" ? { ...f, value: objectiveValue } : f)),
  };
}

export function listAutomations() {
  return { automations: state.automations };
}

export function toggleAutomation(id) {
  const a = state.automations.find((x) => x.id === id);
  if (a && !a.builtIn) a.status = a.status === "live" ? "paused" : "live";
  persist();
  return a;
}

export function approveAction(id) {
  const action = ACTIONS[id];
  if (!action) return null;
  const at = now();
  const receipt = {
    id, appliedAt: at, destination: action.destination,
    lines: action.changes.map((ch) => ({ campaign: ch.campaign, change: ch.change, campaignId: ch.campaignId })),
    impact: action.impact,
    undo: "Reversible for 30 days",
  };
  state.applied[id] = receipt;
  for (const ch of action.changes) {
    if (!ch.campaignId) continue;
    (state.changes[ch.campaignId] ||= []).unshift({
      at: `Today, ${at}`, by: currentUser?.name || "You", change: ch.change, tool: action.destination,
    });
  }
  persist();
  return receipt;
}

export function undoAction(id) {
  const receipt = state.applied[id];
  if (!receipt) return { ok: false };
  delete state.applied[id];
  for (const key of Object.keys(state.changes)) {
    state.changes[key] = state.changes[key].filter((e) => !receipt.lines.some((l) => l.change === e.change));
  }
  persist();
  return { ok: true };
}

const AUTOMATION_DEFS = {
  "li-waste": {
    id: "auto-li-waste",
    name: "LinkedIn wasted-spend check",
    origin: "From chat · today",
    quote: "Find where my LinkedIn ads are leaking spend",
    produces: "Findings with drafted fixes — pushes only after your approval.",
    schedule: "Mondays · 7:00 AM",
    lastRun: "Not yet run · first run Monday",
    status: "live",
    steps: [
      "Scan every live LinkedIn campaign for non-ICP delivery, creative fatigue and audience overlap",
      "Draft the fixes under the same guardrails you just approved",
      "Wait for your approval — here and in Slack",
      "Push the approved changes and report what moved",
    ],
  },
  "finance-brief": {
    id: "auto-finance-brief",
    name: "Monthly finance brief",
    origin: "From chat · today",
    quote: "Make this a monthly finance brief",
    produces: "The influence ladder — direct, influenced, in-cycle — rebuilt and posted to #revenue on the 1st.",
    schedule: "Monthly · 1st, 8:00 AM",
    lastRun: "Not yet run · first run Nov 1",
    status: "live",
    steps: [
      "Rebuild the three attribution tiers from HubSpot deals + person-matched ad touches",
      "Attach the account journey behind every influenced deal",
      "Post the one-pager to #revenue — read-only, nothing to approve",
    ],
  },
  "handoff-sweep": {
    id: "auto-handoff-sweep",
    name: "Hidden-pipeline sweep",
    origin: "From chat · today",
    quote: "Watch for new accounts like this weekly",
    produces: "New ad-engaged ICP accounts with no open opp, scored and queued for sales — pushed only after your approval.",
    schedule: "Mondays · 7:30 AM",
    lastRun: "Not yet run · first run Monday",
    status: "live",
    steps: [
      "Match ad-engaged accounts against open opportunities and sales activity in HubSpot",
      "Score the new ones against your winning-journey pattern",
      "Draft the call-sheet update and wait for your approval",
      "Push to HubSpot and post the sheet in #gtm-leadership",
    ],
  },
  "fatigue-watch": {
    id: "auto-fatigue-watch",
    name: "Creative fatigue watch",
    origin: "From chat · today",
    quote: "Repeat this check weekly",
    produces: "Fatiguing ad sets across Meta and LinkedIn, with rotation drafts ready to approve.",
    schedule: "Thursdays · 7:00 AM",
    lastRun: "Not yet run · first run Thursday",
    status: "live",
    steps: [
      "Track frequency, CTR decay and CPL by creative across Meta and LinkedIn",
      "Flag ad sets crossing the fatigue thresholds from this conversation",
      "Draft rotations and budget shifts — pushed only after your approval",
    ],
  },
  "tracking-health": {
    id: "auto-tracking-health",
    name: "Conversion tracking health check",
    origin: "From chat · today",
    quote: "Keep checking this daily",
    produces: "A daily tag-vs-CRM cross-check — the next break surfaces same-day, not 30 days later.",
    schedule: "Daily · 6:30 AM",
    lastRun: "Not yet run · first run tomorrow",
    status: "live",
    steps: [
      "Compare platform-reported conversions against HubSpot outcomes by day, per channel",
      "Flag any divergence beyond normal lag the same morning",
      "Post the diagnosis to #revenue with the fix steps",
    ],
  },
  "roas-guard": {
    id: "auto-roas-guard",
    name: "True-ROAS guard",
    origin: "From chat · today",
    quote: "Guard ROAS like this weekly",
    produces: "Any campaign under 1× true ROAS for two straight weeks, with a drafted pause or fix.",
    schedule: "Mondays · 7:00 AM",
    lastRun: "Not yet run · first run Monday",
    status: "live",
    steps: [
      "Score every live campaign on CRM-grounded ROAS, not platform-reported",
      "Flag anything under 1× for two consecutive weeks",
      "Draft the pause or restructure and wait for your approval",
    ],
  },
};

export function createAutomation(kind, quote) {
  const def = AUTOMATION_DEFS[kind];
  if (!def) return null;
  let existing = state.automations.find((a) => a.id === def.id);
  if (!existing) {
    // Clone, and carry the user's actual sentence as the card's origin quote.
    existing = { ...def, quote: quote || def.quote };
    state.automations.splice(1, 0, existing);
    persist();
  }
  return existing;
}

/* ── The scripted conversation ──────────────────────────────────────────
   One structured reply per user turn. The client animates `working` lines,
   streams `text`, then renders `blocks` (opportunities / action / automation)
   and `chips`. Matching is generous so the demo survives paraphrasing. */
export function chatReply({ text = "", branch = null, phase = "start" }) {
  const t = text.trim().toLowerCase();

  // Specific intents first: "Only the audience leak" contains "leak", so it
  // must win over the branch-detection regex below.
  if (/only.*audience|^audience leak$|just the (titles|exclusions)/.test(t)) {
    return {
      branch: "li", phase: "proposed",
      text: "Just the title exclusions, then. The other two findings stay on Home so you can come back to them.",
      blocks: [{ type: "action", action: ACTIONS["act-li-audience-only"] }],
    };
  }

  // Branch detection — jumping between branches is always allowed.
  if (/leak|wast(e|ed|ing)|where.*spend.*go|fix my linkedin|linkedin.*(leak|waste|fix|spend)/.test(t) && !/facebook|meta|google/.test(t)) {
    return {
      branch: "li", phase: "analyzed",
      working: [
        "Pulled 34 days of delivery across your 3 LinkedIn campaigns",
        "Joined audience segments to the HubSpot ICP list (312 outcomes, 90 days)",
        "Checked creative frequency, CTR trend and audience overlap",
      ],
      text:
        "Found it. **$6,740/mo — about 28% of your LinkedIn spend — isn't working for you**, in three places:",
      blocks: [{
        type: "opportunities",
        items: [
          { title: "Audience leak — $4,210/mo", detail: "LI_Broad_Awareness_Q3 serves 38% of impressions to non-ICP titles: interns, students, job seekers. None of those titles has converted in 90 days.", campaignId: "li-broad-awareness" },
          { title: "Creative fatigue — $1,380/mo", detail: "LI_Retargeting_Decision_Makers is at frequency 9.4 with CTR down 38% in three weeks. Right audience, exhausted ads.", campaignId: "li-retargeting-dm" },
          { title: "ABM overlap — $1,150/mo", detail: "LI_Broad_Awareness_Q3 double-pays for 214 accounts your Tier-1 ABM campaign already covers.", campaignId: "li-broad-awareness" },
        ],
      }],
      chips: ["Fix all three", "Only the audience leak", "Which titles are we paying for?"],
    };
  }

  if (/which titles|what titles|titles.*paying/.test(t)) {
    return {
      branch: "li", phase: "analyzed",
      text:
        "The top non-ICP titles taking spend on LI_Broad_Awareness_Q3, last 30 days:\n\n" +
        "- **Student / Intern** — $1,620 · 0 conversions ever\n" +
        "- **Job seeker (open-to-work)** — $980 · 0 conversions\n" +
        "- **Sales Development Rep** — $710 · outside your buying committee\n" +
        "- **Freelance / consultant (1-person)** — $540 · below the 200-employee floor\n" +
        "- **HR & recruiting titles** — $360 · 0 conversions\n\n" +
        "All eleven exclusions were checked against every converting title in HubSpot — there's no overlap.",
      chips: ["Fix all three", "Keep the SDR titles in", "Only the audience leak"],
    };
  }

  // The override beat: the user keeps a title the agent wanted to exclude,
  // and the correction becomes a standing rule, not a one-off.
  if (/keep.*(sdr|sales development)|don'?t exclude.*(sdr|sales development)/.test(t)) {
    return {
      branch: "li", phase: "proposed",
      text:
        "Noted — **Sales Development Reps stay in targeting.** I've saved that as a rule, not a one-off: *SDR titles are never proposed for exclusion on any LinkedIn campaign.* Every future scan starts from it, and you can reverse it any time.\n\nHere's the revised push — 10 exclusions instead of 11:",
      blocks: [{ type: "action", action: ACTIONS["act-li-keep-sdr"] }],
    };
  }

  if ((/all three|fix (them|these|all|it)|go ahead|do it|apply|yes/.test(t) && branch === "li") || /exclude those titles/.test(t)) {
    return {
      branch: "li", phase: "proposed",
      text: "Here's exactly what I'll push. Nothing fires until you approve.",
      blocks: [{ type: "action", action: ACTIONS["act-li-fix"] }],
    };
  }

  if (/pause|non.?brand/.test(t)) {
    return {
      branch: "pause", phase: "proposed",
      working: [
        "Compared G_Search_NonBrand_Automation against 90 days of CRM outcomes",
        "Checked which winning journeys touch non-brand search",
      ],
      text:
        "Yes — pause it. **G_Search_NonBrand_Automation returns $0.31 per $1** and is down 50% week over week. Your three top closed-won journeys all start on Google, but on **Brand** and **Display** — not this campaign. The one caveat: I'd hold the freed $8.3K rather than auto-reallocate, since Display is already absorbing the September shift.",
      blocks: [{ type: "action", action: ACTIONS["act-pause-nonbrand"] }],
    };
  }

  if (/call sheet|icp accounts|hand.?off|no open opp/.test(t)) {
    return {
      branch: "handoff", phase: "proposed",
      working: [
        "Matched ad-engaged accounts against open opportunities in HubSpot",
        "Scored the 12 against your winning-journey pattern",
      ],
      text:
        "**12 ICP accounts are engaging your ads with no open opportunity — $666K of potential.** The four to call first:\n\n" +
        "- **Walter, Edwards and Rios** — 9 buyers engaged · 5 SQLs · EMEA\n" +
        "- **Rodriguez LLC** — 7 buyers · 3 SQLs · EMEA\n" +
        "- **Jones Inc** — 6 buyers · 3 SQLs · NA-East\n" +
        "- **Novak PLC** — 5 buyers · 4 SQLs · APAC\n\n" +
        "All LinkedIn-touched, all matching your top winning journey. Want them in front of sales?",
      blocks: [{ type: "action", action: ACTIONS["act-handoff"] }],
    };
  }

  if (/fatigue|facebook|creative|meta/.test(t)) {
    return {
      branch: "fatigue", phase: "proposed",
      working: [
        "Pulled 30 days of Meta creative-level performance",
        "Compared format CPLs against lead-to-opp conversion in HubSpot",
      ],
      text:
        "The fatigue is real but it's **format-specific**: Facebook CPL is up 34.5% while leads fell 23%, and it's the older static ad sets doing the damage — **video and carousel still convert at a fraction of the cost** (your carousel clicks cost $0.09). And Meta_Summer_Promo_V3 is −85% WoW, but it touches $805K of open pipeline, so it gets a hold test, not a blind cut.",
      blocks: [{ type: "action", action: ACTIONS["act-fatigue"] }],
    };
  }

  if (/0 conversions|zero conversions|tracking|tag|google.*report/.test(t)) {
    return {
      branch: "tracking", phase: "proposed",
      working: [
        "Compared Google-reported conversions against HubSpot outcomes by day",
        "Checked the conversion tag against your site's deploy log",
      ],
      text:
        "**It's a tag break, not performance.** Google's conversion snippet stopped firing on **Sep 2** — the same day as a site deploy. Spend and clicks are normal (clicks +64%), HubSpot keeps recording opportunities from Google traffic, and the account has 8,704 historic conversions. Two things matter: get the tag fixed, and make sure nobody judges Google on these numbers meanwhile — it's your best channel at 4.81× true ROAS on Display.",
      blocks: [{ type: "action", action: ACTIONS["act-tracking"] }],
    };
  }

  if (/weekly|every monday|monthly|repeat|automat|schedule|keep (watching|checking)|convert.*workflow|finance brief/.test(t)) {
    // "Make THIS repeatable": the workflow matches the conversation it came
    // from — each branch converts into its own definition.
    const KIND_BY_BRANCH = {
      li: "li-waste", finance: "finance-brief", handoff: "handoff-sweep",
      fatigue: "fatigue-watch", tracking: "tracking-health", pause: "roas-guard",
    };
    const kind = /finance|brief/.test(t) ? "finance-brief" : KIND_BY_BRANCH[branch] || "li-waste";
    const automation = createAutomation(kind, text.trim());
    return {
      branch: branch || "li", phase: "automated",
      text: kind === "finance-brief"
        ? "Done — the brief rebuilds itself on the 1st and lands in #revenue. I pulled the tiers straight from this conversation; there was nothing to configure:"
        : "Done — this now repeats. I pulled the steps straight out of this conversation; there was nothing to configure:",
      blocks: [{ type: "automation", automation }],
      chips: ["Open Workflows-v2", "What else can you push changes to?"],
    };
  }

  // Create from chat — the "Create new" button on Campaigns lands here.
  // The draft is the catalog's Live-Deal Air Cover play: cover the buying
  // committees of open deals, built paused, approve-gated like everything.
  if (/create|new campaign|launch a campaign|air cover/.test(t)) {
    return {
      branch: "create", phase: "proposed",
      working: [
        "Pulled your 9 open deals and their buying committees from HubSpot",
        "Checked committee ad coverage — 5 of 9 deals currently see no ads at all",
        "Drafted audience, budget and creatives under your guardrails",
      ],
      text:
        "The campaign worth creating right now is **air cover for your open deals**: 5 of your 9 open deals' buying committees see no ads at all while sales works them. Here's the draft — it's created **paused**, so nothing serves until you flip it on:",
      blocks: [{ type: "action", action: ACTIONS["act-create-campaign"] }],
    };
  }

  // The finance ladder — Nick's #1 pain on the Scala call: he can defend
  // ~$200K of direct attribution while the influence view shows $2M, and
  // finance won't buy the gap. Three tiers, walked up in order.
  if (/finance|defend|cfo|justify/.test(t)) {
    return {
      branch: "finance", phase: "analyzed",
      working: [
        "Pulled direct-attributed deals from HubSpot (ad click → form fill)",
        "Matched ad touches to each deal's timeline, person by person",
        "Checked buying-committee ad engagement on open deals",
      ],
      text:
        "There are **three honest tiers** to that number — walk finance up them in order, starting where they already believe you:\n\n" +
        "**1 · Direct attribution — $212K, 7 deals.** Clicked an ad, filled the form. Nobody can argue with it, and it's the only tier the platforms and your current HubSpot report can see. This is why they read 0.96×.\n\n" +
        "**2 · Influenced before creation — $890K, 23 deals.** The buying committee saw 3+ ad touches in the 90 days before each deal was created — matched person-by-person between the ad platforms and HubSpot, not account-level guesswork. This is the 3.61×.\n\n" +
        "**3 · Engaged during the sale — $640K of open pipeline.** Committee members keep clicking ads *after* the deal exists, on 9 open deals — including 2 that added new committee members last week.\n\n" +
        "Every tier-2 and tier-3 deal has a journey you can open and show — first touch to today.",
      chips: ["Show me one deal's journey", "Make this a monthly finance brief", "Done for now"],
    };
  }

  if (/what else|which tools|push changes to|integrations|other systems/.test(t)) {
    return {
      branch, phase,
      text:
        "Anything you'd do in those tools yourself, one-off, straight from this chat — no workflow needed:\n\n" +
        "- **LinkedIn Ads** — audiences, exclusions, frequency caps, budgets, pause/resume\n" +
        "- **Google Ads** — the same, plus negative keywords\n" +
        "- **Meta Ads** — ad-set budgets, format weighting, hold tests\n" +
        "- **HubSpot** — lists, tasks, properties on accounts you own\n" +
        "- **Slack** — posts and digests to any connected channel\n" +
        "- **Creatives** — draft copy variants for any campaign, staged for your review\n\n" +
        "Every push shows you the exact change and its checks first. If you find yourself asking for the same thing twice, say \"make it weekly\" and it becomes a workflow.",
      chips: ["Find where my LinkedIn ads are leaking spend", "Draft the call sheet for the 12 ICP accounts with no open opp"],
    };
  }

  if (/done for now|that's all|thanks|nothing else/.test(t)) {
    return {
      branch, phase,
      text: "I'm here when you need me. The background scans keep running — anything new lands on Home, and nothing gets pushed anywhere without your approval.",
    };
  }

  // Fallback — steer into the demo without pretending to understand.
  return {
    branch, phase,
    text:
      "I can analyze anything across your connected channels and push the fix from right here. A few things worth your time this morning:",
    chips: [
      "Find where my LinkedIn ads are leaking spend",
      "Should I pause G_Search_NonBrand_Automation?",
      "Why is Google reporting 0 conversions?",
    ],
  };
}
