import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, LayoutDashboard, FileText, Plug, CheckCircle2, Loader2, Search, X } from "lucide-react";
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

function Section({ title, lead, children, delay }) {
  return (
    <motion.section {...fadeUp(delay)} className="flex flex-col gap-3 pt-6 mt-6 border-t border-neutral-200">
      <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</h2>
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

  // Close the full-screen preview on Escape.
  useEffect(() => {
    if (!previewOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setPreviewOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const skill = SKILLS_CATALOG.find((s) => s.slug === id);

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 bg-pv-neutral-grey-50">
        <p className="text-[15px] text-[var(--text-secondary)]">Skill not found.</p>
        <PvButton variant="primary" size="md" label="Back to Home" onClick={() => navigate("/home")} />
      </div>
    );
  }

  const isMemo = skill.output_type === "memo" || skill.type === "memo";
  const OutputIcon = isMemo ? FileText : LayoutDashboard;
  const outputImg = SKILL_OUTPUT_BY_SLUG[skill.slug] || null;

  const runSkill = async () => {
    if (running) return;
    setRunning(true);
    try {
      // Start a skill_run session and open the Skills v2 run page.
      const res = await apiPost("/api/sessions", { skill_id: skill.slug });
      const sid = res?.session?.session_id;
      if (!sid) throw new Error("No session id returned");
      navigate(`/skills-v2/run/${sid}`);
    } catch (e) {
      toast.error("Failed to start: " + e.message);
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-col h-full w-full min-w-[900px] overflow-y-auto bg-pv-neutral-grey-50">
        <div className="flex flex-col w-full max-w-[1180px] mx-auto px-8 py-8">
          {/* Back */}
          <motion.button
            {...fadeUp(0)}
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors self-start mb-5 p-0"
          >
            <ArrowLeft size={14} /> All skills
          </motion.button>

          {/* Hero — full width */}
          <motion.div {...fadeUp(0.04)} className="flex flex-col gap-2.5 mb-8">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">{skill.name}</h1>
            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-[760px]">{skill.description}</p>
          </motion.div>

          {/* Docs layout: main content (left) + details sidebar (right) */}
          <div className="flex gap-10 items-start">
            {/* LEFT — content + output space */}
            <main className="flex-1 min-w-0 flex flex-col">
              {/* Output preview — shown only when a screenshot exists for this skill */}
              {outputImg && (
                <motion.button
                  {...fadeUp(0.06)}
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="group relative block w-full h-[460px] overflow-hidden rounded-xl border border-[var(--border-primary)] bg-white cursor-zoom-in p-0"
                >
                  <img src={outputImg} alt={`${skill.name} output`} className="w-full block align-top" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 text-[13px] font-medium text-[var(--text-primary)] shadow-lg">
                      <Search size={14} /> Click to preview
                    </span>
                  </div>
                </motion.button>
              )}

              {/* Overview */}
              {skill.overview && <Section title="Overview" lead={skill.overview} delay={0.08} />}

              {/* What you'll get */}
              {skill.whatYoullGet && <Section title="What you'll get" lead={skill.whatYoullGet} delay={0.1} />}

              {/* Questions answered */}
              {skill.questions?.length > 0 && (
                <Section title="Questions answered" delay={0.12}>
                  <ul className="flex flex-col gap-2">
                    {skill.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] text-[var(--text-primary)]">
                        <CheckCircle2 size={16} className="text-pv-primary-primary-500 mt-0.5 shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* How it works */}
              {skill.steps?.length > 0 && (
                <Section title="How it works" lead={skill.howItWorksLead} delay={0.14}>
                  <div className="flex flex-col gap-3 mt-1">
                    {skill.steps.map((step) => (
                      <div key={step.num} className="flex gap-3 p-4 bg-white border border-[var(--border-primary)] rounded-lg">
                        <span className="text-[13px] font-semibold text-pv-primary-primary-500 shrink-0">{step.num}</span>
                        <div className="flex flex-col gap-1">
                          <p className="text-[14px] font-medium text-[var(--text-primary)]">{step.title}</p>
                          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Inputs required */}
              {skill.inputs?.length > 0 && (
                <Section title="Inputs required" delay={0.16}>
                  <ul className="flex flex-col gap-2">
                    {skill.inputs.map((inp, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-[var(--text-primary)]">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pv-neutral-grey-100 text-[11px] font-medium text-[var(--text-secondary)] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Example prompts */}
              {skill.prompts?.length > 0 && (
                <Section title="Example prompts" lead="Ask Sage any of these in natural language." delay={0.18}>
                  <div className="flex flex-col gap-2">
                    {skill.prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={runSkill}
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[var(--border-primary)] rounded-lg text-left hover:border-pv-primary-primary-300 cursor-pointer transition-colors group"
                      >
                        <span className="text-[13px] text-[var(--text-primary)]">{p}</span>
                        <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-pv-primary-primary-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              <div className="h-10" />
            </main>

            {/* RIGHT — sticky details panel */}
            <motion.aside {...fadeUp(0.06)} className="w-[300px] shrink-0 self-start sticky top-0 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Output type</span>
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
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Build time</span>
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">{skill.time}</span>
                  </div>
                )}

                {skill.integrations?.length > 0 && (
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-[var(--border-primary)]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Integrations ({skill.integrations.length})
                    </span>
                    <div className="flex flex-col gap-2.5">
                      {skill.integrations.map((it) => {
                        const url = connectorIcon(it.name);
                        return (
                          <div key={it.name} className="flex items-center gap-2.5" title={it.desc}>
                            {url ? (
                              <img src={url} alt="" className="w-5 h-5 object-contain shrink-0" loading="lazy" />
                            ) : (
                              <Plug size={16} className="text-pv-primary-primary-500 shrink-0" />
                            )}
                            <span className="text-[13px] text-[var(--text-primary)] truncate">{it.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </motion.aside>
          </div>
        </div>

        {/* Footer — full-width sticky bar */}
        <div className="sticky bottom-0 z-10 w-full bg-white border-t border-pv-neutral-grey-200 px-8 py-4 shadow-[0_-8px_24px_-10px_rgba(16,24,40,0.18)]">
          <div className="w-full max-w-[1180px] mx-auto flex items-center justify-between gap-4">
            <p className="text-[14px] text-pv-neutral-grey-600">
              {skill.inputs?.length || "A few"} quick inputs, then Sage builds your {skill.name.toLowerCase()} in {skill.time || "minutes"}.
            </p>
            <PvButton
              variant="primary"
              size="lg"
              label={running ? "Starting…" : "Run this skill"}
              icon={running ? SpinnerIcon : Play}
              iconWeight="fill"
              disabled={running}
              onClick={runSkill}
            />
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
