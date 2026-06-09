// ABM Skills
import abmAndAccountIntelligence from "./ABM/Skill Details/abm-and-account-intelligence.json";
import abmCampaignAccountReach from "./ABM/Skill Details/abm-campaign-account-reach.json";
import abmCampaignPenetration from "./ABM/Skill Details/abm-campaign-penetration.json";
import abmTargetAccountMonitoring from "./ABM/Skill Details/abm-target-account-monitoring.json";
import accountEngagementRanking from "./ABM/Skill Details/account-engagement-ranking.json";
import accountEngagementVelocity from "./ABM/Skill Details/account-engagement-velocity.json";
import accountIntentShiftBrief from "./ABM/Skill Details/account-intent-shift-brief.json";
import buyerJourneyAnalysis from "./ABM/Skill Details/buyer-journey-analysis.json";
import buyingGroupCompleteness from "./ABM/Skill Details/buying-group-completeness.json";
import buyingUnitPenetration from "./ABM/Skill Details/buying-unit-penetration.json";
import targetAccountCoverageGap from "./ABM/Skill Details/target-account-coverage-gap.json";

// Attribution & ROI Skills
import attributionModelComparison from "./Attribution & ROI/Skill Details/attribution-model-comparison.json";
import channelMixAnalysis from "./Attribution & ROI/Skill Details/channel-mix-analysis.json";
import contentPerformanceDashboard from "./Attribution & ROI/Skill Details/content-performance-dashboard.json";
import dealSourceBrief from "./Attribution & ROI/Skill Details/deal-source-brief.json";
import fieldMarketingImpact from "./Attribution & ROI/Skill Details/field-marketing-impact.json";
import leadSourceEffectiveness from "./Attribution & ROI/Skill Details/lead-source-effectiveness.json";
import leadSourceHygieneReport from "./Attribution & ROI/Skill Details/lead-source-hygiene-report.json";
import liftAnalysis from "./Attribution & ROI/Skill Details/lift-analysis.json";
import marketingPerformanceReview from "./Attribution & ROI/Skill Details/marketing-performance-review.json";
import marketingSpendDashboard from "./Attribution & ROI/Skill Details/marketing-spend-dashboard.json";
import multiTouchRevenueAttribution from "./Attribution & ROI/Skill Details/multi-touch-revenue-attribution.json";
import sourcedPipelineDiagnostic from "./Attribution & ROI/Skill Details/sourced-pipeline-diagnostic.json";

// Funnel & Conversion Skills
import closedWonJourneyRetrospective from "./Funnel & Conversion/Skill Details/closed-won-journey-retrospective.json";
import fullFunnelJourneyVisibility from "./Funnel & Conversion/Skill Details/full-funnel-journey-visibility.json";
import funnelConversionRates from "./Funnel & Conversion/Skill Details/funnel-conversion-rates.json";
import funnelDropDiagnostic from "./Funnel & Conversion/Skill Details/funnel-drop-diagnostic.json";
import leadScoringDashboard from "./Funnel & Conversion/Skill Details/lead-scoring-dashboard.json";
import lifecycleStageVelocity from "./Funnel & Conversion/Skill Details/lifecycle-stage-velocity.json";
import mqlSqlConversionTrend from "./Funnel & Conversion/Skill Details/mql-sql-conversion-trend.json";
import quarterlyFunnelReview from "./Funnel & Conversion/Skill Details/quarterly-funnel-review.json";
import sdrConversionPerformance from "./Funnel & Conversion/Skill Details/sdr-conversion-performance.json";

// Pipeline Analysis Skills
import dealPrioritizationBrief from "./Pipeline Analysis/Skill Details/deal-prioritization-brief.json";
import pipelineAgingReport from "./Pipeline Analysis/Skill Details/pipeline-aging-report.json";
import pipelineCoverageGapAnalysis from "./Pipeline Analysis/Skill Details/pipeline-coverage-gap-analysis.json";
import pipelineCoverage from "./Pipeline Analysis/Skill Details/pipeline-coverage.json";
import pipelineSnapshot from "./Pipeline Analysis/Skill Details/pipeline-snapshot.json";
import quarterlyPipelineReview from "./Pipeline Analysis/Skill Details/quarterly-pipeline-review.json";
import salesVelocity from "./Pipeline Analysis/Skill Details/sales-velocity.json";
import sourceOfPipeline from "./Pipeline Analysis/Skill Details/source-of-pipeline.json";

// ROAS Skills
import audiencePerformance from "./ROAS/Skill Details/audience-performance.json";
import budgetPacing from "./ROAS/Skill Details/budget-pacing.json";
import campaignPerformance from "./ROAS/Skill Details/campaign-performance.json";
import channelPerformanceReview from "./ROAS/Skill Details/channel-performance-review.json";
import channelRoas from "./ROAS/Skill Details/channel-roas.json";
import creativePerformance from "./ROAS/Skill Details/creative-performance.json";
import quarterlyAdPerformanceReview from "./ROAS/Skill Details/quarterly-ad-performance-review.json";
import roasDropAnalysis from "./ROAS/Skill Details/roas-drop-analysis.json";
import spendReallocationPlan from "./ROAS/Skill Details/spend-reallocation-plan.json";

// Sales Activity Skills
import activityToOutcomeCorrelation from "./Sales Activity/Skill Details/activity-to-outcome-correlation.json";
import outboundSequenceEffectiveness from "./Sales Activity/Skill Details/outbound-sequence-effectiveness.json";
import quarterlyActivityReview from "./Sales Activity/Skill Details/quarterly-activity-review.json";
import repActivityMix from "./Sales Activity/Skill Details/rep-activity-mix.json";
import repPerformanceAndCommission from "./Sales Activity/Skill Details/rep-performance-and-commission.json";
import repPerformanceScorecard from "./Sales Activity/Skill Details/rep-performance-scorecard.json";
import sdrCapacityUtilization from "./Sales Activity/Skill Details/sdr-capacity-utilization.json";
import sdrHitList from "./Sales Activity/Skill Details/sdr-hit-list.json";

const WIDGET_ICONS = [
  "ChartBar",
  "ChartLine",
  "Table",
  "Gauge",
  "Funnel",
  "GridFour",
  "ChartPieSlice",
  "Trophy",
  "FlowArrow",
  "ChartScatter"
];

function generateUid(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    const char = slug.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let uid = "";
  let seed = Math.abs(hash);
  for (let i = 0; i < 16; i++) {
    uid += chars[seed % chars.length];
    seed = Math.floor(seed / chars.length) + slug.charCodeAt(i % slug.length);
  }
  return uid;
}

function transformSkill(raw) {
  const uid = generateUid(raw.id);

  return {
    uid,
    id: raw.id,
    title: raw.name,
    category: raw.workstreamName?.toUpperCase() || "UNCATEGORIZED",
    workstreamId: raw.workstreamId,
    renderType: raw.renderType || "dashboard",
    tagline: raw.description,
    status: raw.badges?.ready ? "Ready" : "In Development",
    build_time: raw.badges?.buildTime || "~10 min",
    widget_count: raw.badges?.widgetCount || 0,
    data_sources: raw.connectors || [],
    also_surfaces: raw.alsoSurfaces || [],
    before_we_run: {
      subtitle: "We'll ask a few quick questions to tailor the output:",
      questions: raw.beforeWeRun || []
    },
    what_youll_get: {
      subtitle: "Your dashboard will include:",
      widgets: (raw.whatYoullGet || []).map((w, idx) => ({
        name: w.name,
        description: w.desc,
        icon: WIDGET_ICONS[idx % WIDGET_ICONS.length]
      }))
    },
    cta: {
      heading: "Ready to build?",
      subtext: raw.callout || `Run this skill to generate your ${raw.name} dashboard.`,
      sign_off_note: "Usually takes " + (raw.badges?.buildTime || "~10 min")
    }
  };
}

const rawSkills = [
  // ABM
  abmAndAccountIntelligence,
  abmCampaignAccountReach,
  abmCampaignPenetration,
  abmTargetAccountMonitoring,
  accountEngagementRanking,
  accountEngagementVelocity,
  accountIntentShiftBrief,
  buyerJourneyAnalysis,
  buyingGroupCompleteness,
  buyingUnitPenetration,
  targetAccountCoverageGap,
  // Attribution & ROI
  attributionModelComparison,
  channelMixAnalysis,
  contentPerformanceDashboard,
  dealSourceBrief,
  fieldMarketingImpact,
  leadSourceEffectiveness,
  leadSourceHygieneReport,
  liftAnalysis,
  marketingPerformanceReview,
  marketingSpendDashboard,
  multiTouchRevenueAttribution,
  sourcedPipelineDiagnostic,
  // Funnel & Conversion
  closedWonJourneyRetrospective,
  fullFunnelJourneyVisibility,
  funnelConversionRates,
  funnelDropDiagnostic,
  leadScoringDashboard,
  lifecycleStageVelocity,
  mqlSqlConversionTrend,
  quarterlyFunnelReview,
  sdrConversionPerformance,
  // Pipeline Analysis
  dealPrioritizationBrief,
  pipelineAgingReport,
  pipelineCoverageGapAnalysis,
  pipelineCoverage,
  pipelineSnapshot,
  quarterlyPipelineReview,
  salesVelocity,
  sourceOfPipeline,
  // ROAS
  audiencePerformance,
  budgetPacing,
  campaignPerformance,
  channelPerformanceReview,
  channelRoas,
  creativePerformance,
  quarterlyAdPerformanceReview,
  roasDropAnalysis,
  spendReallocationPlan,
  // Sales Activity
  activityToOutcomeCorrelation,
  outboundSequenceEffectiveness,
  quarterlyActivityReview,
  repActivityMix,
  repPerformanceAndCommission,
  repPerformanceScorecard,
  sdrCapacityUtilization,
  sdrHitList
];

const allSkills = rawSkills.map(transformSkill);

const SKILLS_BY_UID = {};
const SKILLS_BY_ID = {};
const SKILLS_BY_WORKSTREAM = {};

for (const skill of allSkills) {
  SKILLS_BY_UID[skill.uid] = skill;
  SKILLS_BY_ID[skill.id] = skill;

  if (!SKILLS_BY_WORKSTREAM[skill.workstreamId]) {
    SKILLS_BY_WORKSTREAM[skill.workstreamId] = [];
  }
  SKILLS_BY_WORKSTREAM[skill.workstreamId].push(skill);
}

export function getSkillByUid(uid) {
  return SKILLS_BY_UID[uid] || null;
}

export function getSkillById(id) {
  return SKILLS_BY_ID[id] || null;
}

const WORKSTREAM_ID_MAP = {
  "ws_a1b2c3d4e5f6g7h8": "attribution",
  "ws_b2c3d4e5f6g7h8i9": "pipeline",
  "ws_c3d4e5f6g7h8i9j0": "abm",
  "ws_d4e5f6g7h8i9j0k1": "funnel",
  "ws_e5f6g7h8i9j0k1l2": "roas",
  "ws_f6g7h8i9j0k1l2m3": "sales-activity"
};

export function getSkillsByWorkstream(workstreamId) {
  const mappedId = WORKSTREAM_ID_MAP[workstreamId] || workstreamId;
  return SKILLS_BY_WORKSTREAM[mappedId] || [];
}

export function getAllSkills() {
  return allSkills;
}

export { allSkills, SKILLS_BY_WORKSTREAM };
