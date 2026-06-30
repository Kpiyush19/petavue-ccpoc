import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CircleNotch, CheckCircle, Target, Eye, Lightning, MagnifyingGlass,
  CaretRight, X, ClockCounterClockwise, Play, ChartBar,
} from "@phosphor-icons/react";
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
        <ProgressRail current={p} active="Read your history" />
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">Review your goal</h1>
          <p className="text-[15px] text-[var(--text-secondary)] mb-7">Here's how we'll measure and watch it. Adjust on the right, then save.</p>
        </div>
        <PvButton variant="primary" size="md" label="Save" onClick={() => setShowSave(true)} />
      </div>

      <div className="flex gap-8 items-start">
        {/* Left: targets, conditions, moves */}
        <div className="flex-1 min-w-0 flex flex-col gap-7">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Your targets — how we'll know you hit the goal</p>
            <p className="text-[13px] text-[var(--text-secondary)] mb-3">Your goal breaks into these measurable targets. We check each one every run.</p>
            {goal.targets.map((t) => (
              <div key={t.id} className="p-4 bg-white border border-[var(--border-primary)] rounded-lg">
                <div className="flex gap-2.5">
                  <Target size={18} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                  <p className="text-[15px] font-medium text-[var(--text-primary)] leading-relaxed">{t.label}</p>
                </div>
                <button onClick={() => setWhyOpen((v) => !v)} className="flex items-center gap-1 mt-2.5 ml-7 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">
                  <CaretRight size={12} className={cn("transition-transform", whyOpen && "rotate-90")} /> Why this, and where it comes from
                </button>
                {whyOpen && <p className="ml-7 mt-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">{t.why}</p>}
              </div>
            ))}
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Conditions we'll watch each run</p>
            <div className="flex flex-col gap-2">
              {goal.conditions.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 px-4 py-3 bg-white border border-[var(--border-primary)] rounded-lg">
                  <Eye size={16} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{c.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Moves we may recommend</p>
            <div className="flex flex-col gap-2">
              {goal.moves.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5 px-4 py-3 bg-white border border-[var(--border-primary)] rounded-lg">
                  <Lightning size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{m.label}</p>
                </div>
              ))}
            </div>
          </section>
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
function RecommendationCard({ goal, rec, refetch }) {
  const qc = useQueryClient();
  const act = useMutation({
    mutationFn: ({ action, note }) => apiPost(`/api/goals/${goal.id}/recommendations/${rec.id}/act`, { action, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });
  const done = rec.status !== "open";

  return (
    <div className={cn("p-4 rounded-lg border", done ? "border-[var(--border-primary)] bg-pv-neutral-grey-50 opacity-70" : "border-pv-primary-primary-200 bg-pv-primary-primary-50/30")}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[13px] font-semibold text-pv-primary-primary-600">{rec.title}</span>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-600 border border-rose-200">Now</span>
      </div>
      <p className="text-[13px] text-[var(--text-primary)] font-medium mb-1.5">→ {rec.tldr}</p>
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-1.5">{rec.body}</p>
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-3">{rec.evidence}</p>
      {done ? (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)] capitalize">
          <CheckCircle size={14} weight="fill" className="text-green-500" /> {rec.status === "acted" ? "Done" : rec.status === "rejected" ? "Dismissed" : "Snoozed"}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <PvButton variant="secondary" size="sm" label="Done" icon={CheckCircle} onClick={() => act.mutate({ action: "acted" })} />
          <PvButton variant="ghost" size="sm" label="Dismiss" onClick={() => act.mutate({ action: "rejected" })} />
          <PvButton variant="ghost" size="sm" label="Snooze" icon={ClockCounterClockwise} onClick={() => act.mutate({ action: "snoozed", note: "Snoozed until next run" })} />
        </div>
      )}
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
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />0 watching</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{recs.filter((r) => r.status === "acted").length} done</span>
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
                <div className="p-4 bg-white border border-[var(--border-primary)] rounded-xl flex flex-col gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{recs[0].groupLabel}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{recs[0].groupNote}</p>
                  </div>
                  {recs.map((r) => <RecommendationCard key={r.id} goal={goal} rec={r} refetch={refetch} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside className="w-[320px] shrink-0 self-start sticky top-0 flex flex-col gap-4">
          <div className="bg-white border border-[var(--border-primary)] rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Targets</p>
            {goal.targets.map((t) => (
              <div key={t.id} className="flex gap-2">
                <Target size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)] line-clamp-2">{t.label}</p>
                  {t.target && <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Target: {t.target}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[var(--border-primary)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">What we're watching</p>
              <span className="text-[11px] text-[var(--text-muted)]">{goal.conditions.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {goal.conditions.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Eye size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2">{c.label}</p>
                  </div>
                  <span className={cn("shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded", c.state === "fired" ? "bg-rose-50 text-rose-600" : "text-[var(--text-muted)]")}>
                    {c.state === "fired" ? "fired" : "quiet"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[var(--border-primary)] rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Goal notes</p>
            {goal.notes.length === 0 ? <p className="text-[12px] text-[var(--text-muted)] mb-2">No notes yet.</p> : (
              <div className="flex flex-col gap-1.5 mb-2">
                {goal.notes.map((n) => <p key={n.id} className="text-[12px] text-[var(--text-secondary)]">• {n.text}</p>)}
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Pausing Meta for 3 weeks · never pause Brand Search"
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none mb-2"
            />
            <div className="flex justify-end">
              <PvButton variant="secondary" size="sm" label="Add note" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} />
            </div>
          </div>
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
