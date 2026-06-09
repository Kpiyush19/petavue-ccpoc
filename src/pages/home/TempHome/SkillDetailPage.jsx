import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChevronLeft, Play, Loader2, LayoutDashboard, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Skeleton, Tooltip } from "../../../common-components";
import { useScrollCleanup } from "../../../common-components/Tooltip/useScrollCleanup";
import { apiGet, apiPost } from "../../../api";
import { cn } from "../../../utils/cn";
import { formatSkillName } from "./utils/formatSkillName";
import { getDemoSkillDetail } from "./utils/demoSkills";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

function formatConnectedStack(items) {
  if (!items?.length) return null;
  return items.map((item, i) => {
    if (typeof item === "string") return item;
    if (item.options) {
      return item.options.join(item.join === "or" ? " or " : ", ");
    }
    return item.role || "";
  });
}

export default function SkillDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const scrollContainerRef = useRef(null);
  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: scrollContainerRef });

  const {
    data: skill,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["skill-detail", id],
    queryFn: () => getDemoSkillDetail(id) || apiGet(`/api/skills/${id}`),
    staleTime: Infinity,
    enabled: !!id
  });

  useEffect(() => {
    if (!showPreview) return;

    const handlePreviewKeyPress = (e) => {
      if (e?.code === "Escape") {
        setShowPreview(false);
      }
    };

    document.addEventListener("keydown", handlePreviewKeyPress);

    return () => {
      document.removeEventListener("keydown", handlePreviewKeyPress);
    };
  }, [showPreview]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
        <div className="relative h-full w-full min-w-[900px] flex flex-col bg-pv-neutral-grey-50">
          <div className="flex-1 overflow-y-auto">
            <div className="flex w-full gap-6 px-12 py-8">
              <div className="flex flex-col w-[calc(50%-12px)] shrink-0">
                <Skeleton width={48} height={16} />
                <Skeleton width={320} height={32} className="mt-5" />

                <div className="mt-3 space-y-2">
                  <Skeleton width="100%" height={16} />
                  <Skeleton width="75%" height={16} />
                </div>

                <div className="flex items-center gap-3 mt-5">
                  <Skeleton width={96} height={24} />
                  <Skeleton width={128} height={24} />
                </div>

                <Skeleton width={192} height={16} className="mt-3" />

                <div className="mt-5">
                  <Skeleton width={112} height={12} className="mb-3" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton width={96} height={16} />
                      <Skeleton width={128} height={24} />
                      <Skeleton width={80} height={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton width={96} height={16} />
                      <Skeleton width={96} height={24} />
                      <Skeleton width={112} height={24} />
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-white border border-pv-neutral-grey-200 rounded-lg">
                  <Skeleton width={128} height={20} className="mb-3" />
                  <Skeleton width="100%" height={16} className="mb-2" />
                  <Skeleton width="66%" height={16} className="mb-5" />
                  <div className="border-t border-pv-neutral-grey-200 my-5" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton width={24} height={16} />
                        <div className="flex-1">
                          <Skeleton width={192} height={16} className="mb-1" />
                          <Skeleton width="100%" height={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-6 bg-white border border-pv-neutral-grey-200 rounded-lg">
                  <Skeleton width={224} height={20} className="mb-3" />
                  <Skeleton width="66%" height={16} className="mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} width="100%" height={48} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[calc(50%-12px)] shrink-0 mt-[46px]">
                <div className="bg-white border border-pv-neutral-grey-200 rounded-xl overflow-hidden">
                  <div className="flex items-start justify-between gap-4 p-5 border-b border-pv-neutral-grey-100">
                    <div className="flex flex-col">
                      <Skeleton width={100} height={18} />
                      <Skeleton width={180} height={14} className="mt-1" />
                    </div>
                    <Skeleton width={100} height={24} className="rounded-full" />
                  </div>
                  <div className="p-4">
                    <Skeleton width="100%" height={300} className="rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 w-full bg-pv-neutral-grey-50 border-t border-pv-neutral-grey-200">
            <div className="w-full">
              <div className="p-5 bg-white flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Skeleton width={288} height={16} className="mb-2" />
                  <Skeleton width={384} height={12} />
                </div>
                <Skeleton width={128} height={40} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !skill) {
    return (
      <div className="h-full w-full overflow-y-auto bg-pv-neutral-grey-50">
        <div className="w-full max-w-3xl mx-auto px-8 py-8">
          <div className="mb-8">
            <Button btnColor="transparent" btnSize="sm" onClick={() => navigate("/home")}>
              <ChevronLeft size={16} />
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <h2 className="text-lg font-medium text-pv-neutral-grey-900">Skill not found</h2>
            <p className="text-sm text-pv-neutral-grey-500">
              The skill you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rd = skill.run_details || {};
  const OutputIcon = skill.output_type === "memo" ? FileText : LayoutDashboard;
  const connectedStack = rd.connectedStack || {};
  const whatYoullGet = rd.whatYoullGet || {};
  const onceItsLive = rd.onceItsLive || {};
  const beforeWeRun = rd.beforeWeRun || {};
  const cta = rd.cta || {};

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const res = await apiPost("/api/sessions", { skill_id: skill.name });
      const sessionId = res?.session?.session_id;
      if (!sessionId) {
        toast.error("Session created but no id returned");
        return;
      }
      navigate(`/skills-v2/run/${sessionId}`, { state: { backUrl: `/home/skill/${id}` } });
    } catch (e) {
      toast.error("Failed to create session: " + (e.message || "Unknown error"));
    } finally {
      setIsRunning(false);
    }
  };

  const RunButton = ({ size = "md" }) => (
    <Button btnColor="primary" btnSize={size === "lg" ? "lg" : "md"} onClick={handleRun} disabled={isRunning}>
      {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
      {cta.button || "Run this skill"}
    </Button>
  );

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div className="relative h-full w-full min-w-[900px] flex flex-col bg-pv-neutral-grey-50">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="flex w-full gap-6 px-12 py-8">
            <div className={cn("flex flex-col shrink-0", skill._isDemoSkill ? "w-full" : "w-[calc(50%-12px)]")}>
              <motion.div {...fadeUp(0)} className="flex items-center gap-3">
                <Button btnColor="transparent" btnSize="sm" onClick={() => navigate("/home")}>
                  <ChevronLeft size={14} />
                  Back
                </Button>
              </motion.div>

              <motion.h1 {...fadeUp(0.02)} className="text-[28px] font-semibold text-pv-neutral-grey-900 mt-5">
                {formatSkillName(skill.name)}
              </motion.h1>

              <motion.div {...fadeUp(0.04)} className="mt-3 space-y-3">
                <p className="text-[15px] text-pv-neutral-grey-600 leading-relaxed">
                  {rd.subhead?.[0] || skill.description}
                </p>
                {rd.subhead?.[1] && (
                  <p className="text-[14px] text-pv-neutral-grey-500 leading-relaxed">{rd.subhead[1]}</p>
                )}
              </motion.div>

              <motion.div {...fadeUp(0.06)} className="flex items-center gap-3 mt-5">
                <span
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium border rounded flex items-center gap-1.5",
                    skill.output_type === "memo"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  <OutputIcon size={12} />
                  {skill.output_type === "memo" ? "Memo" : "Dashboard"}
                </span>
                {rd.status?.state && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-pv-success-text bg-pv-success-bg border border-pv-success-border rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-pv-success-text" />
                    {rd.status.state}
                  </span>
                )}
              </motion.div>

              {rd.build && (
                <motion.p {...fadeUp(0.07)} className="text-[13px] text-pv-neutral-grey-500 mt-3">
                  Builds in {rd.build.estimate}
                  {rd.build.composition && <span> · {rd.build.composition}</span>}
                </motion.p>
              )}

              {(connectedStack.required?.length > 0 ||
                connectedStack.recommended?.length > 0 ||
                connectedStack.optional?.length > 0) && (
                <motion.div {...fadeUp(0.08)} className="mt-5">
                  <p className="text-[12px] font-medium text-pv-neutral-grey-500 uppercase tracking-wider mb-2">
                    Connected stack
                  </p>
                  <div className="space-y-2">
                    {connectedStack.required?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] text-pv-neutral-grey-400 w-28 shrink-0 pt-1">Required</span>
                        <div className="flex flex-wrap gap-2">
                          {connectedStack.required.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-[11px] font-mono bg-white text-pv-neutral-grey-600 border border-pv-neutral-grey-200 rounded"
                            >
                              {typeof item === "string" ? item : item.options?.join(item.join === "or" ? " or " : ", ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {connectedStack.recommended?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] text-pv-neutral-grey-400 w-28 shrink-0 pt-1">Recommended</span>
                        <div className="flex flex-wrap gap-2">
                          {connectedStack.recommended.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-[11px] font-mono bg-white text-pv-neutral-grey-600 border border-pv-neutral-grey-200 rounded"
                            >
                              {typeof item === "string" ? item : item.options?.join(item.join === "or" ? " or " : ", ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {connectedStack.optional?.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] text-pv-neutral-grey-400 w-28 shrink-0 pt-1">Optional</span>
                        <div className="flex flex-wrap gap-2">
                          {connectedStack.optional.map((item, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-[11px] font-mono bg-white text-pv-neutral-grey-600 border border-pv-neutral-grey-200 rounded"
                            >
                              {typeof item === "string" ? item : item.options?.join(item.join === "or" ? " or " : ", ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {(whatYoullGet.widgets?.length > 0 || whatYoullGet.intro) && (
                <motion.div
                  {...fadeUp(0.1)}
                  className="mt-10 p-6 bg-white border border-pv-neutral-grey-200 rounded-lg"
                >
                  <h2 className="text-[16px] font-semibold text-pv-neutral-grey-900 mb-2">What you'll get</h2>
                  {whatYoullGet.intro && (
                    <p className="text-[13px] text-pv-neutral-grey-500 leading-relaxed">{whatYoullGet.intro}</p>
                  )}
                  {whatYoullGet.widgets?.length > 0 && (
                    <>
                      <div className="border-t border-pv-neutral-grey-200 my-5" />
                      <div className="space-y-5">
                        {whatYoullGet.widgets.map((widget, i) => (
                          <div key={i} className="flex gap-4">
                            <span className="text-[13px] font-semibold text-pv-primary-primary-500 w-6 shrink-0">
                              {widget.n || String(i + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <div className="text-[14px] font-medium text-pv-neutral-grey-900">{widget.title}</div>
                              <div className="text-[13px] text-pv-neutral-grey-500 mt-0.5">{widget.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {whatYoullGet.conditionalViews && (
                    <div className="mt-6 p-4 bg-pv-neutral-grey-50 rounded-lg border border-pv-neutral-grey-100">
                      <p className="text-[12px] text-pv-neutral-grey-500 mb-1">
                        {whatYoullGet.conditionalViews.label || "Conditional views"}
                      </p>
                      <p className="text-[13px] text-pv-neutral-grey-600">{whatYoullGet.conditionalViews.text}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {(onceItsLive.questions?.length > 0 || onceItsLive.intro) && (
                <motion.div
                  {...fadeUp(0.12)}
                  className="mt-6 p-6 bg-white border border-pv-neutral-grey-200 rounded-lg"
                >
                  <h2 className="text-[16px] font-semibold text-pv-neutral-grey-900 mb-2">
                    Once it's live, you can answer
                  </h2>
                  {onceItsLive.intro && (
                    <p className="text-[13px] text-pv-neutral-grey-500 leading-relaxed mb-4">{onceItsLive.intro}</p>
                  )}
                  {onceItsLive.questions?.length > 0 && (
                    <div className="space-y-2">
                      {onceItsLive.questions.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 bg-pv-neutral-grey-50 rounded-lg text-[13px] text-pv-neutral-grey-700 border border-pv-neutral-grey-100"
                        >
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {(beforeWeRun.questions?.length > 0 || beforeWeRun.intro) && (
                <motion.div
                  {...fadeUp(0.14)}
                  className="mt-8 p-6 bg-white border border-pv-neutral-grey-200 rounded-lg"
                >
                  <h2 className="text-[16px] font-semibold text-pv-neutral-grey-900 mb-2">Before we run</h2>
                  {beforeWeRun.intro && (
                    <p className="text-[13px] text-pv-neutral-grey-500 leading-relaxed">{beforeWeRun.intro}</p>
                  )}
                  {beforeWeRun.questions?.length > 0 && (
                    <>
                      <div className="border-t border-pv-neutral-grey-200 my-5" />
                      <div className="space-y-5">
                        {beforeWeRun.questions.map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <span className="text-[13px] font-semibold text-pv-primary-primary-500 w-6 shrink-0">
                              {item.n || String(i + 1).padStart(2, "0")}
                            </span>
                            <div>
                              <div className="text-[14px] font-medium text-pv-neutral-grey-900">{item.question}</div>
                              <div className="text-[13px] text-pv-neutral-grey-500 mt-0.5">{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {beforeWeRun.optionalFollowups && (
                    <div className="mt-6 p-4 bg-pv-neutral-grey-50 rounded-lg">
                      <p className="text-[12px] text-pv-neutral-grey-500 mb-1">
                        Optional follow-ups, shown only when your data warrants them
                      </p>
                      <p className="text-[13px] text-pv-neutral-grey-600">{beforeWeRun.optionalFollowups}</p>
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div
                {...fadeUp(0.16)}
                className="mt-6 p-5 bg-white border border-pv-neutral-grey-200 border-l-4 border-l-pv-primary-primary-500 rounded-lg"
              >
                <p className="text-[13px] text-pv-neutral-grey-600 leading-relaxed">
                  Your configuration is versioned and replayed deterministically on refresh, so numbers do not drift
                  unless the inputs or source data change. The trust mechanism here is <strong>traceability</strong>,
                  not a claim of guaranteed accuracy.
                </p>
              </motion.div>
            </div>
            {!skill._isDemoSkill && (
              <div className="flex flex-col w-[calc(50%-12px)] shrink-0 mt-[46px]">
                <div className="bg-white border border-pv-neutral-grey-200 rounded-xl overflow-hidden">
                  <div className="flex items-start justify-between gap-4 p-5 border-b border-pv-neutral-grey-100">
                    <div className="flex flex-col w-full overflow-hidden">
                      <h3 className="text-[15px] font-semibold text-pv-neutral-grey-900">Sample output</h3>
                      <Tooltip
                        title={`${formatSkillName(skill.name)} ${skill.output_type === "memo" ? "memo" : "dashboard"} · Time-decay model`}
                        tooltipActive={tooltipShow}
                        displayTooltipOnOverflow
                        placement="bottom-start"
                      >
                        <p
                          className="text-[13px] text-pv-neutral-grey-500 mt-1 max-w-[90%] truncate"
                          onMouseEnter={() => {
                            setTooltipShow(true);
                          }}
                        >
                          {formatSkillName(skill.name)} {skill.output_type === "memo" ? "Memo" : "Dashboard"} · Time-decay
                          model
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="p-4">
                    <div
                      className="rounded-lg overflow-hidden border border-pv-neutral-grey-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setShowPreview(true)}
                    >
                      <img
                        src={rd.preview?.url || "/placeholder-dashboard.png"}
                        alt={`${formatSkillName(skill.name)} preview`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 left-0 w-full bg-pv-neutral-grey-50 border-t border-pv-neutral-grey-200">
          <div className="w-full">
            <div className="p-5 bg-white flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] text-pv-neutral-grey-700 leading-relaxed">
                  {cta.primary ||
                    "Review the setup, confirm the methodology, and build a dashboard with audit-ready lineage."}
                </p>
                <p className="text-[12px] text-pv-neutral-grey-500 mt-1">
                  {cta.secondary ||
                    "Every credited dollar traces in two clicks to the source-system records, clarifications, and query log behind it."}
                </p>
              </div>
              <RunButton size="lg" />
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <button
            className="fixed top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => setShowPreview(false)}
          >
            <X size={24} className="text-white" />
          </button>
          <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
            <div className="min-h-full flex items-center justify-center py-8">
              <img
                src={rd.preview?.url || "/placeholder-dashboard.png"}
                alt={`${formatSkillName(skill.name)} preview`}
                className="w-[85vw] max-w-[1200px] h-auto rounded-lg shadow-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
