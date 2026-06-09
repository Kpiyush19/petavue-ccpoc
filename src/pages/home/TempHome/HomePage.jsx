import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowUp, Paperclip, X, Upload, LayoutDashboard, FileText } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, apiGet } from "../../../api";
import { cn } from "../../../utils/cn";
import { useSessionContext } from "../../../contexts/SessionContext";
import { MAX_FILES, MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_SET } from "../../../utils/upload";
import { Button, Input, Tooltip, Skeleton } from "../../../common-components";
import { useScrollCleanup } from "../../../common-components/Tooltip/useScrollCleanup";
import { formatSkillName } from "./utils/formatSkillName";
import { getDemoSkills } from "./utils/demoSkills";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName() {
  const user = getCurrentUser();
  if (!user?.name) return "";
  return user.name.split(" ")[0];
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

export default function HomePage() {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  const { tooltipShow, setTooltipShow } = useScrollCleanup({
    containerRef: scrollContainerRef,
    enabled: true
  });

  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ["home-skills"],
    queryFn: () => apiGet("/api/skills?category=skill"),
    staleTime: Infinity
  });

  const apiSkills = (skillsData?.skills || []).filter((s) => s.scope !== "global" && s.is_active);
  const demoSkills = getDemoSkills();
  const skills = [...apiSkills, ...demoSkills];

  const validateAndAddFiles = useCallback(
    (newFiles) => {
      const currentCount = files.length;
      const toAdd = [];
      const errors = [];

      for (const file of newFiles) {
        if (currentCount + toAdd.length >= MAX_FILES) {
          errors.push(`Max ${MAX_FILES} files allowed`);
          break;
        }
        const ext = getExtension(file.name);
        if (!ALLOWED_SET.has(ext)) {
          errors.push(`${file.name}: unsupported type (${ext})`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: too large (max ${MAX_FILE_SIZE_MB}MB)`);
          continue;
        }
        if (files.some((f) => f.name === file.name) || toAdd.some((f) => f.name === file.name)) {
          continue;
        }
        toAdd.push(file);
      }

      if (toAdd.length > 0) setFiles((prev) => [...prev, ...toAdd]);
      if (errors.length > 0) toast.error(errors[0]);
    },
    [files]
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (createLoading) return;
    if (!trimmed && files.length === 0) return;

    setCreateLoading(true);
    try {
      const sid = await session.createSession("");
      navigate(`/session/${sid}`, {
        state: {
          initialMessage: trimmed || null,
          initialFiles: files.length > 0 ? files : null
        }
      });
    } catch (e) {
      toast.error("Failed to create session: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files) validateAndAddFiles(Array.from(e.dataTransfer.files));
  };

  const canSend = !createLoading && (message.trim().length > 0 || files.length > 0);

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div
        ref={scrollContainerRef}
        className="flex flex-col h-full w-full min-w-[900px] overflow-y-auto bg-pv-neutral-grey-50 pb-4"
      >
        <div className="flex flex-col w-full max-w-[1400px] mx-auto px-8 py-8">
          <motion.div {...fadeUp(0)} className="flex flex-col gap-1 mb-6">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">
              {getGreeting()}, {getFirstName()}.
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)]">Ask the agent, or run a skill.</p>
            {skillsLoading ? (
              <Skeleton width={100} height={16} className="mt-1" />
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] mt-1">
                <span className="text-pv-primary-primary-600 font-medium">{skills.length}</span> skills available
              </p>
            )}
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="flex flex-col gap-3 pt-6 border-t border-neutral-200">
            <div
              className={cn(
                "relative flex flex-col bg-white border rounded-lg shadow-sm transition-colors hover:border-pv-primary-primary-300 focus-within:!border-pv-primary-primary-500",
                dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border-primary)]"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                <div className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                <span className="text-[13px] text-[var(--text-secondary)]">Ask the Petavue agent</span>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-0">
                  {files.map((file, i) => (
                    <span
                      key={`${file.name}-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono
                    bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-primary)]"
                    >
                      <span className="truncate max-w-[140px]">{file.name}</span>
                      <span className="text-[var(--text-muted)]">{formatSize(file.size)}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="ml-0.5 p-0.5 rounded hover:bg-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]
                      bg-transparent border-none cursor-pointer transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {dragOver && (
                <div className="absolute inset-0 bg-[var(--accent)]/5 border-2 border-dashed border-[var(--accent)]/40 flex items-center justify-center z-10 pointer-events-none">
                  <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
                    <Upload size={16} />
                    Drop files to attach
                  </div>
                </div>
              )}

              <div className="flex items-center min-h-[52px] gap-2 px-2">
                <Button
                  btnColor="ghost"
                  btnSize="sm"
                  mainBtnClassName="!rounded-xl !w-10 !h-10 !p-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                >
                  <Paperclip size={18} />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Input
                  inputRef={messageInputRef}
                  type="textarea"
                  minRows={1}
                  maxRows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the agent to analyze your data..."
                  autoFocus
                  className={{
                    wrapper: "flex-1",
                    input: {
                      wrapper: "border-none py-2 px-0 bg-transparent focus-within:border-none",
                      root: "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    }
                  }}
                />

                <Button
                  btnColor="primary"
                  btnSize="sm"
                  mainBtnClassName="!rounded-xl !w-10 !h-10 !p-0 mr-2"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Your Skills
                </span>
                <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
              </div>
            </div>

            {skillsLoading && (
              <div className="grid grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => {
                  const isNotFirstColumn = index % 3 !== 0;
                  const isNotFirstRow = index >= 3;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col gap-3 p-5 bg-white border border-[var(--border-primary)]",
                        isNotFirstColumn && "-ml-px",
                        isNotFirstRow && "-mt-px"
                      )}
                    >
                      <Skeleton width={80} height={20} />
                      <Skeleton width="70%" height={20} />
                      <div className="space-y-1">
                        <Skeleton width="100%" height={14} />
                        <Skeleton width="80%" height={14} />
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        <Skeleton width={48} height={24} />
                        <Skeleton width={56} height={24} />
                        <Skeleton width={40} height={24} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!skillsLoading && skills.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-[14px] text-[var(--text-muted)]">No skills available yet</p>
              </div>
            )}

            {!skillsLoading && skills.length > 0 && (
              <div className="grid grid-cols-3">
                {skills.map((skill, index) => {
                  const isNotFirstColumn = index % 3 !== 0;
                  const isNotFirstRow = index >= 3;
                  const OutputIcon = skill.output_type === "memo" ? FileText : LayoutDashboard;

                  return (
                    <div
                      key={skill.id}
                      onClick={() => navigate(`/home/skill/${skill.id}`)}
                      className={cn(
                        "flex flex-col gap-3 p-5 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-pv-primary-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                        isNotFirstColumn && "-ml-px",
                        isNotFirstRow && "-mt-px"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded flex items-center gap-1",
                            skill.output_type === "memo"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-blue-50 text-blue-700 border-blue-300"
                          )}
                        >
                          <OutputIcon size={10} />
                          {skill.output_type || "dashboard"}
                        </span>
                      </div>
                      <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">
                        {formatSkillName(skill.name)}
                      </h3>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                        {skill.description}
                      </p>
                      {skill.tags?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {skill.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-[11px] rounded border bg-white text-[var(--text-secondary)] border-[var(--border-primary)]"
                            >
                              {tag}
                            </span>
                          ))}
                          {skill.tags.length > 4 && (
                            <Tooltip title={skill.tags.slice(4).join(", ")} placement="top" tooltipActive={tooltipShow}>
                              <span
                                className="px-2 py-1 text-[11px] text-[var(--text-muted)] cursor-default"
                                onMouseEnter={() => setTooltipShow(true)}
                              >
                                +{skill.tags.length - 4}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
