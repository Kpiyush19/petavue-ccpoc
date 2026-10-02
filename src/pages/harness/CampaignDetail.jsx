/**
 * One campaign — readable, not configurable.
 *
 * Mirrors the skill-detail layout: app-chrome header, grey canvas with one
 * white card (16px padding), "Petavue's read" leading like the skill's
 * Description, main content center (stat band + uppercase-labelled sections:
 * proof, journey, findings, change log) and a 300px grey aside on the right
 * holding the small details — the campaign's context, source + freshness.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CaretLeft, CheckCircle, Warning, PencilSimple, ArrowsLeftRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/ui";
import { apiGet } from "../../api";
import { cn } from "../../utils/cn";
import SourceIcon from "../../components/SourceIcon";
import { fmtMoney, FINDING_COPY, findingPrompt } from "./bits";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] },
});

/* The skill-detail section label. */
const SECTION_LABEL = "text-[14px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]";

function Stat({ label, value, sub, tone }) {
  return (
    <div className="flex flex-col gap-1 flex-1 px-6 py-4">
      <span className="text-[12px] font-medium text-[#757A97]">{label}</span>
      <span className={cn("text-[20px] leading-[26px] font-medium tabular-nums tracking-[-0.01em]", tone || "text-[var(--text-primary)]")}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-[var(--text-muted)]">{sub}</span>}
    </div>
  );
}

/* The platform's claim vs the CRM's record — the line Petavue exists for. */
function ProofStrip({ c }) {
  const broken = c.channel === "Google Ads";
  return (
    <div className="flex items-center gap-0 bg-white border border-[var(--color-grey-100)] rounded-xl overflow-hidden">
      <div className="flex flex-col gap-0.5 flex-1 px-5 py-4">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#757A97]">
          <SourceIcon name={c.channel} size={12} /> {c.channel.replace(" Ads", "")} reports
        </span>
        <span className={cn("text-[16px] font-medium tabular-nums", broken ? "text-amber-600" : "text-[var(--text-primary)]")}>
          {c.platformConv} conversions
        </span>
        {broken && <span className="text-[11px] text-amber-600">tag broken since Sep 2 — don't judge on this</span>}
      </div>
      <ArrowsLeftRight size={16} className="shrink-0 text-[var(--color-grey-300)]" />
      <div className="flex flex-col gap-0.5 flex-1 px-5 py-4">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#757A97]">
          <SourceIcon name="hubspot" size={12} /> HubSpot records
        </span>
        <span className="text-[16px] font-medium tabular-nums text-[var(--text-primary)]">{c.crmOpps} opportunities</span>
        <span className="text-[11px] text-[var(--text-muted)]">matched person-by-person</span>
      </div>
      <ArrowsLeftRight size={16} className="shrink-0 text-[var(--color-grey-300)] opacity-0" />
      <div className="flex flex-col gap-0.5 flex-1 px-5 py-4 bg-primary-50/50">
        <span className="text-[11px] font-medium uppercase tracking-wide text-primary-700">What that's worth</span>
        <span className="text-[16px] font-medium tabular-nums text-primary-700">{fmtMoney(c.pipeline)} pipeline</span>
        <span className="text-[11px] text-primary-600/70">CRM-grounded · last 30 days</span>
      </div>
    </div>
  );
}

/* One influenced deal as a timeline — ad touches land before AND after the
   deal is created; direct attribution would only count the form fill. */
function JourneyStrip({ j }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{j.account} · {j.deal}</span>
        <span className="text-[11px] leading-[16px] text-[var(--text-muted)] text-right max-w-[340px]">{j.note}</span>
      </div>
      <div className="flex items-start">
        {j.events.map((e, i) => (
          <div key={i} className="flex flex-col flex-1 min-w-0 gap-2">
            <div className="flex items-center h-3.5">
              <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : "bg-[var(--color-grey-200)]")} />
              <span className={cn(
                "shrink-0 rounded-full",
                e.when === "deal"
                  ? "w-3.5 h-3.5 bg-primary-500 border-[3px] border-primary-100"
                  : e.when === "after"
                    ? "w-2.5 h-2.5 bg-emerald-500"
                    : "w-2.5 h-2.5 bg-[var(--color-grey-300)]",
              )} />
              <span className={cn("h-px flex-1", i === j.events.length - 1 ? "bg-transparent" : "bg-[var(--color-grey-200)]")} />
            </div>
            <div className="flex flex-col gap-0.5 px-2 text-center">
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{e.date}</span>
              <span className={cn("text-[12px] font-medium leading-snug", e.when === "deal" ? "text-primary-600" : "text-[var(--text-primary)]")}>
                {e.label}
              </span>
              <span className="text-[11px] leading-[15px] text-[#757A97]">{e.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextField({ field }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.value);
  const save = () => {
    setEditing(false);
    toast.success("Context saved — the next scan uses this.");
  };
  return (
    <div className="flex flex-col gap-1 py-3 group">
      <span className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{field.label}</span>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label={`Edit ${field.label}`}
            className="opacity-0 group-hover:opacity-100 bg-transparent border-none p-0.5 cursor-pointer text-[var(--text-muted)] hover:text-primary-500 transition-all"
          >
            <PencilSimple size={13} />
          </button>
        )}
      </span>
      {editing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          onBlur={save}
          autoFocus
          className="w-full bg-white border border-primary-300 rounded-md px-2 py-1 text-[12px] text-[var(--text-primary)] outline-none focus:border-primary-500"
        />
      ) : (
        <span className="text-[12px] leading-[18px] text-[var(--text-primary)]">{value}</span>
      )}
      <span className="text-[11px] text-[var(--text-muted)]">{field.source} · updated {field.updated}</span>
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading } = useQuery({
    queryKey: ["harness-campaign", id],
    queryFn: () => apiGet(`/api/harness/campaigns/${id}`),
  });

  if (isLoading || !c || c.detail === "not found") {
    return (
      <div className="flex items-center justify-center h-full bg-grey-50">
        <span className="text-[13px] text-[#757A97]">{isLoading ? "Loading…" : "Campaign not found."}</span>
      </div>
    );
  }

  const fixInChat = (prompt) => navigate("/home", { state: { seed: prompt } });
  const icpTone = c.icpMatch >= 75 ? "text-emerald-600" : c.icpMatch >= 60 ? "text-amber-600" : "text-rose-600";

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[960px]">

        {/* Header — same chrome as every other page. */}
        <div className="flex w-full px-6 items-center gap-4 h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <button
            onClick={() => navigate("/campaigns")}
            aria-label="Back to campaigns"
            className="grid place-items-center w-8 h-8 rounded-lg bg-transparent border border-[var(--color-grey-100)] cursor-pointer text-[var(--text-secondary)] hover:bg-[var(--color-grey-50)] transition-colors"
          >
            <CaretLeft size={15} />
          </button>
          <span className="flex items-center gap-2.5 min-w-0 flex-1">
            <SourceIcon name={c.channel} size={15} />
            <span className="text-[16px] leading-[24px] font-medium truncate">{c.name}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
              Live
            </span>
          </span>
          <Button
            variant="secondary"
            size="md"
            label="Ask Sage"
            onClick={() => fixInChat(c.findings.length > 0 ? findingPrompt(c.id, c.findings[0]) : "Find where my LinkedIn ads are leaking spend")}
          />
        </div>

        {/* Body — the skill-detail shell: grey canvas, one white card. */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-grey-50 p-4">
          <div className="flex flex-col min-h-full w-full bg-white border border-grey-100/50 rounded-xl p-4">

            <div className="flex gap-10 items-start">

              {/* Main column */}
              <main className="flex-1 min-w-0 flex flex-col">

                {/* Petavue's read — the skill page's Description slot. */}
                <motion.div {...fadeUp(0)} className="flex flex-col gap-2 mb-6">
                  <span className={SECTION_LABEL}>Petavue's read</span>
                  <p className="m-0 text-[14px] leading-relaxed text-[var(--text-primary)] max-w-[820px]">{c.narrative}</p>
                </motion.div>

                <motion.div {...fadeUp(0.05)} className="flex items-stretch divide-x divide-[var(--color-grey-100)] border border-[var(--color-grey-100)] rounded-xl overflow-hidden">
                  <Stat label="Spend · 30d" value={fmtMoney(c.spend30d)} />
                  <Stat label="Leads" value={c.leads} />
                  <Stat label="Opps (CRM)" value={c.crmOpps} />
                  <Stat label="Pipeline" value={fmtMoney(c.pipeline)} />
                  <Stat label="ICP match" value={`${c.icpMatch}%`} tone={icpTone} />
                </motion.div>

                <motion.section {...fadeUp(0.08)} className="flex flex-col gap-3 mt-6">
                  <h2 className={cn("m-0", SECTION_LABEL)}>Platform vs CRM</h2>
                  <ProofStrip c={c} />
                </motion.section>

                {c.journey && (
                  <section className="flex flex-col gap-3 pt-6 mt-6 border-t border-[var(--color-grey-100)]">
                    <h2 className={cn("m-0", SECTION_LABEL)}>Account journey</h2>
                    <JourneyStrip j={c.journey} />
                  </section>
                )}

                <section className="flex flex-col gap-3 pt-6 mt-6 border-t border-[var(--color-grey-100)]">
                  <h2 className={cn("m-0", SECTION_LABEL)}>
                    {c.findings.length > 0 ? `${c.findings.length} open finding${c.findings.length === 1 ? "" : "s"}` : "No open findings"}
                  </h2>
                  {c.findings.length === 0 ? (
                    <span className="flex items-center gap-2 text-[13px] text-[#757A97]">
                      <CheckCircle size={15} weight="fill" className="text-emerald-500" />
                      The background scan checks this campaign daily. Anything it finds lands here and on Home.
                    </span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {c.findings.map((fid) => {
                        const f = FINDING_COPY[fid];
                        if (!f) return null;
                        return (
                          <div key={fid} className="flex items-center gap-3 px-4 py-3 bg-grey-50 border border-grey-100 rounded-lg">
                            <Warning size={15} weight="duotone" className="shrink-0 text-rose-500" />
                            <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[14px] font-medium leading-snug text-[var(--text-primary)]">{f.title}</span>
                              <span className="text-[13px] text-[#757A97] leading-snug">{f.line}</span>
                            </span>
                            <Button
                              variant="secondary"
                              size="md"
                              label="Fix in chat"
                              className="shrink-0"
                              onClick={() => fixInChat(findingPrompt(c.id, fid))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="flex flex-col gap-3 pt-6 mt-6 border-t border-[var(--color-grey-100)]">
                  <h2 className={cn("m-0", SECTION_LABEL)}>Changes Petavue pushed</h2>
                  {(c.changes || []).length === 0 ? (
                    <span className="text-[13px] text-[#757A97]">
                      Nothing yet. Changes you approve in chat land here with who approved them and when.
                    </span>
                  ) : (
                    <div className="flex flex-col">
                      {c.changes.map((ch, i) => (
                        <div key={i} className={cn("flex items-start gap-3 py-3", i > 0 && "border-t border-[var(--color-grey-100)]")}>
                          <CheckCircle size={15} weight="fill" className="shrink-0 mt-0.5 text-emerald-500" />
                          <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[13px] text-[var(--text-primary)] leading-snug">{ch.change}</span>
                            <span className="text-[12px] text-[var(--text-muted)]">{ch.at} · approved by {ch.by} · {ch.tool}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="h-10" />
              </main>

              {/* Aside — the small details, like the skill page's rail. */}
              <motion.aside
                {...fadeUp(0.1)}
                className="w-[300px] shrink-0 self-start sticky top-0 flex flex-col gap-3 p-3 bg-grey-50 border border-grey-100/70 rounded-xl"
              >
                <div className="flex flex-col gap-1">
                  <span className={SECTION_LABEL}>Campaign context</span>
                  <p className="m-0 text-[12px] text-[var(--text-secondary)] leading-snug">
                    What Petavue optimizes against — every value shows its source. Hover to edit.
                  </p>
                </div>
                <div className="flex flex-col divide-y divide-[var(--color-grey-100)]">
                  {(c.context || []).map((f) => <ContextField key={f.key} field={f} />)}
                </div>
              </motion.aside>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
