import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiGet, apiPut, getCurrentUser } from "../../../api";

const FEATURES = [
  {
    flag: "todowrite_enabled",
    label: "Show progress checklist",
    description:
      "Let the agent maintain a structured task list for analyses, shown as a 'Progress' widget in the header.",
  },
  {
    flag: "opus_main_model_enabled",
    label: "Use Opus 4.7 as main model",
    description:
      "Replace the default model with Claude Opus 4.7 for regular sessions. Better planning, fewer errors, higher cost.",
  },
  {
    flag: "opus_advisor_enabled",
    label: "Enable Opus advisor",
    description:
      "Add a native Opus 4.7 advisor that the agent can consult at key decision points. Improves skill selection, insight quality, and planning.",
  },
  {
    flag: "widget_chat_enabled",
    label: "Widget-scoped chat",
    description:
      "When refining a widget from the lineage drawer, run a focused conversation with only the widget's lineage as context, instead of the full session history.",
  },
  {
    flag: "slack_enabled",
    label: "Slack integration",
    description:
      "Enable Slack Alerts and Slack AI Agent for this tenant. Users can @mention the bot or use the assistant panel to run analyses directly from Slack.",
    tenantOnly: true,
  },
];

function ToggleSwitch({ enabled, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-grey-300)]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function ExperimentalFeatures() {
  const [userFlags, setUserFlags] = useState({});
  const [tenantFlags, setTenantFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const currentUser = getCurrentUser();
    const role = currentUser?.role || "";
    setIsAdmin(role.toLowerCase() === "admin");

    Promise.all([
      apiGet("/api/users/me/feature-flags"),
      apiGet("/api/tenant/feature-flags"),
    ])
      .then(([userData, tenantData]) => {
        if (cancelled) return;
        setUserFlags(userData.feature_flags || {});
        setTenantFlags(tenantData.feature_flags || {});
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Failed to load feature flags');
        setUserFlags({});
        setTenantFlags({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleUserFlag = async (flag, next) => {
    const key = `user:${flag}`;
    setPending((p) => ({ ...p, [key]: true }));
    const prev = !!userFlags[flag];
    setUserFlags((f) => ({ ...f, [flag]: next }));
    try {
      await apiPut("/api/users/me/feature-flags", { flag, enabled: next });
    } catch {
      toast.error('Failed to update feature flag');
      setUserFlags((f) => ({ ...f, [flag]: prev }));
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  const toggleTenantFlag = async (flag, next) => {
    const key = `tenant:${flag}`;
    setPending((p) => ({ ...p, [key]: true }));
    const prev = !!tenantFlags[flag];
    setTenantFlags((f) => ({ ...f, [flag]: next }));
    try {
      await apiPut("/api/tenant/feature-flags", { flag, enabled: next });
    } catch {
      toast.error('Failed to update tenant feature flag');
      setTenantFlags((f) => ({ ...f, [flag]: prev }));
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div className="space-y-0.5 w-full">
      <p className="text-black font-semibold text-sm leading-5 mb-4">Experimental features</p>
      {isAdmin && (
        <p className="text-xs text-[var(--color-grey-500)] mb-3">
          Tenant-wide flags apply to all users. Personal flags apply only to you. Tenant-wide takes precedence.
        </p>
      )}
      <div className="flex flex-col divide-y divide-[var(--color-grey-200)] border border-[var(--color-grey-200)] rounded-lg w-full">
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-3 bg-[var(--color-grey-50)]">
          <div className="flex-1 min-w-0" />
          {isAdmin && (
            <div className="w-[72px] text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Tenant
              </span>
            </div>
          )}
          <div className="w-[72px] text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary-500)]">
              Personal
            </span>
          </div>
        </div>

        {FEATURES.filter((feat) => !feat.tenantOnly || isAdmin).map((feat) => {
          const tenantEnabled = !!tenantFlags[feat.flag];
          const userEnabled = tenantEnabled || !!userFlags[feat.flag];
          const userLocked = tenantEnabled;
          const tenantPending = !!pending[`tenant:${feat.flag}`];
          const userPending = !!pending[`user:${feat.flag}`];

          return (
            <div key={feat.flag} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-grey-900)]">
                    {feat.label}
                  </span>
                  {userLocked && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-grey-100)] text-[var(--color-grey-500)]">
                      Enabled by tenant
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-grey-600)] mt-1 leading-snug">
                  {feat.description}
                </div>
              </div>
              {isAdmin && (
                <div className="w-[72px] flex justify-center">
                  <ToggleSwitch
                    enabled={tenantEnabled}
                    disabled={loading || tenantPending}
                    onChange={(next) => toggleTenantFlag(feat.flag, next)}
                  />
                </div>
              )}
              <div className="w-[72px] flex justify-center">
                {feat.tenantOnly ? (
                  <span className="text-[10px] text-[var(--color-grey-400)]">—</span>
                ) : (
                  <ToggleSwitch
                    enabled={userEnabled}
                    disabled={loading || userPending || userLocked}
                    onChange={(next) => toggleUserFlag(feat.flag, next)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
