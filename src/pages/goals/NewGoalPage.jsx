import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, FlowArrow, ArrowSquareOut, MagnifyingGlass, CaretRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button as PvButton } from "../../petavue";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

export default function NewGoalPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statement, setStatement] = useState("");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const { data: wfData } = useQuery({ queryKey: ["goal-workflows"], queryFn: () => apiGet("/api/goals/workflows") });
  const allWorkflows = wfData?.workflows || [];
  const hasWorkflows = allWorkflows.length > 0;
  const workflows = allWorkflows.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));
  const create = useMutation({
    mutationFn: () => apiPost("/api/goals", { statement: statement.trim(), workflowIds: selected }),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["goals"] }); const id = res?.goal?.id; navigate(id ? `/goals/${id}` : "/goals"); },
    onError: (e) => toast.error("Failed: " + e.message),
  });
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  // A workflow sharpens calibration but is never required — a goal statement alone is enough.
  const canCreate = statement.trim().length > 0 && !create.isPending;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Standard app header bar with breadcrumb (consistent with Dashboards) */}
      <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate("/goals")} className="text-[16px] leading-[24px] font-medium text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0">Goals</button>
          <CaretRight size={14} className="text-[var(--pv-neutral-grey-400)] shrink-0" />
          <span className="block truncate text-[16px] leading-[24px] font-medium max-w-[420px] text-pv-neutral-grey-900">New goal</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-pv-neutral-grey-50">
        <div className="w-full max-w-[860px] mx-auto px-8 py-8">
          {/* Form card panel */}
          <div className="bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-[var(--pv-neutral-grey-150)]">
              <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Create a new goal</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Describe the outcome you want — we'll read your data and propose how to measure and watch it.</p>
            </div>

            {/* Card body — stacked labeled fields */}
            <div className="p-6 flex flex-col gap-6">
              {/* Goal */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2">What's the goal? <span className="text-rose-500">*</span></label>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="e.g. Grow qualified pipeline to $1.5M and keep win rate above 25% by Sep 30"
                  className="w-full text-[15px] px-4 py-3.5 rounded-xl border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none text-[var(--text-primary)] placeholder:text-[#adb2ce]"
                />
                <p className="text-[12px] text-[var(--text-muted)] mt-2">Describe the outcome in plain language — we'll figure out how to measure it.</p>
              </div>

              {/* Workflows */}
              <div>
                <label className="block text-[14px] font-semibold text-[var(--text-primary)] mb-2">
                  Which workflows feed this goal? <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                </label>

                {!hasWorkflows ? (
                  <div className="flex flex-col items-center text-center gap-2 px-5 py-9 rounded-xl border border-dashed border-[var(--border-primary)] bg-pv-neutral-grey-50">
                    <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[var(--border-primary)]">
                      <FlowArrow size={22} className="text-[var(--text-muted)]" />
                    </span>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">No workflows connected yet</p>
                    <p className="text-[13px] text-[var(--text-secondary)] max-w-[460px] leading-relaxed">
                      Workflows sharpen a goal by pointing it at a specific report. You don't need one to start — we'll calibrate on all your connected data, and you can attach a workflow later.
                    </p>
                    <div className="mt-1">
                      <PvButton variant="secondary" size="sm" label="Set up a workflow" icon={ArrowSquareOut} iconPosition="suffix" onClick={() => navigate("/workflows")} />
                    </div>
                  </div>
                ) : (
                  <>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your workflows…" className="w-full text-[14px] px-4 py-2.5 mb-2.5 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none" />
                    {workflows.length === 0 ? (
                      <div className="flex flex-col items-center text-center gap-1.5 px-5 py-9 rounded-xl border border-dashed border-[var(--border-primary)]">
                        <MagnifyingGlass size={20} className="text-[var(--text-muted)]" />
                        <p className="text-[13px] text-[var(--text-secondary)]">No workflows match “{search}”.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {workflows.map((w) => (
                          <button key={w.id} type="button" onClick={() => toggle(w.id)}
                            className={cn("flex items-center gap-3 px-3.5 py-3 rounded-lg border text-left transition-colors", selected.includes(w.id) ? "border-pv-primary-primary-500 bg-pv-primary-primary-50" : "border-[var(--border-primary)] hover:border-pv-primary-primary-300 bg-white")}>
                            <span className={cn("shrink-0 w-4 h-4 rounded border flex items-center justify-center", selected.includes(w.id) ? "bg-pv-primary-primary-500 border-pv-primary-primary-500" : "border-[var(--border-primary)]")}>
                              {selected.includes(w.id) && <span className="w-2 h-2 rounded-[2px] bg-white" />}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">{w.name}</span>
                              <span className="text-[12px] text-[var(--text-muted)] truncate">{w.schedule} · {w.lastRun}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page-wide footer */}
      <div className="shrink-0 w-full px-6 py-3 border-t border-[var(--pv-neutral-grey-150)] bg-white flex items-center justify-between gap-4">
        <span className="text-[13px] text-[var(--text-muted)]">{selected.length > 0 ? `${selected.length} workflow${selected.length !== 1 ? "s" : ""} selected` : "Calibrates on all connected data"}</span>
        <div className="flex items-center gap-2">
          <PvButton variant="secondary" size="md" label="Cancel" onClick={() => navigate("/goals")} />
          <PvButton variant="primary" size="md" label={create.isPending ? "Creating…" : "Create & Calibrate"} icon={Target} disabled={!canCreate} onClick={() => create.mutate()} />
        </div>
      </div>
    </div>
  );
}
