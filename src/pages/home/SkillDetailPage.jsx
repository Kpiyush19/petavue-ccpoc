import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Play, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../common-components";
import { getSkillByUid } from "./data/workstreams/skills";
import { useSessionContext } from "../../contexts/SessionContext";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

export default function SkillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useSessionContext();
  const [isLoading, setIsLoading] = useState(false);

  const skill = getSkillByUid(id);

  if (!skill) {
    return (
      <div className="h-full w-full overflow-y-auto bg-pv-neutral-grey-50">
        <div className="w-full max-w-3xl mx-auto px-8 py-8">
          <div className="mb-8">
            <Button btnColor="transparent" btnSize="sm" onClick={() => navigate("/home")}>
              <ChevronLeft size={16} />
              All skills
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center">
              <AlertCircle size={32} className="text-pv-neutral-grey-400" />
            </div>
            <h2 className="text-lg font-medium text-pv-neutral-grey-900">Skill not found</h2>
            <p className="text-sm text-pv-neutral-grey-500">
              The skill you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initialMessage = `Running ${skill.title || skill.id}. Do not skip any skill step during execution. Ask appropriate clarification and present plan for approval.`;
  const questions = skill.before_we_run?.questions || [];
  const widgets = skill.what_youll_get?.widgets || [];
  const alsoSurfaces = skill.also_surfaces || [];

  const handleConfigureAndRun = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const sid = await session.createSession("", "", skill.id);
      navigate(`/session/${sid}`, {
        state: {
          initialMessage,
          initialFiles: null
        }
      });
    } catch (e) {
      toast.error("Failed to create session: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div className="h-full w-full min-w-[900px] overflow-y-auto bg-pv-neutral-grey-50">
        <div className="w-[80%] max-w-[1400px] mx-auto px-8 py-8">
          <motion.div {...fadeUp(0)} className="w-fit">
            <Button btnColor="transparent" btnSize="sm" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
              Back
            </Button>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="mt-6">
            <span className="inline-flex px-3 py-1.5 text-[11px] font-bold text-pv-primary-primary-500 uppercase tracking-wider bg-white border border-pv-primary-primary-200 rounded">
              {skill.category}
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.08)} className="text-[28px] font-semibold text-pv-neutral-grey-900 mt-4">
            {skill.title}
          </motion.h1>

          <motion.p {...fadeUp(0.1)} className="text-[15px] text-pv-neutral-grey-600 leading-relaxed mt-3 max-w-2xl">
            {skill.tagline}
          </motion.p>

          <motion.div {...fadeUp(0.12)} className="flex flex-col flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-pv-neutral-grey-100 text-pv-neutral-grey-600 border border-pv-neutral-grey-200 rounded">
                {skill.renderType}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-pv-success-text bg-white border border-pv-success-border rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-pv-success-text" />
                Ready to build
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-pv-neutral-grey-500 font-mono">Builds in {skill.build_time}</span>
              <span className="text-pv-neutral-grey-300">·</span>
              <span className="text-[13px] text-pv-neutral-grey-500">{widgets.length} sections</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(skill.data_sources || []).map((source, idx) => (
                <span key={source} className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[11px] text-pv-neutral-grey-600 bg-white border border-pv-neutral-grey-200 rounded font-mono whitespace-nowrap">
                    {source}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="mt-6 pt-6 border-t border-pv-neutral-grey-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                <span className="text-[11px] font-semibold text-pv-neutral-grey-900 uppercase tracking-wider">
                  Also Surfaces
                </span>
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
              </div>
            </div>

            <ul className="space-y-2.5 mb-6">
              {alsoSurfaces.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-pv-neutral-grey-700">
                  <span className="text-pv-neutral-grey-400 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <Button btnColor="primary" btnSize="lg" onClick={handleConfigureAndRun} disabled={isLoading}>
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
                Run this skill
              </Button>
              <span className="text-[13px] text-pv-neutral-grey-400">Nothing runs without your sign-off.</span>
            </div>
          </motion.div>

          {questions.length > 0 && (
            <motion.div {...fadeUp(0.18)} className="mt-6 pt-6 border-t border-pv-neutral-grey-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                  <span className="text-[11px] font-semibold text-pv-neutral-grey-900 uppercase tracking-wider">
                    Before We Run
                  </span>
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                </div>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-[13px] font-semibold text-pv-primary-primary-500 w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-pv-neutral-grey-700">{q}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.2)} className="mt-6 pt-6 border-t border-pv-neutral-grey-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                <span className="text-[11px] font-semibold text-pv-neutral-grey-900 uppercase tracking-wider">
                  What You'll Get
                </span>
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
              </div>
            </div>

            <p className="text-[14px] text-pv-neutral-grey-500 mb-5">
              Sage assembles the sections below from your connected sources. Every value is traceable; you can edit
              definitions later from the Data hub.
            </p>

            <div className="space-y-0">
              {widgets.map((widget, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 bg-white border border-pv-neutral-grey-200 -mt-px first:mt-0"
                >
                  <span className="text-[14px] font-semibold text-pv-primary-primary-500 w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="text-[14px] font-medium text-pv-neutral-grey-900">{widget.name}</div>
                    <div className="text-[13px] text-pv-neutral-grey-500 mt-0.5">{widget.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...fadeUp(0.22)}
            className="mt-10 mb-8 p-5 bg-white border border-l-4 border-pv-neutral-grey-200 border-l-pv-primary-primary-500 flex items-center justify-between gap-4"
          >
            <p className="text-[14px] text-pv-neutral-grey-600">
              {skill.cta?.subtext ||
                `${questions.length} quick inputs, then Sage builds your ${skill.title.toLowerCase()} in ${skill.build_time}.`}
            </p>
            <Button btnColor="primary" btnSize="lg" onClick={handleConfigureAndRun} disabled={isLoading}>
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
              Run this skill
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
