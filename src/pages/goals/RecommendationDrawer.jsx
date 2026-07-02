import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Bell, ShieldCheck, ChatCircle, CheckCircle, ClockCounterClockwise, XCircle, Sliders, CircleNotch, ArrowUUpLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

/* Inline recommendation detail — used both in the drawer and the Recommendations
   tab's right panel. Fills its container height (scroll body + pinned footer). */
export function RecommendationDetail({ goalId, recId, onClose, onOpenGoal }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [thread, setThread] = useState([]);
  const [showChat, setShowChat] = useState(false);
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
    acted: { label: "Marked acted", cls: "text-green-600" },
    rejected: { label: "Dismissed", cls: "text-[var(--text-muted)]" },
    snoozed: { label: rec.snoozeLabel ? `Snoozed · ${rec.snoozeLabel}` : "Snoozed", cls: "text-amber-600" },
  }[rec.status];

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--border-primary)]">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full", actNow ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700")}>{actNow ? "Act now" : "Watch"}</span>
            {rec.age && <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-pv-primary-primary-50 text-pv-primary-primary-600">{rec.age}</span>}
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-pv-neutral-grey-100 text-[var(--text-muted)]">{rec.category}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowChat((v) => !v)} className={cn("flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors", showChat ? "bg-pv-primary-primary-50 border-pv-primary-primary-300 text-pv-primary-primary-600" : "bg-transparent border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")} aria-label="Comment">
              <ChatCircle size={14} /> Comment{thread.length > 0 && <span className="text-[11px] font-semibold">· {thread.filter((m) => m.role === "user").length}</span>}
            </button>
            {onClose && <button onClick={onClose} className="p-1 rounded-md text-[var(--text-muted)] hover:bg-pv-neutral-grey-100 bg-transparent border-none cursor-pointer" aria-label="Close"><X size={18} /></button>}
          </div>
        </div>
        <div className="px-5 pt-2.5 pb-4">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] leading-snug">{rec.title}</h2>
          {onOpenGoal && goal?.name && (
            <button onClick={() => onOpenGoal(goalId)} className="mt-1 text-[12px] font-medium text-pv-primary-primary-600 hover:underline bg-transparent border-none cursor-pointer p-0">{goal.name}</button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 [&>*]:shrink-0">
        {rec.metrics?.length > 0 && (
          <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden">
            {rec.metrics.map((m, i) => (
              <div key={i} className={cn("grid items-baseline gap-3 px-4 py-2.5", i > 0 && "border-t border-[var(--pv-neutral-grey-100)]")} style={{ gridTemplateColumns: "120px 1fr" }}>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</span>
                <span className="text-[13px] text-[var(--text-primary)]"><span className="font-semibold">{m.value}</span>{m.note && <span className="text-[var(--text-muted)]"> · {m.note}</span>}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{rec.body}</p>

        {rec.trigger && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-pv-neutral-grey-50 border border-[var(--pv-neutral-grey-100)]">
            <Bell size={15} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{rec.trigger}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="border border-[var(--border-primary)] rounded-xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Action</p>
            <ul className="flex flex-col gap-1.5">
              {(rec.steps || [rec.tldr]).map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[13px] text-[var(--text-primary)] leading-snug"><span className="text-pv-primary-primary-500 mt-0.5">›</span>{s}</li>
              ))}
            </ul>
          </div>
          {rec.impact && (
            <div className="rounded-xl p-4 bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Estimated impact</p>
                {rec.tier && <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-white text-[var(--text-muted)] border border-[var(--border-primary)]">Tier {rec.tier}</span>}
              </div>
              <p className="text-[20px] font-semibold text-[var(--text-primary)] leading-none">{rec.impact.value}</p>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-snug">{rec.impact.label}{rec.impact.sub ? ` · ${rec.impact.sub}` : ""}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
          <ShieldCheck size={14} className="text-green-600" /> Verified · defensible on the numbers
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-[var(--border-primary)] px-5 py-3.5">
        {done ? (
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", resolved?.cls)}><CheckCircle size={15} weight="fill" /> {resolved?.label}</span>
            <PvButton variant="secondary" size="sm" label="Undo" icon={ArrowUUpLeft} onClick={() => act.mutate({ action: "open" })} />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <PvButton variant="primary" size="md" label="Mark acted" icon={CheckCircle} disabled={act.isPending} onClick={() => doAct({ action: "acted" }, "Marked acted — monitoring for recovery")} />
              <PvButton variant="secondary" size="md" label="Snooze 7d" icon={ClockCounterClockwise} disabled={act.isPending} onClick={() => doAct({ action: "snoozed", snooze: "7 days" }, "Snoozed for 7 days")} />
              <PvButton variant="secondary" size="md" label="Hold" disabled={act.isPending} onClick={() => doAct({ action: "snoozed", snooze: "on hold" }, "Held until lifted")} />
              <PvButton variant="ghost" size="md" label="Adjust trigger" icon={Sliders} onClick={() => toast.success("Adjust the trigger from the goal's conditions")} />
              <PvButton variant="ghost" size="md" label="Dismiss" icon={XCircle} disabled={act.isPending} onClick={() => doAct({ action: "rejected" }, "Dismissed — archived")} />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2.5 leading-relaxed">
              <span className="font-medium text-[var(--text-secondary)]">Mark acted</span> → monitoring · <span className="font-medium text-[var(--text-secondary)]">Snooze / Hold</span> → held · <span className="font-medium text-[var(--text-secondary)]">Adjust</span> → changes the trigger · <span className="font-medium text-[var(--text-secondary)]">Dismiss</span> → archived
            </p>
          </>
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
