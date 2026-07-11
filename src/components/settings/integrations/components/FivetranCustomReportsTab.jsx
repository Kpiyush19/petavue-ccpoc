import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash, Info, PencilSimple, CaretRight, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/ui";
import { Skeleton } from "@/ui";
import {
  useGetFivetranReports,
  useGetFivetranReportCatalog,
  useDeleteFivetranReport,
  usePutFivetranReportSelection
} from "../api/fivetranReports";
import { useNotificationStore } from "../stores/notifications";
import { UnsavedChangesBanner } from "./UnsavedChangesBanner";
import { SaveObjectsConfirmModal } from "./SaveObjectsConfirmModal";
import { AddCustomReportModal } from "./AddCustomReportModal";

// Self-serve add/edit/delete of custom reports. Users author and tweak their
// own reports (including the seeded predefined ones) from this tab. Flip to
// false to fall back to support-managed reports (read + sync-toggle only).
const CUSTOM_REPORTS_SELF_SERVE = true;

// Custom Reports tab — list of Fivetran-configured reports with per-row
// enable/disable AND an "+ Add report" entry point. The same reports also
// appear in the Schema tab (marked with a CUSTOM badge) so the user has
// two equivalent places to toggle them.

export const FivetranCustomReportsTab = ({ integrationId }) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const reportsQuery = useGetFivetranReports({ id: integrationId });
  // Catalog gives us friendly labels (name → "Country") and the metric/dim
  // split so the expanded row can show selected fields by name. Only fetch
  // once we know the source supports reports (else the endpoint 404s).
  const catalogQuery = useGetFivetranReportCatalog({
    id: integrationId,
    enabled: !!reportsQuery.data?.supportsCustomReports
  });
  const toggleMut = usePutFivetranReportSelection();
  const deleteMut = useDeleteFivetranReport();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editReport, setEditReport] = useState(null); // report object being edited
  const [confirmDelete, setConfirmDelete] = useState(null); // key of report to delete
  const [expanded, setExpanded] = useState(() => new Set()); // report keys expanded

  const toggleExpand = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // name → friendly label, plus the set of metric names (to split Google
  // Ads' combined fields[] back into dimensions vs metrics).
  const labelByName = useMemo(() => {
    const m = new Map();
    const cat = catalogQuery.data;
    if (cat) {
      for (const f of cat.dimensions ?? []) m.set(f.name, f.label);
      for (const f of cat.metrics ?? []) m.set(f.name, f.label);
    }
    return m;
  }, [catalogQuery.data]);
  const metricSet = useMemo(
    () => new Set((catalogQuery.data?.metrics ?? []).map((m) => m.name)),
    [catalogQuery.data]
  );

  // Server snapshot of selected reports — the baseline for the editor below.
  const serverSelected = useMemo(() => {
    const set = new Set();
    for (const r of reportsQuery.data?.reports ?? []) {
      if (r.selected) set.add(r.key);
    }
    return set;
  }, [reportsQuery.data]);

  const [draft, setDraft] = useState(null);

  // Baseline the draft was seeded from. Kept in a ref so it updates in the
  // SAME effect as `draft`. Comparing `dirty` against `serverSelected`
  // directly flagged a false "unsaved changes" banner: on every report
  // refetch, `serverSelected` gets a fresh reference one render before the
  // effect resets `draft`, so for that render draft ≠ serverSelected even
  // though the user changed nothing.
  const baselineRef = useRef(new Set());

  useEffect(() => {
    baselineRef.current = serverSelected;
    setDraft(new Set(serverSelected));
  }, [serverSelected]);

  const picks = draft ?? serverSelected;
  const dirty = useMemo(() => {
    if (!draft) return false;
    const base = baselineRef.current;
    if (draft.size !== base.size) return true;
    for (const k of draft) if (!base.has(k)) return true;
    return false;
  }, [draft]);

  const toggleLocal = (key, checked) => {
    setDraft((prev) => {
      const next = new Set(prev ?? serverSelected);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const added = useMemo(
    () => (draft ? [...draft].filter((k) => !serverSelected.has(k)) : []),
    [draft, serverSelected]
  );
  const removed = useMemo(
    () => (draft ? [...serverSelected].filter((k) => !draft.has(k)) : []),
    [draft, serverSelected]
  );

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      for (const key of added) {
        await toggleMut.mutateAsync({ id: integrationId, key, selected: true });
      }
      for (const key of removed) {
        await toggleMut.mutateAsync({ id: integrationId, key, selected: false });
      }
      setShowConfirm(false);
      addNotification({
        type: "success",
        title: "Changes saved",
        message: ""
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setDraft(new Set(serverSelected));

  const handleAddReport = () => setShowBuilder(true);

  useEffect(() => {
    const onFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["fivetran_reports", integrationId] });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient, integrationId]);

  if (reportsQuery.isLoading) {
    return (
      <div className="px-6 py-5 flex flex-col gap-3">
        <Skeleton width="40%" height={18} />
        <Skeleton width="100%" height={80} />
        <Skeleton width="100%" height={80} />
      </div>
    );
  }

  const data = reportsQuery.data || {};
  const supports = !!data.supportsCustomReports;
  const reports = Array.isArray(data.reports) ? data.reports : [];

  if (!supports) {
    return (
      <div className="px-6 py-5">
        <div className="border border-[var(--color-grey-200)] rounded-lg p-6 text-center text-sm text-[var(--color-grey-500)]">
          Custom reports aren't available for this source.
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="max-w-2xl">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
            Custom reports
          </h2>
          <p className="text-xs text-[var(--color-grey-500)] mt-1">
            A custom report is a saved query: you pick the dimensions
            (e.g. date, country, campaign) and the metrics (e.g. sessions,
            users, conversions) you want, and we sync that combination as
            a new table in your warehouse.
          </p>
          {CUSTOM_REPORTS_SELF_SERVE ? (
            <p className="text-xs text-[var(--color-grey-500)] mt-1.5">
              Click <span className="font-medium text-[var(--color-text-primary)]">+ Add report</span>
              {" "}to build one. Toggle below to choose which reports sync;
              the same toggle is also available in the Schema tab.
            </p>
          ) : (
            <p className="text-xs text-[var(--color-grey-500)] mt-1.5">
              To add or remove a custom report, please contact the
              {" "}<span className="font-medium text-[var(--color-text-primary)]">Petavue support team</span>.
              You can still toggle below to choose which reports sync.
            </p>
          )}
        </div>
        {CUSTOM_REPORTS_SELF_SERVE && (
          <Button
            variant="primary"
            size="md"
            onClick={handleAddReport}
          >
            <Plus size={14} className="mr-1.5" />
            Add report
          </Button>
        )}
      </div>

      {dirty && (
        <UnsavedChangesBanner
          onDiscard={handleDiscard}
          onSave={() => setShowConfirm(true)}
          saveLabel="Review changes"
          isSaving={saving}
        />
      )}

      {showConfirm && (
        <SaveObjectsConfirmModal
          added={added}
          removed={removed}
          totalBefore={serverSelected.size}
          totalAfter={picks.size}
          isSaving={saving}
          onConfirm={handleSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {reports.length === 0 ? (
        <EmptyState onAdd={handleAddReport} canAdd={CUSTOM_REPORTS_SELF_SERVE} />
      ) : (
        <div className="border border-[var(--color-grey-200)] rounded-lg bg-white overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_100px_80px] items-center px-3 py-2 bg-[var(--color-grey-50)] border-b border-[var(--color-grey-100)] text-[12px] font-medium text-[var(--color-grey-500)] uppercase tracking-wide">
            <div />
            <div>Report</div>
            <div>Status</div>
            <div />
          </div>
          {reports.map((r) => {
            const checked = picks.has(r.key);
            const isOpen = expanded.has(r.key);
            return (
              <div
                key={r.key}
                className="border-b border-[var(--color-grey-100)] last:border-b-0"
              >
              <div
                className="grid grid-cols-[40px_1fr_100px_80px] items-center px-3 py-3 bg-white hover:bg-[var(--color-grey-50)]"
              >
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--color-primary-500)] cursor-pointer ml-1"
                    checked={checked}
                    disabled={saving}
                    onChange={(e) => toggleLocal(r.key, e.target.checked)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => toggleExpand(r.key)}
                  className="min-w-0 text-left flex items-start gap-1.5 group"
                  aria-expanded={isOpen}
                  title={isOpen ? "Hide fields" : "Show selected fields"}
                >
                  <span className="text-[var(--color-grey-400)] group-hover:text-[var(--color-grey-600)] mt-0.5 shrink-0">
                    {isOpen ? <CaretDown size={12} weight="bold" /> : <CaretRight size={12} weight="bold" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                      {r.key}
                    </span>
                    <ReportSummary config={r.config} service={data.service} />
                  </span>
                </button>
                <div className="text-xs">
                  {checked ? (
                    <span className="inline-flex items-center gap-1 text-[var(--color-green)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)]" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-[var(--color-grey-500)]">Disabled</span>
                  )}
                </div>
                {CUSTOM_REPORTS_SELF_SERVE ? (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditReport(r)}
                      className="text-[var(--color-grey-400)] hover:text-[var(--color-primary-500)] p-1"
                      title="Edit report"
                      aria-label="Edit report"
                      disabled={deleteMut.isPending}
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(r.key)}
                      className="text-[var(--color-grey-400)] hover:text-[var(--pv-status-error,#EF4444)] p-1"
                      title="Delete report"
                      aria-label="Delete report"
                      disabled={deleteMut.isPending}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ) : (
                  <span />
                )}
              </div>
              {isOpen && (
                <ReportDetails
                  config={r.config}
                  service={data.service}
                  labelByName={labelByName}
                  metricSet={metricSet}
                  loading={catalogQuery.isLoading}
                />
              )}
              </div>
            );
          })}
        </div>
      )}

      {showBuilder && (
        <AddCustomReportModal
          integrationId={integrationId}
          service={data.service}
          onClose={() => setShowBuilder(false)}
          onCreated={() => setShowBuilder(false)}
        />
      )}

      {editReport && (
        <AddCustomReportModal
          integrationId={integrationId}
          service={data.service}
          editReport={editReport}
          onClose={() => setEditReport(null)}
          onCreated={() => setEditReport(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteReportModal
          reportKey={confirmDelete}
          isDeleting={deleteMut.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            try {
              await deleteMut.mutateAsync({ id: integrationId, key: confirmDelete });
              setConfirmDelete(null);
            } catch {
              /* notification shown by hook */
            }
          }}
        />
      )}
    </div>
  );
};

const ConfirmDeleteReportModal = ({ reportKey, isDeleting, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-[var(--color-grey-200)]">
        <h2 className="text-base font-medium text-[var(--color-text-primary)]">
          Delete custom report
        </h2>
        <p className="text-xs text-[var(--color-grey-500)] mt-1">
          The report <span className="font-medium">{reportKey}</span> will be removed from this connection.
          Existing data in your warehouse stays; only future syncs stop.
        </p>
      </div>
      <div className="px-5 py-3 flex items-center justify-end gap-2">
        <Button variant="secondary" size="md" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="red" size="md" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting…" : "Delete report"}
        </Button>
      </div>
    </div>
  </div>
);

const arrCount = (v) => (Array.isArray(v) ? v.length : 0);
const arrJoin = (v, max = 3) => {
  if (!Array.isArray(v) || v.length === 0) return null;
  const head = v.slice(0, max).join(", ");
  return v.length > max ? `${head}, +${v.length - max}` : head;
};
const pluralize = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

const ReportSummary = ({ config, service }) => {
  if (!config || typeof config !== "object") return null;
  const parts = [];

  if (service === "google_analytics_4") {
    const d = arrCount(config.dimensions);
    const m = arrCount(config.metrics);
    if (d) parts.push(pluralize(d, "dimension"));
    if (m) parts.push(pluralize(m, "metric"));
    if (config.filter) parts.push(`filter: ${String(config.filter).slice(0, 40)}`);
    if (config.aggregation) parts.push(`agg: ${config.aggregation}`);
    if (config.rollback_window) parts.push(`rollback: ${config.rollback_window}d`);
    else if (config.report_rollback_window) parts.push(`rollback: ${config.report_rollback_window}d`);
    else if (config.time_aggregation_granularity) parts.push(`granularity: ${config.time_aggregation_granularity}`);
  } else if (service === "google_ads") {
    if (config.report_type) parts.push(config.report_type);
    const f = arrCount(config.fields);
    if (f) parts.push(pluralize(f, "field"));
    const segs = arrJoin(config.segments);
    if (segs) parts.push(`segments: ${segs}`);
  } else if (service === "facebook_ads") {
    if (config.level) parts.push(`level: ${config.level}`);
    const f = arrCount(config.fields);
    if (f) parts.push(pluralize(f, "field"));
    const breakdowns = arrJoin(config.breakdowns || config.breakdown);
    if (breakdowns) parts.push(`breakdowns: ${breakdowns}`);
    const actionBreakdowns = arrJoin(config.action_breakdowns || config.action_breakdown);
    if (actionBreakdowns) parts.push(`action breakdowns: ${actionBreakdowns}`);
    const attr = arrJoin(config.action_attribution_windows);
    if (attr) parts.push(`attribution: ${attr}`);
    if (config.action_report_time) parts.push(`report time: ${config.action_report_time}`);
  }

  if (parts.length === 0) return null;
  return (
    <p className="text-xs text-[var(--color-grey-500)] mt-0.5">{parts.join(" · ")}</p>
  );
};

// Read-only breakdown of a report's selected fields — shown when a row is
// expanded. Mirrors the per-service shape buildReportPayload produces.
const ReportDetails = ({ config, service, labelByName, metricSet, loading }) => {
  if (!config || typeof config !== "object") return null;

  let dims = [];
  let metrics = [];
  const extras = [];

  if (service === "google_analytics_4") {
    dims = Array.isArray(config.dimensions) ? config.dimensions : [];
    metrics = Array.isArray(config.metrics) ? config.metrics : [];
    if (config.rollback_window) extras.push(["Rollback window", `${config.rollback_window} days`]);
    if (config.time_aggregation_granularity) extras.push(["Granularity", config.time_aggregation_granularity]);
  } else if (service === "google_ads") {
    const fields = Array.isArray(config.fields) ? config.fields : [];
    dims = fields.filter((f) => !metricSet.has(f));
    metrics = fields.filter((f) => metricSet.has(f));
    if (config.report_type) extras.push(["Report type", config.report_type]);
  } else if (service === "facebook_ads") {
    dims = Array.isArray(config.breakdowns) ? config.breakdowns : [];
    metrics = Array.isArray(config.fields) ? config.fields : [];
    if (config.level) extras.push(["Level", config.level]);
    if (Array.isArray(config.action_attribution_windows) && config.action_attribution_windows.length) {
      extras.push(["Attribution", config.action_attribution_windows.join(", ")]);
    }
  }

  const label = (n) => labelByName?.get(n) || n;

  return (
    <div className="px-3 pb-3 pl-[52px] bg-[var(--color-grey-50)] flex flex-col gap-2.5">
      <FieldChips title={`Dimensions (${dims.length})`} names={dims} label={label} loading={loading} />
      <FieldChips title={`Metrics (${metrics.length})`} names={metrics} label={label} loading={loading} />
      {extras.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
          {extras.map(([k, v]) => (
            <span key={k} className="text-[12px] text-[var(--color-grey-500)]">
              <span className="font-medium text-[var(--color-grey-600)]">{k}:</span> {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const FieldChips = ({ title, names, label, loading }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-grey-500)]">
      {title}
    </span>
    {names.length === 0 ? (
      <span className="text-[12px] text-[var(--color-grey-400)]">
        {loading ? "Loading…" : "None"}
      </span>
    ) : (
      <div className="flex flex-wrap gap-1">
        {names.map((n) => (
          <span
            key={n}
            title={n}
            className="inline-flex items-center text-[12px] px-2 py-0.5 rounded-full bg-white border border-[var(--color-grey-200)] text-[var(--color-grey-700)]"
          >
            {label(n)}
          </span>
        ))}
      </div>
    )}
  </div>
);

const EmptyState = ({ onAdd, canAdd }) => (
  <div className="border border-[var(--color-grey-200)] rounded-lg bg-white p-8 flex items-start gap-3">
    <Info size={18} className="text-[var(--color-grey-500)] mt-0.5 shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        No custom reports configured
      </p>
      {canAdd ? (
        <p className="text-xs text-[var(--color-grey-500)] mt-1">
          Nothing to sync from this connection yet. Use{" "}
          <button
            type="button"
            onClick={onAdd}
            className="text-[var(--color-primary-500)] font-medium hover:underline"
          >
            Add report
          </button>{" "}
          to set one up.
        </p>
      ) : (
        <p className="text-xs text-[var(--color-grey-500)] mt-1">
          Nothing to sync from this connection yet. Please contact the{" "}
          <span className="font-medium text-[var(--color-text-primary)]">Petavue support team</span>
          {" "}to add one.
        </p>
      )}
    </div>
  </div>
);

export default FivetranCustomReportsTab;
