import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowsClockwise, Info } from "@phosphor-icons/react";
import { Button } from "../../../../common-components/Button";
import Skeleton from "../../../../common-components/Skeleton";
import { useGetSetupAssociations } from "../api/getSetupAssociations";
import { usePutSetupAssociations } from "../api/putSetupAssociations";
import { useNotificationStore } from "../stores/notifications";
import { UnsavedChangesBanner } from "./UnsavedChangesBanner";

// HubSpot only. Settings tab for association sync.
//
// BE shape (GET /integration-setup/:id/associations):
//   {
//     supportedAssociations: [{ key, from, to, label, description }],
//     selectedAssociations: string[]  // keys
//     manualMode: boolean             // true = user-picked, false = auto
//   }
//
// BE behaviour (PUT /integration-setup/:id/associations):
//   - Empty array → AUTO mode (pv-sync-engine discovers everything,
//                  including new pairs HubSpot adds in future)
//   - Non-empty   → MANUAL mode (only the listed keys sync)
//
// UI: a single grouped checklist of all supported pairs. On first load,
// auto mode shows every pair as ticked; users can untick individual pairs
// to narrow the sync. On save:
//   - If every supported pair is still ticked → send `[]` so the server
//     keeps auto-mode semantics (future-pair discovery preserved).
//   - Otherwise → send the explicit list (manual mode).
// This removes the old Auto/Manual binary while keeping the BE contract.
export const AssociationsTab = ({ integrationId }) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const associationsQuery = useGetSetupAssociations({ id: integrationId });

  // Local draft — null until the user touches anything.
  const [draftPicks, setDraftPicks] = useState(null); // Set<string> | null

  const putAssociations = usePutSetupAssociations({
    config: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["integration_setup_associations", integrationId]
        });
        setDraftPicks(null);
        addNotification({
          type: "success",
          title: "Changes saved",
          message: ""
        });
      }
    }
  });

  const data = associationsQuery.data || {};
  const supported = Array.isArray(data.supportedAssociations)
    ? data.supportedAssociations
    : [];
  const allSupportedKeys = supported.map((p) => p.key);
  const allSupportedSet = new Set(allSupportedKeys);
  const isServerAuto = !data.manualMode;
  // In auto mode, treat every supported pair as effectively selected so the
  // UI can show ticked checkboxes immediately and respond to untick gestures
  // without the user having to flip a separate "manual" toggle first.
  const effectiveServerPicks = isServerAuto
    ? new Set(allSupportedKeys)
    : new Set(
        (Array.isArray(data.selectedAssociations)
          ? data.selectedAssociations
          : []
        ).map((k) => String(k).toUpperCase())
      );

  const picks = draftPicks ?? effectiveServerPicks;

  const dirty =
    draftPicks !== null &&
    (draftPicks.size !== effectiveServerPicks.size ||
      Array.from(draftPicks).some((k) => !effectiveServerPicks.has(k)));

  const togglePick = (key) => {
    setDraftPicks((prev) => {
      const base = prev ?? new Set(effectiveServerPicks);
      const next = new Set(base);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSelected =
    allSupportedKeys.length > 0 && allSupportedKeys.every((k) => picks.has(k));
  const toggleAll = () => {
    setDraftPicks(() => {
      if (allSelected) return new Set();
      return new Set(allSupportedKeys);
    });
  };

  const handleSave = () => {
    if (!integrationId) return;
    // Every supported pair ticked → empty array (auto mode preserved so
    // future HubSpot-added pairs sync automatically). Otherwise the explicit
    // list (manual mode).
    const allTicked =
      allSupportedKeys.length > 0 &&
      allSupportedKeys.every((k) => picks.has(k));
    const payload = allTicked ? [] : Array.from(picks);
    putAssociations.mutate({
      id: integrationId,
      body: { selectedAssociations: payload }
    });
  };

  const handleDiscard = () => {
    setDraftPicks(null);
  };

  const handleRefresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["integration_setup_associations", integrationId]
    });

  if (!integrationId) {
    return (
      <div className="px-6 py-5">
        <div className="border border-[var(--pv-neutral-grey-200)] rounded-lg p-6 text-center">
          <p className="text-sm text-[var(--pv-neutral-grey-500)]">
            We couldn't load this integration. It may not be connected yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-medium text-[var(--pv-text-primary-text)]">
            Associations to sync
          </h2>
          <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
            {allSelected
              ? "Auto mode — Petavue syncs every supported pair, including new ones HubSpot may add later."
              : "Custom mode — only the ticked pairs sync. Switch back to Auto to also include future pairs."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            btnColor="secondary"
            btnSize="md"
            onClick={handleRefresh}
            disabled={associationsQuery.isFetching}
          >
            <ArrowsClockwise size={14} className="mr-1.5" />
            {associationsQuery.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {dirty && (
        <UnsavedChangesBanner
          onDiscard={handleDiscard}
          onSave={handleSave}
          isSaving={putAssociations.isPending}
        />
      )}

      {/* Mode toggle — clicking "Auto" re-ticks every pair so we save
          selectedAssociations:[] and preserve future-pair discovery. Clicking
          "Custom" doesn't change picks; it's effectively a passthrough that
          tells the user the current state is treated as a custom selection. */}
      {allSupportedKeys.length > 0 && (
        <div className="inline-flex border border-[var(--pv-neutral-grey-200)] rounded-md overflow-hidden self-start">
          <ModeButton
            active={allSelected}
            onClick={() => {
              if (!allSelected) setDraftPicks(new Set(allSupportedKeys));
            }}
            title="Sync every supported pair (and any new pair HubSpot adds later)"
          >
            Auto · Recommended
          </ModeButton>
          <ModeButton
            active={!allSelected}
            onClick={() => {
              // No-op when already custom. From auto, drop one arbitrary pick
              // so the user immediately lands in a "decide which to keep"
              // state — they can then untick more from the list below.
              if (allSelected && allSupportedKeys.length > 0) {
                const next = new Set(allSupportedKeys);
                next.delete(allSupportedKeys[allSupportedKeys.length - 1]);
                setDraftPicks(next);
              }
            }}
            title="Pick which pairs to sync. New HubSpot pairs won't be added automatically."
          >
            Custom
          </ModeButton>
        </div>
      )}

      <SelectableAssociationsList
        supported={supported}
        picks={picks}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onToggle={togglePick}
        isLoading={associationsQuery.isLoading}
        isSaving={putAssociations.isPending}
      />
    </div>
  );
};

const ModeButton = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={[
      "px-4 py-1.5 text-xs font-medium transition-colors",
      active
        ? "bg-[var(--pv-primary-500)] text-white"
        : "bg-white text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)]"
    ].join(" ")}
  >
    {children}
  </button>
);

// Preserve BE-provided order of "from" objects on first appearance so the
// grouped list mirrors how HubSpot users mentally model their data.
const groupPairsByFrom = (pairs) => {
  const order = [];
  const buckets = new Map();
  for (const p of pairs) {
    const from = p.from || "Other";
    if (!buckets.has(from)) {
      buckets.set(from, []);
      order.push(from);
    }
    buckets.get(from).push(p);
  }
  return order.map((from) => ({ from, pairs: buckets.get(from) }));
};

const humanizeObject = (name) => {
  if (!name) return name;
  return name
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
};

const SelectableAssociationsList = ({
  supported,
  picks,
  allSelected,
  onToggleAll,
  onToggle,
  isLoading,
  isSaving
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={28} />
        ))}
      </div>
    );
  }
  if (supported.length === 0) {
    return (
      <div className="border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white p-6 text-center text-xs text-[var(--pv-neutral-grey-500)]">
        No association pairs available yet. Save objects on the Schema tab
        first, then come back here.
      </div>
    );
  }
  // Within each group, surface selected pairs first then sort alphabetically
  // by the "to" object so users land on what's already syncing.
  const groups = groupPairsByFrom(supported).map((g) => ({
    ...g,
    pairs: [...g.pairs].sort((a, b) => {
      const aSel = picks.has(a.key) ? 0 : 1;
      const bSel = picks.has(b.key) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return humanizeObject(a.to).localeCompare(humanizeObject(b.to));
    })
  }));
  const selectedCount = supported.filter((p) => picks.has(p.key)).length;

  return (
    <>
      {picks.size === 0 && (
        <div className="border border-[var(--pv-status-warning,#F59E0B)]/30 bg-[var(--pv-status-warning,#F59E0B)]/5 rounded-lg p-3 flex items-start gap-2">
          <Info size={14} className="text-[var(--pv-status-warning,#F59E0B)] mt-0.5 shrink-0" />
          <p className="text-xs text-[var(--pv-text-primary-text)]">
            No associations selected. Saving like this turns off association sync
            entirely.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-[var(--pv-neutral-grey-500)]">
          {selectedCount} of {supported.length} pair{supported.length === 1 ? "" : "s"} selected
        </span>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--pv-neutral-grey-500)]">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--pv-primary-500)] cursor-pointer"
            checked={allSelected}
            onChange={onToggleAll}
            disabled={isSaving}
            aria-label="Select all"
          />
          Select all
        </label>
      </div>
      <div className="flex flex-col gap-4">
        {groups.map((g) => {
          const groupSelected = g.pairs.filter((p) => picks.has(p.key)).length;
          return (
            <div
              key={g.from}
              className="border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--pv-neutral-grey-50)] border-b border-[var(--pv-neutral-grey-100)]">
                <span className="text-[11px] font-medium text-[var(--pv-text-primary-text)] uppercase tracking-wide">
                  {humanizeObject(g.from)}
                </span>
                <span className="text-[10px] text-[var(--pv-neutral-grey-500)]">
                  {groupSelected} of {g.pairs.length} selected
                </span>
              </div>
              {g.pairs.map((p) => {
                const checked = picks.has(p.key);
                return (
                  <label
                    key={p.key}
                    className="grid grid-cols-[40px_1fr] items-center px-3 py-2.5 border-b border-[var(--pv-neutral-grey-100)] last:border-b-0 cursor-pointer bg-white hover:bg-[var(--pv-neutral-grey-50)]"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--pv-primary-500)] cursor-pointer"
                      checked={checked}
                      onChange={() => onToggle(p.key)}
                      disabled={isSaving}
                    />
                    <div>
                      <div className="text-sm text-[var(--pv-text-primary-text)] font-medium flex items-center gap-1.5">
                        <span className="text-[var(--pv-neutral-grey-400)]">↔</span>
                        <span>{humanizeObject(p.to)}</span>
                      </div>
                      {p.description && (
                        <div className="text-[11px] text-[var(--pv-neutral-grey-500)] mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AssociationsTab;
