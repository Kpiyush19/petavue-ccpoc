// Status pill for the Schema tab. One consistent pill language down the column,
// with colour as the hierarchy: steady-state config is quiet (grey), live sync
// stands out. Green is reserved for "Completed" so it has a single meaning.
//   DISABLED    → "Disabled"    (light grey) — not selected for sync.
//   ENABLED     → "Enabled"     (grey)       — selected, idle.
//   IN_PROGRESS → "In progress" (blue, pulse) — part of an active run.
//   COMPLETED   → "Completed"   (green)      — finished successfully today (tenant tz).
// Colours mirror the StatusPill in data-hub/sync-activity.

const STYLES = {
  DISABLED: {
    bg: "bg-[var(--pv-neutral-grey-50)]",
    text: "text-[var(--pv-neutral-grey-500)]",
    label: "Disabled",
    pulse: false
  },
  ENABLED: {
    bg: "bg-[var(--pv-neutral-grey-100)]",
    text: "text-[var(--pv-neutral-grey-600)]",
    label: "Enabled",
    pulse: false
  },
  IN_PROGRESS: {
    bg: "bg-[var(--pv-primary-50)]",
    text: "text-[var(--pv-primary-500)]",
    label: "In progress",
    pulse: true
  },
  COMPLETED: {
    bg: "bg-[var(--pv-success-bg)]",
    text: "text-[var(--pv-success-text)]",
    label: "Completed",
    pulse: false
  }
};

export const SyncStatusPill = ({ state }) => {
  const cfg = STYLES[state];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-normal whitespace-nowrap ${cfg.bg} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${cfg.pulse ? "animate-pulse" : ""}`}
      />
      {cfg.label}
    </span>
  );
};

// One-line meaning per status, shown in the Status column-header legend tooltip
// so users can see every state at a glance. Order = config lifecycle.
const LEGEND = [
  { state: "DISABLED", desc: "Not selected for sync." },
  { state: "ENABLED", desc: "Selected for sync, idle." },
  { state: "IN_PROGRESS", desc: "Part of an active sync run." },
  { state: "COMPLETED", desc: "Finished successfully today." }
];

export const SyncStatusLegend = () => (
  <div className="flex flex-col gap-2.5 py-1 normal-case tracking-normal">
    {LEGEND.map(({ state, desc }) => (
      <div key={state} className="flex items-center gap-3">
        <span className="shrink-0 w-28">
          <SyncStatusPill state={state} />
        </span>
        <span className="text-[11px] font-normal leading-snug text-white/85">{desc}</span>
      </div>
    ))}
  </div>
);

export default SyncStatusPill;
