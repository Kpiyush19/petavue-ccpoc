import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, ArrowSquareOut, Play, CircleNotch, CheckCircle, ClockCounterClockwise, Target, Eye, Lightning,
} from "@phosphor-icons/react";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />;

function QuickRec({ goalId, rec, onChanged }) {
  const act = useMutation({
    mutationFn: (action) => apiPost(`/api/goals/${goalId}/recommendations/${rec.id}/act`, { action, note: action === "snoozed" ? "Snoozed from quick view" : undefined }),
    onSuccess: onChanged,
  });
  const done = rec.status !== "open";
  return (
    <div className={cn("p-3.5 rounded-lg border", done ? "border-[var(--border-primary)] bg-pv-neutral-grey-50 opacity-70" : "border-pv-primary-primary-200 bg-pv-primary-primary-50/30")}>
      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug mb-1">→ {rec.tldr}</p>
      <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-2.5">{rec.body}</p>
      {done ? (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)]">
          <CheckCircle size={14} weight="fill" className="text-green-500" /> {rec.status === "acted" ? "Done" : rec.status === "rejected" ? "Dismissed" : "Snoozed"}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <PvButton variant="secondary" size="sm" label="Done" icon={CheckCircle} onClick={() => act.mutate("acted")} />
          <PvButton variant="ghost" size="sm" label="Dismiss" onClick={() => act.mutate("rejected")} />
          <PvButton variant="ghost" size="sm" label="Snooze" icon={ClockCounterClockwise} onClick={() => act.mutate("snoozed")} />
        </div>
      )}
    </div>
  );
}

export default function GoalQuickView({ id, onClose, onFull }) {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const { data: goal } = useQuery({ queryKey: ["goal", id], queryFn: () => apiGet(`/api/goals/${id}`), enabled: !!id });

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { setShow(false); setTimeout(onClose, 280); };
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["goal", id] });
    qc.invalidateQueries({ queryKey: ["goals"] });
    qc.invalidateQueries({ queryKey: ["goals-attention"] });
  };
  const check = useMutation({ mutationFn: () => apiPost(`/api/goals/${id}/check-in`, {}), onSuccess: invalidate });

  const lastCheckIn = goal?.checkIns?.[0];
  const recs = lastCheckIn?.recommendations || [];

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop (inspired by .dash-backdrop) */}
      <div
        onClick={close}
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(15, 22, 36, 0.18)", opacity: show ? 1 : 0 }}
      />
      {/* Drawer — iOS-style drawer curve (Ionic) for a natural slide */}
      <div
        className="absolute top-0 right-0 h-full w-[540px] max-w-[92vw] bg-white shadow-2xl flex flex-col"
        style={{ transform: show ? "translateX(0)" : "translateX(100%)", transition: "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {!goal ? (
          <div className="flex items-center gap-2 p-6 text-[14px] text-[var(--text-muted)]"><Spinner size={18} /> Loading…</div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-primary)]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <h3 className="text-[17px] font-semibold text-[var(--text-primary)] truncate">{goal.name}</h3>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1 line-clamp-2">{goal.statement}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <PvButton variant="ghost" size="sm" icon={ArrowSquareOut} aria-label="Open full view" onClick={() => onFull(id)} />
                <PvButton variant="ghost" size="sm" icon={X} aria-label="Close" onClick={close} />
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-3 border-b border-[var(--border-primary)]">
              <button onClick={() => onFull(id)} className="text-[13px] font-medium text-pv-primary-primary-600 hover:underline bg-transparent border-none cursor-pointer p-0">Open full view</button>
              <PvButton variant="primary" size="sm" label={check.isPending ? "Checking…" : "Run check-in"} icon={check.isPending ? Spinner : Play} iconPosition="suffix" disabled={check.isPending} onClick={() => check.mutate()} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              {lastCheckIn && (
                <div className="p-4 bg-pv-neutral-grey-50 border border-[var(--border-primary)] rounded-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Latest check-in · {lastCheckIn.at}</p>
                  <p className="text-[14px] font-medium text-[var(--text-primary)] leading-snug">{lastCheckIn.summary}</p>
                </div>
              )}

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Recommendations</p>
                {recs.length === 0 ? (
                  <p className="text-[13px] text-[var(--text-muted)]">No recommendations yet — run a check-in.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {recs.map((r) => <QuickRec key={r.id} goalId={id} rec={r} onChanged={invalidate} />)}
                  </div>
                )}
              </section>

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Targets</p>
                {goal.targets.map((t) => (
                  <div key={t.id} className="flex gap-2">
                    <Target size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{t.label}</p>
                      {t.target && <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Target: {t.target}</p>}
                    </div>
                  </div>
                ))}
              </section>

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">What we're watching ({goal.conditions.length})</p>
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
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
