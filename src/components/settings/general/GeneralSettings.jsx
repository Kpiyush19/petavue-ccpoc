import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/ui";
import { Skeleton } from "@/ui";
import { useNotificationStore } from "../integrations/stores/notifications";
import { useGetTenantSettings } from "./api/getTenantSettings";
import { usePatchTenantSettings } from "./api/patchTenantSettings";

// General (tenant-wide) Settings — currently just timezone.
//
// Lives outside any single integration because the TZ applies to every sync
// schedule across the tenant: pv-sync-engine runs the daily cron at 1 AM
// local time in this timezone for every native (SF/HS) integration. Each
// integration's Settings tab used to host this picker, which made it look
// per-integration; this page is the canonical home now.

const TZ_CARDS = [
  { tz: "PST", name: "Pacific Standard Time" },
  { tz: "EST", name: "Eastern Standard Time" },
  { tz: "IST", name: "India Standard Time" }
];

const cardBase =
  "flex flex-col items-start gap-1 px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none";
const cardSelected = "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]";
const cardIdle =
  "border-[var(--color-grey-200)] bg-white hover:border-[var(--color-primary-300)] hover:bg-[var(--color-grey-50)]";

export default function GeneralSettings() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [overrideTz, setOverrideTz] = useState(null);

  const settingsQuery = useGetTenantSettings();
  const save = usePatchTenantSettings({
    config: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Settings saved",
          message: "Your timezone will be used for every integration's next sync."
        });
        queryClient.invalidateQueries({ queryKey: ["tenant_settings"] });
        // Every integration's header reads nextSyncAtDisplay which is computed
        // from the tenant timezone — invalidate so the displayed value updates
        // without a full reload.
        queryClient.invalidateQueries({ queryKey: ["integration_setup_detail"] });
        setOverrideTz(null);
      },
      onError: (err) => {
        addNotification({
          type: "error",
          title: "Couldn't save",
          message:
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Please try again."
        });
      }
    }
  });

  const serverTz =
    typeof settingsQuery.data?.timezone === "string"
      ? settingsQuery.data.timezone.toUpperCase()
      : null;
  const tz = overrideTz ?? serverTz ?? "PST";
  const tzDirty = overrideTz !== null && overrideTz !== serverTz;

  const handleSave = () => {
    if (!tzDirty) return;
    save.mutate({ body: { timezone: tz } });
  };

  return (
    <div className="px-6 py-5 flex flex-col gap-6 max-w-3xl">
      <section className="border border-[var(--color-grey-200)] rounded-lg bg-white p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
              Sync timezone
            </h2>
            <p className="text-xs text-[var(--color-grey-500)] mt-1">
              Daily syncs run near midnight in this timezone. Applies to every
              integration on your tenant.
            </p>
          </div>
          {tzDirty && (
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={save.isPending}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          )}
        </div>

        {settingsQuery.isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={64} className="rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {TZ_CARDS.map((card) => {
              const isSelected = tz === card.tz;
              return (
                <button
                  key={card.tz}
                  type="button"
                  onClick={() => setOverrideTz(card.tz)}
                  className={`${cardBase} ${isSelected ? cardSelected : cardIdle}`}
                >
                  <span
                    className={`text-base font-semibold ${
                      isSelected
                        ? "text-[var(--color-primary-500)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {card.tz}
                  </span>
                  <span className="text-xs text-[var(--color-grey-500)]">
                    {card.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
