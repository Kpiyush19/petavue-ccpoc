import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  IntegrationDetail,
  IntegrationDetailWithTabs
} from "../../components/settings/integrations";
import { FivetranIntegrationDetail } from "../../components/settings/integrations/FivetranIntegrationDetail";
import SlackIntegrationDetail from './SlackIntegrationDetail'

// Routing rules for /settings/integrations/:slug:
//   "salesforce" | "hubspot"          → IntegrationDetailWithTabs (SF/HS tabbed UI)
//   24-char hex ObjectId              → FivetranIntegrationDetail (post-OAuth redirect)
//   "fivetran_<service>"              → FivetranIntegrationDetail (clicked from registry)
//   anything else (postgres, slack…)  → legacy IntegrationDetail
//
// Fivetran's OAuth callback redirects to /settings/integrations/{ObjectId}.
// The integrations registry card uses /settings/integrations/fivetran_<svc>.
// Both routes resolve to the same Fivetran detail page; the page itself
// handles the slug→ObjectId lookup via /fivetran/by-platform when needed.
const TABBED_SLUGS = new Set(["salesforce", "hubspot"]);
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;
const isFivetranSlug = (s) => typeof s === "string" && s.startsWith("fivetran_");

export default function IntegrationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();

  const integrationName = location.state?.name || slug;
  const isTabbedSlug = TABBED_SLUGS.has(slug);
  const isFivetranObjectId = OBJECT_ID_REGEX.test(slug || "");
  const fivetranPlatformSlug = isFivetranSlug(slug);

  if (isTabbedSlug) {
    return (
      <IntegrationDetailWithTabs
        integrationName={integrationName}
        platform={slug}
        onBack={() => navigate("/settings/integrations")}
        onNavigate={(path) => navigate(path)}
        integrationsPath="/settings/integrations"
        myProfilePath="/my-profile"
      />
    );
  }

  if (isFivetranObjectId) {
    return (
      <FivetranIntegrationDetail
        integrationId={slug}
        onBack={() => navigate("/settings/integrations")}
      />
    );
  }

  if (fivetranPlatformSlug) {
    return (
      <FivetranIntegrationDetail
        platform={slug}
        onBack={() => navigate("/settings/integrations")}
      />
    );
  }

  if (slug === "slack") {
    return (
      <SlackIntegrationDetail
        onBack={() => navigate("/settings/integrations")}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--pv-neutral-grey-50)]">
      <IntegrationDetail
        integrationName={integrationName}
        onBack={() => navigate("/settings/integrations")}
        onNavigate={(path) => navigate(path)}
        integrationsPath="/settings/integrations"
        myProfilePath="/my-profile"
      />
    </div>
  );
}
