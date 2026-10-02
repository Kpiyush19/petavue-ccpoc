/**
 * Workflows-v2 — things you asked Petavue to repeat.
 *
 * Same shell as the campaign detail / skill detail pages: grey canvas, one
 * white card, uppercase section labels, main content left and a 300px grey
 * aside with the small details (how one gets made, the guardrails). Cards
 * carry the sentence that created them — sentences and steps, not settings.
 */
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatCircleText, PauseCircle, PlayCircle, Quotes } from "@phosphor-icons/react";
import { Button } from "@/ui";
import { toast } from "sonner";
import { apiGet, apiPost } from "../../api";
import { cn } from "../../utils/cn";

const SECTION_LABEL = "text-[14px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]";

function StatusPill({ status }) {
  const live = status === "live";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
      live ? "bg-emerald-50 text-emerald-700" : "bg-white text-[#757A97] border border-[var(--color-grey-100)]",
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", live ? "bg-emerald-500" : "bg-[var(--color-grey-300)]")} />
      {live ? "Live" : "Paused"}
    </span>
  );
}

function AutomationCard({ a, onToggle }) {
  const paused = a.status === "paused";
  return (
    <div className={cn(
      "flex flex-col gap-2.5 p-4 bg-grey-50 border border-grey-100 rounded-lg transition-opacity",
      paused && "opacity-70",
    )}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 min-w-0">
          <h3 className="m-0 text-[14px] font-semibold leading-snug tracking-[-0.2px] text-[var(--text-primary)] truncate">
            {a.name}
          </h3>
          <StatusPill status={a.status} />
        </span>
        {!a.builtIn && (
          <button
            onClick={() => onToggle(a.id)}
            className="shrink-0 inline-flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer text-[12px] text-[#757A97] hover:text-[var(--text-primary)] transition-colors"
          >
            {paused ? <><PlayCircle size={14} /> Resume</> : <><PauseCircle size={14} /> Pause</>}
          </button>
        )}
      </div>

      <p className="m-0 text-[13px] text-[var(--text-secondary)] leading-relaxed">{a.produces}</p>

      {(a.steps || []).length > 0 && (
        <div className="flex flex-col gap-1.5 py-1">
          {a.steps.map((s, i) => (
            <span key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 grid place-items-center w-[18px] h-[18px] mt-px rounded-full bg-white border border-[var(--color-grey-100)] text-[10px] font-medium text-[#757A97] tabular-nums">
                {i + 1}
              </span>
              <span className="text-[12px] leading-[19px] text-[var(--text-primary)]">{s}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-[var(--color-grey-100)]">
        {a.quote ? (
          <span className="flex items-center gap-1.5 min-w-0 text-[12px] text-[var(--text-muted)]">
            <Quotes size={13} weight="fill" className="shrink-0 opacity-60" />
            <span className="truncate italic">“{a.quote}”</span>
            <span className="shrink-0">· {a.origin.replace("From chat · ", "")}</span>
          </span>
        ) : (
          <span className="text-[12px] text-[var(--text-muted)]">{a.origin}</span>
        )}
        <span className="shrink-0 text-[12px] text-[var(--text-muted)] tabular-nums">
          {a.schedule} · {a.lastRun}
        </span>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["harness-automations"],
    queryFn: () => apiGet("/api/harness/automations"),
  });
  const toggle = useMutation({
    mutationFn: (id) => apiPost(`/api/harness/automations/${id}/toggle`, {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["harness-automations"] });
      toast.success(res?.automation?.status === "paused" ? "Paused. Nothing runs until you resume it." : "Resumed.");
    },
  });

  const automations = data?.automations || [];
  const fromChat = automations.filter((a) => !a.builtIn);
  const builtIn = automations.filter((a) => a.builtIn);

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[960px]">
        <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <span className="text-[16px] leading-[24px] font-medium">Workflows</span>
          <Button
            variant="secondary"
            size="md"
            label="Start one in chat"
            onClick={() => navigate("/home", { state: { seed: "Find where my LinkedIn ads are leaking spend" } })}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-grey-50 p-4">
          <div className="flex flex-col min-h-full w-full bg-white border border-grey-100/50 rounded-xl p-4">
            <div className="flex gap-10 items-start">

              {/* Main column */}
              <main className="flex-1 min-w-0 flex flex-col">

                <div className="flex flex-col gap-2 mb-6">
                  <span className={SECTION_LABEL}>Description</span>
                  <p className="m-0 text-[14px] leading-relaxed text-[var(--text-primary)] max-w-[820px]">
                    Things you asked Petavue to repeat. Each one was built from a conversation — no builder, no
                    configuration — and runs in the background until it has something worth your approval.
                  </p>
                </div>

                <section className="flex flex-col gap-3 pt-6 border-t border-[var(--color-grey-100)]">
                  <h2 className={cn("m-0", SECTION_LABEL)}>From your chats</h2>
                  {isLoading ? (
                    <div className="h-[120px] bg-grey-50 border border-grey-100 rounded-lg animate-pulse" />
                  ) : fromChat.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 px-6 bg-grey-50 border border-dashed border-[var(--color-grey-200)] rounded-lg text-center">
                      <ChatCircleText size={20} className="text-[var(--text-muted)]" />
                      <span className="text-[13px] text-[var(--text-primary)]">Nothing here yet — and that's the point.</span>
                      <span className="text-[12px] text-[#757A97] max-w-[400px]">
                        Do anything once in chat. If you want it again, say “make it weekly” and it appears here, built
                        from the conversation.
                      </span>
                    </div>
                  ) : (
                    fromChat.map((a) => <AutomationCard key={a.id} a={a} onToggle={(id) => toggle.mutate(id)} />)
                  )}
                </section>

                <section className="flex flex-col gap-3 pt-6 mt-6 border-t border-[var(--color-grey-100)]">
                  <h2 className={cn("m-0", SECTION_LABEL)}>Always on</h2>
                  {builtIn.map((a) => <AutomationCard key={a.id} a={a} onToggle={() => {}} />)}
                </section>

                <div className="h-10" />
              </main>

              {/* Aside — how one gets made + the guardrails. */}
              <aside className="w-[300px] shrink-0 self-start sticky top-0 flex flex-col gap-3 p-3 bg-grey-50 border border-grey-100/70 rounded-xl">
                <div className="flex flex-col gap-2.5">
                  <span className={SECTION_LABEL}>How one gets made</span>
                  <ol className="m-0 p-0 list-none flex flex-col gap-2">
                    {[
                      "Do anything once in chat — find a leak, draft a call sheet, fix a campaign",
                      "Say “make it weekly” (or monthly, or daily)",
                      "It appears here, built from that conversation — pause or resume any time",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[var(--color-grey-200)] text-[12px] font-semibold text-primary-600 shrink-0">
                          {i + 1}
                        </span>
                        <span className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--color-grey-200)]">
                  <span className={SECTION_LABEL}>Guardrails</span>
                  <p className="m-0 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    One-time actions never need a workflow. And nothing here pushes a change on its own — every push
                    waits for your approval, in chat or in Slack.
                  </p>
                </div>
              </aside>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
