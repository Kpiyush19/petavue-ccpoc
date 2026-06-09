import { useEffect, useMemo, useState } from "react";
import { CREATING_MESSAGE_ROTATE_MS } from "../constants";
import { X, MagnifyingGlass, Plus, Check, Lock, CaretDown, CaretRight } from "@phosphor-icons/react";
import { Button } from "../../../../common-components/Button";
import {
  useGetFivetranReportCatalog,
  usePostFivetranReport,
  usePutFivetranReport
} from "../api/fivetranReports";

// Native "Add custom report" modal — replaces the Fivetran Connect Card
// redirect. User picks dimensions + metrics from a catalog the BE returns,
// fills in a few service-specific knobs, and we POST to integration-srv
// which then PATCHes Fivetran's config.reports[].
//
// Doubles as the edit modal: pass `editReport` ({ key, config }) to prefill
// from an existing report and PUT the changes instead of POSTing a new one.
// This is the path for tweaking a seeded/predefined report.

const GOOGLE_ADS_REPORT_TYPES = [
  { value: "CAMPAIGN_PERFORMANCE", label: "Campaign performance" },
  { value: "AD_GROUP_PERFORMANCE", label: "Ad group performance" },
  { value: "AD_PERFORMANCE", label: "Ad performance" },
  { value: "KEYWORDS_PERFORMANCE", label: "Keywords performance" },
  { value: "SEARCH_TERMS_PERFORMANCE", label: "Search terms performance" },
  { value: "CLICK_PERFORMANCE", label: "Click performance" },
  { value: "GEOGRAPHIC_PERFORMANCE", label: "Geographic performance" },
  { value: "ACCOUNT_PERFORMANCE", label: "Account performance" }
];

const FB_ATTRIBUTION_WINDOWS = [
  "1d_view",
  "7d_view",
  "28d_view",
  "1d_click",
  "7d_click",
  "28d_click"
];

export const AddCustomReportModal = ({ integrationId, onClose, onCreated, editReport = null }) => {
  const isEdit = !!editReport;
  const catalogQuery = useGetFivetranReportCatalog({ id: integrationId });
  const create = usePostFivetranReport();
  const update = usePutFivetranReport();
  const mutation = isEdit ? update : create;
  const busy = mutation.isPending;
  const catalog = catalogQuery.data;

  const [step, setStep] = useState("edit"); // "edit" | "review"
  const [tableName, setTableName] = useState("");
  const [dims, setDims] = useState(new Set());
  const [metrics, setMetrics] = useState(new Set());
  const [rollback, setRollback] = useState(30);
  const [granularity, setGranularity] = useState("DAILY");
  const [reportType, setReportType] = useState("CAMPAIGN_PERFORMANCE");
  const [fbLevel, setFbLevel] = useState("campaign");
  const [fbAttribution, setFbAttribution] = useState(new Set(["7d_click"]));

  // Edit mode: prefill from the existing report config once the catalog is
  // loaded (we need it to split Google Ads' combined `fields[]` back into
  // dimensions vs metrics). Reverses buildReportPayload per service. The
  // setState calls are the whole point of this prefill effect — catalog
  // arrives async so we can't seed via lazy initializers.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isEdit || !catalog) return;
    const cfg = editReport.config || {};
    const metricSet = new Set(catalog.metrics.map((m) => m.name));
    if (catalog.service === "google_analytics_4") {
      setTableName(cfg.table || editReport.key || "");
      // Exclude the granularity date-spine dims — they're locked/auto-managed.
      const spine = new Set(Object.values(catalog.constraints?.dateDimensionByGranularity || {}));
      setDims(new Set((cfg.dimensions || []).filter((d) => !spine.has(d))));
      setMetrics(new Set(cfg.metrics || []));
      if (cfg.rollback_window != null) setRollback(cfg.rollback_window);
      if (cfg.time_aggregation_granularity) setGranularity(cfg.time_aggregation_granularity);
    } else if (catalog.service === "google_ads") {
      setTableName(cfg.table || editReport.key || "");
      const fields = Array.isArray(cfg.fields) ? cfg.fields : [];
      setDims(new Set(fields.filter((f) => !metricSet.has(f))));
      setMetrics(new Set(fields.filter((f) => metricSet.has(f))));
      if (cfg.report_type) setReportType(cfg.report_type);
    } else if (catalog.service === "facebook_ads") {
      setTableName(cfg.name || editReport.key || "");
      setDims(new Set(cfg.breakdowns || []));
      setMetrics(new Set(cfg.fields || []));
      if (cfg.level) setFbLevel(cfg.level);
      if (Array.isArray(cfg.action_attribution_windows)) {
        setFbAttribution(new Set(cfg.action_attribution_windows));
      }
    }
  }, [isEdit, catalog, editReport]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // GA4 only: the date dimension is mandatory and determined by the chosen
  // granularity (DAILY→date, WEEKLY→yearWeek, …). It's auto-managed — shown
  // as a locked chip that swaps when the granularity changes — not hand-picked.
  const dateDimByGran = catalog?.constraints?.dateDimensionByGranularity;
  const activeDateDim = useMemo(
    () => (dateDimByGran ? dateDimByGran[granularity] || "date" : null),
    [dateDimByGran, granularity]
  );
  const spineDims = useMemo(
    () => new Set(Object.values(dateDimByGran || {})),
    [dateDimByGran]
  );

  const lockedDims = useMemo(() => {
    const s = new Set(catalog?.constraints?.requiredDimensions ?? []);
    if (activeDateDim) s.add(activeDateDim);
    return s;
  }, [catalog, activeDateDim]);

  // Dimensions offered in the picker: hide the granularity-managed date-spine
  // dims (date/yearWeek/yearMonth/year) except the active one (shown locked).
  const dimensionFields = useMemo(
    () =>
      (catalog?.dimensions ?? []).filter(
        (f) => !spineDims.has(f.name) || f.name === activeDateDim
      ),
    [catalog, spineDims, activeDateDim]
  );

  const toggleDim = (name) => {
    if (lockedDims.has(name)) return;
    setDims((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const toggleMetric = (name) => {
    setMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const toggleAttribution = (val) => {
    setFbAttribution((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const effectiveDims = useMemo(() => {
    const out = new Set(dims);
    for (const r of lockedDims) out.add(r);
    return out;
  }, [dims, lockedDims]);

  const dimsOverLimit =
    catalog && effectiveDims.size > catalog.constraints.maxDimensions;
  const metricsOverLimit =
    catalog && metrics.size > catalog.constraints.maxMetrics;
  const nameValid = /^[a-zA-Z0-9_]+$/.test(tableName);

  const canSubmit =
    catalog &&
    tableName.length > 0 &&
    nameValid &&
    effectiveDims.size > 0 &&
    metrics.size > 0 &&
    !dimsOverLimit &&
    !metricsOverLimit;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const keyField = catalog.keyField;
    const body = {
      [keyField]: tableName.trim(),
      dimensions: Array.from(effectiveDims),
      metrics: Array.from(metrics)
    };
    if (catalog.service === "google_analytics_4") {
      body.rollback_window = Number(rollback);
      body.time_aggregation_granularity = granularity;
    } else if (catalog.service === "google_ads") {
      body.report_type = reportType;
    } else if (catalog.service === "facebook_ads") {
      body.level = fbLevel;
      body.action_attribution_windows = Array.from(fbAttribution);
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: integrationId, key: editReport.key, body });
      } else {
        await create.mutateAsync({ id: integrationId, body });
      }
      if (onCreated) onCreated(tableName.trim());
      onClose();
    } catch {
      /* notification shown by hook */
    }
  };

  const serviceLabel =
    catalog?.service === "google_analytics_4"
      ? "Google Analytics 4"
      : catalog?.service === "google_ads"
        ? "Google Ads"
        : catalog?.service === "facebook_ads"
          ? "Facebook Ads"
          : "";

  // name → friendly label map so the review screen shows "Country", not
  // "country", without scanning the catalog inline.
  const labelByName = useMemo(() => {
    const m = new Map();
    if (catalog) {
      for (const f of catalog.dimensions) m.set(f.name, f.label);
      for (const f of catalog.metrics) m.set(f.name, f.label);
    }
    return m;
  }, [catalog]);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--pv-neutral-grey-200)] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-[var(--pv-text-primary-text)]">
              {isEdit ? "Edit custom report" : "Add custom report"}{serviceLabel ? ` — ${serviceLabel}` : ""}
            </h2>
            <p className="text-xs text-[var(--pv-neutral-grey-500)] mt-1">
              {isEdit
                ? "Adjust the dimensions, metrics, or settings — changes apply on the next sync."
                : "Pick the dimensions and metrics you want — we'll sync them as a new table on the next run."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)] -mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        {busy ? (
          <CreatingState
            serviceLabel={serviceLabel}
            tableName={tableName}
          />
        ) : catalogQuery.isLoading || !catalog ? (
          <div className="p-8 text-center text-sm text-[var(--pv-neutral-grey-500)]">
            Loading catalog…
          </div>
        ) : step === "review" ? (
          <ReviewSummary
            service={catalog.service}
            serviceLabel={serviceLabel}
            tableName={tableName}
            dimNames={Array.from(effectiveDims)}
            metricNames={Array.from(metrics)}
            labelByName={labelByName}
            rollback={rollback}
            granularity={granularity}
            reportTypeLabel={
              GOOGLE_ADS_REPORT_TYPES.find((t) => t.value === reportType)?.label ||
              reportType
            }
            fbLevel={fbLevel}
            fbAttribution={Array.from(fbAttribution)}
            isEdit={isEdit}
          />
        ) : (
          <div className="px-5 py-4 flex-1 overflow-y-auto flex flex-col gap-4">
            <Field
              label="Report name"
              hint="Becomes the table name in your warehouse. Letters, numbers, underscores only."
            >
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. campaign_daily_sessions"
                className="w-full h-9 px-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--pv-primary-100)] focus:border-[var(--pv-primary-500)]"
              />
              {tableName.length > 0 && !nameValid && (
                <p className="text-[11px] text-[var(--pv-status-error,#EF4444)] mt-1">
                  Only letters, numbers, and underscores.
                </p>
              )}
            </Field>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FieldPicker
                title="Dimensions"
                fields={dimensionFields}
                selected={effectiveDims}
                locked={lockedDims}
                onToggle={toggleDim}
                overLimit={dimsOverLimit}
                limit={catalog.constraints.maxDimensions}
              />
              <FieldPicker
                title="Metrics"
                fields={catalog.metrics}
                selected={metrics}
                onToggle={toggleMetric}
                overLimit={metricsOverLimit}
                limit={catalog.constraints.maxMetrics}
              />
            </div>

            {catalog.service === "google_analytics_4" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Rollback window (days)"
                  hint={`How many days back to re-fetch each sync. ${catalog.constraints.rollbackWindow?.min}–${catalog.constraints.rollbackWindow?.max}.`}
                >
                  <input
                    type="number"
                    min={catalog.constraints.rollbackWindow?.min}
                    max={catalog.constraints.rollbackWindow?.max}
                    value={rollback}
                    onChange={(e) => setRollback(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white"
                  />
                </Field>
                <Field
                  label="Granularity"
                  hint="Time bucket per row. DAILY = one row per day; WEEKLY/MONTHLY/YEARLY roll the data up to that bucket."
                >
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white"
                  >
                    {catalog.constraints.aggregations.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {activeDateDim && (
                    <p className="text-[11px] text-[var(--pv-neutral-grey-500)] mt-1">
                      We'll add the matching date column automatically:{" "}
                      <span className="font-medium text-[var(--pv-text-primary-text)]">
                        {labelByName.get(activeDateDim) || activeDateDim}
                      </span>
                      .
                    </p>
                  )}
                </Field>
              </div>
            )}

            {catalog.service === "google_ads" && (
              <Field label="Report type" hint="Google Ads report shape.">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white"
                >
                  {GOOGLE_ADS_REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {catalog.service === "facebook_ads" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Level" hint="Each row represents one of these.">
                  <select
                    value={fbLevel}
                    onChange={(e) => setFbLevel(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-[var(--pv-neutral-grey-200)] bg-white"
                  >
                    <option value="account">Account</option>
                    <option value="campaign">Campaign</option>
                    <option value="adset">Ad set</option>
                    <option value="ad">Ad</option>
                  </select>
                </Field>
                <Field label="Attribution windows" hint="Conversion windows to count.">
                  <div className="flex flex-wrap gap-1">
                    {FB_ATTRIBUTION_WINDOWS.map((w) => {
                      const on = fbAttribution.has(w);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => toggleAttribution(w)}
                          className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                            on
                              ? "bg-[var(--pv-primary-100,#EEF2FF)] border-[var(--pv-primary-300,#A5B4FC)] text-[var(--pv-primary-700,#3730A3)]"
                              : "bg-white border-[var(--pv-neutral-grey-200)] text-[var(--pv-neutral-grey-700)] hover:border-[var(--pv-primary-300,#A5B4FC)]"
                          }`}
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}
          </div>
        )}

        {!busy && (
        <div className="px-5 py-3 border-t border-[var(--pv-neutral-grey-200)] flex items-center justify-end gap-2">
          {step === "edit" ? (
            <>
              <Button btnColor="secondary" btnSize="md" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button
                btnColor="primary"
                btnSize="md"
                onClick={() => canSubmit && setStep("review")}
                disabled={!canSubmit || busy}
              >
                {isEdit ? "Review changes" : "Review & create"}
              </Button>
            </>
          ) : (
            <>
              <Button
                btnColor="secondary"
                btnSize="md"
                onClick={() => setStep("edit")}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                btnColor="primary"
                btnSize="md"
                onClick={handleSubmit}
                disabled={!canSubmit || busy}
              >
                {isEdit ? (
                  <>
                    <Check size={14} className="mr-1.5" />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus size={14} className="mr-1.5" />
                    Confirm &amp; create
                  </>
                )}
              </Button>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

// ── Subcomponents ────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-[var(--pv-text-primary-text)]">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-[var(--pv-neutral-grey-500)]">{hint}</p>}
  </div>
);

// Mid-flight loading state. PATCH to Fivetran takes ~3-6s in practice
// (read existing reports → append → PATCH → re-read). A blank spinner
// in that window feels broken; rotating messages tell the user what's
// happening and that we haven't lost them.
const CreatingState = ({ serviceLabel, tableName }) => {
  const messages = [
    "Hang tight — we're getting your report ready…",
    `Talking to ${serviceLabel || "your source"}…`,
    "Saving the configuration…",
    "Wiring it up for the next sync…",
    "Almost done…"
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    // Advance through the messages and HOLD on the last one ("Almost done…")
    // until the request resolves and the modal closes — don't loop back to
    // the start (which looked like the loader was restarting).
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= messages.length - 1) {
          clearInterval(t);
          return i;
        }
        return i + 1;
      });
    }, CREATING_MESSAGE_ROTATE_MS);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="px-5 py-12 flex-1 flex flex-col items-center justify-center gap-4 text-center">
      <svg
        className="animate-spin h-10 w-10 text-[var(--pv-primary-500)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <div className="flex flex-col gap-1.5 max-w-md">
        <p className="text-sm font-medium text-[var(--pv-text-primary-text)] transition-opacity duration-300">
          {messages[idx]}
        </p>
        {tableName && (
          <p className="text-xs text-[var(--pv-neutral-grey-500)]">
            Creating <span className="font-mono">{tableName}</span>
          </p>
        )}
        <p className="text-[11px] text-[var(--pv-neutral-grey-400)] mt-1">
          This usually takes a few seconds. Please don't close this window.
        </p>
      </div>
    </div>
  );
};

// Pre-submit confirmation panel — last chance to spot a mistake before we
// PATCH Fivetran. Read-only summary of every field that will land on the
// wire; "Back" returns to the editor with everything preserved.
const ReviewSummary = ({
  service,
  serviceLabel,
  tableName,
  dimNames,
  metricNames,
  labelByName,
  rollback,
  granularity,
  reportTypeLabel,
  fbLevel,
  fbAttribution,
  isEdit
}) => (
  <div className="px-5 py-4 flex-1 overflow-y-auto flex flex-col gap-3">
    <div className="rounded-md border border-[var(--pv-primary-300,#A5B4FC)] bg-[var(--pv-primary-100,#EEF2FF)] px-3 py-2 text-[11px] text-[var(--pv-primary-700,#3730A3)]">
      {isEdit
        ? `Review your changes before we send them to ${serviceLabel || "the source"}. Renaming the report creates a new table on the next sync — the old one stops updating.`
        : `Review the report before we send it to ${serviceLabel || "the source"}. Changes take effect on the next sync.`}
    </div>

    <SummaryRow label="Source">{serviceLabel}</SummaryRow>
    <SummaryRow label="Report name" mono>
      {tableName}
    </SummaryRow>
    <SummaryRow label={`Dimensions (${dimNames.length})`}>
      <ChipList names={dimNames} labelByName={labelByName} />
    </SummaryRow>
    <SummaryRow label={`Metrics (${metricNames.length})`}>
      <ChipList names={metricNames} labelByName={labelByName} />
    </SummaryRow>

    {service === "google_analytics_4" && (
      <>
        <SummaryRow label="Rollback window">{rollback} days</SummaryRow>
        <SummaryRow label="Granularity">{granularity}</SummaryRow>
      </>
    )}
    {service === "google_ads" && (
      <SummaryRow label="Report type">{reportTypeLabel}</SummaryRow>
    )}
    {service === "facebook_ads" && (
      <>
        <SummaryRow label="Level">{fbLevel}</SummaryRow>
        <SummaryRow label="Attribution windows">
          <ChipList names={fbAttribution} />
        </SummaryRow>
      </>
    )}
  </div>
);

const SummaryRow = ({ label, children, mono }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
    <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--pv-neutral-grey-500)] pt-1">
      {label}
    </div>
    <div
      className={`text-sm text-[var(--pv-text-primary-text)] ${
        mono ? "font-mono text-[13px]" : ""
      }`}
    >
      {children || <span className="text-[var(--pv-neutral-grey-400)]">—</span>}
    </div>
  </div>
);

const ChipList = ({ names, labelByName }) => {
  if (!names || names.length === 0) {
    return <span className="text-[var(--pv-neutral-grey-400)]">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((n) => (
        <span
          key={n}
          className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-white border border-[var(--pv-primary-300,#A5B4FC)] text-[var(--pv-primary-700,#3730A3)]"
          title={n}
        >
          {labelByName?.get(n) || n}
        </span>
      ))}
    </div>
  );
};

// Picker: search, group by category (collapsed-by-default after the first
// two so the GA4 live catalog of 15+ categories doesn't visually explode).
const FieldPicker = ({
  title,
  fields,
  selected,
  locked = new Set(),
  onToggle,
  overLimit,
  limit
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        (f.category || "").toLowerCase().includes(q)
    );
  }, [fields, search]);

  const grouped = useMemo(() => {
    const out = new Map();
    for (const f of filtered) {
      const k = f.category || "Other";
      if (!out.has(k)) out.set(k, []);
      out.get(k).push(f);
    }
    return out;
  }, [filtered]);

  // Categories with a locked or already-selected field auto-expand — the
  // user shouldn't have to hunt for fields that are already part of their
  // selection. The rest stay collapsed (GA4 live has 15+ categories — open
  // them all and the picker becomes a wall of text again).
  // Searching expands everything automatically.
  const isSearching = search.trim().length > 0;

  const autoOpenCats = useMemo(() => {
    const open = new Set();
    for (const [cat, fs] of grouped.entries()) {
      if (fs.some((f) => selected.has(f.name) || locked.has(f.name))) {
        open.add(cat);
      }
    }
    // Fresh state (nothing picked, nothing locked) — open the first
    // category so the user sees fields immediately rather than a stack
    // of collapsed headers.
    if (open.size === 0) {
      const first = grouped.keys().next().value;
      if (first) open.add(first);
    }
    return open;
  }, [grouped, selected, locked]);

  // User overrides — explicit open/close per category. Selecting a chip
  // updates `autoOpenCats` but must NOT flip a category the user has
  // already opened/closed by hand (the prior "invert auto" approach was
  // collapsing the dropdown right under the user's click).
  const [override, setOverride] = useState({}); // { [cat]: true | false }
  const isOpen = (cat) => {
    if (isSearching) return true;
    if (cat in override) return override[cat];
    return autoOpenCats.has(cat);
  };
  const toggleCat = (cat) => {
    const next = !isOpen(cat);
    setOverride((prev) => ({ ...prev, [cat]: next }));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-[var(--pv-text-primary-text)]">
          {title}
        </label>
        <span
          className={`text-[11px] ${
            overLimit
              ? "text-[var(--pv-status-error,#EF4444)] font-medium"
              : "text-[var(--pv-neutral-grey-500)]"
          }`}
        >
          {selected.size} / {limit}
        </span>
      </div>
      <div className="border border-[var(--pv-neutral-grey-200)] rounded-md bg-white flex flex-col">
        <div className="relative border-b border-[var(--pv-neutral-grey-100)]">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pv-neutral-grey-400)] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white focus:outline-none rounded-t-md"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1.5">
          {[...grouped.entries()].map(([category, fs]) => {
            const open = isOpen(category);
            return (
              <div key={category}>
                <button
                  type="button"
                  onClick={() => toggleCat(category)}
                  className="w-full flex items-center justify-between px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-text-primary-text)]"
                >
                  <span className="flex items-center gap-1">
                    {open ? <CaretDown size={10} weight="bold" /> : <CaretRight size={10} weight="bold" />}
                    {category}
                  </span>
                  <span className="text-[10px] text-[var(--pv-neutral-grey-400)]">
                    {fs.length}
                  </span>
                </button>
                {open && (
                  <div className="flex flex-wrap gap-1 pt-1 pb-1">
                    {fs.map((f) => {
                      const checked = selected.has(f.name);
                      const isLocked = locked.has(f.name);
                      return (
                        <button
                          key={f.name}
                          type="button"
                          onClick={() => onToggle(f.name)}
                          disabled={isLocked}
                          title={f.name}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors ${
                            checked
                              ? "bg-[var(--pv-primary-100,#EEF2FF)] border-[var(--pv-primary-300,#A5B4FC)] text-[var(--pv-primary-700,#3730A3)]"
                              : "bg-white border-[var(--pv-neutral-grey-200)] text-[var(--pv-neutral-grey-700)] hover:border-[var(--pv-primary-300,#A5B4FC)]"
                          } ${isLocked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {isLocked ? (
                            <Lock size={9} weight="fill" />
                          ) : checked ? (
                            <Check size={10} weight="bold" />
                          ) : null}
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-xs text-[var(--pv-neutral-grey-500)] text-center py-6">
              No matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCustomReportModal;
