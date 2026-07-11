import { useState } from "react";
import { Plug, CheckCircle, XCircle, User, Buildings } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/ui";
import { Skeleton } from "@/ui";
import { useRequestSetupDisconnect } from "../api/requestSetupDisconnect";
import { useTestSetupConnection } from "../api/testSetupConnection";
import { useGetPlatformDetail } from "../api/getPlatformDetail";
import { useNotificationStore } from "../stores/notifications";
import { RequestDisconnectConfirm } from "./RequestDisconnectConfirm";

// Mockup reference: docs/self-serve-implementation/v2/mockups/settings-page-product-sf.html
// Settings tab:
//   Section 1 — Connection (test + disconnect)
//
// Sync timezone used to live here, but it's tenant-wide (one timezone per
// tenant applies to every integration's schedule), so it moved to
// Settings → General. We leave a small breadcrumb pointing there.
// Disconnect uses POST /integration-setup/:id/request-disconnect (soft).

export const SettingsTab = ({ platform, integrationId, integrationName, onDisconnected }) => {
  const { addNotification } = useNotificationStore();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const detailQuery = useGetPlatformDetail({ platform });
  const detail = detailQuery.data || {};

  const [testResult, setTestResult] = useState(null); // { ok, message }
  const testConnection = useTestSetupConnection({
    config: {
      onSuccess: (data) => {
        const ok = data?.tokenStatus === "valid" || data?.success === true;
        setTestResult({
          ok,
          message:
            data?.message ||
            (ok ? "Connection looks healthy." : "Stored token is invalid or expired.")
        });
      },
      onError: () => setTestResult({ ok: false, message: "Couldn't reach the platform." })
    }
  });
  const disconnect = useRequestSetupDisconnect({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Disconnect requested",
          message: "Our team will follow up to complete the disconnect."
        });
        setShowDisconnectConfirm(false);
        if (onDisconnected) onDisconnected();
      }
    }
  });

  const handleDisconnect = () => {
    if (!integrationId) return;
    disconnect.mutate({ id: integrationId, body: { reason: "User-initiated from Settings tab" } });
  };

  return (
    <div className="px-6 py-5 flex flex-col gap-6">
      {/* Connection */}
      <section className="border border-[var(--color-grey-200)] rounded-lg bg-white p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            Connection
          </h2>
          <p className="text-xs text-[var(--color-grey-500)] mt-1">
            OAuth connection details for {integrationName || platform}.
          </p>
        </div>

        {detailQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={48} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[var(--color-grey-200)] rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-grey-500)] mb-1">
                <Buildings size={12} />
                Org URL
              </div>
              <div className="text-xs text-[var(--color-text-primary)] break-all">
                {detail.org_url || "—"}
              </div>
            </div>
            <div className="border border-[var(--color-grey-200)] rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-grey-500)] mb-1">
                <User size={12} />
                Connected by
              </div>
              <div className="text-xs text-[var(--color-text-primary)]">
                {detail.admin_name || "—"}
              </div>
            </div>
            <div className="border border-[var(--color-grey-200)] rounded-md p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--color-grey-500)] mb-1">
                <User size={12} />
                Service account
              </div>
              <div className="text-xs text-[var(--color-text-primary)] break-all">
                {detail.service_account_name || detail.service_account_user || "—"}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (!integrationId) return;
              setTestResult(null);
              testConnection.mutate({ id: integrationId });
            }}
            disabled={!integrationId || testConnection.isPending}
          >
            {testConnection.isPending ? "Testing…" : "Test connection"}
          </Button>
          {testResult && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                testResult.ok
                  ? "text-[var(--color-green)]"
                  : "text-[var(--pv-status-error,#EF4444)]"
              }`}
            >
              {testResult.ok ? <CheckCircle size={14} weight="fill" /> : <XCircle size={14} weight="fill" />}
              {testResult.message}
            </span>
          )}
        </div>

        {!showDisconnectConfirm ? (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-grey-100)]">
            <Button
              variant="red"
              size="md"
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={!integrationId}
              className="border border-[var(--pv-status-error,#EF4444)]"
            >
              <Plug size={14} className="mr-1.5" />
              Request disconnect
            </Button>
          </div>
        ) : (
          <RequestDisconnectConfirm
            integrationName={integrationName}
            platform={platform}
            isLoading={disconnect.isPending}
            onCancel={() => setShowDisconnectConfirm(false)}
            onSubmit={handleDisconnect}
          />
        )}
      </section>

      <p className="text-[12px] text-[var(--color-grey-500)]">
        Looking for the sync timezone? It's tenant-wide now and lives under{" "}
        <Link
          to="/settings/general"
          className="text-[var(--color-primary-500)] font-medium hover:underline"
        >
          Settings → General
        </Link>
        .
      </p>
    </div>
  );
};

export default SettingsTab;
