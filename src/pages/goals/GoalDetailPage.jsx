import { useState, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CircleNotch, CheckCircle, Target, Eye, Lightning, MagnifyingGlass,
  CaretRight, X, ClockCounterClockwise, Play, Question, WaveSine, Pulse, Warning, XCircle, PencilSimple, NotePencil,
  Clock, UserCircle, TrendUp, ChartPieSlice, PaperPlaneTilt, ArrowsClockwise, Info,
  CurrencyDollar, Fire, Funnel, Tag, Code, CaretDown, ChatCircle,
} from "@phosphor-icons/react";
import { Tooltip } from "@/common-components";

// Category icon + accent per finding type. Paid-media keys first, legacy
// deal-tracking keys kept as a fallback for any older seeded data.
const REC_ICONS = {
  spend: CurrencyDollar, headroom: MagnifyingGlass, fatigue: Fire, landing: Funnel, brand: Tag,
  stale: Clock, owner: UserCircle, stuck: TrendUp, concentration: ChartPieSlice, threshold: Target,
};
import { toast } from "sonner";
import SageWidget from "./SageWidget";
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
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Reading your paid spend and demo history…</p>
          <p className="text-[13px] text-[var(--text-secondary)]">92 days of Google &amp; Meta spend · 12,480 rows in google_ads_campaigns.csv</p>
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
      subtitle="Turning your answers into the targets we'll measure and the signals we'll watch on every run."
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
    <div onClick={() => onOpen?.(rec.id)} className={cn("flex flex-col h-full p-4 rounded-xl border border-pv-neutral-grey-150/50 transition-shadow bg-white cursor-pointer dropshadow-card", done ? "opacity-80" : "hover:shadow-md")}>
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

/* Compact stat tile — used in the Overview and Monitor summary strips so each
   tab opens with a scannable status line before any detail. */
function StatTile({ icon: Icon, tone, value, label }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 bg-white border border-[var(--pv-neutral-grey-150)] rounded-xl">
      <span className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", tone || "bg-pv-neutral-grey-100 text-[var(--text-muted)]")}>
        <Icon size={18} weight="fill" />
      </span>
      <div className="min-w-0">
        <p className="text-[18px] font-semibold text-[var(--text-primary)] leading-none">{value}</p>
        <p className="text-[12px] text-[var(--text-secondary)] mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

/* Overview status card — uppercase label + icon on top, a colored figure, and a
   one-line read of what it means. Drives the Overview status strip. */
function OverviewStat({ label, icon: Icon, iconClass, num, numClass, word, desc }) {
  return (
    <div className="flex flex-col bg-white border border-pv-neutral-grey-150/50 rounded-lg px-4 py-3.5 dropshadow-card">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{label}</span>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={20} weight="fill" className={iconClass} />}
        <span className="text-[14px] font-semibold leading-none">
          <span className={numClass}>{num}</span>{word && <span className="text-[var(--text-primary)]"> {word}</span>}
        </span>
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] leading-snug">{desc}</p>
    </div>
  );
}

/* One IMPACT / TRIGGER / SIGNAL sub-card inside the Top finding panel. */
function FindingStat({ label, value, sub }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-pv-neutral-grey-150/50 bg-pv-neutral-grey-50/50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug mt-1">{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

/* The single most important finding from the latest check-in, shown on the
   Overview tab. Makes the reasoning chain visible — finding · evidence · why it
   fired · worth · next best action — without opening the Recommendations tab. */
function TopFindingPanel({ rec, onOpen }) {
  const actNow = rec.severity === "act-now";
  const Icon = REC_ICONS[rec.iconKey] || Lightning;
  return (
    <div className="rounded-xl border border-pv-neutral-grey-150/50 bg-white overflow-hidden dropshadow-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("flex items-center justify-center w-7 h-7 rounded-full shrink-0", actNow ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}><Icon size={15} weight="fill" /></span>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] truncate">Top finding · {rec.category}</span>
        </div>
        <span className={cn("shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full", actNow ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>{actNow ? "Act now" : "Watch"}</span>
      </div>
      <div className="px-4 pb-4 flex flex-col gap-4">
        <div>
          <p className="text-[16px] font-semibold text-[var(--text-primary)] leading-snug">{rec.title}</p>
          {rec.body && <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mt-1.5">{rec.body}</p>}
        </div>

        {/* Impact · Trigger · Signal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FindingStat label="Impact" value={rec.impact?.value} sub={rec.impact?.label} />
          <FindingStat label="Trigger" value={rec.triggerLabel} />
          <FindingStat label="Signal" value={rec.signal} />
        </div>

        <div className="flex flex-wrap items-end gap-4 pt-3 border-t border-[var(--pv-neutral-grey-100)]">
          <div className="min-w-[180px] flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Next best action</p>
            <p className="text-[14px] text-[var(--text-primary)] leading-snug mt-1">{rec.tldr}</p>
          </div>
          <div className="ml-auto shrink-0">
            <PvButton variant="primary" size="md" label="Open finding" icon={ArrowRight} iconPosition="suffix" onClick={() => onOpen(rec.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Goal scorecard — the "are we winning?" answer, leading the Overview. The
   primary rule is shown large with its current value vs target; the rest are
   compact pass/fail rows. Replaces the vanity stat strip + plain rules list. */
function GoalScorecard({ targets }) {
  if (!targets?.length) return null;
  const [primary, ...rest] = targets;
  const metCount = targets.filter((t) => t.met).length;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Goal scorecard</p>
        <p className="text-[12px] text-[var(--text-muted)]">{metCount} of {targets.length} rule{targets.length !== 1 ? "s" : ""} on target</p>
      </div>

      {/* Primary — the headline metric vs target */}
      <div className={cn("rounded-xl border border-pv-neutral-grey-150/50 p-4 mb-3 dropshadow-card", primary.met ? "bg-green-50/40" : "bg-rose-50/40")}>
        <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">{primary.label}</p>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          {primary.current != null && <span className={cn("text-[28px] font-semibold leading-none", primary.met ? "text-green-600" : "text-rose-600")}>{primary.current}</span>}
          <span className="text-[12px] text-[var(--text-secondary)] mb-1">target {primary.target}</span>
          <span className={cn("ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full", primary.met ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700")}>
            {primary.met ? <CheckCircle size={11} weight="fill" /> : <Warning size={11} weight="fill" />}{primary.met ? "On target" : "Off target"}
          </span>
        </div>
        {primary.why && <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-2">{primary.why}</p>}
      </div>

      {/* Secondary rules — compact pass/fail */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rest.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-pv-neutral-grey-150/50 bg-white px-3.5 py-3 dropshadow-card">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug truncate">{t.label}</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  {t.current != null && <span className={cn("font-semibold", t.met ? "text-green-600" : "text-rose-600")}>{t.current}</span>}
                  {t.current != null ? " · " : ""}target {t.target}
                </p>
              </div>
              <span className={cn("shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full", t.met ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700")}>
                {t.met ? <CheckCircle size={13} weight="fill" /> : <Warning size={13} weight="fill" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Monitor health — a compact read of the goal's monitors on the Overview tab,
   fired first. Sits beside the Top finding panel. */
function MonitorHealthPanel({ conditions, firingCount, onViewAll }) {
  const sorted = [...conditions].sort((a, b) => (b.state === "fired" ? 1 : 0) - (a.state === "fired" ? 1 : 0));
  return (
    <div className="rounded-xl border border-pv-neutral-grey-150/50 bg-white overflow-hidden dropshadow-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Monitor health</p>
        {firingCount > 0
          ? <span className="text-[12px] font-semibold text-amber-600">{firingCount} firing</span>
          : <span className="text-[12px] font-medium text-green-600">All quiet</span>}
      </div>
      <div className="p-2 flex flex-col gap-1.5">
        {sorted.map((c) => {
          const fired = c.state === "fired";
          return (
            <div key={c.id} className={cn("flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg", fired ? "bg-rose-50/60 border border-rose-100" : "border border-transparent")}>
              <p className={cn("text-[12px] leading-snug", fired ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]")}>{c.label}</p>
              <span className={cn("shrink-0 text-[10px] font-semibold", fired ? "text-rose-600" : "text-green-600")}>{fired ? "Fired" : "Quiet"}</span>
            </div>
          );
        })}
      </div>
      {onViewAll && (
        <button onClick={onViewAll} className="w-full px-4 py-2.5 text-[12px] font-medium text-pv-primary-primary-600 hover:bg-pv-neutral-grey-50 bg-transparent border-none border-t border-[var(--pv-neutral-grey-100)] cursor-pointer text-left">
          View all monitors →
        </button>
      )}
    </div>
  );
}

/* Monitor tab's right column: what to do next, derived from the top open
   finding — gives the side column a clear job beyond notes. */
function NextStepCard({ rec, firingCount, onOpen }) {
  if (!rec) {
    return (
      <div className="bg-white border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2"><CheckCircle size={15} weight="fill" className="text-green-500" /><p className="text-[14px] font-semibold text-[var(--text-primary)]">Next step</p></div>
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Monitors are quiet — nothing needs action right now. The moment a rule fires, the next step lands here.</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-pv-neutral-grey-150/50 rounded-xl overflow-hidden dropshadow-card">
      <div className="px-4 py-3 flex items-center gap-2">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Next step</p>
      </div>
      <div className="px-4 pb-3 flex flex-col gap-3">
        <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{rec.title}</p>
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{rec.tldr}</p>
        {rec.impact && <p className="text-[12px] text-[var(--text-muted)]">{rec.impact.label}: <span className="font-semibold text-[var(--text-primary)]">{rec.impact.value}</span></p>}
        <PvButton variant="primary" size="md" label="Open finding" icon={ArrowRight} iconPosition="suffix" onClick={() => onOpen(rec.id)} />
      </div>
    </div>
  );
}

/* One monitored condition on the Monitor tab: human-readable label first, with
   the raw rule logic tucked behind "View rule logic" for the audit-minded. */
// Render a rule string with `code` chips for the numeric values.
function renderRuleText(text) {
  return text.split(/(`[^`]+`)/g).map((p, i) =>
    p.startsWith("`") && p.endsWith("`")
      ? <code key={i} className="px-1.5 py-0.5 rounded bg-pv-neutral-grey-100 text-[11px] font-mono text-[var(--text-primary)]">{p.slice(1, -1)}</code>
      : <span key={i}>{p}</span>
  );
}

/* One labelled detail row inside an expanded monitor — a tree-connected line
   with an optional value chip (clean run-trace style). */
function MonitorDetail({ label, children }) {
  return (
    <div className="relative flex items-start gap-2 pl-4 py-1">
      <span className="absolute left-0 top-0 bottom-1/2 w-3 border-l border-b border-[var(--pv-neutral-grey-200)] rounded-bl" />
      <span className="text-[12px] text-[var(--text-muted)] shrink-0 mt-0.5 min-w-[52px]">{label}</span>
      <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed min-w-0">{children}</div>
    </div>
  );
}

function MonitorRow({ condition, defaultOpen, divider, onOpenFinding }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const fired = condition.state === "fired";
  const rule = condition.rule || condition.logic;
  return (
    <div className={cn(divider && "border-t border-[var(--pv-neutral-grey-100)]")}>
      {/* Header — clickable, chevron on the right */}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-pv-neutral-grey-50/60 transition-colors">
        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
          {fired ? <span className="w-2 h-2 rounded-full bg-rose-500" /> : <span className="w-2 h-2 rounded-full border-[1.5px] border-pv-neutral-grey-300" />}
        </span>
        <span className="flex-1 min-w-0 text-[14px] font-medium text-[var(--text-primary)] truncate">{condition.label}</span>
        <span className={cn("shrink-0 text-[10px] font-semibold", fired ? "text-rose-600" : "text-[var(--text-muted)]")}>
          {fired ? (condition.count ? `${condition.count} fired` : "fired") : "quiet"}
        </span>
        <CaretDown size={14} className={cn("shrink-0 text-[var(--text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      {/* Body — animated, tree-indented details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pl-[26px] pr-4 pb-3.5 flex flex-col">
              {condition.description && <p className="text-[12px] text-[var(--text-secondary)] leading-snug mb-1">{condition.description}</p>}
              {condition.creates && (
                <MonitorDetail label="Creates">
                  {condition.findingCategory ? (
                    <button onClick={() => onOpenFinding?.(condition)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pv-primary-primary-50 text-pv-primary-primary-700 text-[12px] font-medium border-none cursor-pointer hover:bg-pv-primary-primary-100 transition-colors">
                      {condition.creates} <ArrowRight size={11} weight="bold" />
                    </button>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{condition.creates}</span>
                  )}
                </MonitorDetail>
              )}
              {rule && (
                <MonitorDetail label="Rule">
                  {condition.rule ? renderRuleText(condition.rule) : <code className="px-1.5 py-0.5 rounded bg-pv-neutral-grey-100 text-[11px] font-mono text-[var(--text-primary)]">{condition.logic}</code>}
                </MonitorDetail>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveGoal({ goal, refetch, showComment, setShowComment }) {
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
  const openRecs = recs.filter((r) => r.status === "open");
  const actNow = openRecs.filter((r) => r.severity === "act-now").length;
  const watching = openRecs.filter((r) => r.severity === "watch").length;
  const doneCount = recs.filter((r) => r.status === "acted").length;
  const firingCount = goal.conditions.filter((c) => c.state === "fired").length;
  // The single highest-priority open finding — drives the Overview "Top finding"
  // panel and the Monitor "Next step" card.
  const leadRec = openRecs.find((r) => r.severity === "act-now") || openRecs[0] || null;
  // Open the finding a monitor produced — links "Creates: X" to the recommendation.
  const openFinding = (condition) => {
    const rec = recs.find((r) => r.category === condition.findingCategory);
    if (rec) setRecId(rec.id);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">{goal.name}</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">{goal.statement}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PvButton variant="ghost" size="md" label="Comment" icon={ChatCircle} onClick={() => setShowComment(true)} />
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
        {/* ── Overview: goal-level command summary ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* 1 — Goal scorecard: are we winning? (leads the page) */}
            <GoalScorecard targets={goal.targets} />

            {lastCheckIn ? (
              <>
                {/* 2 — Latest check-in synthesis: summary leads, timestamp as caption */}
                <div className="flex items-start gap-2.5 rounded-xl border border-[var(--pv-neutral-grey-150)] bg-pv-neutral-grey-50/60 px-4 py-3.5 dropshadow-card">
                  <ClockCounterClockwise size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">{lastCheckIn.summary}</p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-1.5">Latest check-in · {lastCheckIn.at}</p>
                  </div>
                </div>

                {/* 3 — Top finding: the one move to make */}
                {leadRec && <TopFindingPanel rec={leadRec} onOpen={setRecId} />}

                {/* Monitors — which are firing + a line each; full detail on the Monitor tab */}
                <div className="rounded-xl border border-pv-neutral-grey-150/50 bg-white overflow-hidden dropshadow-card">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">Monitors</p>
                      {firingCount > 0
                        ? <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-600">{firingCount} firing</span>
                        : <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-green-50 text-green-600">all quiet</span>}
                    </div>
                    <button onClick={() => setTab("monitor")} className="group inline-flex items-center gap-1 text-[12px] font-medium text-pv-primary-primary-600 hover:underline bg-transparent border-none cursor-pointer p-0">
                      View all {goal.conditions.length} <ArrowRight size={12} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  <div className="px-4 pb-3.5 flex flex-col gap-2.5">
                    {firingCount > 0 ? (
                      goal.conditions.filter((c) => c.state === "fired").map((c) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-[7px]" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug truncate">{c.label}</p>
                            {c.description && <p className="text-[12px] text-[var(--text-secondary)] leading-snug truncate">{c.description}</p>}
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-rose-600 mt-0.5">{c.count ? `${c.count} fired` : "Fired"}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-[var(--text-secondary)]">All {goal.conditions.length} monitors are quiet — nothing tripped this run.</p>
                    )}
                    {firingCount > 0 && (goal.conditions.length - firingCount) > 0 && (
                      <p className="text-[11px] text-[var(--text-muted)] pt-0.5">+ {goal.conditions.length - firingCount} quiet monitor{(goal.conditions.length - firingCount) !== 1 ? "s" : ""} still watching</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
                <Lightning size={26} className="text-[var(--text-muted)]" />
                <p className="text-[16px] font-medium text-[var(--text-primary)]">No check-ins yet</p>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">Run a check-in to measure this goal against your latest paid data. You'll see where spend is leaking and where demand is going unanswered — each finding backed by the number behind it.</p>
                <div className="mt-2">
                  <PvButton variant="primary" size="md" label="Run your first check-in" icon={Play} iconPosition="suffix" onClick={() => check.mutate()} />
                </div>
              </div>
            )}
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
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">Your moves show up here after the first check-in — each grounded in the number that triggered it, so you can act with confidence.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 items-stretch">
                {recs.map((r) => <RecommendationCard key={r.id} goal={goal} rec={r} refetch={refetch} onOpen={setRecId} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Monitor: trust-building + trigger visibility ── */}
        {tab === "monitor" && (() => {
          const fired = goal.conditions.filter((c) => c.state === "fired");
          const quietList = goal.conditions.filter((c) => c.state !== "fired");
          const quietCount = quietList.length;
          return (
            <div className="flex flex-col gap-5">
              {/* Monitor summary strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <OverviewStat
                  label="Current state" icon={Warning} iconClass="text-rose-500"
                  num={firingCount} numClass={firingCount > 0 ? "text-rose-600" : "text-green-600"} word="firing"
                  desc={firingCount > 0 ? `${firingCount} sustained pattern${firingCount !== 1 ? "s" : ""} generated findings in the latest check-in.` : "No monitors are firing right now."}
                />
                <OverviewStat
                  label="Quiet" icon={CheckCircle} iconClass="text-green-500"
                  num={quietCount} numClass="text-green-600" word="quiet"
                  desc={`${quietCount} monitor${quietCount !== 1 ? "s are" : " is"} healthy and still watching.`}
                />
                <OverviewStat
                  label="Last run" icon={ClockCounterClockwise} iconClass="text-pv-primary-primary-500"
                  num={lastCheckIn ? lastCheckIn.at : "—"} numClass="text-[var(--text-primary)]" word=""
                  desc="Every rule was evaluated against this run's campaign and demo data."
                />
                <OverviewStat
                  label="Reliability" icon={CheckCircle} iconClass="text-green-500"
                  num={goal.conditions.length} numClass="text-green-600" word={goal.conditions.length === 1 ? "rule run" : "rules run"}
                  desc="All rules ran cleanly this check-in — no gaps or errors."
                />
              </div>

              {/* What we're watching — full width; firing (expanded) then quiet (collapsed) */}
              <div className="bg-white border border-pv-neutral-grey-150/50 rounded-xl overflow-hidden dropshadow-card">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">What we're watching</p>
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5">All monitors checked every run</p>
                    </div>
                    {firingCount > 0 && <span className="shrink-0 px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-600">{firingCount} firing</span>}
                  </div>

                  {fired.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-rose-50/40 border-b border-[var(--pv-neutral-grey-100)] text-[10px] font-semibold uppercase tracking-wider text-rose-600">Firing · {fired.length}</div>
                      {fired.map((c, i) => <MonitorRow key={c.id} condition={c} defaultOpen divider={i > 0} onOpenFinding={openFinding} />)}
                    </>
                  )}
                  {quietList.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 bg-pv-neutral-grey-50 border-y border-[var(--pv-neutral-grey-100)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Quiet · {quietList.length}</div>
                      {quietList.map((c, i) => <MonitorRow key={c.id} condition={c} divider={i > 0} onOpenFinding={openFinding} />)}
                    </>
                  )}
                </div>
            </div>
          );
        })()}
      </div>

      {recId && <RecommendationDrawer goalId={goal.id} recId={recId} onClose={() => setRecId(null)} />}

      {/* Comment overlay — slides in from the right; notes live here now */}
      <AnimatePresence>
        {showComment && (
          <>
            <div className="fixed inset-0 z-[39]" onClick={() => setShowComment(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-[60px] right-0 bottom-0 w-[340px] max-w-[88%] bg-white border-l border-[var(--border-primary)] shadow-[-8px_0_24px_-12px_rgba(16,24,40,0.18)] flex flex-col z-[40]"
            >
              <div className="shrink-0 flex items-center justify-between px-4 h-[52px] border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-1.5">
                  <ChatCircle size={16} className="text-pv-primary-primary-500" />
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Comments</p>
                  {goal.notes.length > 0 && <span className="text-[11px] text-[var(--text-muted)]">{goal.notes.length}</span>}
                </div>
                <button onClick={() => setShowComment(false)} className="p-1 rounded-md text-[var(--text-muted)] hover:bg-pv-neutral-grey-100 bg-transparent border-none cursor-pointer" aria-label="Close comments"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
                {goal.notes.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">Leave a comment or instruction for this goal — it stays attached to its monitors and carries into future check-ins.</p>
                ) : (
                  goal.notes.map((n) => (
                    <div key={n.id} className="flex flex-col gap-1 px-3 py-2 bg-pv-neutral-grey-50 rounded-lg">
                      <p className="text-[12px] text-[var(--text-primary)] leading-snug">{n.text}</p>
                      <span className="text-[10px] text-[var(--text-muted)]">{n.at}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="shrink-0 p-3 border-t border-[var(--border-primary)] flex items-end gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && note.trim()) addNote.mutate(); }}
                  rows={2}
                  autoFocus
                  placeholder="Add a comment — e.g. “Never pause Brand Search”"
                  className="flex-1 text-[12px] px-2.5 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
                />
                <PvButton variant="primary" size="md" label="Add" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
  const [showComment, setShowComment] = useState(false);

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
            // The active goal grows to contain all its content (Goal rules included)
            // and the outer area scrolls; the wizard phases keep h-full so their own
            // panels can scroll internally.
            "flex flex-col min-h-full w-full bg-white rounded-xl",
            goal && ["calibrating", "decisions", "building", "review"].includes(goal.status)
              ? "h-full"
              : "border border-[var(--pv-neutral-grey-150)] p-4"
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
              <ActiveGoal goal={goal} refetch={refetch} showComment={showComment} setShowComment={setShowComment} />
            )}
          </div>
        </div>
      </FooterSlot.Provider>

      {/* Page-wide footer slot — wizard phases portal their footer here */}
      <div ref={setFooterEl} className="shrink-0 w-full" />

      {/* Sage — floating assistant */}
      <SageWidget title={crumb} hidden={showComment} />
    </div>
  );
}
