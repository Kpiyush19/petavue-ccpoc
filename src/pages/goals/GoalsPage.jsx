import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, Target, CheckCircle, ClockCounterClockwise, Play, CircleNotch, CaretRight, CaretDown, Lightning, Sliders,
  DotsThree, XCircle, ArrowSquareOut, Lightbulb, Eye, Clock, Flag, Pulse, FlowArrow, MagnifyingGlass, Plus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Tooltip } from "@/common-components";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost, apiPut } from "../../api";
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
const GOALS_COLS = "32px minmax(0,1fr) 150px 96px 96px 120px 36px";

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
    <div className="flex flex-col bg-white border border-[var(--pv-neutral-grey-150)] rounded-lg px-4 py-3.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{kind}</span>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={20} weight="fill" className={c.txt} />}
        <span className="text-[24px] font-semibold leading-none text-[var(--text-primary)]">{value}</span>
      </div>
      <p className="text-[14px] text-[var(--text-secondary)] leading-snug">{desc}</p>
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--pv-neutral-grey-100)]">
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
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)] tracking-[-0.01em]">{title}</h2>
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

/* ── A goal row (single line, table) ── */
function GoalRow({ goal, onOpen, onFull, index }) {
  const qc = useQueryClient();
  const inSetup = goal.health === "setup";
  const h = HEALTH[goal.health] || HEALTH.setup;
  const check = useMutation({
    mutationFn: () => apiPost(`/api/goals/${goal.id}/check-in`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); qc.invalidateQueries({ queryKey: ["goals-attention"] }); },
  });

  const menuItems = goal.status === "active"
    ? [
        { label: check.isPending ? "Checking…" : "Run check-in", icon: check.isPending ? Spinner : Play, onClick: () => check.mutate() },
        { label: "Open full view", icon: ArrowSquareOut, onClick: () => onFull(goal.id) },
      ]
    : [{ label: "Resume setup", icon: CaretRight, onClick: () => onFull(goal.id) }];

  return (
    <div
      className="grid items-center w-full px-3 h-[58px] shrink-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-lg hover:bg-[var(--pv-primary-50)] hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)] transition-all cursor-pointer"
      style={{ gridTemplateColumns: GOALS_COLS }}
      onClick={() => onOpen(goal)}
    >
      <span className="text-[12px] font-normal text-[var(--text-muted)] px-2">{index}.</span>
      <div className="flex items-center gap-2.5 min-w-0 px-2">
        <span className="text-[12px] font-normal text-[var(--text-primary)] truncate">{goal.name}</span>
      </div>
      <span className={cn("text-[12px] font-normal truncate px-2", h.text)}>{inSetup ? (SETUP_LABEL[goal.status] || "In setup") : h.label}</span>
      <span className="text-[12px] font-normal text-[var(--text-secondary)] whitespace-nowrap px-2">{goal.targetSummary || "—"}</span>
      <span className="px-2">
        {goal.actNow > 0
          ? <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-600 whitespace-nowrap">{goal.actNow} act now</span>
          : <span className="text-[12px] font-normal text-[var(--text-muted)]">—</span>}
      </span>
      <span className="text-[12px] font-normal text-[var(--text-muted)] whitespace-nowrap px-2">{goal.lastCheckIn ? `checked ${goal.lastCheckIn}` : "—"}</span>
      <div className="px-2" onClick={(e) => e.stopPropagation()}><RowMenu items={menuItems} /></div>
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
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 max-w-[480px]">Shared context every goal calibration and run uses to ground its recommendations.</p>
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
        "w-full text-left rounded-[4px] border bg-white transition-colors cursor-pointer",
        selected
          ? "bg-pv-primary-primary-50 border-pv-primary-primary-500 shadow-[0_4px_4px_rgba(54,97,237,0.08)]"
          : "border-[var(--pv-neutral-grey-200)] hover:bg-pv-primary-primary-50",
        done && "opacity-70"
      )}
    >
      <div className="flex items-center">
        {/* icon frame */}
        <div className="flex items-center justify-center p-2.5 shrink-0">
          <div
            className={cn("flex items-center justify-center w-9 h-9 rounded-[4px] border border-[var(--pv-neutral-grey-200)]", selected ? "bg-white" : "bg-pv-neutral-grey-50")}
            style={{ boxShadow: "0 4px 4px rgba(122,122,122,0.04)" }}
          >
            <Icon size={16} weight="fill" className={done ? "text-[var(--text-muted)]" : actNow ? "text-rose-500" : "text-amber-500"} />
          </div>
        </div>
        {/* content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 pr-3 py-2.5">
          <Tooltip title={item.title} arrow placement="top">
            <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug truncate cursor-default">{item.title}</p>
          </Tooltip>
          <div className="flex items-center gap-2">
            <span className={cn("text-[12px] font-semibold uppercase tracking-wide", done ? "text-[var(--text-muted)]" : actNow ? "text-rose-600" : "text-amber-700")}>{done ? "Done" : actNow ? "Act now" : "Watch"}</span>
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
        <p className="text-[13px] text-[var(--text-secondary)] max-w-[380px]">Run a check-in on a goal to surface new recommendations.</p>
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
      desc: items.length ? `recommendation${items.length !== 1 ? "s" : ""} need action now` : "nothing needs action right now",
      foot: `Across ${goals.length} goal${goals.length !== 1 ? "s" : ""}`, footIcon: Target },
    { kind: "Needs attention", color: "amber", icon: Flag, value: String(attentionGoals),
      desc: `goal${attentionGoals !== 1 ? "s" : ""} off track this week`, foot: attentionGoals > 0 ? "See below" : "All clear", footIcon: Pulse },
    { kind: "On track", color: "green", icon: CheckCircle, value: String(onTrack),
      desc: `of ${goals.length} goal${goals.length !== 1 ? "s" : ""} on track`, foot: setup > 0 ? `${setup} still calibrating` : "Healthy pace", footIcon: Pulse },
    { kind: "Watching", color: "blue", icon: Eye, value: String(watching),
      desc: `signal${watching !== 1 ? "s" : ""} we're monitoring`, foot: "No action needed yet", footIcon: Pulse },
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
        <div className="flex items-center gap-2">
          <PvButton variant="secondary" size="md" label="Configure" icon={Sliders} onClick={() => setShowConfig(true)} />
          <PvButton variant="primary" size="md" label="New Goal" icon={Plus} onClick={() => navigate("/goals/new")} />
        </div>
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

                {/* ── Your goals (floaty table, no card / no collapse) ── */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[16px] font-semibold text-[var(--text-primary)] tracking-[-0.01em]">Your goals</h2>
                    <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goals.length}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{onTrack} on track</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />{attentionGoals} act now</span>
                  </div>
                </div>

                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-14 border border-[var(--border-primary)] rounded-lg text-center">
                    <Target size={24} className="text-[var(--text-muted)]" />
                    <p className="text-[14px] text-[var(--text-secondary)]">No goals yet. Create one to start tracking.</p>
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                    <div className="grid px-3 py-2 w-full" style={{ gridTemplateColumns: GOALS_COLS }}>
                      <span className="text-[var(--pv-neutral-grey-500)] font-medium text-xs px-2">#</span>
                      <HeaderCell label="Goal" />
                      <HeaderCell label="Status" />
                      <HeaderCell label="Target" />
                      <HeaderCell label="Action" />
                      <HeaderCell label="Last check-in" />
                      <span />
                    </div>
                    <div className="flex flex-col gap-2">
                      {goals.map((g, i) => <GoalRow key={g.id} goal={g} index={i + 1} onOpen={openGoal} onFull={(gid) => navigate(`/goals/${gid}`)} />)}
                    </div>
                  </div>
                )}
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
