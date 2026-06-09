import { getAuthToken } from "../../../../api";
import { decodeJwtPayload } from "../../../../utils/jwt";

import channelRoasTile from "../../data/workstreams/ROAS/Tiles/channel-roas.json";
import campaignPerformanceTile from "../../data/workstreams/ROAS/Tiles/campaign-performance.json";
import creativePerformanceTile from "../../data/workstreams/ROAS/Tiles/creative-performance.json";
import spendReallocationPlanTile from "../../data/workstreams/ROAS/Tiles/spend-reallocation-plan.json";
import budgetPacingTile from "../../data/workstreams/ROAS/Tiles/budget-pacing.json";
import audiencePerformanceTile from "../../data/workstreams/ROAS/Tiles/audience-performance.json";
import leadSourceEffectivenessTile from "../../data/workstreams/Attribution & ROI/Tiles/lead-source-effectiveness.json";
import marketingSpendDashboardTile from "../../data/workstreams/Attribution & ROI/Tiles/marketing-spend-dashboard.json";
import liftAnalysisTile from "../../data/workstreams/Attribution & ROI/Tiles/lift-analysis.json";
import fullFunnelJourneyVisibilityTile from "../../data/workstreams/Funnel & Conversion/Tiles/full-funnel-journey-visibility.json";
import leadScoringDashboardTile from "../../data/workstreams/Funnel & Conversion/Tiles/lead-scoring-dashboard.json";
import pipelineCoverageGapAnalysisTile from "../../data/workstreams/Pipeline Analysis/Tiles/pipeline-coverage-gap-analysis.json";
import sdrConversionPerformanceTile from "../../data/workstreams/Funnel & Conversion/Tiles/sdr-conversion-performance.json";
import abmCampaignPenetrationTile from "../../data/workstreams/ABM/Tiles/abm-campaign-penetration.json";
import accountEngagementRankingTile from "../../data/workstreams/ABM/Tiles/account-engagement-ranking.json";
import buyerJourneyAnalysisTile from "../../data/workstreams/ABM/Tiles/buyer-journey-analysis.json";
import targetAccountCoverageGapTile from "../../data/workstreams/ABM/Tiles/target-account-coverage-gap.json";
import fieldMarketingImpactTile from "../../data/workstreams/Attribution & ROI/Tiles/field-marketing-impact.json";

import channelRoasDetail from "../../data/workstreams/ROAS/Skill Details/channel-roas.json";
import campaignPerformanceDetail from "../../data/workstreams/ROAS/Skill Details/campaign-performance.json";
import creativePerformanceDetail from "../../data/workstreams/ROAS/Skill Details/creative-performance.json";
import spendReallocationPlanDetail from "../../data/workstreams/ROAS/Skill Details/spend-reallocation-plan.json";
import budgetPacingDetail from "../../data/workstreams/ROAS/Skill Details/budget-pacing.json";
import audiencePerformanceDetail from "../../data/workstreams/ROAS/Skill Details/audience-performance.json";
import leadSourceEffectivenessDetail from "../../data/workstreams/Attribution & ROI/Skill Details/lead-source-effectiveness.json";
import marketingSpendDashboardDetail from "../../data/workstreams/Attribution & ROI/Skill Details/marketing-spend-dashboard.json";
import liftAnalysisDetail from "../../data/workstreams/Attribution & ROI/Skill Details/lift-analysis.json";
import fullFunnelJourneyVisibilityDetail from "../../data/workstreams/Funnel & Conversion/Skill Details/full-funnel-journey-visibility.json";
import leadScoringDashboardDetail from "../../data/workstreams/Funnel & Conversion/Skill Details/lead-scoring-dashboard.json";
import pipelineCoverageGapAnalysisDetail from "../../data/workstreams/Pipeline Analysis/Skill Details/pipeline-coverage-gap-analysis.json";
import sdrConversionPerformanceDetail from "../../data/workstreams/Funnel & Conversion/Skill Details/sdr-conversion-performance.json";
import abmCampaignPenetrationDetail from "../../data/workstreams/ABM/Skill Details/abm-campaign-penetration.json";
import accountEngagementRankingDetail from "../../data/workstreams/ABM/Skill Details/account-engagement-ranking.json";
import buyerJourneyAnalysisDetail from "../../data/workstreams/ABM/Skill Details/buyer-journey-analysis.json";
import targetAccountCoverageGapDetail from "../../data/workstreams/ABM/Skill Details/target-account-coverage-gap.json";
import fieldMarketingImpactDetail from "../../data/workstreams/Attribution & ROI/Skill Details/field-marketing-impact.json";

const DEMO_TENANT_ID = "GPFYRWJF";

const allTiles = [
  channelRoasTile,
  campaignPerformanceTile,
  creativePerformanceTile,
  spendReallocationPlanTile,
  budgetPacingTile,
  audiencePerformanceTile,
  leadSourceEffectivenessTile,
  marketingSpendDashboardTile,
  liftAnalysisTile,
  fullFunnelJourneyVisibilityTile,
  leadScoringDashboardTile,
  pipelineCoverageGapAnalysisTile,
  sdrConversionPerformanceTile,
  abmCampaignPenetrationTile,
  accountEngagementRankingTile,
  buyerJourneyAnalysisTile,
  targetAccountCoverageGapTile,
  fieldMarketingImpactTile
];

const detailsMap = {
  "channel-roas": channelRoasDetail,
  "campaign-performance": campaignPerformanceDetail,
  "creative-performance": creativePerformanceDetail,
  "spend-reallocation-plan": spendReallocationPlanDetail,
  "budget-pacing": budgetPacingDetail,
  "audience-performance": audiencePerformanceDetail,
  "lead-source-effectiveness": leadSourceEffectivenessDetail,
  "marketing-spend-dashboard": marketingSpendDashboardDetail,
  "lift-analysis": liftAnalysisDetail,
  "full-funnel-journey-visibility": fullFunnelJourneyVisibilityDetail,
  "lead-scoring-dashboard": leadScoringDashboardDetail,
  "pipeline-coverage-gap-analysis": pipelineCoverageGapAnalysisDetail,
  "sdr-conversion-performance": sdrConversionPerformanceDetail,
  "abm-campaign-penetration": abmCampaignPenetrationDetail,
  "account-engagement-ranking": accountEngagementRankingDetail,
  "buyer-journey-analysis": buyerJourneyAnalysisDetail,
  "target-account-coverage-gap": targetAccountCoverageGapDetail,
  "field-marketing-impact": fieldMarketingImpactDetail
};

export function getCurrentTenantId() {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.tenantId || null;
}

export function isDemoTenant() {
  return getCurrentTenantId() === DEMO_TENANT_ID;
}

function transformTileToSkill(tile) {
  return {
    id: tile.id,
    name: tile.name,
    description: tile.description,
    scope: "tenant",
    output_type: tile.renderType === "memo" ? "memo" : "dashboard",
    tags: tile.dataSources || [],
    is_active: true
  };
}

function transformDetailToSkill(detail) {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    scope: "tenant",
    output_type: detail.renderType === "memo" ? "memo" : "dashboard",
    tags: detail.connectors || [],
    is_active: true,
    _isDemoSkill: true,
    run_details: {
      subhead: [detail.description],
      status: { state: "Ready" },
      build: {
        estimate: detail.badges?.buildTime || "~10 min",
        composition: `${detail.badges?.widgetCount || 5} widgets`
      },
      connectedStack: {
        required: detail.connectors || []
      },
      whatYoullGet: {
        intro: detail.callout,
        widgets: (detail.whatYoullGet || []).map((item, i) => ({
          n: String(i + 1).padStart(2, "0"),
          title: item.name,
          description: item.desc
        }))
      },
      onceItsLive: {
        questions: detail.alsoSurfaces || []
      },
      beforeWeRun: {
        questions: (detail.beforeWeRun || []).map((q, i) => ({
          n: String(i + 1).padStart(2, "0"),
          question: q,
          detail: ""
        }))
      },
      cta: {
        button: "Run this skill",
        primary: detail.callout
      }
    }
  };
}

export function getDemoSkills() {
  if (!isDemoTenant()) return [];

  return allTiles.map(transformTileToSkill);
}

export function getDemoSkillDetail(skillId) {
  if (!isDemoTenant()) return null;

  const detail = detailsMap[skillId];
  if (!detail) return null;

  return transformDetailToSkill(detail);
}
