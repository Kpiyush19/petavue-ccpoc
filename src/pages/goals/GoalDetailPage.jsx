import { useState, useRef, useEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CircleNotch, CheckCircle, Target, Eye, Lightning, MagnifyingGlass,
  CaretRight, X, ClockCounterClockwise, Play, Question, WaveSine, Pulse, Warning, XCircle, PencilSimple, NotePencil,
  Clock, UserCircle, TrendUp, ChartPieSlice, PaperPlaneTilt, PaperPlaneRight, ArrowsClockwise, Info,
  CurrencyDollar, Fire, Funnel, Tag, Code, CaretDown, ChatCircle, Sparkle,
} from "@phosphor-icons/react";
import { Tooltip } from "@/ui";

// Category icon + accent per finding type. Paid-media keys first, legacy
// deal-tracking keys kept as a fallback for any older seeded data.
const REC_ICONS = {
  spend: CurrencyDollar, headroom: MagnifyingGlass, fatigue: Fire, landing: Funnel, brand: Tag,
  query: MagnifyingGlass, pacing: Clock, device: Pulse, geo: Target, scale: TrendUp,
  stale: Clock, owner: UserCircle, stuck: TrendUp, concentration: ChartPieSlice, threshold: Target,
};
import { toast } from "sonner";
import SageWidget, { SAGE_GRADIENT } from "./SageWidget";
import { ChatOverlay } from "../../components/dashboards/dashboard-viewer-widget";
import { Button as PvButton } from "@/ui";
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
            {i > 0 && <span className={cn("w-5 h-[2px] rounded-full", done ? "bg-primary-400" : "bg-[var(--border-primary)]")} />}
            <span className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle size={16} weight="fill" className="text-primary-600 shrink-0" />
              ) : active ? (
                <span className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary-500 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-[var(--border-primary)] shrink-0" />
              )}
              <span className={cn("text-[14px] whitespace-nowrap", active ? "text-primary-600 font-medium" : done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{label}</span>
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
      <div className="flex items-center gap-2 min-w-0 text-[14px] text-[var(--text-secondary)]">{left}</div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  );
  return slot ? createPortal(bar, slot) : bar;
}

// Unified panel: titled content, footer pinned (progress now lives in the footer).
function WizardScaffold({ title, subtitle, children, footer }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto bg-white border border-[var(--color-grey-100)] rounded-xl px-6 py-5">
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
        <Spinner size={20} className="text-primary-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <p className="text-[16px] font-semibold text-[var(--text-primary)]">Reading your paid spend and demo history…</p>
          <p className="text-[14px] text-[var(--text-secondary)]">92 days of Google &amp; Meta spend · 12,480 rows in google_ads_campaigns.csv</p>
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
                : active ? <Spinner size={20} className="text-primary-500 shrink-0 mt-0.5" />
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
      subtitle="Your answers shape the targets; every option is grounded in your real numbers."
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
              <button key={qq.id} onClick={() => setIdx(i)} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-[var(--border-primary)] bg-grey-50 text-left cursor-pointer hover:border-primary-300 transition-colors">
                <CheckCircle size={16} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Question {i + 1}</p>
                  <p className="text-[14px] text-[var(--text-primary)] leading-snug line-clamp-1">{label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[12px] font-semibold text-primary-600 mb-2">Question {idx + 1} of {total}</p>
      <p className="text-[14px] text-[var(--text-primary)] leading-relaxed mb-4">{q.text}</p>
      <div className="flex items-start gap-2 px-4 py-3 mb-5 rounded-lg bg-primary-50 border border-primary-100">
        <Question size={16} className="text-primary-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">What we found:</span> {q.found}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {q.options.map((o) => (
          <button
            key={o.id}
            onClick={() => choose(o.id)}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 rounded-lg border text-left transition-colors",
              chosen === o.id ? "border-primary-500 bg-primary-50" : "border-[var(--border-primary)] hover:border-primary-300 bg-white"
            )}
          >
            <span className={cn("shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center", chosen === o.id ? "border-primary-500" : "border-[var(--border-primary)]")}>
              {chosen === o.id && <span className="w-2 h-2 rounded-full bg-primary-500" />}
            </span>
            <span className="flex-1 text-[14px] text-[var(--text-primary)] leading-relaxed">{o.label}</span>
            {o.recommended && <span className="shrink-0 px-2 py-0.5 text-[12px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200">recommended</span>}
          </button>
        ))}
        <button
          onClick={() => choose("other")}
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left transition-colors",
            chosen === "other" ? "border-primary-500 bg-primary-50" : "border-[var(--border-primary)] hover:border-primary-300 bg-white"
          )}
        >
          <span className={cn("shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center", chosen === "other" ? "border-primary-500" : "border-[var(--border-primary)]")}>
            {chosen === "other" && <span className="w-2 h-2 rounded-full bg-primary-500" />}
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
      <div className="flex-1 flex min-h-0 bg-white border border-[var(--color-grey-100)] rounded-xl overflow-hidden">
        {/* Left: titled content */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4">
          <h1 className="text-[16px] font-semibold text-[var(--text-primary)]">Review your goal</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-6">Here's how we'll measure and watch it. Adjust on the right, then save.</p>
          <div className="flex flex-col gap-7">
            {/* Targets */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-grey-600" />
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Targets</h2>
                <span className="px-1.5 py-0.5 text-[12px] font-semibold rounded-full bg-grey-100 text-[var(--text-muted)]">{goal.targets.length}</span>
              </div>
              <p className="text-[14px] text-[var(--text-secondary)] mb-3">How we'll know you hit the goal: we check each target every run.</p>
              {goal.targets.map((t) => (
                <div key={t.id} className="p-4 bg-white border border-[var(--border-primary)] rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-medium text-[var(--text-primary)] leading-relaxed">{t.label}</p>
                    {t.target && <span className="shrink-0 px-2.5 py-1 text-[14px] font-semibold rounded-md bg-primary-50 text-primary-700">{t.target}</span>}
                  </div>
                  <button onClick={() => setWhyOpen((v) => !v)} className="flex items-center gap-1 mt-3 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">
                    <CaretRight size={12} className={cn("transition-transform", whyOpen && "rotate-90")} /> Why this, and where it comes from
                  </button>
                  {whyOpen && <p className="mt-1.5 text-[14px] text-[var(--text-secondary)] leading-relaxed pl-4 border-l-2 border-primary-100">{t.why}</p>}
                </div>
              ))}
            </section>

            {/* Conditions we'll watch */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <WaveSine size={16} className="text-grey-600" />
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Conditions we'll watch each run</h2>
                <span className="px-1.5 py-0.5 text-[12px] font-semibold rounded-full bg-grey-100 text-[var(--text-muted)]">{goal.conditions.length}</span>
              </div>
              <div className="flex flex-col">
                {goal.conditions.map((c, i) => (
                  <div key={c.id} className="flex items-start gap-2.5 py-2">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-grey-100 text-[12px] font-semibold text-[var(--text-muted)] mt-0.5">{i + 1}</span>
                    <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{c.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Moves we may recommend */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lightning size={16} className="text-grey-600" />
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Moves we may recommend</h2>
                <span className="px-1.5 py-0.5 text-[12px] font-semibold rounded-full bg-grey-100 text-[var(--text-muted)]">{goal.moves.length}</span>
              </div>
              <div className="flex flex-col">
                {goal.moves.map((m, i) => (
                  <div key={m.id} className="flex items-start gap-2.5 py-2">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-grey-100 text-[12px] font-semibold text-[var(--text-muted)] mt-0.5">{i + 1}</span>
                    <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{m.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right rail: adjust chat (always open) */}
        <div style={{ width: chatWidth }} className="relative shrink-0 border-l border-[var(--color-grey-100)] flex flex-col">
            {/* Drag handle to resize the panel width */}
            <div
              onMouseDown={startResize}
              className="group absolute left-0 top-0 bottom-0 -ml-1 w-2 z-20 cursor-col-resize flex items-center justify-center"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
            >
              <span className="w-[2px] h-full bg-transparent group-hover:bg-primary-300 transition-colors" />
            </div>
            <div className="shrink-0 flex items-start gap-2 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <PencilSimple size={16} className="text-primary-500 shrink-0" />
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">Want to adjust anything?</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chat.map((m, i) => (
                <div key={i} className={cn("text-[14px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%]", m.role === "user" ? "self-end bg-primary-500 text-white rounded-br-md" : "self-start bg-grey-100 text-[var(--text-primary)] rounded-bl-md")}>
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
                className="flex-1 text-[14px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-primary-500 outline-none resize-none"
              />
              <button onClick={sendAdjust} disabled={!draft.trim() || adjust.isPending} className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white disabled:opacity-40 shrink-0 cursor-pointer border-none transition-opacity" aria-label="Send">
                {adjust.isPending ? <Spinner size={16} /> : <PaperPlaneTilt size={16} weight="fill" />}
              </button>
            </div>
        </div>
      </div>

      <WizardFooter
        left={
          <>
            <WizardSteps current={3} />
            <Tooltip title="Tell us in plain language, and we'll change the setup and tell you what moved. We only adjust the goal here; we won't run analysis." arrow placement="top">
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
            <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-1.5">Name this goal</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full text-[14px] px-3.5 py-2.5 rounded-lg border border-primary-500 outline-none mb-4"
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

function RecommendationCard({ goal, rec, refetch, onOpen }) {
  const qc = useQueryClient();
  // pending = the action awaiting input ({ action }); reason = the note; snoozeFor = the snooze duration.
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState("");
  const [snoozeFor, setSnoozeFor] = useState("");
  const act = useMutation({
    mutationFn: (body) => apiPost(`/api/goals/${goal.id}/recommendations/${rec.id}/act`, body),
    onSuccess: () => { setPending(null); setReason(""); setSnoozeFor(""); qc.invalidateQueries({ queryKey: ["goal", goal.id] }); refetch(); },
  });
  const done = rec.status !== "open";
  const actNow = rec.severity === "act-now";
  const Icon = REC_ICONS[rec.iconKey] || Lightning;
  const tint = done
    ? { chip: "bg-grey-100 text-[var(--text-muted)]" }
    : actNow
      ? { chip: "bg-rose-50 text-rose-600" }
      : { chip: "bg-amber-50 text-amber-600" };
  const resolved = {
    acted: { icon: CheckCircle, cls: "text-green-600", label: "Done" },
    rejected: { icon: XCircle, cls: "text-[var(--text-muted)]", label: "Dismissed" },
    snoozed: { icon: ClockCounterClockwise, cls: "text-amber-600", label: rec.snoozeLabel ? `Snoozed · ${rec.snoozeLabel}` : "Snoozed" },
  }[rec.status];

  return (
    <div onClick={() => onOpen?.(rec.id)} className={cn("flex flex-col h-full p-4 rounded-xl border border-grey-100/50 transition-colors bg-white cursor-pointer dropshadow-card", done ? "opacity-80" : "hover:border-primary-300 hover:bg-primary-50")}>
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
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-3">{rec.body}</p>

      {/* Impact strip */}
      {rec.impact && (
        <div className="flex items-baseline gap-2 px-3 py-2 mb-3 rounded-lg bg-grey-50 border border-[var(--color-grey-100)]">
          <span className="text-[16px] font-semibold text-[var(--text-primary)] leading-none">{rec.impact.value}</span>
          <span className="text-[12px] text-[var(--text-secondary)]">{rec.impact.label}</span>
          {rec.impact.sub && <span className="ml-auto text-[12px] text-[var(--text-muted)] whitespace-nowrap">{rec.impact.sub}</span>}
        </div>
      )}

      {/* Actions pinned to the bottom so cards align in the grid */}
      <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-3 border-t border-[var(--color-grey-100)]">
        {done ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", resolved.cls)}>
                {(() => { const I = resolved.icon; return <I size={14} weight="fill" />; })()} {resolved.label}
              </span>
              <button onClick={() => act.mutate({ action: "open" })} className="text-[12px] font-medium text-[var(--text-muted)] hover:text-primary-600 bg-transparent border-none cursor-pointer">Undo</button>
            </div>
            {rec.reason && <p className="text-[12px] text-[var(--text-muted)] italic leading-snug">“{rec.reason}”</p>}
          </div>
        ) : pending ? (
          <div className="flex flex-col gap-2">
            {pending.action === "snoozed" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[var(--text-primary)]">Snooze for</label>
                <input
                  value={snoozeFor}
                  onChange={(e) => setSnoozeFor(e.target.value)}
                  autoFocus
                  placeholder="e.g. 2 weeks · until next month · after the launch"
                  className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-[var(--border-primary)] focus:border-primary-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SNOOZE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setSnoozeFor(opt)}
                      className={cn("text-[12px] px-2 py-1 rounded-full border cursor-pointer transition-colors",
                        snoozeFor === opt ? "border-primary-400 text-primary-600 bg-primary-50" : "border-[var(--border-primary)] text-[var(--text-secondary)] bg-white hover:border-primary-400")}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[12px] font-medium text-[var(--text-primary)]">
              {pending.action === "rejected" ? "Why are you dismissing this? (optional)"
                : pending.action === "acted" ? "What did you do? (optional)"
                : "Anything to note? (optional)"}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              autoFocus={pending.action !== "snoozed"}
              placeholder={pending.action === "rejected" ? "e.g. Never pause Brand Search, it's our best demo source" : "Add context for the next run…"}
              className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-[var(--border-primary)] focus:border-primary-500 outline-none resize-none"
            />
            <div className="flex items-center gap-2">
              <PvButton
                variant="primary" size="sm"
                label={act.isPending ? "Saving…" : "Submit"}
                disabled={act.isPending || (pending.action === "snoozed" && !snoozeFor.trim())}
                onClick={() => act.mutate({ action: pending.action, snooze: snoozeFor.trim() || undefined, reason: reason.trim() || undefined })}
              />
              <button onClick={() => { setPending(null); setReason(""); setSnoozeFor(""); }} className="text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => { setReason(""); setPending({ action: "acted" }); }} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[14px] font-medium text-green-600 hover:bg-green-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <CheckCircle size={14} /> Acted
            </button>
            <button onClick={() => { setReason(""); setPending({ action: "rejected" }); }} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[14px] font-medium text-rose-600 hover:bg-rose-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={() => { setReason(""); setSnoozeFor(""); setPending({ action: "snoozed" }); }} disabled={act.isPending}
              className="ml-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[14px] font-medium text-amber-600 hover:bg-amber-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <ClockCounterClockwise size={14} /> Snooze
            </button>
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
    <div className="flex items-center gap-3 px-3.5 py-3 bg-white border border-[var(--color-grey-100)] rounded-xl">
      <span className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", tone || "bg-grey-100 text-[var(--text-muted)]")}>
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
    <div className="flex flex-col bg-white border border-grey-100/50 rounded-lg px-4 py-3.5 dropshadow-card">
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
    <div className="rounded-lg border border-grey-100/50 bg-grey-50/50 px-3 py-2.5">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug mt-1">{value}</p>
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
    <div className="rounded-xl border border-grey-100/50 bg-white overflow-hidden dropshadow-card">
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
          {rec.body && <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1.5">{rec.body}</p>}
        </div>

        {/* Impact · Trigger · Signal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FindingStat label="Impact" value={rec.impact?.value} sub={rec.impact?.label} />
          <FindingStat label="Trigger" value={rec.triggerLabel} />
          <FindingStat label="Signal" value={rec.signal} />
        </div>

        <div className="flex flex-wrap items-end gap-4 pt-3 border-t border-[var(--color-grey-100)]">
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

// Parse the leading number (with $ / k / m) out of a target/current string.
function statusNum(s) {
  if (s == null) return null;
  const m = String(s).replace(/,/g, "").match(/([\d.]+)\s*([km])?/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const u = (m[2] || "").toLowerCase();
  if (u === "k") n *= 1e3;
  if (u === "m") n *= 1e6;
  return n;
}

/* Goal status — the "am I winning?" reference at the top of the Overview, shown
   as attainment bars. Each bar reads "closeness to passing" (fuller = closer to
   winning, whichever direction the rule runs); amber for off, green for met, so
   it stays quiet under the hero finding. */
function GoalStatusLine({ targets }) {
  if (!targets?.length) return null;
  const onTrack = targets.filter((t) => t.met).length;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Goal status</p>
        <span className="text-[12px] text-[var(--text-muted)]"><span className="font-medium text-[var(--text-primary)]">{onTrack}</span> of {targets.length} on track</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {targets.map((t) => {
          const c = statusNum(t.current), tg = statusNum(t.target);
          // Closeness to passing: 100% when met; otherwise the failing side's
          // ratio toward the boundary (works for both "higher" and "lower" rules).
          const closeness = t.met ? 1 : (c != null && tg ? (c < tg ? c / tg : tg / c) : 0.3);
          const fill = Math.max(5, Math.min(100, closeness * 100));
          return (
            <div key={t.id} className="flex flex-col gap-2 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={cn("text-[16px] font-semibold leading-none", t.met ? "text-green-600" : "text-amber-600")}>{t.current ?? "—"}</span>
                <span className="text-[12px] text-[var(--text-muted)] tabular-nums">target {t.target}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-grey-100 overflow-hidden">
                <div className={cn("h-full rounded-full transition-[width]", t.met ? "bg-green-500" : "bg-amber-500")} style={{ width: `${fill}%` }} />
              </div>
              <span className="text-[12px] text-[var(--text-secondary)] leading-snug line-clamp-2">{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* A quiet "door" to a deeper tab — low-contrast, flat. Used in the Overview's
   third tier so more findings / monitors are reachable without adding weight. */
function OverviewLink({ icon: Icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 px-3.5 py-3 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 hover:bg-primary-50 hover:border-primary-400 text-left cursor-pointer transition-colors w-full">
      <Icon size={17} weight="fill" className="text-primary-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug">{label}</p>
        {sub && <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      <ArrowRight size={15} weight="bold" className="shrink-0 text-primary-500 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

/* Monitor health — a compact read of the goal's monitors on the Overview tab,
   fired first. Sits beside the Top finding panel. */
function MonitorHealthPanel({ conditions, firingCount, onViewAll }) {
  const sorted = [...conditions].sort((a, b) => (b.state === "fired" ? 1 : 0) - (a.state === "fired" ? 1 : 0));
  return (
    <div className="rounded-xl border border-grey-100/50 bg-white overflow-hidden dropshadow-card">
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
        <button onClick={onViewAll} className="w-full px-4 py-2.5 text-[12px] font-medium text-primary-600 hover:bg-grey-50 bg-transparent border-none border-t border-[var(--color-grey-100)] cursor-pointer text-left">
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
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">Monitors are quiet; nothing needs action right now. The moment a rule fires, the next step lands here.</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-grey-100/50 rounded-xl overflow-hidden dropshadow-card">
      <div className="px-4 py-3 flex items-center gap-2">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Next step</p>
      </div>
      <div className="px-4 pb-3 flex flex-col gap-3">
        <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">{rec.title}</p>
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
      ? <code key={i} className="px-1.5 py-0.5 rounded bg-grey-100 text-[12px] font-mono text-[var(--text-primary)]">{p.slice(1, -1)}</code>
      : <span key={i}>{p}</span>
  );
}

/* One labelled detail row inside an expanded monitor — a tree-connected line
   with an optional value chip (clean run-trace style). */
function MonitorDetail({ label, children }) {
  return (
    <div className="relative flex items-start gap-2 pl-4 py-1">
      <span className="absolute left-0 top-0 bottom-1/2 w-3 border-l border-b border-[var(--color-grey-200)] rounded-bl" />
      <span className="text-[12px] text-[var(--text-muted)] shrink-0 mt-0.5 min-w-[52px]">{label}</span>
      <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed min-w-0">{children}</div>
    </div>
  );
}

function MonitorRow({ condition, defaultOpen, onOpenFinding }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const fired = condition.state === "fired";
  const rule = condition.rule || condition.logic;
  return (
    <div>
      {/* Header — clickable, chevron on the right */}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-grey-50 transition-colors">
        {fired
          ? <Warning size={16} className="shrink-0 text-rose-500" />
          : <Eye size={16} className="shrink-0 text-[var(--text-muted)]" />}
        <span className="flex-1 min-w-0 text-[14px] font-medium text-[var(--text-primary)] truncate">{condition.label}</span>
        <CaretDown size={16} className={cn("shrink-0 text-[var(--text-muted)] transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Body — animated, tree-indented details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pl-[42px] pr-4 pb-4 flex flex-col gap-1">
              {condition.description && <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-1">{condition.description}</p>}
              {condition.creates && (
                <MonitorDetail label="Creates">
                  {condition.findingCategory ? (
                    <button onClick={() => onOpenFinding?.(condition)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[12px] font-medium border-none cursor-pointer hover:bg-primary-100 transition-colors">
                      {condition.creates} <ArrowRight size={12} weight="bold" />
                    </button>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{condition.creates}</span>
                  )}
                </MonitorDetail>
              )}
              {rule && (
                <MonitorDetail label="Rule">
                  {condition.rule ? renderRuleText(condition.rule) : <code className="px-1.5 py-0.5 rounded bg-grey-100 text-[12px] font-mono text-[var(--text-primary)]">{condition.logic}</code>}
                </MonitorDetail>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Feedback tab — everything the customer has told us on this goal: decisions
   captured on recommendations (Acted / Dismissed / Snoozed + the reason) and
   comments left via the Comment panel. Read straight from the stored records. */
function FeedbackTab({ goal }) {
  const decisions = goal.checkIns.flatMap((ci) => ci.recommendations).filter((r) => r.status !== "open");
  const comments = goal.notes || [];
  const meta = {
    acted: { icon: CheckCircle, cls: "text-green-600", bg: "bg-green-50", label: "Acted" },
    rejected: { icon: XCircle, cls: "text-rose-600", bg: "bg-rose-50", label: "Dismissed" },
    snoozed: { icon: ClockCounterClockwise, cls: "text-amber-600", bg: "bg-amber-50", label: "Snoozed" },
  };

  if (!decisions.length && !comments.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
        <ChatCircle size={26} className="text-[var(--text-muted)]" />
        <p className="text-[16px] font-medium text-[var(--text-primary)]">No feedback yet</p>
        <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">When you act on, dismiss, or snooze a recommendation (or leave a comment), it shows up here, and the engine factors it into the next check-in.</p>
      </div>
    );
  }

  // Unify decisions + comments into one readable activity timeline.
  const items = [
    ...decisions.map((r) => {
      const m = meta[r.status] || meta.acted;
      return {
        id: r.id, Icon: m.icon, cls: m.cls, bg: m.bg,
        label: m.label + (r.status === "snoozed" && r.snoozeLabel ? ` · ${r.snoozeLabel}` : ""),
        context: r.category, time: r.actedAgo, title: r.title,
        reason: r.reason, needsReason: true,
      };
    }),
    ...comments.map((n) => ({
      id: n.id, Icon: ChatCircle, cls: "text-primary-600", bg: "bg-primary-50",
      label: "Comment", context: null, time: n.at, title: null,
      reason: n.text, needsReason: false,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          const { Icon } = it;
          return (
            <li key={it.id} className="relative flex gap-3 pb-5 last:pb-0">
              {/* connector rail */}
              {!last && <span aria-hidden className="absolute left-[13.5px] top-8 -bottom-1 w-px bg-[var(--color-grey-100)]" />}
              <span className={cn("relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0 ring-4 ring-[#fcfcfc]", it.bg, it.cls)}><Icon size={15} weight="fill" /></span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={cn("text-[14px] font-semibold", it.cls)}>{it.label}</span>
                  {it.context && <span className="text-[12px] text-[var(--text-muted)]">· {it.context}</span>}
                  {it.time && <span className="ml-auto text-[12px] text-[var(--text-muted)] shrink-0">{it.time}</span>}
                </div>
                {it.title && <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug mt-1">{it.title}</p>}
                {it.reason
                  ? <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-1">{it.reason}</p>
                  : it.needsReason && <p className="text-[12px] text-[var(--text-muted)] mt-1">No reason captured.</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-[12px] text-[var(--text-muted)] flex items-start gap-1.5 pt-3 border-t border-[var(--color-grey-100)]"><Info size={14} className="mt-px shrink-0" /> The engine reads this on the next check-in: dismissed findings won't re-flag for the same reason, and snoozed ones return when their timer is up.</p>
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
  // Auto-grow the comment input up to 3 lines, then scroll (same as Sage's).
  const commentRef = useRef(null);
  const MAX_COMMENT_H = 80;
  useEffect(() => {
    const el = commentRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMMENT_H)}px`;
    el.style.overflowY = el.scrollHeight > MAX_COMMENT_H ? "auto" : "hidden";
  }, [note, showComment]);

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
  // Feedback = decisions captured on recommendations + comments left on the goal.
  const feedbackCount = goal.checkIns.flatMap((ci) => ci.recommendations).filter((r) => r.status !== "open").length + (goal.notes?.length || 0);
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
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">{goal.statement}</p>
        </div>
      </div>

      {/* Tab bar — Overview · Recommendations · Monitor */}
      <div className="flex w-full shrink-0 border-b border-[var(--color-grey-100)] mt-5">
        <div className="flex items-start gap-6">
          {[
            { k: "overview", label: "Overview" },
            { k: "recommendations", label: "Recommendations", badge: actNow || recs.length },
            { k: "monitor", label: "Monitor", badge: firingCount },
            { k: "feedback", label: "Feedback", badge: feedbackCount },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "relative flex items-center gap-2 h-11 px-1 bg-transparent border-none cursor-pointer text-[14px] transition-colors",
                tab === t.k ? "text-primary-500 font-medium" : "text-[var(--text-primary)] hover:text-primary-500"
              )}
            >
              {t.label}
              {t.badge > 0 && (
                <span className={cn("px-1.5 py-0.5 text-[12px] font-semibold rounded-full", tab === t.k ? "bg-primary-500 text-white" : "bg-grey-100 text-[var(--text-muted)]")}>{t.badge}</span>
              )}
              {tab === t.k && (
                <motion.span
                  layoutId="goalTabUnderline"
                  className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-primary-500"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {/* ── Overview: goal-level command summary ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            {/* Tier 1 — status: are we winning? (quiet, flat, never competes) */}
            <GoalStatusLine targets={goal.targets} />

            {lastCheckIn ? (
              <>
                {/* Tier 2 — the one move to make (the only elevated block) */}
                {leadRec && <TopFindingPanel rec={leadRec} onOpen={setRecId} />}

                {/* Tier 3 — also happening: quiet doors to the deeper tabs */}
                {(() => {
                  const more = Math.max(0, openRecs.length - (leadRec ? 1 : 0));
                  const quietCount = goal.conditions.length - firingCount;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <OverviewLink
                        icon={Lightning}
                        label={more > 0 ? `${more} more open finding${more !== 1 ? "s" : ""}` : "No other open findings"}
                        sub="See all recommendations"
                        onClick={() => setTab("recommendations")}
                      />
                      <OverviewLink
                        icon={Pulse}
                        label={firingCount > 0 ? `${firingCount} monitor${firingCount !== 1 ? "s" : ""} firing · ${quietCount} quiet` : `All ${goal.conditions.length} monitors quiet`}
                        sub="Open the Monitor tab"
                        onClick={() => setTab("monitor")}
                      />
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-16 border border-dashed border-[var(--border-primary)] rounded-xl bg-white text-center">
                <Lightning size={26} className="text-[var(--text-muted)]" />
                <p className="text-[16px] font-medium text-[var(--text-primary)]">No check-ins yet</p>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">This goal runs on the next scheduled check-in, measured against your latest paid data. You'll see where spend is leaking and where demand is going unanswered, each finding backed by the number behind it.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Recommendations ── */}
        {tab === "recommendations" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              {lastCheckIn ? (
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Check-in · {lastCheckIn.at}</p>
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
                <p className="text-[12px] text-[var(--text-secondary)] max-w-[440px]">Your moves show up here after the first check-in, each grounded in the number that triggered it, so you can act with confidence.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 items-stretch">
                {/* Active first (act-now, then watch), then acted/rejected/snoozed. */}
                {[...recs].sort((a, b) => {
                  const rank = (r) => r.status !== "open" ? 2 : r.severity === "act-now" ? 0 : 1;
                  return rank(a) - rank(b);
                }).map((r) => <RecommendationCard key={r.id} goal={goal} rec={r} refetch={refetch} onOpen={setRecId} />)}
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
                  num={firingCount} numClass="text-[var(--text-primary)]" word="firing"
                  desc={firingCount > 0 ? `${firingCount} sustained pattern${firingCount !== 1 ? "s" : ""} generated findings in the latest check-in.` : "No monitors are firing right now."}
                />
                <OverviewStat
                  label="Quiet" icon={CheckCircle} iconClass="text-green-500"
                  num={quietCount} numClass="text-[var(--text-primary)]" word="quiet"
                  desc={`${quietCount} monitor${quietCount !== 1 ? "s are" : " is"} healthy and still watching.`}
                />
                <OverviewStat
                  label="Last run" icon={ClockCounterClockwise} iconClass="text-primary-500"
                  num={lastCheckIn ? lastCheckIn.at : "—"} numClass="text-[var(--text-primary)]" word=""
                  desc="Every rule was evaluated against this run's campaign and demo data."
                />
                <OverviewStat
                  label="Reliability" icon={CheckCircle} iconClass="text-green-500"
                  num={goal.conditions.length} numClass="text-[var(--text-primary)]" word={goal.conditions.length === 1 ? "rule run" : "rules run"}
                  desc="All rules ran cleanly this check-in, no gaps or errors."
                />
              </div>

              {/* What we're watching — flat, grouped: firing (expanded) then quiet (collapsed) */}
              <div className="flex flex-col">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">What we're watching</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">All {goal.conditions.length} monitors run on every check-in</p>
                </div>

                {fired.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Warning size={14} weight="fill" className="text-rose-500 shrink-0" />
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Firing</span>
                      <span className="text-[12px] tabular-nums text-[var(--text-muted)]">{fired.length}</span>
                    </div>
                    <div className="rounded-lg border border-grey-100/70 bg-white overflow-hidden divide-y divide-[var(--color-grey-100)]">
                      {fired.map((c) => <MonitorRow key={c.id} condition={c} defaultOpen onOpenFinding={openFinding} />)}
                    </div>
                  </div>
                )}

                {quietList.length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={14} className="text-[var(--text-muted)] shrink-0" />
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Quiet</span>
                      <span className="text-[12px] tabular-nums text-[var(--text-muted)]">{quietList.length}</span>
                    </div>
                    <div className="rounded-lg border border-grey-100/70 bg-white overflow-hidden divide-y divide-[var(--color-grey-100)]">
                      {quietList.map((c) => <MonitorRow key={c.id} condition={c} onOpenFinding={openFinding} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Feedback: every decision + comment the customer has given ── */}
        {tab === "feedback" && <FeedbackTab goal={goal} />}
      </div>

      {recId && <RecommendationDrawer goalId={goal.id} recId={recId} onClose={() => setRecId(null)} />}

      {/* Comment panel — same right-side drawer chrome as Sage, for consistency */}
      <ChatOverlay isOpen={showComment} onClose={() => setShowComment(false)} floating heading="Comments" headerIcon={ChatCircle} headerIconWeight="regular">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
            {goal.notes.length === 0 ? (
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">Leave a comment or instruction for this goal. It stays attached to its monitors and carries into future check-ins.</p>
            ) : (
              goal.notes.map((n) => (
                <div key={n.id} className="flex flex-col gap-1 px-3 py-2 bg-grey-50 rounded-lg">
                  <p className="text-[14px] text-[var(--text-primary)] leading-snug">{n.text}</p>
                  <span className="text-[12px] text-[var(--text-muted)]">{n.at}</span>
                </div>
              ))
            )}
          </div>
          <div className="shrink-0 p-3 flex items-end gap-2">
            <textarea
              ref={commentRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (note.trim()) addNote.mutate(); } }}
              rows={1}
              autoFocus
              placeholder="Add a comment, e.g. “Never pause Brand Search”"
              style={{ minHeight: "36px", maxHeight: `${MAX_COMMENT_H}px` }}
              className="flex-1 text-[14px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-primary-500 outline-none resize-none"
            />
            <PvButton variant="primary" size="md" icon={PaperPlaneRight} disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} aria-label="Send" className="shrink-0" />
          </div>
        </div>
      </ChatOverlay>
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
  const [sageOpen, setSageOpen] = useState(false);
  // Header actions (Comment / Ask Sage / Last checked) only apply to a live goal,
  // not the calibrating → review wizard phases.
  const goalIsActive = goal && !["calibrating", "decisions", "building", "review"].includes(goal.status);
  const lastCheckIn = goal?.checkIns?.[0] || null;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Standard app header bar with breadcrumb (consistent with Dashboards) */}
      <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate("/goals")} className="text-[16px] leading-[24px] font-medium text-[var(--color-grey-500)] hover:text-[var(--color-grey-900)] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0">Goals</button>
          <CaretRight size={14} className="text-[var(--color-grey-400)] shrink-0" />
          <span className="block truncate text-[16px] leading-[24px] font-medium max-w-[420px] text-grey-900">{crumb}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {goalIsActive && lastCheckIn && (
            <Tooltip title={`Last checked ${lastCheckIn.at}`} arrow placement="bottom">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] cursor-default">
                <Clock size={14} /> Last checked
              </span>
            </Tooltip>
          )}
          {goalIsActive && (
            <>
              <PvButton variant="ghost" size="md" label="Add Comment" icon={ChatCircle} iconWeight="regular" onClick={() => setShowComment(true)} />
              <button
                onClick={() => setSageOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium text-white border-none cursor-pointer transition-[filter] hover:brightness-105"
                style={{ background: SAGE_GRADIENT }}
              >
                <Sparkle size={14} weight="fill" /> Ask Sage
              </button>
            </>
          )}
        </div>
      </div>

      <FooterSlot.Provider value={footerEl}>
        <div className="flex-1 min-h-0 overflow-y-auto bg-grey-50 p-4">
          <div className={cn(
            // The active goal grows to contain all its content (Goal rules included)
            // and the outer area scrolls; the wizard phases keep h-full so their own
            // panels can scroll internally.
            "flex flex-col min-h-full w-full bg-[#fcfcfc] rounded-xl",
            goal && ["calibrating", "decisions", "building", "review"].includes(goal.status)
              ? "h-full"
              : "border border-[var(--color-grey-100)] p-3"
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

      {/* Sage — launched from the header "Ask Sage" button; overlay only (no FAB) */}
      <SageWidget
        title={crumb}
        hidden={showComment}
        goal={goal ? { id: goal.id, name: goal.name } : null}
        open={sageOpen}
        onOpenChange={setSageOpen}
        fab={false}
      />
    </div>
  );
}
