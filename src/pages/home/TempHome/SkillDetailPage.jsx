import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronRight, ChevronDown, Check, LayoutDashboard, FileText, Plug, CheckCircle2, Search, X, Info, AlertTriangle } from "lucide-react";
import { Play, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button as PvButton } from "../../../petavue";
import { apiPost } from "../../../api";
import { useSessionContext } from "../../../contexts/SessionContext";
import { cn } from "../../../utils/cn";
import { SparkleIcon } from "../../../petavue/pages/workbook_home/icons/SparkleIcon";
import { SKILLS_CATALOG } from "../../../skills/skillsCatalog";
import { connectorIcon } from "./utils/connectorIcons";

const SpinnerIcon = (props) => <CircleNotch {...props} className="animate-spin" />;

// Output preview screenshots (src/assets/skills/<slug>.png). Not every skill has one.
const SKILL_OUTPUT_MODULES = import.meta.glob("../../../assets/skills/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const SKILL_OUTPUT_BY_SLUG = Object.fromEntries(
  Object.entries(SKILL_OUTPUT_MODULES).map(([path, url]) => [path.split("/").pop().replace(/\.png$/, ""), url])
);

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

// One consistent label treatment — 12px uppercase, AA-contrast secondary color.
const LABEL = "text-[14px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]";

// Integrations are grouped into these three buckets in this order.
const INTEGRATION_GROUP_ORDER = [
  "CRM & Marketing Automation",
  "Ad Platforms",
  "Web & First-party Data",
];
function integrationGroup(name) {
  const n = (name || "").toLowerCase();
  if (/google ads|linkedin ads|meta ads|facebook|microsoft ads|bing|tiktok|display|paid social/.test(n)) return "Ad Platforms";
  if (/ga4|analytics|segment|6sense|clearbit|website|first-party|snowflake|bigquery|intent/.test(n)) return "Web & First-party Data";
  return "CRM & Marketing Automation"; // Salesforce, HubSpot, Outreach, Gong, Marketo, LinkedIn Sales Navigator, etc.
}
// Mock "already connected" set so the panel reads like the user's own setup —
// some connected, some not. Spans all three groups so each shows a mix.
const CONNECTED_INTEGRATIONS = new Set(["Salesforce", "HubSpot", "Google Ads", "GA4"]);

function Section({ title, lead, children, delay }) {
  return (
    <motion.section {...fadeUp(delay)} className="flex flex-col gap-3 pt-6 mt-6 border-t border-neutral-200">
      <h2 className={LABEL}>{title}</h2>
      {lead && <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{lead}</p>}
      {children}
    </motion.section>
  );
}

export default function SkillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useSessionContext();
  const [running, setRunning] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherQuery, setSwitcherQuery] = useState("");
  const switcherRef = useRef(null);

  // Close the full-screen preview on Escape.
  useEffect(() => {
    if (!previewOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setPreviewOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  // Close the skill switcher on outside-click / Escape.
  useEffect(() => {
    if (!switcherOpen) return undefined;
    const onDown = (e) => { if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setSwitcherOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [switcherOpen]);

  const skill = SKILLS_CATALOG.find((s) => s.slug === id);

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 bg-pv-neutral-grey-50">
        <p className="text-[15px] text-[var(--text-secondary)]">Skill not found.</p>
        <PvButton variant="primary" size="md" label="Back to skills" onClick={() => navigate("/skills")} />
      </div>
    );
  }

  const isMemo = skill.output_type === "memo" || skill.type === "memo";
  const OutputIcon = isMemo ? FileText : LayoutDashboard;
  const outputImg = SKILL_OUTPUT_BY_SLUG[skill.slug] || null;

  // Skills the switcher offers, filtered by its search box.
  const switcherList = SKILLS_CATALOG.filter((s) => {
    const q = switcherQuery.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q);
  });

  // This skill's integrations, bucketed into the three groups (empty groups dropped).
  const integrationsByGroup = INTEGRATION_GROUP_ORDER
    .map((group) => ({ group, items: (skill.integrations || []).filter((it) => integrationGroup(it.name) === group) }))
    .filter((g) => g.items.length > 0);

  // Readiness verdict — resolve the per-source connected state into a single
  // "can I run this right now?" answer, so a missing data source surfaces
  // here (before Activate) instead of as a mid-run block later.
  const totalIntegrations = skill.integrations?.length || 0;
  const missingIntegrations = (skill.integrations || []).filter((it) => !CONNECTED_INTEGRATIONS.has(it.name));
  const isReady = totalIntegrations === 0 || missingIntegrations.length === 0;

  const runSkill = async () => {
    if (running) return;
    setRunning(true);
    try {
      // Start a skill_run session and open the Skills v2 run page.
      const res = await apiPost("/api/sessions", { skill_id: skill.slug });
      const sid = res?.session?.session_id;
      if (!sid) throw new Error("No session id returned");
      navigate(`/skills/run/${sid}`);
    } catch (e) {
      toast.error("Failed to start: " + e.message);
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-col w-full h-full min-w-[900px]">

        {/* Standard app header — 60px, consistent with Dashboards / Goals */}
        <div className="flex w-full px-6 items-center justify-between gap-4 h-[60px] shrink-0 border-b border-[var(--pv-neutral-grey-150)] bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => navigate("/skills")}
                  className="shrink-0 text-[16px] leading-[24px] font-medium text-[var(--pv-neutral-grey-500)] hover:text-[var(--pv-neutral-grey-900)] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Skills
                </button>
                <ChevronRight size={14} className="text-[var(--pv-neutral-grey-400)] shrink-0" />

                {/* Current skill: click to switch to another skill */}
                <div className="relative min-w-0" ref={switcherRef}>
                  <button
                    onClick={() => setSwitcherOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={switcherOpen}
                    className="flex items-center gap-1.5 min-w-0 max-w-[440px] bg-transparent border-none p-0 cursor-pointer"
                  >
                    <span className="block truncate text-[16px] leading-[24px] font-medium text-pv-neutral-grey-900">{skill.name}</span>
                    <ChevronDown size={16} className={cn("shrink-0 text-[var(--text-muted)] transition-transform duration-200", switcherOpen && "rotate-180")} />
                  </button>

                  {switcherOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 mt-1 bg-white flex flex-col rounded-lg border border-pv-neutral-grey-200 z-50 min-w-[300px] max-w-[350px] overflow-hidden"
                    >
                      <div className="flex items-center gap-2 h-10 px-3 border-b border-pv-neutral-grey-100 shrink-0">
                        <Search size={15} className="text-[var(--text-muted)] shrink-0" />
                        <input
                          autoFocus
                          value={switcherQuery}
                          onChange={(e) => setSwitcherQuery(e.target.value)}
                          placeholder="Switch skill…"
                          className="flex-1 min-w-0 text-[13px] bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[#adb2ce]"
                        />
                      </div>
                      <div className="max-h-[320px] overflow-y-auto py-1">
                        {switcherList.length === 0 ? (
                          <p className="px-3 py-4 text-[13px] text-[var(--text-muted)] text-center">No skills match.</p>
                        ) : (
                          switcherList.map((s) => {
                            const active = s.slug === skill.slug;
                            return (
                              <button
                                key={s.slug}
                                role="option"
                                aria-selected={active}
                                onClick={() => { setSwitcherOpen(false); setSwitcherQuery(""); if (!active) navigate(`/skills/${s.slug}`); }}
                                className={cn(
                                  "flex items-center gap-2 w-full px-3 py-2 text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-pv-primary-primary-50",
                                  active && "bg-pv-primary-primary-50/60"
                                )}
                              >
                                <span className={cn("flex-1 min-w-0 truncate text-[13px]", active ? "text-pv-primary-primary-700 font-medium" : "text-[var(--text-primary)]")}>{s.name}</span>
                                {active && <Check size={14} className="text-pv-primary-primary-600 shrink-0" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <PvButton
                variant="primary"
                size="md"
                label={running ? "Activating…" : "Activate this skill"}
                icon={running ? SpinnerIcon : Play}
                iconWeight="fill"
                disabled={running}
                onClick={runSkill}
                className="shrink-0"
              />
            </div>

        {/* Grey-framed scroll area with white content card */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-pv-neutral-grey-50 p-4">
          <div className="flex flex-col min-h-full w-full bg-white border border-pv-neutral-grey-150/50 rounded-xl p-4">

              {/* Description — the skill's value prop as readable lead copy
                  (it's a sentence, not a title, so no giant headline). */}
              <motion.div {...fadeUp(0.04)} className="flex flex-col gap-2 mb-8">
                <span className={LABEL}>Description</span>
                <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">{skill.description}</p>
              </motion.div>

              {/* Docs layout: main content (left) + details sidebar (right) */}
              <div className="flex gap-10 items-start">
            {/* LEFT — content + output space */}
            <main className="flex-1 min-w-0 flex flex-col">
              {/* Output preview — a Petavue-built SAMPLE, not the user's live data */}
              {outputImg && (
                <motion.div {...fadeUp(0.06)} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="group relative block w-full h-[460px] overflow-hidden rounded-xl border border-[var(--border-primary)] bg-white cursor-zoom-in p-0"
                  >
                    <img src={outputImg} alt={`${skill.name} sample output`} className="w-full block align-top" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pv-neutral-grey-900/80 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                      <Info size={12} /> Sample output
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-[13px] font-medium text-[var(--text-primary)] shadow-lg">
                        <Search size={14} /> Click to preview
                      </span>
                    </div>
                  </button>
                  <p className="text-[12px] leading-snug text-[var(--text-muted)]">
                    A sample built by Petavue to show what you'll get, not your live data.
                  </p>
                </motion.div>
              )}

              {/* Questions it answers — merges the old "Once it's live" +
                  "Example prompts" sections: these questions double as the
                  plain-language prompts you ask Sage, so one section carries both. */}
              {skill.questions?.length > 0 && (
                <Section title="Questions it answers" lead="Once it's live, ask Sage any of these in plain language. Every one has a single answer you can trace back to source." delay={0.1}>
                  <div className="flex flex-col gap-2 mt-1">
                    {skill.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-pv-neutral-grey-50 border border-pv-neutral-grey-100 rounded-lg">
                        <CheckCircle2 size={15} className="text-pv-primary-primary-500 mt-0.5 shrink-0" />
                        <span className="text-[14px] leading-snug text-[var(--text-primary)]">{q}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Before we run — plain preview of the clarification questions,
                  worded exactly how the run itself asks them */}
              {skill.inputs?.length > 0 && (
                <Section
                  title="Before we run"
                  lead="Before it builds, Sage asks a few quick questions about your data, like which time period to use or how you define a qualified lead. We pre-fill what we can detect; you just confirm or change it."
                  delay={0.16}
                >
                  <div className="flex flex-col divide-y divide-pv-neutral-grey-100 border border-pv-neutral-grey-100 rounded-lg overflow-hidden mt-1">
                    {skill.inputs.map((inp, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 bg-white">
                        <span className="text-[12px] font-semibold text-pv-primary-primary-500 tabular-nums shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[14px] leading-snug text-[var(--text-primary)]">{inp}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <div className="h-10" />
            </main>

            {/* RIGHT — sticky details panel, grounded as a card under the Run CTA */}
            <motion.aside {...fadeUp(0.06)} className="w-[300px] shrink-0 self-start sticky top-0 flex flex-col gap-3 p-4 bg-pv-neutral-grey-50 border border-pv-neutral-grey-150/70 rounded-xl">
                {/* Readiness verdict — the first thing an operator needs: can I
                    run this right now? Sits directly under the Activate CTA. */}
                {totalIntegrations > 0 && (
                  isReady ? (
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-[var(--pv-success-bg)] border border-[var(--pv-success-text)]/25">
                      <CheckCircle2 size={16} className="text-[var(--pv-success-text)] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">You&apos;re ready to run</div>
                        <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5">
                          All {totalIntegrations} data {totalIntegrations === 1 ? "source" : "sources"} this skill needs {totalIntegrations === 1 ? "is" : "are"} connected.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-50 border border-amber-300">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                          Connect {missingIntegrations.length} {missingIntegrations.length === 1 ? "source" : "sources"} to run
                        </div>
                        <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5">
                          This skill needs {missingIntegrations.map((it) => it.name).join(", ")}. You can activate now, but it can&apos;t build until {missingIntegrations.length === 1 ? "it's" : "they're"} connected.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate("/petavue/settings")}
                          className="mt-2 text-[12px] font-medium text-pv-primary-primary-600 hover:text-pv-primary-primary-700 hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                          Connect sources →
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* What happens when you activate — prototype first, final after chat */}
                <div className="flex flex-col gap-2.5">
                  <span className={LABEL}>When you activate</span>
                  <ol className="flex flex-col gap-2">
                    {[
                      "Confirm a few quick inputs, pre-filled from your data",
                      `We build a draft ${isMemo ? "memo" : "dashboard"} on your data`,
                      "Verify it in chat, then publish the final version you can trust and share",
                    ].map((t, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-[var(--border-primary)] text-[11px] font-semibold text-pv-primary-primary-600 shrink-0">{i + 1}</span>
                        <span className="mt-0.5 text-[12px]">{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border-primary)]">
                  <span className={LABEL}>Output type</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 self-start px-2 py-0.5 text-[12px] font-medium rounded border",
                      isMemo ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-blue-50 text-blue-700 border-blue-300"
                    )}
                  >
                    <OutputIcon size={12} />
                    {isMemo ? "Memo" : "Dashboard"}
                  </span>
                </div>

                {skill.time && (
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border-primary)]">
                    <span className={LABEL}>Build time</span>
                    <span className="text-[12px] font-medium text-[var(--pv-success-text)]">{skill.time}</span>
                  </div>
                )}

                {skill.integrations?.length > 0 && (
                  <div className="flex flex-col gap-3.5 pt-4 border-t border-[var(--border-primary)]">
                    <span className={LABEL}>
                      Integrations
                    </span>
                    {integrationsByGroup.map(({ group, items }) => (
                      <div key={group} className="flex flex-col gap-2">
                        <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{group}</div>
                        <div className="flex flex-col gap-2">
                          {items.map((it) => {
                            const url = connectorIcon(it.name);
                            const connected = CONNECTED_INTEGRATIONS.has(it.name);
                            return (
                              <div key={it.name} className="flex items-center gap-2.5" title={it.desc}>
                                {url ? (
                                  <img src={url} alt="" className={cn("w-5 h-5 object-contain shrink-0", !connected && "opacity-40 grayscale")} loading="lazy" />
                                ) : (
                                  <Plug size={16} className={cn("shrink-0", connected ? "text-pv-primary-primary-500" : "text-[var(--text-muted)]")} />
                                )}
                                <span className={cn("flex-1 min-w-0 text-[12px] truncate", connected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{it.name}</span>
                                {connected ? (
                                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--pv-success-text)] shrink-0">
                                    <CheckCircle2 size={13} /> Connected
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => navigate("/petavue/settings")}
                                    className="text-[12px] font-medium text-pv-primary-primary-600 hover:text-pv-primary-primary-700 hover:underline shrink-0 bg-transparent border-none p-0 cursor-pointer"
                                  >
                                    Connect
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Honest note: pre-loaded skill, no self-serve edit */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border-primary)]">
                  <span className={cn("inline-flex items-center gap-1.5", LABEL)}><Info size={12} /> Pre-built skill</span>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    Creating and editing your own skills is coming soon. For now, activate a pre-built one and shape the result in chat. Need a custom skill today?{" "}
                    <a href="mailto:support@petavue.com" className="font-medium text-pv-primary-primary-600 hover:text-pv-primary-primary-700 hover:underline">Contact Petavue support</a>.
                  </p>
                </div>
            </motion.aside>
              </div>
            </div>
          </div>
        </div>

      {/* Full-screen output preview */}
      {previewOpen && outputImg && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-auto p-6 bg-black/80"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            onClick={() => setPreviewOpen(false)}
            aria-label="Close preview"
            className="fixed top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={outputImg}
            alt={`${skill.name} output`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[1100px] w-full h-auto rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}
    </div>
  );
}
