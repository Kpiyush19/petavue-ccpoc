import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, Target, CheckCircle, ClockCounterClockwise, Play, CircleNotch, CaretRight, CaretDown, Lightning, Sliders,
  DotsThree, XCircle, ArrowSquareOut, Lightbulb, Eye, Clock, Flag, Pulse,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost, apiPut } from "../../api";
import { cn } from "../../utils/cn";
import GoalQuickView from "./GoalQuickView";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

const HEALTH = {
  attention: { dot: "bg-rose-500", label: "Needs attention", text: "text-rose-600" },
  ontrack: { dot: "bg-green-500", label: "On track", text: "text-green-600" },
  setup: { dot: "bg-amber-500", label: "In setup", text: "text-amber-600" },
};
const SETUP_LABEL = { calibrating: "Calibrating", decisions: "Ready for review", review: "Ready for review" };

const NEEDS_COLS = "minmax(0,1fr) 180px 200px 84px 36px";
const GOALS_COLS = "minmax(0,1fr) 150px 96px 96px 120px 36px";

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

/* ── Column header cell with a Phosphor icon ── */
function HeaderCell({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)]">
      {Icon && <Icon size={13} />} {label}
    </span>
  );
}

/* ── Collapsible floating section ── */
function Section({ title, count, badge, open, onToggle, headerRight, children }) {
  return (
    <section className="bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.14)]">
      <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-pv-neutral-grey-50/60 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <CaretDown size={14} className={cn("text-[var(--text-muted)] transition-transform", !open && "-rotate-90")} />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</span>
          {typeof count === "number" && (
            <span className={cn("px-1.5 py-0.5 text-[11px] font-semibold rounded-full", badge || "bg-pv-neutral-grey-100 text-[var(--text-muted)]")}>{count}</span>
          )}
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

/* ── A "needs attention" recommendation row ── */
function AttentionRow({ item, onOpen }) {
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
      <button onClick={() => onOpen(item.goalId)} className="flex items-center gap-2 min-w-0 bg-transparent border-none p-0 cursor-pointer text-left">
        <Lightning size={14} weight="fill" className="text-rose-500 shrink-0" />
        <span className="text-[13px] font-medium text-[var(--text-primary)] truncate hover:text-pv-primary-primary-600">{item.tldr}</span>
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
function GoalRow({ goal, onOpen, onFull }) {
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
    <div className="grid items-center gap-3 px-5 py-3 border-t border-[var(--pv-neutral-grey-100)] hover:bg-pv-neutral-grey-50/70 transition-colors cursor-pointer" style={{ gridTemplateColumns: GOALS_COLS }} onClick={() => onOpen(goal)}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={cn("shrink-0 w-2 h-2 rounded-full", h.dot)} />
        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{goal.name}</span>
      </div>
      <span className={cn("text-[12px] font-medium truncate", h.text)}>{inSetup ? (SETUP_LABEL[goal.status] || "In setup") : h.label}</span>
      <span className="text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{goal.targetSummary || "—"}</span>
      <span>
        {goal.actNow > 0
          ? <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-600 whitespace-nowrap">{goal.actNow} act now</span>
          : <span className="text-[12px] text-[var(--text-muted)]">—</span>}
      </span>
      <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">{goal.lastCheckIn ? `checked ${goal.lastCheckIn}` : "—"}</span>
      <div onClick={(e) => e.stopPropagation()}><RowMenu items={menuItems} /></div>
    </div>
  );
}

/* ── New Goal modal ── */
function NewGoalModal({ onClose }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statement, setStatement] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const { data: wfData } = useQuery({ queryKey: ["goal-workflows"], queryFn: () => apiGet("/api/goals/workflows") });
  const workflows = (wfData?.workflows || []).filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));
  const create = useMutation({
    mutationFn: () => apiPost("/api/goals", { statement: statement.trim(), workflowIds: selected }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["goals"] }); const id = res?.goal?.id; if (id) navigate(`/goals/${id}`); },
    onError: (e) => toast.error("Failed: " + e.message),
  });
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const canCreate = statement.trim().length > 0 && selected.length > 0 && !create.isPending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-[640px] max-w-[94vw] max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border-t-[3px] border-[var(--pv-primary-500)]"
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-4">
          <h3 className="text-[18px] font-semibold text-[var(--text-primary)] m-0">New Goal</h3>
          <PvButton variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
        </div>
        <div className="px-5 pb-2 overflow-y-auto">
          <label className="block text-[13px] font-semibold text-[var(--text-primary)] mb-1.5">What's the goal?</label>
          <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={2} autoFocus placeholder="e.g. Grow qualified pipeline to $1.5M and keep win rate above 25% by Sep 30"
            className="w-full text-[14px] px-3.5 py-3 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none text-[var(--text-primary)] placeholder:text-[#adb2ce]" />
          <p className="text-[12px] text-[var(--text-muted)] mt-1.5 mb-4">Describe the outcome in plain language — we'll figure out how to measure it.</p>
          <label className="block text-[13px] font-semibold text-[var(--text-primary)] mb-1.5">Which workflows feed this goal?</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your workflows…" className="w-full text-[14px] px-3.5 py-2.5 mb-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none" />
          <div className="flex flex-col gap-2">
            {workflows.map((w) => (
              <button key={w.id} type="button" onClick={() => toggle(w.id)}
                className={cn("flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-colors", selected.includes(w.id) ? "border-pv-primary-primary-500 bg-pv-primary-primary-50" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 bg-white")}>
                <span className={cn("shrink-0 w-4 h-4 rounded border flex items-center justify-center", selected.includes(w.id) ? "bg-pv-primary-primary-500 border-pv-primary-primary-500" : "border-[var(--border-primary)]")}>
                  {selected.includes(w.id) && <span className="w-2 h-2 rounded-[2px] bg-white" />}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">{w.name}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">{w.schedule} · {w.lastRun}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-primary)] mt-2">
          <PvButton variant="secondary" size="md" label="Cancel" onClick={onClose} />
          <PvButton variant="primary" size="md" label={create.isPending ? "Creating…" : "Create & Calibrate"} disabled={!canCreate} onClick={() => create.mutate()} />
        </div>
      </motion.div>
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

  const Field = ({ label, k, placeholder }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</label>
      <textarea value={value[k] || ""} onChange={(e) => set(k, e.target.value)} rows={3} placeholder={placeholder}
        className="w-full text-[14px] px-3.5 py-3 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none text-[var(--text-primary)] placeholder:text-[#adb2ce]" />
    </div>
  );

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
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 max-w-[480px]">Shared context every goal calibration and run uses to ground its recommendations.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">Context {Math.round((filled / 4) * 100)}%</span>
            <PvButton variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
          </div>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 overflow-y-auto">
          <Field label="Company" k="company" placeholder="What does your company do?" />
          <Field label="Process" k="process" placeholder="How does your GTM / revenue process work?" />
          <Field label="Ideal Customer Profile" k="icp" placeholder="Who are your best-fit customers?" />
          <Field label="Additional context" k="additional" placeholder="Anything else the engine should know." />
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-primary)]">
          <PvButton variant="secondary" size="md" label="Cancel" onClick={onClose} />
          <PvButton variant="primary" size="md" label={save.isPending ? "Saving…" : "Save"} disabled={save.isPending} onClick={() => save.mutate()} />
        </div>
      </motion.div>
    </div>
  );
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [quickId, setQuickId] = useState(null);
  const [openAttn, setOpenAttn] = useState(true);
  const [openGoals, setOpenGoals] = useState(true);
  const { data: goalsData } = useQuery({ queryKey: ["goals"], queryFn: () => apiGet("/api/goals"), refetchInterval: 2500 });
  const { data: attn } = useQuery({ queryKey: ["goals-attention"], queryFn: () => apiGet("/api/goals/attention"), refetchInterval: 2500 });
  const goals = goalsData?.goals || [];
  const items = attn?.items || [];
  const attentionGoals = goals.filter((g) => g.health === "attention").length;
  const onTrack = goals.filter((g) => g.health === "ontrack").length;

  // Active goals open in the quick-view overlay; goals still in setup go to the
  // full wizard page (calibrate → decisions → review).
  const openGoal = (goalOrId) => {
    const g = typeof goalOrId === "string" ? goals.find((x) => x.id === goalOrId) : goalOrId;
    if (g && g.status !== "active") navigate(`/goals/${g.id}`);
    else setQuickId(g?.id || goalOrId);
  };

  return (
    <div className="flex h-full w-full overflow-y-auto bg-pv-neutral-grey-50">
      <div className="flex flex-col w-full max-w-[1180px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-7">
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">Goals</h1>
          <div className="flex items-center gap-2">
            <PvButton variant="secondary" size="md" label="Configure" icon={Sliders} onClick={() => setShowConfig(true)} />
            <PvButton variant="primary" size="md" label="New Goal" icon={Target} onClick={() => setShowNew(true)} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* ── Needs attention ── */}
          <Section
            title="Needs attention"
            count={items.length}
            badge={items.length > 0 ? "bg-rose-50 text-rose-600" : "bg-green-50 text-green-600"}
            open={openAttn}
            onToggle={() => setOpenAttn((v) => !v)}
          >
            {items.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 border-t border-[var(--border-primary)]">
                <CheckCircle size={20} weight="fill" className="text-green-500" />
                <p className="text-[13px] text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">You're all caught up.</span> Run a check-in on a goal to surface new items.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 px-5 py-2.5 border-t border-[var(--pv-neutral-grey-150)] bg-pv-neutral-grey-50/50" style={{ gridTemplateColumns: NEEDS_COLS }}>
                  <HeaderCell icon={Lightbulb} label="Recommendation" />
                  <HeaderCell icon={Target} label="Goal" />
                  <HeaderCell icon={Eye} label="Watching" />
                  <HeaderCell icon={Clock} label="When" />
                  <span />
                </div>
                <AnimatePresence initial={false}>
                  {items.map((it) => <AttentionRow key={it.recId} item={it} onOpen={openGoal} />)}
                </AnimatePresence>
              </>
            )}
          </Section>

          {/* ── Your goals ── */}
          <Section
            title="Your goals"
            count={goals.length}
            open={openGoals}
            onToggle={() => setOpenGoals((v) => !v)}
            headerRight={
              <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{onTrack} on track</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />{attentionGoals} need attention</span>
              </div>
            }
          >
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 border-t border-[var(--border-primary)] text-center">
                <Target size={24} className="text-[var(--text-muted)]" />
                <p className="text-[14px] text-[var(--text-secondary)]">No goals yet. Create one to start tracking.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 px-5 py-2.5 border-t border-[var(--pv-neutral-grey-150)] bg-pv-neutral-grey-50/50" style={{ gridTemplateColumns: GOALS_COLS }}>
                  <HeaderCell icon={Target} label="Goal" />
                  <HeaderCell icon={Pulse} label="Status" />
                  <HeaderCell icon={Flag} label="Target" />
                  <HeaderCell icon={Lightning} label="Action" />
                  <HeaderCell icon={ClockCounterClockwise} label="Last check-in" />
                  <span />
                </div>
                {goals.map((g) => <GoalRow key={g.id} goal={g} onOpen={openGoal} onFull={(gid) => navigate(`/goals/${gid}`)} />)}
              </>
            )}
          </Section>
        </div>
      </div>

      {showNew && <NewGoalModal onClose={() => setShowNew(false)} />}
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
      {quickId && <GoalQuickView id={quickId} onClose={() => setQuickId(null)} onFull={(gid) => { setQuickId(null); navigate(`/goals/${gid}`); }} />}
    </div>
  );
}
