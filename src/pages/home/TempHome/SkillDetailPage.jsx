import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, LayoutDashboard, FileText, Plug, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../common-components";
import { useSessionContext } from "../../../contexts/SessionContext";
import { cn } from "../../../utils/cn";
import { SparkleIcon } from "../../../petavue/pages/workbook_home/icons/SparkleIcon";
import { SKILLS_CATALOG } from "../../../skills/skillsCatalog";

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

  const skill = SKILLS_CATALOG.find((s) => s.slug === id);

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4 bg-pv-neutral-grey-50">
        <p className="text-[15px] text-[var(--text-secondary)]">Skill not found.</p>
        <Button btnColor="primary" btnSize="sm" onClick={() => navigate("/home")}>Back to Home</Button>
      </div>
    );
  }

  const isMemo = skill.output_type === "memo" || skill.type === "memo";
  const OutputIcon = isMemo ? FileText : LayoutDashboard;

  const runSkill = async () => {
    if (running) return;
    setRunning(true);
    try {
      const prompt = skill.prompts?.[0] || `Run the ${skill.name} skill.`;
      const sid = await session.createSession("");
      navigate(`/session/${sid}`, { state: { initialMessage: prompt } });
    } catch (e) {
      toast.error("Failed to start: " + e.message);
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-col h-full w-full min-w-[760px] overflow-y-auto bg-pv-neutral-grey-50">
        <div className="flex flex-col w-full max-w-[860px] mx-auto px-8 py-8">
          {/* Back */}
          <motion.button
            {...fadeUp(0)}
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors self-start mb-5 p-0"
          >
            <ArrowLeft size={14} /> All skills
          </motion.button>

          {/* Hero */}
          <motion.div {...fadeUp(0.04)} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded flex items-center gap-1",
                  isMemo ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-blue-50 text-blue-700 border-blue-300"
                )}
              >
                <OutputIcon size={10} />
                {isMemo ? "memo" : "dashboard"}
              </span>
              {skill.time && (
                <span className="px-2 py-0.5 text-[11px] text-[var(--text-muted)] bg-pv-neutral-grey-100 rounded">
                  {skill.time}
                </span>
              )}
            </div>
            <h1 className="text-[26px] font-semibold text-[var(--text-primary)]">{skill.name}</h1>
            <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">{skill.description}</p>

            {skill.connectors?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {skill.connectors.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-1 text-[11px] rounded border bg-white text-[var(--text-secondary)] border-[var(--border-primary)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3">
              <Button btnColor="primary" btnSize="md" onClick={runSkill} disabled={running}>
                {running ? (
                  <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Starting…</span>
                ) : (
                  <span className="flex items-center gap-2"><SparkleIcon size={16} /> Ask Sage to run this</span>
                )}
              </Button>
            </div>
          </motion.div>

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

          {/* Integrations */}
          {skill.integrations?.length > 0 && (
            <Section title="Integrations" lead={`Reads from ${skill.integrations.length} connected source${skill.integrations.length > 1 ? "s" : ""}.`} delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                {skill.integrations.map((it) => (
                  <div key={it.name} className="flex gap-3 p-4 bg-white border border-[var(--border-primary)] rounded-lg">
                    <Plug size={16} className="text-pv-primary-primary-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{it.name}</p>
                      <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">{it.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}
