import { Plus, Minus } from "@phosphor-icons/react";
import { Button } from "../../../../common-components/Button";

// Preview modal that lists exactly what's changing before the PUT fires.
// Keeps the user from accidentally saving large swaps (e.g. they typed a
// search, checked everything, then forgot the prior picks are gone).
export const SaveObjectsConfirmModal = ({
  added,
  removed,
  totalAfter,
  totalBefore,
  isSaving,
  onConfirm,
  onCancel
}) => {
  const noChange = added.length === 0 && removed.length === 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--pv-neutral-grey-200)]">
          <h2 className="text-base font-medium text-[var(--pv-text-primary-text)]">
            Review changes
          </h2>
          <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
            You're about to update which objects Petavue syncs.{" "}
            {totalBefore} → {totalAfter} enabled.
          </p>
        </div>

        <div className="px-5 py-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {noChange ? (
            <p className="text-sm text-[var(--pv-neutral-grey-500)]">
              No changes to save.
            </p>
          ) : (
            <>
              {added.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Plus
                      size={14}
                      weight="bold"
                      className="text-[var(--pv-success-text)]"
                    />
                    <span className="text-xs font-medium text-[var(--pv-text-primary-text)] uppercase tracking-wide">
                      Added ({added.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {added.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--pv-success-bg,#ECFDF5)] text-[var(--pv-success-text)] text-xs font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {removed.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Minus
                      size={14}
                      weight="bold"
                      className="text-[var(--pv-status-error,#EF4444)]"
                    />
                    <span className="text-xs font-medium text-[var(--pv-text-primary-text)] uppercase tracking-wide">
                      Deleted ({removed.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {removed.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--pv-status-error,#EF4444)]/10 text-[var(--pv-status-error,#EF4444)] text-xs font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--pv-neutral-grey-500)] mt-2 leading-relaxed">
                    Removed objects stop syncing on the next run. Existing
                    data stays in your warehouse — nothing is deleted.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--pv-neutral-grey-200)] flex items-center justify-end gap-2">
          <Button
            btnColor="secondary"
            btnSize="md"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            btnColor="primary"
            btnSize="md"
            onClick={onConfirm}
            disabled={isSaving || noChange}
          >
            {isSaving ? "Saving…" : "Confirm & save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveObjectsConfirmModal;
