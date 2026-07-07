import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Bell, ChatCircle, CheckCircle, ClockCounterClockwise, XCircle, Sliders, CircleNotch, ArrowUUpLeft, Question, CaretDown, Target, Lightning, Eye, Clock, Tag } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

const SNOOZE_OPTIONS = ["1 day", "3 days", "1 week", "2 weeks", "Until next check-in"];

/* Snooze split-button with a duration dropdown (portaled, opens upward). */
function SnoozeMenu({ onSnooze, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - r.top + 4, left: r.left });
    }
    setOpen((o) => !o);
  };
  return (
    <>
      <button ref={btnRef} onClick={toggle} disabled={disabled}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-amber-600 hover:bg-amber-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
        <ClockCounterClockwise size={16} /> Snooze <CaretDown size={12} />
      </button>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="fixed z-[71] w-44 bg-white border border-[var(--border-primary)] rounded-lg shadow-lg py-1" style={{ bottom: pos.bottom, left: pos.left }}>
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

// Render inline `code` chips and **bold** spans inside a derivation step.
function renderInline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-pv-neutral-grey-100 text-[12px] font-mono text-[var(--text-primary)]">{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-[var(--text-primary)]">{p.slice(2, -2)}</strong>;
    return <span key={i}>{p}</span>;
  });
}

/* Inline recommendation detail — used both in the drawer and the Recommendations
   tab's right panel. Fills its container height (scroll body + pinned footer). */
export function RecommendationDetail({ goalId, recId, onClose, onOpenGoal }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [thread, setThread] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showDeriv, setShowDeriv] = useState(false);
  // pending = the action awaiting input ({ action }); reason = the note; snoozeFor = duration.
  const [pending, setPending] = useState(null);
  const [reason, setReason] = useState("");
  const [snoozeFor, setSnoozeFor] = useState("");
  const sendComment = () => {
    const t = comment.trim();
    if (!t) return;
    setThread((c) => [...c, { role: "user", text: t }, { role: "assistant", text: "Noted and saved to this recommendation's record. It'll carry into tomorrow's run." }]);
    setComment("");
  };
  const { data: goal } = useQuery({ queryKey: ["goal", goalId], queryFn: () => apiGet(`/api/goals/${goalId}`) });
  const rec = goal?.checkIns?.[0]?.recommendations?.find((r) => r.id === recId);

  const act = useMutation({
    mutationFn: (body) => apiPost(`/api/goals/${goalId}/recommendations/${recId}/act`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goal", goalId] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["goals-attention"] });
      qc.invalidateQueries({ queryKey: ["goals-recommendations"] });
    },
  });
  const doAct = (body, msg) => act.mutate(body, { onSuccess: () => { toast.success(msg); onClose?.(); } });

  if (!rec) return <div className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] p-6"><Spinner size={18} /> Loading…</div>;

  const actNow = rec.severity === "act-now";
  const done = rec.status !== "open";
  const resolved = {
    acted: { label: "Done", cls: "text-green-600" },
    rejected: { label: "Dismissed", cls: "text-[var(--text-muted)]" },
    snoozed: { label: rec.snoozeLabel ? `Snoozed · ${rec.snoozeLabel}` : "Snoozed", cls: "text-amber-600" },
  }[rec.status];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Scrollable region: header + body scroll together */}
      <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[var(--border-primary)] px-5 py-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex-1 text-[16px] font-semibold text-[var(--text-primary)] leading-snug">{rec.title}</h2>
          {onClose && <button onClick={onClose} className="shrink-0 -mt-1 -mr-1 p-1 rounded-md text-[var(--text-muted)] hover:bg-pv-neutral-grey-100 bg-transparent border-none cursor-pointer" aria-label="Close"><X size={18} /></button>}
        </div>
        {onOpenGoal && goal?.name && (
          <button onClick={() => onOpenGoal(goalId)} className="inline-flex items-center gap-1 text-[12px] font-medium text-pv-primary-primary-600 hover:underline bg-transparent border-none cursor-pointer p-0 self-start"><Target size={13} weight="bold" className="shrink-0" />{goal.name}</button>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[12px] font-normal uppercase tracking-wide text-[var(--text-secondary)]">{actNow ? <Lightning size={11} weight="fill" /> : <Eye size={11} weight="fill" />}{actNow ? "Act now" : "Watch"}</span>
            {rec.age && <span className="inline-flex items-center gap-1 text-[12px] font-normal uppercase tracking-wide text-pv-primary-primary-600"><Clock size={11} weight="bold" />{rec.age}</span>}
            <span className="inline-flex items-center gap-1 text-[12px] font-normal uppercase tracking-wide text-[var(--text-muted)]"><Tag size={11} weight="bold" />{rec.category}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-5 [&>*]:shrink-0">
        {rec.derivation?.length > 0 && (
          <div className="rounded-lg border border-[var(--pv-neutral-grey-150)] overflow-hidden">
            <button onClick={() => setShowDeriv((v) => !v)} className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-semibold text-pv-primary-primary-600 bg-transparent border-none cursor-pointer">
              <span className="flex items-center gap-1.5"><Question size={15} weight="bold" /> Find out how</span>
              <CaretDown size={14} className={cn("transition-transform", showDeriv && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {showDeriv && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="border-t border-[var(--pv-neutral-grey-150)] bg-white px-4 py-1">
                    {rec.derivation.map((step, i) => (
                      <div key={i} className={cn("flex items-start gap-3 py-3", i > 0 && "border-t border-[var(--pv-neutral-grey-150)]")}>
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-pv-primary-primary-600 border border-pv-primary-primary-300 text-[12px] font-semibold shrink-0">{i + 1}</span>
                        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed pt-0.5">{renderInline(step)}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {rec.metrics?.length > 0 && (
          <div className="rounded-lg border border-pv-neutral-grey-150/50 overflow-hidden dropshadow-card">
            {rec.metrics.map((m, i) => (
              <div key={i} className={cn("flex items-baseline justify-between gap-4 px-4 py-2.5", i > 0 && "border-t border-[var(--pv-neutral-grey-100)]")}>
                <span className="text-[13px] text-[var(--text-secondary)] shrink-0">{m.label}</span>
                <span className="text-[13px] text-right text-[var(--text-primary)]"><span className="font-medium">{m.value}</span>{m.note && <span className="text-[var(--text-muted)]"> · {m.note}</span>}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{rec.body}</p>

        {rec.trigger && (
          <div className="flex items-start gap-2">
            <Bell size={15} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{rec.trigger}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Action</p>
            <ul className="flex flex-col gap-1.5">
              {(rec.steps || [rec.tldr]).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-[var(--text-primary)] leading-snug"><span className="text-pv-primary-primary-500 mt-0.5">›</span>{s}</li>
              ))}
            </ul>
          </div>
          {rec.impact && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Estimated impact</p>
                {rec.tier && <span className="px-1.5 py-0.5 text-[12px] font-semibold rounded bg-white text-[var(--text-muted)] border border-[var(--border-primary)]">Tier {rec.tier}</span>}
              </div>
              <p className="text-[18px] font-semibold text-[var(--text-primary)] leading-none">{rec.impact.value}</p>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-snug">{rec.impact.label}{rec.impact.sub ? ` · ${rec.impact.sub}` : ""}</p>
            </div>
          )}
        </div>

      </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-[var(--border-primary)] px-5 py-3.5">
        {done ? (
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", resolved?.cls)}><CheckCircle size={15} weight="fill" /> {resolved?.label}</span>
            <PvButton variant="secondary" size="sm" label="Undo" icon={ArrowUUpLeft} onClick={() => act.mutate({ action: "open" })} />
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
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SNOOZE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setSnoozeFor(opt)}
                      className={cn("text-[11px] px-2 py-1 rounded-full border cursor-pointer transition-colors",
                        snoozeFor === opt ? "border-pv-primary-primary-400 text-pv-primary-primary-600 bg-pv-primary-primary-50" : "border-[var(--border-primary)] text-[var(--text-secondary)] bg-white hover:border-pv-primary-primary-400")}>
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
              placeholder={pending.action === "rejected" ? "e.g. Never pause Brand Search — it's our best demo source" : "Add context for the next run…"}
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
            />
            <div className="flex items-center gap-2">
              <PvButton
                variant="primary" size="sm"
                label={act.isPending ? "Saving…" : "Submit"}
                disabled={act.isPending || (pending.action === "snoozed" && !snoozeFor.trim())}
                onClick={() => doAct(
                  { action: pending.action, snooze: snoozeFor.trim() || undefined, reason: reason.trim() || undefined },
                  pending.action === "acted" ? "Marked done — monitoring for recovery" : pending.action === "rejected" ? "Dismissed — archived" : `Snoozed · ${snoozeFor.trim()}`
                )}
              />
              <button onClick={() => { setPending(null); setReason(""); setSnoozeFor(""); }} className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setReason(""); setPending({ action: "acted" }); }} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-green-600 hover:bg-green-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <CheckCircle size={16} /> Acted
            </button>
            <button onClick={() => { setReason(""); setPending({ action: "rejected" }); }} disabled={act.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-rose-600 hover:bg-rose-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <XCircle size={16} /> Reject
            </button>
            <button onClick={() => { setReason(""); setSnoozeFor(""); setPending({ action: "snoozed" }); }} disabled={act.isPending}
              className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-amber-600 hover:bg-amber-50 bg-transparent border border-[var(--border-primary)] cursor-pointer disabled:opacity-50 transition-colors">
              <ClockCounterClockwise size={16} /> Snooze
            </button>
          </div>
        )}
      </div>

      {/* Right-side collapsible comment chat */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute top-0 right-0 h-full w-[340px] max-w-[88%] bg-white border-l border-[var(--border-primary)] shadow-[-8px_0_24px_-12px_rgba(16,24,40,0.18)] flex flex-col z-10"
          >
            <div className="shrink-0 flex items-center justify-between px-4 h-[52px] border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-1.5">
                <ChatCircle size={16} className="text-pv-primary-primary-500" />
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Comment / instruction</p>
              </div>
              <button onClick={() => setShowChat(false)} className="p-1 rounded-md text-[var(--text-muted)] hover:bg-pv-neutral-grey-100 bg-transparent border-none cursor-pointer" aria-label="Close comments"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {thread.length === 0 ? (
                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">Leave a comment or an instruction for this recommendation — it's saved to its record and carries into the next run.</p>
              ) : (
                thread.map((m, i) => (
                  <div key={i} className={cn("text-[13px] leading-relaxed px-3 py-2 rounded-lg max-w-[88%]", m.role === "user" ? "self-end bg-pv-primary-primary-500 text-white" : "self-start bg-pv-neutral-grey-100 text-[var(--text-primary)]")}>
                    {m.text}
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 p-3 border-t border-[var(--border-primary)] flex items-end gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                rows={2}
                autoFocus
                placeholder="e.g. Never pause Brand Search — hold this one"
                className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
              />
              <PvButton variant="primary" size="md" label="Send" disabled={!comment.trim()} onClick={sendComment} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Drawer wrapper (used on the goal detail page). */
export default function RecommendationDrawer({ goalId, recId, onClose, onOpenGoal }) {
  return (
    <div className="fixed inset-0 z-[70]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="absolute inset-0" style={{ background: "rgba(15,22,36,0.18)" }} onClick={onClose} />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
        className="absolute top-0 right-0 h-full w-[520px] max-w-[94vw] bg-white shadow-2xl overflow-hidden"
      >
        <RecommendationDetail goalId={goalId} recId={recId} onClose={onClose} onOpenGoal={onOpenGoal} />
      </motion.aside>
    </div>
  );
}
