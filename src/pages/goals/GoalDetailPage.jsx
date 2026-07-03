import { useState, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CircleNotch, CheckCircle, Target, Eye, Lightning, MagnifyingGlass,
  CaretRight, X, ClockCounterClockwise, Play, Question, WaveSine, Pulse, Warning, XCircle, PencilSimple, NotePencil,
  Clock, UserCircle, TrendUp, ChartPieSlice, PaperPlaneTilt, ArrowsClockwise, Info,
} from "@phosphor-icons/react";
import { Tooltip } from "@/common-components";

// Category icon + accent per recommendation type.
const REC_ICONS = { stale: Clock, owner: UserCircle, stuck: TrendUp, concentration: ChartPieSlice, threshold: Target };
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";
import RecommendationDrawer from "./RecommendationDrawer";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

// The wizard journey, as a linear "verify & publish"-style progress line shown
// in the footer. Loading → your decisions → we build (targets, conditions &
// moves folded into one step, since none need interaction) → review.
const CALIBRATION_STEPS = [
  "Read your data",
  "Your decisions",
  "Build the goal",
  "Review & save",
];

/* ───────── Wizard shell: titled content panel · sticky footer step line ───────── */

// Horizontal progress line for the footer (Figma "verify & publish" pattern):
// filled checks for done steps, an active dot with a label, connectors between.
function WizardSteps({ current }) {
  return (
    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
      {CALIBRATION_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            {i > 0 && <span className={cn("w-5 h-[2px] rounded-full", done ? "bg-pv-primary-primary-400" : "bg-[var(--border-primary)]")} />}
            <span className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle size={16} weight="fill" className="text-pv-primary-primary-600 shrink-0" />
              ) : active ? (
                <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-pv-primary-primary-500 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-pv-primary-primary-500" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-[var(--border-primary)] shrink-0" />
              )}
              <span className={cn("text-[13px] whitespace-nowrap", active ? "text-pv-primary-primary-600 font-medium" : done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Page-wide footer slot — GoalDetailPage renders a full-width bar below the
// scroll area and shares its DOM node here; WizardFooter portals into it so the
// footer spans the whole page instead of the centered content column.
const FooterSlot = createContext(null);

// Page-wide footer: Cancel/status on the left, actions on the right.
function WizardFooter({ left, right }) {
  const slot = useContext(FooterSlot);
  const bar = (
    <div className="w-full px-6 py-3 border-t border-[var(--border-primary)] bg-white flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0 text-[13px] text-[var(--text-secondary)]">{left}</div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  );
  return slot ? createPortal(bar, slot) : bar;
}

// Unified panel: titled content, footer pinned (progress now lives in the footer).
function WizardScaffold({ title, subtitle, children, footer }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto bg-white border border-[var(--pv-neutral-grey-150)] rounded-xl px-6 py-5">
        <h1 className="text-[16px] font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mb-6">{subtitle}</p>
        {children}
      </div>
      {footer}
    </div>
  );
}

/* ───────────────────────── Calibrating ───────────────────────── */
function Calibrating({ goal, onCancel }) {
  return (
    <WizardScaffold
      title="Calibrating your goal"
      subtitle="We're reading your workflows and history before asking you a couple of quick decisions."
      footer={
        <WizardFooter
          left={<WizardSteps current={0} />}
          right={<PvButton variant="secondary" size="md" label="Cancel" onClick={onCancel} />}
        />
      }
    >
      <div className="flex items-start gap-3 p-5 bg-white border border-[var(--border-primary)] rounded-xl">
        <Spinner size={20} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Reading your workflows and history…</p>
          <p className="text-[13px] text-[var(--text-secondary)]">Searched 38 history files · 497 rows in raw_deals.csv</p>
        </div>
      </div>
    </WizardScaffold>
  );
}

/* ───────────────────────── Building ───────────────────────── */
const BUILD_STEPS = [
  { label: "Targets", note: "Turning your goal into measurable targets" },
  { label: "Conditions", note: "Defining the signals we'll watch each run" },
  { label: "Recommended moves", note: "Drafting the actions we may suggest" },
];
function Building({ goal, onCancel }) {
  const p = goal.buildProgress || 0;
  return (
    <WizardScaffold
      title="Building your goal"
      subtitle="Using your answers to draft the targets, conditions and moves for this goal."
      footer={
        <WizardFooter
          left={<WizardSteps current={2} />}
          right={<PvButton variant="secondary" size="md" label="Cancel" onClick={onCancel} />}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {BUILD_STEPS.map((s, i) => {
          const done = i < p;
          const active = i === p;
          return (
            <div key={s.label} className="flex items-start gap-3">
              {done ? <CheckCircle size={20} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
                : active ? <Spinner size={20} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                : <span className="w-5 h-5 rounded-full border-2 border-[var(--border-primary)] shrink-0 mt-0.5" />}
              <div>
                <p className={cn("text-[14px] font-semibold", done || active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{s.label}</p>
                <p className="text-[12px] text-[var(--text-muted)]">{s.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </WizardScaffold>
  );
}

/* ───────────────────────── Decisions ───────────────────────── */
function Decisions({ goal, refetch, onCancel }) {
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
    <WizardScaffold
      title="A couple of decisions"
      subtitle="Your answers shape the targets — every option is grounded in your real numbers."
      footer={
        <WizardFooter
          left={<WizardSteps current={1} />}
          right={
            <>
              <PvButton variant="secondary" size="md" label="Cancel" onClick={onCancel} />
              <PvButton variant="primary" size="md" label={idx < total - 1 ? "Next" : (submit.isPending ? "Building…" : "Build targets")} icon={ArrowRight} iconPosition="suffix" disabled={!chosen || submit.isPending} onClick={next} />
            </>
          }
        />
      }
    >
      {/* Answered so far — a quick glance; click to revisit */}
      {idx > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {goal.questions.slice(0, idx).map((qq, i) => {
            const ansId = answers[qq.id];
            const opt = qq.options.find((o) => o.id === ansId);
            const label = opt ? opt.label : ansId === "other" ? "Something else…" : "—";
            return (
              <button key={qq.id} onClick={() => setIdx(i)} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-[var(--border-primary)] bg-pv-neutral-grey-50 text-left cursor-pointer hover:border-pv-primary-primary-300 transition-colors">
                <CheckCircle size={16} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Question {i + 1}</p>
                  <p className="text-[13px] text-[var(--text-primary)] leading-snug line-clamp-1">{label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[12px] font-semibold text-pv-primary-primary-600 mb-2">Question {idx + 1} of {total}</p>
      <p className="text-[14px] text-[var(--text-primary)] leading-relaxed mb-4">{q.text}</p>
      <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-lg bg-pv-primary-primary-50 border border-pv-primary-primary-100">
        <Question size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
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
    </WizardScaffold>
  );
}

/* ───────────────────────── Review ───────────────────────── */
function Review({ goal, refetch, onCancel }) {
  const qc = useQueryClient();
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState(goal.name || "");
  const [whyOpen, setWhyOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [chatWidth, setChatWidth] = useState(360);

  // Drag the left edge of the adjust panel to resize it (300–620px).
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = chatWidth;
    const onMove = (ev) => setChatWidth(Math.min(620, Math.max(300, startW + (startX - ev.clientX))));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

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
      <div className="flex-1 flex min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-xl overflow-hidden">
        {/* Left: titled content */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4">
          <h1 className="text-[16px] font-semibold text-[var(--text-primary)]">Review your goal</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6">Here's how we'll measure and watch it — adjust on the right, then save.</p>
          <div className="flex flex-col gap-7">
            {/* Targets */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-pv-neutral-grey-600" />
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Targets</h2>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.targets.length}</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mb-3">How we'll know you hit the goal — we check each target every run.</p>
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

            {/* Conditions we'll watch */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <WaveSine size={16} className="text-pv-neutral-grey-600" />
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Conditions we'll watch each run</h2>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.conditions.length}</span>
              </div>
              <div className="flex flex-col">
                {goal.conditions.map((c, i) => (
                  <div key={c.id} className="flex items-start gap-2.5 py-2">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-pv-neutral-grey-100 text-[11px] font-semibold text-[var(--text-muted)] mt-0.5">{i + 1}</span>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{c.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Moves we may recommend */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lightning size={16} className="text-pv-neutral-grey-600" />
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Moves we may recommend</h2>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.moves.length}</span>
              </div>
              <div className="flex flex-col">
                {goal.moves.map((m, i) => (
                  <div key={m.id} className="flex items-start gap-2.5 py-2">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-pv-neutral-grey-100 text-[11px] font-semibold text-[var(--text-muted)] mt-0.5">{i + 1}</span>
                    <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{m.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right rail: adjust chat (always open) */}
        <div style={{ width: chatWidth }} className="relative shrink-0 border-l border-[var(--pv-neutral-grey-150)] flex flex-col">
            {/* Drag handle to resize the panel width */}
            <div
              onMouseDown={startResize}
              className="group absolute left-0 top-0 bottom-0 -ml-1 w-2 z-20 cursor-col-resize flex items-center justify-center"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
            >
              <span className="w-[2px] h-full bg-transparent group-hover:bg-pv-primary-primary-300 transition-colors" />
            </div>
            <div className="shrink-0 flex items-start gap-2 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <PencilSimple size={16} className="text-pv-primary-primary-500 shrink-0" />
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">Want to adjust anything?</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chat.map((m, i) => (
                <div key={i} className={cn("text-[13px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%]", m.role === "user" ? "self-end bg-pv-primary-primary-500 text-white rounded-br-md" : "self-start bg-pv-neutral-grey-100 text-[var(--text-primary)] rounded-bl-md")}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="shrink-0 p-3 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAdjust(); } }}
                rows={1}
                placeholder="Tell us what to adjust…"
                className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
              />
              <button onClick={sendAdjust} disabled={!draft.trim() || adjust.isPending} className="flex items-center justify-center w-9 h-9 rounded-full bg-pv-primary-primary-500 text-white disabled:opacity-40 shrink-0 cursor-pointer border-none transition-opacity" aria-label="Send">
                {adjust.isPending ? <Spinner size={16} /> : <PaperPlaneTilt size={16} weight="fill" />}
              </button>
            </div>
        </div>
      </div>

      <WizardFooter
        left={
          <>
            <WizardSteps current={3} />
            <Tooltip title="Tell us in plain language — we'll change the setup and tell you what moved. We only adjust the goal here; we won't run analysis." arrow placement="top">
              <span className="inline-flex items-center cursor-default text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"><Info size={16} /></span>
            </Tooltip>
          </>
        }
        right={
          <>
            <PvButton variant="secondary" size="md" label="Cancel" onClick={onCancel} />
            <PvButton variant="primary" size="md" label="Save goal" icon={CheckCircle} onClick={() => setShowSave(true)} />
          </>
        }
      />

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
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium text-amber-600 hover:bg-amber-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
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

function RecommendationCard({ goal, rec, refetch, onOpen }) {
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
    <div onClick={() => onOpen?.(rec.id)} className={cn("flex flex-col h-full p-4 rounded-xl border transition-colors bg-white cursor-pointer", done ? "border-[var(--border-primary)] opacity-80" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 shadow-[0_1px_2px_rgba(16,24,40,0.04)]")}>
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
      <p className={cn("text-[14px] font-semibold leading-snug mb-1.5", done ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")}>{rec.title}</p>
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
      <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-3 border-t border-[var(--pv-neutral-grey-100)]">
        {done ? (
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", resolved.cls)}>
              {(() => { const I = resolved.icon; return <I size={14} weight="fill" />; })()} {resolved.label}
            </span>
            <button onClick={() => act.mutate({ action: "open" })} className="text-[12px] font-medium text-[var(--text-muted)] hover:text-pv-primary-primary-600 bg-transparent border-none cursor-pointer">Undo</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => act.mutate({ action: "acted" })} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium text-green-600 hover:bg-green-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <CheckCircle size={14} /> Acted
            </button>
            <button onClick={() => act.mutate({ action: "rejected" })} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium text-rose-600 hover:bg-rose-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <XCircle size={14} /> Reject
            </button>
            <span className="ml-auto"><SnoozeMenu disabled={act.isPending} onSnooze={(snooze) => act.mutate({ action: "snoozed", snooze })} /></span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveGoal({ goal, refetch }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [recId, setRecId] = useState(null);
  const [tab, setTab] = useState("overview");
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
  const firingCount = goal.conditions.filter((c) => c.state === "fired").length;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">{goal.name}</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">{goal.statement}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PvButton variant="secondary" size="md" label="Run history" icon={ClockCounterClockwise} onClick={() => navigate(`/goals/${goal.id}/runs`)} />
          <PvButton variant="primary" size="md" label={check.isPending ? "Checking…" : "Run check-in"} icon={check.isPending ? Spinner : Play} iconPosition="suffix" disabled={check.isPending} onClick={() => check.mutate()} />
        </div>
      </div>

      {/* Tab bar — Overview · Recommendations · Monitor */}
      <div className="flex w-full shrink-0 border-b border-[var(--pv-neutral-grey-150)] mt-5">
        <div className="flex items-start gap-6">
          {[
            { k: "overview", label: "Overview" },
            { k: "recommendations", label: "Recommendations", badge: actNow || recs.length },
            { k: "monitor", label: "Monitor", badge: firingCount },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "flex items-center gap-2 h-11 px-1 border-b-2 bg-transparent cursor-pointer text-[14px] transition-colors",
                tab === t.k ? "text-pv-primary-primary-500 font-medium border-pv-primary-primary-500" : "text-[var(--text-primary)] border-transparent hover:text-pv-primary-primary-500"
              )}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={cn("px-1.5 py-0.5 text-[11px] font-semibold rounded-full", tab === t.k ? "bg-pv-primary-primary-500 text-white" : "bg-pv-neutral-grey-100 text-[var(--text-muted)]")}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {/* ── Overview: how am I doing + targets ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            {lastCheckIn ? (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Latest check-in</span>
                  <span className="text-[11px] text-[var(--text-muted)]">· {lastCheckIn.at}</span>
                </div>
                <p className="text-[18px] font-medium text-[var(--text-primary)] leading-snug">{lastCheckIn.summary}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
                <Lightning size={26} className="text-[var(--text-muted)]" />
                <p className="text-[16px] font-medium text-[var(--text-primary)]">No check-ins yet</p>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">Run a check-in to measure your targets against the latest data and get data-backed recommendations — each with the evidence behind it.</p>
                <div className="mt-2">
                  <PvButton variant="primary" size="md" label="Run your first check-in" icon={Play} iconPosition="suffix" onClick={() => check.mutate()} />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-pv-primary-primary-500" />
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">Targets</p>
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{goal.targets.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 items-stretch">
                {goal.targets.map((t) => (
                  <div key={t.id} className="group flex flex-col gap-3 p-4 bg-white border border-[var(--pv-neutral-grey-150)] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)] hover:border-pv-primary-primary-200 transition-all">
                    <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug">{t.label}</p>
                    <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{t.why}</p>
                    <div className="flex items-center gap-1.5 mt-auto pt-2.5 border-t border-[var(--pv-neutral-grey-100)] text-[11px] font-medium text-[var(--text-muted)]">
                      <ArrowsClockwise size={12} weight="bold" /> Checked every run
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Recommendations ── */}
        {tab === "recommendations" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              {lastCheckIn ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Check-in · {lastCheckIn.at}</p>
              ) : <span />}
              <div className="flex items-center gap-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5"><Lightning size={13} weight="fill" className="text-rose-500" />{actNow} act now</span>
                <span className="inline-flex items-center gap-1.5"><Eye size={13} className="text-amber-500" />{watching} watching</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={13} weight="fill" className="text-green-500" />{doneCount} done</span>
              </div>
            </div>
            {recs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
                <ClockCounterClockwise size={26} className="text-[var(--text-muted)]" />
                <p className="text-[16px] font-medium text-[var(--text-primary)]">No recommendations yet</p>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">They appear here after your first check-in — each with the data that triggered it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 items-stretch">
                {recs.map((r) => <RecommendationCard key={r.id} goal={goal} rec={r} refetch={refetch} onOpen={setRecId} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Monitor: what we're watching + notes ── */}
        {tab === "monitor" && (
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            {/* What we're watching — status board */}
            {(() => {
              const conditions = [...goal.conditions].sort((a, b) => (b.state === "fired" ? 1 : 0) - (a.state === "fired" ? 1 : 0));
              return (
                <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">What we're watching</p>
                    </div>
                    {firingCount > 0 && <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-600">{firingCount} firing</span>}
                  </div>
                  <div className="p-2 flex flex-col">
                    {conditions.map((c) => {
                      const fired = c.state === "fired";
                      return (
                        <div key={c.id} title={c.label} className={cn("flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg", fired && "bg-rose-50/60")}>
                          <span className="relative flex items-center justify-center w-4 h-4 shrink-0 mt-0.5">
                            {fired ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            ) : (
                              <span className="w-2 h-2 rounded-full border-[1.5px] border-pv-neutral-grey-300" />
                            )}
                          </span>
                          <p className={cn("flex-1 text-[12px] leading-snug", fired ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]")}>{c.label}</p>
                          <span className={cn("shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded", fired ? "bg-rose-100 text-rose-700" : "text-[var(--text-muted)]")}>
                            {fired ? <Warning size={11} weight="fill" /> : <CheckCircle size={11} weight="fill" />}
                            {fired ? (c.count ? `${c.count} fired` : "fired") : "quiet"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Goal notes — a running log, kept with the goal's context */}
            <div className="bg-white border border-[var(--border-primary)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3">
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">Notes</p>
                {goal.notes.length > 0 && <span className="text-[11px] text-[var(--text-muted)]">{goal.notes.length}</span>}
              </div>
              <div className="p-3 flex flex-col gap-2.5">
                {goal.notes.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                    {goal.notes.map((n) => (
                      <div key={n.id} className="flex flex-col gap-1 px-3 py-2 bg-pv-neutral-grey-50 rounded-lg">
                        <p className="text-[12px] text-[var(--text-primary)] leading-snug">{n.text}</p>
                        <span className="text-[10px] text-[var(--text-muted)]">{n.at}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && note.trim()) addNote.mutate(); }}
                    rows={2}
                    placeholder="Add a note — e.g. “Never pause Brand Search”"
                    className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
                  />
                  <PvButton variant="secondary" size="sm" label="Add note" icon={NotePencil} disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {recId && <RecommendationDrawer goalId={goal.id} recId={recId} onClose={() => setRecId(null)} />}
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

  const cancel = () => navigate("/goals");
  const crumb = goal?.name || "Goal";
  const [footerEl, setFooterEl] = useState(null);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Standard app header bar with breadcrumb (consistent with Dashboards) */}
      <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate("/goals")} className="text-[16px] leading-[24px] font-medium text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0">Goals</button>
          <CaretRight size={14} className="text-[var(--pv-neutral-grey-400)] shrink-0" />
          <span className="block truncate text-[16px] leading-[24px] font-medium max-w-[420px] text-pv-neutral-grey-900">{crumb}</span>
        </div>
      </div>

      <FooterSlot.Provider value={footerEl}>
        <div className="flex-1 min-h-0 overflow-y-auto bg-pv-neutral-grey-50 p-4">
          <div className={cn(
            "flex flex-col min-h-full w-full h-full bg-white rounded-xl",
            // Padded/bordered card only for the active goal; wizard phases render
            // their own panels, so they stay unbordered on the grey backdrop.
            goal && !["calibrating", "decisions", "building", "review"].includes(goal.status) && "border border-[var(--pv-neutral-grey-150)] p-4"
          )}>
            {isLoading || !goal ? (
              <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] mt-8"><Spinner size={18} /> Loading…</div>
            ) : goal.status === "calibrating" ? (
              <Calibrating goal={goal} onCancel={cancel} />
            ) : goal.status === "decisions" ? (
              <Decisions goal={goal} refetch={refetch} onCancel={cancel} />
            ) : goal.status === "building" ? (
              <Building goal={goal} onCancel={cancel} />
            ) : goal.status === "review" ? (
              <Review goal={goal} refetch={refetch} onCancel={cancel} />
            ) : (
              <ActiveGoal goal={goal} refetch={refetch} />
            )}
          </div>
        </div>
      </FooterSlot.Provider>

      {/* Page-wide footer slot — wizard phases portal their footer here */}
      <div ref={setFooterEl} className="shrink-0 w-full" />
    </div>
  );
}
