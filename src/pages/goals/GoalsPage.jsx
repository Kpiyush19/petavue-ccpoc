import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, Target, CheckCircle, ClockCounterClockwise, Play, CircleNotch, CaretRight, CaretDown, Lightning, Sliders,
  DotsThree, XCircle, ArrowSquareOut, Lightbulb, Eye, Clock, Flag, Pulse, FlowArrow, MagnifyingGlass, Plus, Trash,
  Sparkle, PaperPlaneRight, Funnel, Info, Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Tooltip } from "@/common-components";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost, apiPut, apiDelete } from "../../api";
import { cn } from "../../utils/cn";
import { RecommendationDetail } from "./RecommendationDrawer";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

const HEALTH = {
  attention: { dot: "bg-rose-500", label: "Act now", text: "text-rose-600" },
  ontrack: { dot: "bg-green-500", label: "On track", text: "text-green-600" },
  setup: { dot: "bg-amber-500", label: "In setup", text: "text-amber-600" },
};
const SETUP_LABEL = { calibrating: "Calibrating", decisions: "Ready for review", review: "Ready for review" };

const NEEDS_COLS = "minmax(0,1fr) 180px 200px 84px 36px";
// Shared column layout for both goal lists: Goal · What we found · Priority ·
// Activity · Checked · kebab.
const GOALS_COLS = "minmax(0,1.3fr) minmax(0,1.9fr) 132px 150px 110px 44px";

/* ── Row kebab menu (portaled so it escapes section overflow) ── */
function RowMenu({ items, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 192) });
    }
    setOpen((o) => !o);
  };
  return (
    <div className="flex justify-center">
      <button ref={btnRef} onClick={toggle} disabled={disabled}
        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-pv-neutral-grey-100 bg-transparent border-none cursor-pointer disabled:opacity-50" aria-label="Actions">
        <DotsThree size={18} weight="bold" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="fixed z-[61] w-48 bg-white border border-[var(--border-primary)] rounded-lg shadow-lg py-1"
                style={{ top: pos.top, left: pos.left, transformOrigin: "top right" }}
              >
                {items.map((it) => (
                  <button key={it.label} onClick={(e) => { e.stopPropagation(); it.onClick(); setOpen(false); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left bg-transparent border-none cursor-pointer hover:bg-pv-neutral-grey-50", it.danger ? "text-rose-600" : "text-[var(--text-primary)]")}>
                    {it.icon && <it.icon size={15} />} {it.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

/* ── ThoughtSpot-style insight card: color-coded 2px top border, sharp corners,
      subtle hover lift. Used for the portfolio "Highlights" row. ── */
const INSIGHT_COLOR = {
  red: { bar: "#ef4444", txt: "text-rose-600" },
  amber: { bar: "#f59e0b", txt: "text-amber-600" },
  green: { bar: "#22c55e", txt: "text-green-600" },
  blue: { bar: "var(--pv-primary-500)", txt: "text-pv-primary-primary-600" },
};
function InsightCard({ kind, color, icon: Icon, value, desc, foot, footIcon: FootIcon, onClick }) {
  const c = INSIGHT_COLOR[color] || INSIGHT_COLOR.blue;
  return (
    <div className="flex flex-col h-full bg-white border border-pv-neutral-grey-150/50 rounded-lg px-4 py-3.5 dropshadow-card">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{kind}</span>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={16} className={c.txt} />}
        <span className="text-[24px] font-semibold leading-none text-[var(--text-primary)]">{value}</span>
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] leading-snug mb-3">{desc}</p>
      <div className="flex items-center gap-1.5 mt-auto pt-2.5 border-t border-[var(--pv-neutral-grey-100)]">
        {FootIcon && <FootIcon size={13} className="text-[var(--text-muted)] shrink-0" />}
        <span className="text-[12px] text-[var(--text-muted)] truncate">{foot}</span>
      </div>
    </div>
  );
}

/* ── Column header cell with a Phosphor icon ── */
function HeaderCell({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-[var(--pv-neutral-grey-500)] font-medium text-xs px-2">
      {Icon && <Icon size={13} />} {label}
    </span>
  );
}

/* ── Collapsible section with a proper heading ── */
function Section({ title, icon: Icon, iconClass, count, badge, open, onToggle, headerRight, children }) {
  return (
    <section className="bg-white border border-[var(--pv-neutral-grey-150)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.14)]">
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-pv-neutral-grey-50/60 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} weight="fill" className={cn("shrink-0", iconClass || "text-[var(--text-muted)]")} />}
          <h2 className="text-[14px] font-normal text-[var(--text-primary)] tracking-[-0.01em]">{title}</h2>
          {typeof count === "number" && (
            <span className={cn("px-1.5 py-0.5 text-[11px] font-semibold rounded-full", badge || "bg-pv-neutral-grey-100 text-[var(--text-muted)]")}>{count}</span>
          )}
          <CaretDown size={15} className={cn("text-[var(--text-muted)] transition-transform ml-0.5", !open && "-rotate-90")} />
        </div>
        {headerRight}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ── An "act now" recommendation row ── */
function AttentionRow({ item, onOpen, onOpenRec }) {
  const qc = useQueryClient();
  const act = useMutation({
    mutationFn: (action) => apiPost(`/api/goals/${item.goalId}/recommendations/${item.recId}/act`, { action, note: action === "snoozed" ? "Snoozed from home" : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals-attention"] }); qc.invalidateQueries({ queryKey: ["goals"] }); },
  });
  return (
    <motion.div
      layout
      initial={false}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="grid items-center gap-3 px-5 py-3 border-t border-[var(--pv-neutral-grey-100)] hover:bg-pv-neutral-grey-50/70 transition-colors overflow-hidden"
      style={{ gridTemplateColumns: NEEDS_COLS }}
    >
      <button onClick={() => onOpenRec(item.goalId, item.recId)} className="flex items-center gap-2 min-w-0 bg-transparent border-none p-0 cursor-pointer text-left">
        <Lightning size={14} weight="fill" className="text-rose-500 shrink-0" />
        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate hover:text-pv-primary-primary-600">{item.title}</span>
      </button>
      <button onClick={() => onOpen(item.goalId)} className="text-[12px] font-medium text-pv-primary-primary-600 hover:underline truncate text-left bg-transparent border-none p-0 cursor-pointer">{item.goalName}</button>
      <span className="text-[12px] text-[var(--text-secondary)] truncate">{item.groupLabel}</span>
      <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">{item.at}</span>
      <RowMenu
        disabled={act.isPending}
        items={[
          { label: "Mark done", icon: CheckCircle, onClick: () => act.mutate("acted") },
          { label: "Snooze", icon: ClockCounterClockwise, onClick: () => act.mutate("snoozed") },
          { label: "Dismiss", icon: XCircle, danger: true, onClick: () => act.mutate("rejected") },
        ]}
      />
    </motion.div>
  );
}

/* One mutually-exclusive bucket per goal — drives the "Your goals" filter tabs
   so a long list can be narrowed to a subset instead of scrolled. */
function goalBucket(g) {
  if (g.health === "setup") return "attention"; // needs setup / your input
  if (g.actNow > 0) return "actnow";
  if (g.watching > 0) return "watching";
  return "ontrack";
}
const GOAL_FILTERS = [
  { k: "all", label: "All" },
  { k: "actnow", label: "Act now" },
  { k: "attention", label: "Needs attention" },
  { k: "ontrack", label: "On track" },
  { k: "watching", label: "Watching" },
];

/* Filter for "Your goals" — design-system button trigger + portaled menu of
   buckets with live counts. */
function GoalFilterDropdown({ value, onChange, counts, total }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const current = GOAL_FILTERS.find((f) => f.k === value) || GOAL_FILTERS[0];
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 240) });
    }
    setOpen((o) => !o);
  };
  return (
    <div ref={ref} className="relative shrink-0">
      <PvButton variant="secondary" size="md" icon={Funnel} aria-label={`Filter goals: ${current.label}`} onClick={toggle} />
      {value !== "all" && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pv-primary-primary-500 ring-2 ring-white pointer-events-none" />}
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed z-[61] w-[240px] bg-white border border-[var(--border-primary)] rounded-lg shadow-lg py-1" style={{ top: pos.top, left: pos.left }}>
            <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Filter by</p>
            {GOAL_FILTERS.map((f) => {
              const count = f.k === "all" ? total : (counts[f.k] || 0);
              const active = f.k === value;
              return (
                <button
                  key={f.k}
                  onClick={() => { onChange(f.k); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between gap-4 px-4 py-3 text-[14px] text-left bg-transparent border-none cursor-pointer hover:bg-pv-neutral-grey-50",
                    active ? "text-pv-primary-primary-600 font-medium" : "text-[var(--text-primary)]"
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className={cn("flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 transition-colors", active ? "border-pv-primary-primary-500" : "border-pv-neutral-grey-300")}>
                      {active && <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />}
                    </span>
                    {f.label}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">{count}</span>
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/* Priority pill — the first thing a triager reads: what should I do about this
   goal? Act now → Watch → On track → setup states. */
function goalPriority(goal) {
  const b = goalBucket(goal);
  if (b === "actnow") return { label: "Act now", icon: Lightning, cls: "bg-rose-50 text-rose-600" };
  if (b === "attention") return { label: "Needs attention", icon: Warning, cls: "bg-amber-50 text-amber-700" };
  if (b === "watching") return { label: "Watching", icon: Eye, cls: "bg-blue-50 text-blue-700" };
  return { label: "On track", icon: CheckCircle, cls: "bg-green-50 text-green-600" };
}

/* Shared row actions (open · delete) for both the triage cards and the table. */
function useGoalRowMenu(goal, onFull) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => apiDelete(`/api/goals/${goal.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-attention"] });
      qc.invalidateQueries({ queryKey: ["goals-recommendations"] });
      toast.success("Goal deleted");
    },
    onError: (e) => toast.error("Couldn't delete: " + e.message),
  });
  const removeGoal = () => { if (window.confirm(`Delete “${goal.name}”? This can't be undone.`)) del.mutate(); };
  const items = [
    { label: "Open full view", icon: ArrowSquareOut, onClick: () => onFull(goal.id) },
    { label: del.isPending ? "Deleting…" : "Delete goal", icon: Trash, danger: true, onClick: removeGoal },
  ];
  return { items };
}

/* ── Shared column header for both goal lists. ── */
function GoalListHeader() {
  return (
    <div className="grid px-3 py-2 w-full" style={{ gridTemplateColumns: GOALS_COLS }}>
      <HeaderCell label="Goal" />
      <HeaderCell label="What we found" />
      <HeaderCell label="Priority" />
      <HeaderCell label="Activity" />
      <HeaderCell label="Checked" />
      <span />
    </div>
  );
}

/* ── The one goal row, used in BOTH "Where to act first" and "Your goals" so the
      two read as the same object — same columns, 12px, priority as a bg chip.
      Goal · Priority · Reason to open · Activity · Checked · menu. ── */
function GoalRow({ goal, onOpen, onFull }) {
  const { items: menuItems } = useGoalRowMenu(goal, onFull);
  const p = goalPriority(goal);
  const finding = goal.topFinding;
  const inSetup = goal.health === "setup";

  // Reason to open — the latest finding if there is one, otherwise a state line.
  const reason = finding
    ? finding.title
    : inSetup
      ? (goal.status === "calibrating" ? "Calibrating: reading your data" : "Ready for review: finish setup to start tracking")
      : "On track. Nothing needs action this check-in";

  return (
    <div
      className="grid items-center w-full px-3 h-[52px] shrink-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-lg hover:bg-[var(--pv-primary-50)] hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)] transition-all cursor-pointer"
      style={{ gridTemplateColumns: GOALS_COLS }}
      onClick={() => onOpen(goal)}
    >
      {/* Goal */}
      <span className="text-[12px] font-medium text-[var(--text-primary)] truncate px-2">{goal.name}</span>
      {/* What we found — secondary text */}
      <span className="text-[12px] text-[#757A97] truncate px-2">{reason}</span>
      {/* Priority — bg chip */}
      <span className="px-2">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap", p.cls)}><p.icon size={10} weight="fill" />{p.label}</span>
      </span>
      {/* Activity — parts joined by "|" */}
      <span className="px-2 flex items-center gap-1.5 min-w-0 text-[12px] text-[var(--text-muted)]">
        {(() => {
          const parts = [];
          if (goal.actNow > 0) parts.push(<span key="act" className="text-[var(--text-primary)] font-semibold whitespace-nowrap">{goal.actNow} to act</span>);
          if (goal.watching > 0 && goal.actNow === 0) parts.push(<span key="watch" className="whitespace-nowrap">{goal.watching} watching</span>);
          if (goal.firingCount > 0) parts.push(<span key="fire" className="whitespace-nowrap">{goal.firingCount} firing</span>);
          if (parts.length === 0) return <span>—</span>;
          return parts.flatMap((el, i) => i === 0 ? [el] : [<span key={`sep${i}`} className="text-[var(--pv-neutral-grey-300)]">|</span>, el]);
        })()}
      </span>
      {/* Checked */}
      <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap truncate px-2">{goal.lastCheckIn || "Not run yet"}</span>
      {/* Action — kebab (Run check-in / Open full view / Delete live inside it) */}
      <div className="px-2 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
        <RowMenu items={menuItems} />
      </div>
    </div>
  );
}

/* ── Config popup ── */
function ConfigModal({ onClose }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["goal-config"], queryFn: () => apiGet("/api/goals/config") });
  const [form, setForm] = useState(null);
  const value = form || data || { company: "", process: "", icp: "", additional: "" };
  const set = (k, v) => setForm({ ...value, [k]: v });
  const save = useMutation({
    mutationFn: () => apiPut("/api/goals/config", value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goal-config"] }); toast.success("Context saved"); onClose(); },
  });
  const filled = ["company", "process", "icp", "additional"].filter((k) => (value[k] || "").trim()).length;
  const FIELDS = [
    { k: "company", label: "Company", placeholder: "What does your company do?" },
    { k: "process", label: "Process", placeholder: "How does your GTM / revenue process work?" },
    { k: "icp", label: "Ideal Customer Profile", placeholder: "Who are your best-fit customers?" },
    { k: "additional", label: "Additional context", placeholder: "Anything else the engine should know." },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-[700px] max-w-[94vw] max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border-t-[3px] border-[var(--pv-primary-500)]"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-primary)]">
          <div>
            <h3 className="text-[18px] font-semibold text-[var(--text-primary)] m-0">Configure</h3>
            <p className="text-[14px] text-[var(--text-secondary)] mt-0.5 max-w-[480px]">The context we ground every goal in: how your business, funnel, and best-fit customers actually work, so the findings fit you, not a generic benchmark.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PvButton variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
          {FIELDS.map((f) => (
            <div key={f.k} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--text-primary)]">{f.label}</label>
              <textarea value={value[f.k] || ""} onChange={(e) => set(f.k, e.target.value)} rows={3} placeholder={f.placeholder}
                className="w-full text-[14px] px-3.5 py-3 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none text-[var(--text-primary)] placeholder:text-[#adb2ce]" />
            </div>
          ))}
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-primary)]">
          <PvButton variant="secondary" size="md" label="Cancel" onClick={onClose} />
          <PvButton variant="primary" size="md" label={save.isPending ? "Saving…" : "Save"} disabled={save.isPending} onClick={() => save.mutate()} />
        </div>
      </motion.div>
    </div>
  );
}

/* ── Recommendations tab: master list (left) + detail (right) ── */
/* Item styled like a Workbook action card: icon frame + content, radius-4 card,
   hover → primary-50, active → primary-50 + primary-500 border + soft shadow. */
function RecListItem({ item, selected, onClick }) {
  const actNow = item.severity === "act-now";
  const done = item.status !== "open";
  const Icon = done ? CheckCircle : actNow ? Lightning : Eye;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full min-h-[76px] text-left rounded-[4px] border bg-white transition-colors cursor-pointer",
        selected
          ? "bg-pv-primary-primary-50 border-pv-primary-primary-500 shadow-[0_4px_4px_rgba(54,97,237,0.08)]"
          : "border-[var(--pv-neutral-grey-200)] hover:bg-pv-primary-primary-50",
        done && "opacity-70"
      )}
    >
      <div className="flex items-center min-h-[76px]">
        {/* icon frame */}
        <div className="flex items-center justify-center p-2.5 shrink-0">
          <div
            className={cn("flex items-center justify-center w-9 h-9 rounded-[4px] border border-[var(--pv-neutral-grey-200)]", selected ? "bg-white" : "bg-pv-neutral-grey-50")}
            style={{ boxShadow: "0 4px 4px rgba(122,122,122,0.04)" }}
          >
            <Icon size={16} className={done ? "text-[var(--text-muted)]" : actNow ? "text-rose-500" : "text-amber-500"} />
          </div>
        </div>
        {/* content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 pr-3 py-2">
          <Tooltip title={item.title} arrow placement="top">
            <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 cursor-default">{item.title}</p>
          </Tooltip>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-normal uppercase tracking-wide text-[var(--text-secondary)]">{done ? "Done" : actNow ? "Act now" : "Watch"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RecommendationsPanel({ onOpenGoal }) {
  const { data } = useQuery({ queryKey: ["goals-recommendations"], queryFn: () => apiGet("/api/goals/recommendations"), refetchInterval: 2500 });
  const items = data?.items || [];
  const [sel, setSel] = useState(null);
  const selected = items.find((i) => i.recId === sel) || items[0];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full text-center px-6">
        <CheckCircle size={26} weight="fill" className="text-green-500" />
        <p className="text-[15px] font-medium text-[var(--text-primary)]">You're all caught up</p>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-[380px]">No moves to make right now. We'll flag anything wasting spend or leaving demand on the table the moment it shows up.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: recommendation list (wbc__chat-style panel) */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[var(--pv-neutral-grey-150)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {items.map((it) => (
            <RecListItem key={it.recId} item={it} selected={selected?.recId === it.recId} onClick={() => setSel(it.recId)} />
          ))}
        </div>
      </div>
      {/* Right: detail */}
      <div className="flex-1 min-w-0">
        {selected && <RecommendationDetail key={selected.recId} goalId={selected.goalId} recId={selected.recId} onOpenGoal={onOpenGoal} />}
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("goals");
  const [showConfig, setShowConfig] = useState(false);
  const [goalFilter, setGoalFilter] = useState("all");
  const [goalSearch, setGoalSearch] = useState("");
  const { data: recData } = useQuery({ queryKey: ["goals-recommendations"], queryFn: () => apiGet("/api/goals/recommendations"), refetchInterval: 2500 });
  const recCount = (recData?.items || []).filter((r) => r.status === "open").length;
  const { data: goalsData } = useQuery({ queryKey: ["goals"], queryFn: () => apiGet("/api/goals"), refetchInterval: 2500 });
  const { data: attn } = useQuery({ queryKey: ["goals-attention"], queryFn: () => apiGet("/api/goals/attention"), refetchInterval: 2500 });
  const goals = goalsData?.goals || [];
  const items = attn?.items || [];
  const attentionGoals = goals.filter((g) => g.health === "attention").length;
  const onTrack = goals.filter((g) => g.health === "ontrack").length;
  const setup = goals.filter((g) => g.health === "setup").length;

  // Portfolio "Highlights" — four lenses on the goal portfolio: what to do now,
  // what's off track, what's healthy, and what's being watched (lower priority).
  const watching = (recData?.items || []).filter((r) => r.severity === "watch" && r.status === "open").length;
  const insights = [
    { kind: "Act now", color: "red", icon: Lightning, value: String(items.length),
      desc: items.length ? `move${items.length !== 1 ? "s" : ""} to make before they cost you pipeline` : "nothing needs a decision right now",
      foot: `Across ${goals.length} goal${goals.length !== 1 ? "s" : ""}`, footIcon: Target },
    { kind: "Needs attention", color: "amber", icon: Flag, value: String(attentionGoals),
      desc: `goal${attentionGoals !== 1 ? "s" : ""} drifting off the number this week`, foot: attentionGoals > 0 ? "See below" : "All clear", footIcon: Pulse },
    { kind: "On track", color: "green", icon: CheckCircle, value: String(onTrack),
      desc: `of ${goals.length} goal${goals.length !== 1 ? "s" : ""} on pace to hit the number`, foot: setup > 0 ? `${setup} still calibrating` : "Healthy pace", footIcon: Pulse },
    { kind: "Watching", color: "blue", icon: Eye, value: String(watching),
      desc: `early signal${watching !== 1 ? "s" : ""} we're watching, no action needed yet`, foot: "No action needed yet", footIcon: Pulse },
  ];

  // Every goal opens its full detail page (no overlay).
  const openGoal = (goalOrId) => {
    const id = typeof goalOrId === "string" ? goalOrId : goalOrId?.id;
    if (id) navigate(`/goals/${id}`);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Standard app header bar (consistent with Dashboards / Sessions / Workflows) */}
      <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
        <span className="text-[16px] leading-[24px] font-medium">Goals</span>
      </div>

      {/* Sub-tab bar (Goals · Recommendations) */}
      <div className="flex w-full shrink-0 bg-white border-b border-[var(--pv-neutral-grey-150)]">
        <div className="flex items-start gap-6 px-4">
          {[{ k: "goals", label: "Objectives" }, { k: "recommendations", label: "Recommendations" }].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "flex items-center gap-2 h-12 px-2 border-b-2 bg-transparent cursor-pointer text-[14px] transition-colors",
                tab === t.k ? "text-pv-primary-primary-500 font-medium border-pv-primary-primary-500" : "text-[var(--text-primary)] border-transparent hover:text-pv-primary-primary-500"
              )}
            >
              {t.label}
              {t.k === "recommendations" && recCount > 0 && (
                <span className={cn("px-1.5 py-0.5 text-[11px] font-semibold rounded-full", tab === t.k ? "bg-pv-primary-primary-500 text-white" : "bg-pv-neutral-grey-100 text-[var(--text-muted)]")}>{recCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboards-style frame: grey-50 padded area with the page in a white panel */}
      <div className="flex-1 min-h-0 p-4 bg-pv-neutral-grey-50 overflow-hidden">
        <div className="flex flex-col w-full h-full bg-white rounded-xl border border-[var(--pv-neutral-grey-150)] overflow-hidden">
          {tab === "goals" ? (
            <div className="w-full h-full overflow-y-auto">
              <div className="flex flex-col w-full p-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {insights.map((ins) => <InsightCard key={ins.kind} {...ins} />)}
                </div>

                {/* ── Where to act first — triage strip (top), same columnar row ── */}
                {(() => {
                  // Everything that needs a move: act-now goals and needs-attention (setup) goals.
                  const actionable = goals.filter((g) => ["actnow", "attention"].includes(goalBucket(g)));
                  if (actionable.length === 0) return null;
                  const bucketRank = { actnow: 0, attention: 1 };
                  const sorted = [...actionable].sort((a, b) => (bucketRank[goalBucket(a)] ?? 9) - (bucketRank[goalBucket(b)] ?? 9));
                  const shown = sorted.slice(0, 5);
                  return (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-[14px] font-normal text-[var(--text-primary)] tracking-[-0.01em]">Where to act first</h2>
                        <Tooltip title="The goals bleeding spend or leaving demos on the table, worked top-down, so your next move protects the number." arrow placement="top">
                          <span className="inline-flex items-center cursor-default text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><Info size={15} /></span>
                        </Tooltip>
                      </div>
                      <div className="flex flex-col w-full">
                        <GoalListHeader />
                        <div className="flex flex-col gap-2">
                          {shown.map((g) => <GoalRow key={g.id} goal={g} onOpen={openGoal} onFull={(gid) => navigate(`/goals/${gid}`)} />)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Your goals — full list (bottom), same columnar row + header ── */}
                {(() => {
                  const q = goalSearch.trim().toLowerCase();
                  const counts = goals.reduce((m, g) => { const b = goalBucket(g); m[b] = (m[b] || 0) + 1; return m; }, {});
                  const filtered = goals.filter((g) =>
                    (goalFilter === "all" || goalBucket(g) === goalFilter) &&
                    (!q || g.name.toLowerCase().includes(q))
                  );
                  return (
                    <>
                      <div id="your-goals" className="flex items-center gap-3 mb-3 scroll-mt-4 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-[14px] font-normal text-[var(--text-primary)] tracking-[-0.01em]">Your goals</h2>
                          <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goals.length}</span>
                        </div>
                        {goals.length > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            {/* Search — consistent 320px design-system style */}
                            <div className="flex items-center gap-2 w-80 h-8 border border-pv-neutral-grey-200 rounded-lg bg-white focus-within:border-brand-ai-100 hover:border-pv-primary-primary-300 px-3 transition-colors">
                              <MagnifyingGlass size={16} weight="regular" className="text-pv-neutral-grey-500 shrink-0" />
                              <input
                                value={goalSearch}
                                onChange={(e) => setGoalSearch(e.target.value)}
                                placeholder="Search goals"
                                className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-pv-neutral-grey-500 p-0"
                              />
                            </div>
                            {/* Filter — 32×32 icon-only secondary button, after the search */}
                            <GoalFilterDropdown value={goalFilter} onChange={setGoalFilter} counts={counts} total={goals.length} />
                          </div>
                        )}
                      </div>

                      {goals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-14 border border-[var(--border-primary)] rounded-lg text-center">
                          <Target size={24} className="text-[var(--text-muted)]" />
                          <p className="text-[14px] text-[var(--text-secondary)]">No goals yet. Set one and we'll watch your paid spend for waste and the demand you're missing, and tell you where the next dollar should go.</p>
                        </div>
                      ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-10 border border-dashed border-[var(--border-primary)] rounded-lg text-center">
                          <MagnifyingGlass size={20} className="text-[var(--text-muted)]" />
                          <p className="text-[13px] text-[var(--text-secondary)]">No goals match{q ? ` “${goalSearch.trim()}”` : " this filter"}.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          <GoalListHeader />
                          <div className="flex flex-col gap-2">
                            {filtered.map((g) => <GoalRow key={g.id} goal={g} onOpen={openGoal} onFull={(gid) => navigate(`/goals/${gid}`)} />)}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <RecommendationsPanel onOpenGoal={openGoal} />
          )}
        </div>
      </div>

      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
    </div>
  );
}
