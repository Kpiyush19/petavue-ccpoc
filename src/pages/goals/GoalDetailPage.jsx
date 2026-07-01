import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CircleNotch, CheckCircle, Target, Eye, Lightning, MagnifyingGlass,
  CaretRight, X, ClockCounterClockwise, Play, ChartBar, WaveSine, Pulse, XCircle, PencilSimple, NotePencil,
  Clock, UserCircle, TrendUp, ChartPieSlice,
} from "@phosphor-icons/react";

// Category icon + accent per recommendation type.
const REC_ICONS = { stale: Clock, owner: UserCircle, stuck: TrendUp, concentration: ChartPieSlice, threshold: Target };
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

const CALIBRATION_STEPS = [
  "Loaded your workflows",
  "Read your history",
  "Targets",
  "Conditions",
  "Recommended moves",
  "Ready for your review",
];

/* ───────────────────────── Calibrating ───────────────────────── */
function Calibrating({ goal }) {
  const p = goal.progress || 0;
  const labels = ["Getting started…", "Reading your pipeline history…", "Proposing targets…", "Defining conditions to watch…", "Drafting recommended moves…", "Finishing up…"];
  return (
    <>
      <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">Calibrating your goal</h1>
      <p className="text-[15px] text-[var(--text-secondary)] mb-7">We're reading your data and proposing how to measure this goal.</p>
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 p-5 bg-white border border-[var(--border-primary)] rounded-xl">
            <Spinner size={20} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">{labels[Math.min(p, labels.length - 1)]}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Searched 38 history files · 497 rows in raw_deals.csv</p>
            </div>
          </div>
          <p className="text-[13px] text-[var(--text-muted)] mt-4">This usually takes a minute. You can leave and come back — your progress is saved.</p>
        </div>
        <ProgressRail current={p} />
      </div>
    </>
  );
}

function ProgressRail({ current, active }) {
  return (
    <aside className="w-[280px] shrink-0 self-start sticky top-0 bg-white border border-[var(--border-primary)] rounded-xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Progress</p>
      <div className="flex flex-col gap-3.5">
        {CALIBRATION_STEPS.map((label, i) => {
          const done = i < current;
          const isActive = i === current;
          return (
            <div key={label} className="flex items-center gap-2.5">
              {done ? (
                <CheckCircle size={18} weight="fill" className="text-green-600 shrink-0" />
              ) : isActive ? (
                <Spinner size={18} className="text-pv-primary-primary-500 shrink-0" />
              ) : (
                <span className="w-[18px] h-[18px] rounded-full border-2 border-[var(--border-primary)] shrink-0" />
              )}
              <span className={cn("text-[13px]", done || isActive ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]")}>
                {isActive && active ? active : label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ───────────────────────── Decisions ───────────────────────── */
function Decisions({ goal, refetch }) {
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = goal.questions[idx];
  const total = goal.questions.length;

  const submit = useMutation({
    mutationFn: () => apiPost(`/api/goals/${goal.id}/answer`, { answers }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });

  const choose = (optId) => setAnswers((a) => ({ ...a, [q.id]: optId }));
  const next = () => {
    if (idx < total - 1) setIdx(idx + 1);
    else submit.mutate();
  };
  const chosen = answers[q.id];

  return (
    <>
      <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">A couple of decisions</h1>
      <p className="text-[15px] text-[var(--text-secondary)] mb-7">Your answers shape the targets — every option is grounded in your real numbers.</p>
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-pv-primary-primary-600">A few quick questions</span>
            <span className="text-[13px] text-[var(--text-muted)]">Question {idx + 1} of {total}</span>
          </div>
          <div className="h-1 rounded-full bg-pv-neutral-grey-100 mb-6 overflow-hidden">
            <div className="h-full bg-pv-primary-primary-500 rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>

          <p className="text-[16px] text-[var(--text-primary)] leading-relaxed mb-4">{q.text}</p>
          <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-lg bg-pv-primary-primary-50 border border-pv-primary-primary-100">
            <ChartBar size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">What we found:</span> {q.found}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {q.options.map((o) => (
              <button
                key={o.id}
                onClick={() => choose(o.id)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 rounded-lg border text-left transition-colors",
                  chosen === o.id ? "border-pv-primary-primary-500 bg-pv-primary-primary-50" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 bg-white"
                )}
              >
                <span className={cn("shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center", chosen === o.id ? "border-pv-primary-primary-500" : "border-[var(--border-primary)]")}>
                  {chosen === o.id && <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />}
                </span>
                <span className="flex-1 text-[14px] text-[var(--text-primary)] leading-relaxed">{o.label}</span>
                {o.recommended && <span className="shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200">recommended</span>}
              </button>
            ))}
            <button
              onClick={() => choose("other")}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left transition-colors",
                chosen === "other" ? "border-pv-primary-primary-500 bg-pv-primary-primary-50" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 bg-white"
              )}
            >
              <span className={cn("shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center", chosen === "other" ? "border-pv-primary-primary-500" : "border-[var(--border-primary)]")}>
                {chosen === "other" && <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />}
              </span>
              <span className="text-[14px] text-[var(--text-secondary)]">Something else…</span>
            </button>
          </div>

          <div className="flex justify-end mt-6">
            <PvButton variant="primary" size="md" label={idx < total - 1 ? "Next" : (submit.isPending ? "Building…" : "Build targets")} icon={ArrowRight} iconPosition="suffix" disabled={!chosen || submit.isPending} onClick={next} />
          </div>
        </div>
        <ProgressRail current={1} active="Waiting for your answers" />
      </div>
    </>
  );
}

/* ───────────────────────── Review ───────────────────────── */
function Review({ goal, refetch }) {
  const qc = useQueryClient();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState(goal.name || "");
  const [whyOpen, setWhyOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");

  const adjust = useMutation({
    mutationFn: (text) => apiPost(`/api/goals/${goal.id}/adjust`, { text }),
    onSuccess: (res, text) => {
      setChat((c) => [...c, { role: "user", text }, { role: "assistant", text: res.reply }]);
      qc.invalidateQueries({ queryKey: ["goal", goal.id] });
      refetch();
    },
  });
  const save = useMutation({
    mutationFn: () => apiPost(`/api/goals/${goal.id}/save`, { name: name.trim() || goal.name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });

  const sendAdjust = () => { if (!draft.trim()) return; adjust.mutate(draft.trim()); setDraft(""); };

  return (
    <>
      <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">Review your goal</h1>
      <p className="text-[15px] text-[var(--text-secondary)] mb-7">Here's how we'll measure and watch it. Adjust on the right, then save.</p>

      <div className="flex gap-8 items-start pb-24">
        {/* Left: targets, conditions, moves */}
        <div className="flex-1 min-w-0 flex flex-col gap-7">
          {/* Targets */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-pv-primary-primary-500" />
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Targets</h2>
              <span className="text-[12px] text-[var(--text-muted)]">— how we'll know you hit the goal</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-3">Your goal breaks into these measurable targets. We check each one every run.</p>
            {goal.targets.map((t) => (
              <div key={t.id} className="p-4 bg-white border border-[var(--border-primary)] rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium text-[var(--text-primary)] leading-relaxed">{t.label}</p>
                  {t.target && <span className="shrink-0 px-2.5 py-1 text-[13px] font-semibold rounded-md bg-pv-primary-primary-50 text-pv-primary-primary-700">{t.target}</span>}
                </div>
                <button onClick={() => setWhyOpen((v) => !v)} className="flex items-center gap-1 mt-3 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">
                  <CaretRight size={12} className={cn("transition-transform", whyOpen && "rotate-90")} /> Why this, and where it comes from
                </button>
                {whyOpen && <p className="mt-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed pl-4 border-l-2 border-pv-primary-primary-100">{t.why}</p>}
              </div>
            ))}
          </section>

          {/* Conditions + Moves — the watch/act pair, side by side */}
          <div className="grid grid-cols-2 gap-5 items-start">
            {/* Conditions we'll watch */}
            <section className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <WaveSine size={16} className="text-[var(--text-muted)]" />
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Conditions we'll watch</h2>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.conditions.length}</span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">Signals we test on every run to catch drift early.</p>
              <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
                {goal.conditions.map((c, i) => (
                  <div key={c.id} className={cn("flex items-start gap-2.5 px-3.5 py-3", i > 0 && "border-t border-[var(--pv-neutral-grey-100)]")}>
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-pv-neutral-grey-100 text-[11px] font-semibold text-[var(--text-muted)] mt-0.5">{i + 1}</span>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{c.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Moves we may recommend */}
            <section className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Lightning size={16} className="text-amber-500" />
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Moves we may recommend</h2>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.moves.length}</span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mb-2.5">Actions we'll surface when a condition fires — you decide.</p>
              <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
                {goal.moves.map((m, i) => (
                  <div key={m.id} className={cn("flex items-start gap-2.5 px-3.5 py-3", i > 0 && "border-t border-[var(--pv-neutral-grey-100)]")}>
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 mt-0.5">
                      <Lightning size={12} weight="fill" className="text-amber-500" />
                    </span>
                    <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{m.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right: adjust panel */}
        <aside className="w-[340px] shrink-0 self-start sticky top-0 flex flex-col bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--border-primary)]">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Want to adjust anything?</p>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">Tell us in plain language — we'll change the setup and tell you what moved. We only adjust the goal here; we won't run analysis.</p>
          </div>
          <div className="flex flex-col gap-3 p-4 max-h-[300px] overflow-y-auto">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Config stands at <span className="font-semibold text-[var(--text-primary)]">{goal.targets.length} target, {goal.conditions.length} conditions, {goal.moves.length} actions</span>. If you'd like any thresholds or scopes adjusted, just say the word.
            </p>
            {chat.map((m, i) => (
              <div key={i} className={cn("text-[13px] leading-relaxed px-3 py-2 rounded-lg max-w-[88%]", m.role === "user" ? "self-end bg-pv-primary-primary-500 text-white" : "self-start bg-pv-neutral-grey-100 text-[var(--text-primary)]")}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[var(--border-primary)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdjust(); } }}
              rows={2}
              placeholder="e.g. Track $1M instead of $1.5M · add a target for new logos"
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
            />
          </div>
        </aside>
      </div>

      {/* Sticky action footer */}
      <div className="sticky bottom-0 -mx-8 -mb-8 px-8 py-3.5 bg-white/85 backdrop-blur-sm border-t border-[var(--border-primary)] flex items-center justify-between gap-4">
        <p className="text-[13px] text-[var(--text-secondary)] min-w-0 truncate">
          <span className="font-semibold text-[var(--text-primary)]">{goal.targets.length} target{goal.targets.length !== 1 && "s"} · {goal.conditions.length} conditions · {goal.moves.length} moves</span>
          <span className="hidden sm:inline"> — ready when you are</span>
        </p>
        <PvButton variant="primary" size="md" label="Save goal" icon={CheckCircle} onClick={() => setShowSave(true)} />
      </div>

      {showSave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSave(false)} />
          <div className="relative w-[440px] max-w-[94vw] bg-white rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Save goal</h3>
              <PvButton variant="ghost" size="sm" icon={X} aria-label="Close" onClick={() => setShowSave(false)} />
            </div>
            <label className="block text-[13px] font-semibold text-[var(--text-primary)] mb-1.5">Name this goal</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full text-[14px] px-3.5 py-2.5 rounded-lg border border-pv-primary-primary-500 outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <PvButton variant="secondary" size="md" label="Cancel" onClick={() => setShowSave(false)} />
              <PvButton variant="primary" size="md" label={save.isPending ? "Saving…" : "Save goal"} disabled={save.isPending} onClick={() => save.mutate()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────────────────── Active dashboard ───────────────────────── */
const SNOOZE_OPTIONS = ["1 day", "3 days", "1 week", "2 weeks", "Until next check-in"];

/* Snooze split-button with a duration dropdown (portaled). */
function SnoozeMenu({ onSnooze, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen((o) => !o);
  };
  return (
    <>
      <button ref={btnRef} onClick={toggle} disabled={disabled}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-pv-neutral-grey-100 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50">
        <ClockCounterClockwise size={14} /> Snooze <CaretRight size={11} className="rotate-90" />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="fixed z-[71] w-44 bg-white border border-[var(--border-primary)] rounded-lg shadow-lg py-1" style={{ top: pos.top, left: pos.left }}>
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Snooze for</p>
            {SNOOZE_OPTIONS.map((label) => (
              <button key={label} onClick={() => { onSnooze(label); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left bg-transparent border-none cursor-pointer hover:bg-pv-neutral-grey-50 text-[var(--text-primary)]">
                {label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

function RecommendationCard({ goal, rec, refetch }) {
  const qc = useQueryClient();
  const act = useMutation({
    mutationFn: (body) => apiPost(`/api/goals/${goal.id}/recommendations/${rec.id}/act`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });
  const done = rec.status !== "open";
  const actNow = rec.severity === "act-now";
  const Icon = REC_ICONS[rec.iconKey] || Lightning;
  const tint = done
    ? { chip: "bg-pv-neutral-grey-100 text-[var(--text-muted)]" }
    : actNow
      ? { chip: "bg-rose-50 text-rose-600" }
      : { chip: "bg-amber-50 text-amber-600" };
  const resolved = {
    acted: { icon: CheckCircle, cls: "text-green-600", label: "Done" },
    rejected: { icon: XCircle, cls: "text-[var(--text-muted)]", label: "Dismissed" },
    snoozed: { icon: ClockCounterClockwise, cls: "text-amber-600", label: rec.snoozeLabel ? `Snoozed · ${rec.snoozeLabel}` : "Snoozed" },
  }[rec.status];

  return (
    <div className={cn("flex flex-col h-full p-4 rounded-xl border transition-colors bg-white", done ? "border-[var(--border-primary)] opacity-80" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 shadow-[0_1px_2px_rgba(16,24,40,0.04)]")}>
      {/* Header: category + severity */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("flex items-center justify-center w-7 h-7 rounded-full shrink-0", tint.chip)}>
            <Icon size={15} weight="fill" />
          </span>
          <span className="text-[12px] font-medium text-[var(--text-muted)] truncate">{rec.category || rec.groupLabel}</span>
        </div>
        {!done && (
          <span className={cn("shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full", actNow ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>
            {actNow ? "Now" : "Watch"}
          </span>
        )}
      </div>

      {/* Headline + body */}
      <p className={cn("text-[14px] font-semibold leading-snug mb-1.5", done ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")}>{rec.tldr}</p>
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3">{rec.body}</p>

      {/* Impact strip */}
      {rec.impact && (
        <div className="flex items-baseline gap-2 px-3 py-2 mb-3 rounded-lg bg-pv-neutral-grey-50 border border-[var(--pv-neutral-grey-100)]">
          <span className="text-[16px] font-semibold text-[var(--text-primary)] leading-none">{rec.impact.value}</span>
          <span className="text-[12px] text-[var(--text-secondary)]">{rec.impact.label}</span>
          {rec.impact.sub && <span className="ml-auto text-[11px] text-[var(--text-muted)] whitespace-nowrap">{rec.impact.sub}</span>}
        </div>
      )}

      {/* Actions pinned to the bottom so cards align in the grid */}
      <div className="mt-auto pt-3 border-t border-[var(--pv-neutral-grey-100)]">
        {done ? (
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", resolved.cls)}>
              {(() => { const I = resolved.icon; return <I size={14} weight="fill" />; })()} {resolved.label}
            </span>
            <button onClick={() => act.mutate({ action: "open" })} className="text-[12px] font-medium text-[var(--text-muted)] hover:text-pv-primary-primary-600 bg-transparent border-none cursor-pointer">Undo</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <PvButton variant="secondary" size="sm" label="Done" icon={CheckCircle} onClick={() => act.mutate({ action: "acted" })} />
            <PvButton variant="ghost" size="sm" label="Dismiss" onClick={() => act.mutate({ action: "rejected" })} />
            <SnoozeMenu disabled={act.isPending} onSnooze={(snooze) => act.mutate({ action: "snoozed", snooze })} />
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveGoal({ goal, refetch }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const lastCheckIn = goal.checkIns[0];

  const check = useMutation({
    mutationFn: () => apiPost(`/api/goals/${goal.id}/check-in`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });
  const addNote = useMutation({
    mutationFn: () => apiPost(`/api/goals/${goal.id}/notes`, { text: note.trim() }),
    onSuccess: () => { setNote(""); qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });

  const recs = lastCheckIn?.recommendations || [];
  const actNow = recs.filter((r) => r.severity === "act-now" && r.status === "open").length;
  const watching = recs.filter((r) => r.severity === "watch" && r.status === "open").length;
  const doneCount = recs.filter((r) => r.status === "acted").length;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">{goal.name}</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">{goal.statement}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PvButton variant="secondary" size="md" label="Run history" icon={ClockCounterClockwise} />
          <PvButton variant="primary" size="md" label={check.isPending ? "Checking…" : "Run check-in"} icon={check.isPending ? Spinner : Play} iconPosition="suffix" disabled={check.isPending} onClick={() => check.mutate()} />
        </div>
      </div>

      <div className="flex gap-8 items-start mt-6">
        {/* Left: check-in result + recommendations */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {lastCheckIn ? (
            <div className="p-5 bg-white border border-[var(--border-primary)] rounded-xl">
              <p className="text-[18px] font-semibold text-[var(--text-primary)] leading-snug">{lastCheckIn.summary}</p>
              <p className="text-[12px] text-[var(--text-muted)] mt-2">Projection is a naive run-rate estimate.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
              <Lightning size={26} className="text-pv-primary-primary-400" />
              <p className="text-[15px] font-medium text-[var(--text-primary)]">No check-ins yet</p>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-[440px]">Run a check-in to measure your targets against the latest data and get data-backed recommendations — each with the evidence behind it.</p>
              <div className="mt-2">
                <PvButton variant="primary" size="md" label="Run your first check-in" icon={Play} iconPosition="suffix" onClick={() => check.mutate()} />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Recommendations</p>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{actNow} act now</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{watching} watching</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{doneCount} done</span>
              </div>
            </div>
            {recs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-12 border border-dashed border-[var(--border-primary)] rounded-xl text-center">
                <ClockCounterClockwise size={22} className="text-[var(--text-muted)]" />
                <p className="text-[14px] text-[var(--text-secondary)]">No recommendations yet</p>
                <p className="text-[12px] text-[var(--text-muted)]">They appear here after your first check-in.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {lastCheckIn && <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Check-in · {lastCheckIn.at}</p>}
                <div className="grid grid-cols-2 gap-4 items-stretch">
                  {recs.map((r) => <RecommendationCard key={r.id} goal={goal} rec={r} refetch={refetch} />)}
                </div>
              </div>
            )}
          </div>

          {/* Goal notes — a running log, kept with the main content */}
          <div className="bg-white border border-[var(--border-primary)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <NotePencil size={16} className="text-[var(--text-muted)]" />
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Goal notes</p>
              {goal.notes.length > 0 && <span className="text-[11px] text-[var(--text-muted)]">({goal.notes.length})</span>}
            </div>
            {goal.notes.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {goal.notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 px-3 py-2 bg-pv-neutral-grey-50 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-pv-primary-primary-400 mt-1.5 shrink-0" />
                    <p className="flex-1 text-[13px] text-[var(--text-primary)]">{n.text}</p>
                    <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">{n.at}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && note.trim()) addNote.mutate(); }}
                rows={1}
                placeholder="Add a note — e.g. “Pausing Meta for 3 weeks · never pause Brand Search”"
                className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
              />
              <PvButton variant="secondary" size="md" label="Add" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} />
            </div>
          </div>
        </div>

        {/* Right rail — the monitor */}
        <aside className="w-[320px] shrink-0 self-start sticky top-0 flex flex-col gap-4">
          {/* Targets */}
          <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
              <Target size={16} className="text-pv-primary-primary-500" />
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Targets</p>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {goal.targets.map((t) => (
                <div key={t.id} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{t.label}</p>
                    {t.target && <span className="shrink-0 px-2 py-0.5 text-[12px] font-semibold rounded-md bg-pv-primary-primary-50 text-pv-primary-primary-700">{t.target}</span>}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">Checked every run</p>
                </div>
              ))}
            </div>
          </div>

          {/* What we're watching — status board */}
          {(() => {
            const conditions = [...goal.conditions].sort((a, b) => (b.state === "fired" ? 1 : 0) - (a.state === "fired" ? 1 : 0));
            const firing = goal.conditions.filter((c) => c.state === "fired").length;
            const quiet = goal.conditions.length - firing;
            return (
              <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
                  <div className="flex items-center gap-2">
                    <WaveSine size={16} className="text-[var(--text-muted)]" />
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">What we're watching</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium">
                    <span className={cn("inline-flex items-center gap-1", firing > 0 ? "text-rose-600" : "text-[var(--text-muted)]")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", firing > 0 ? "bg-rose-500" : "bg-pv-neutral-grey-300")} />{firing}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{quiet}
                    </span>
                  </div>
                </div>
                <div className="p-2 flex flex-col">
                  {conditions.map((c) => {
                    const fired = c.state === "fired";
                    return (
                      <div key={c.id} title={c.label} className={cn("flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg", fired && "bg-rose-50/60")}>
                        <span className="relative flex items-center justify-center w-4 h-4 shrink-0 mt-0.5">
                          {fired ? (
                            <>
                              <span className="absolute w-2.5 h-2.5 rounded-full bg-rose-400/40 animate-ping" />
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            </>
                          ) : (
                            <span className="w-2 h-2 rounded-full border-[1.5px] border-pv-neutral-grey-300" />
                          )}
                        </span>
                        <p className={cn("flex-1 text-[12px] leading-snug line-clamp-2", fired ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]")}>{c.label}</p>
                        <span className={cn("shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded", fired ? "bg-rose-100 text-rose-700" : "text-[var(--text-muted)]")}>
                          {fired ? (c.count ? `${c.count} fired` : "fired") : "quiet"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </>
  );
}

/* ───────────────────────── Router ───────────────────────── */
export default function GoalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: goal, isLoading, refetch } = useQuery({
    queryKey: ["goal", id],
    queryFn: () => apiGet(`/api/goals/${id}`),
    refetchInterval: 1200,
  });

  return (
    <div className="flex h-full w-full overflow-y-auto bg-pv-neutral-grey-50">
      <div className="flex flex-col w-full max-w-[1180px] mx-auto px-8 py-8">
        <button onClick={() => navigate("/goals")} className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer self-start mb-5 p-0">
          <ArrowLeft size={14} /> Back to goals
        </button>

        {isLoading || !goal ? (
          <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] mt-8"><Spinner size={18} /> Loading…</div>
        ) : goal.status === "calibrating" ? (
          <Calibrating goal={goal} />
        ) : goal.status === "decisions" ? (
          <Decisions goal={goal} refetch={refetch} />
        ) : goal.status === "review" ? (
          <Review goal={goal} refetch={refetch} />
        ) : (
          <ActiveGoal goal={goal} refetch={refetch} />
        )}
      </div>
    </div>
  );
}
