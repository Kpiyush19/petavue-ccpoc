import { Warning } from "@phosphor-icons/react";
import { Button } from "@/ui";

// Unified inline "Request disconnect" confirmation panel used by every
// integration's Settings tab (SF, HS, Fivetran sources). Single source of
// truth so wording, layout, and CTA labels don't drift between connectors.
//
// Renders below the "Request disconnect" button when the user clicks it,
// so we stay on-page instead of opening a modal — matches the SettingsTab
// pattern.
export const RequestDisconnectConfirm = ({
  integrationName,
  platform,
  isLoading,
  onCancel,
  onSubmit
}) => {
  const label =
    integrationName ||
    (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "this integration");
  return (
    <div className="border border-[var(--pv-status-error,#EF4444)] bg-[var(--pv-status-error,#EF4444)]/5 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Warning size={18} className="text-[var(--pv-status-error,#EF4444)] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Request disconnect for {label}
          </p>
          <p className="text-xs text-[var(--color-grey-500)] mt-1">
            We'll notify the Petavue team to follow up.
          </p>
          <p className="text-xs text-[var(--color-grey-500)] mt-1.5">
            Petavue team will get back to you once you request disconnection.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="red" size="md" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Requesting…" : "Submit request"}
        </Button>
      </div>
    </div>
  );
};

export default RequestDisconnectConfirm;
