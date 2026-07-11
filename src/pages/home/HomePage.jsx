import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp, Paperclip, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "../../api";
import { cn } from "../../utils/cn";
import { useSessionContext } from "../../contexts/SessionContext";
import { MAX_FILES, MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_SET } from "../../utils/upload";
import { Tooltip, Button, Input } from "@/ui";
import { useScrollCleanup } from "@/hooks/useScrollCleanup";
import workstreamsData from "./data/workstreams/workstreams.json";
import { getSkillById } from "./data/workstreams/skills";

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

const RECENT_SESSIONS = [
  {
    id: "3",
    type: "DASHBOARD",
    title: "Q3 pipeline snapshot",
    timestamp: "Yesterday",
    tags: ["PIPELINE ANALYSIS", "SNAPSHOT"]
  },
  {
    id: "2",
    type: "DASHBOARD",
    title: "Multi-touch revenue attribution",
    timestamp: "2h ago",
    tags: ["ATTRIBUTION", "MULTI-TOUCH"]
  },
  {
    id: "1",
    type: "MEMO",
    title: "Lift analysis: Q1 paid social push",
    timestamp: "4d ago",
    tags: ["ATTRIBUTION", "LIFT ANALYSIS"]
  }
];

const MOST_USED = [
  {
    skillId: "multi-touch-revenue-attribution",
    opens: 92,
    tags: ["ATTRIBUTION", "MULTI-TOUCH"]
  },
  {
    skillId: "abm-target-account-monitoring",
    opens: 64,
    tags: ["ABM", "TARGET MONITORING"]
  },
  {
    skillId: "closed-won-journey-retrospective",
    opens: 28,
    tags: ["FUNNEL", "RETROSPECTIVE"]
  }
];

const GLOBAL_SUGGESTIONS = [
  "Diagnose a metric drop",
  "Plan a budget shift",
  "Reconcile two attribution models",
  "Compare two periods",
  "Build a board-ready dashboard"
];

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

  const { tooltipShow, setTooltipShow } = useScrollCleanup({ containerRef: scrollContainerRef });

  const totalSkills = workstreamsData.reduce((sum, ws) => sum + ws.skillCount, 0);

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
        className="flex flex-col h-full w-full min-w-[900px] overflow-y-auto bg-grey-50 pb-4"
      >
        <div className="flex flex-col w-full max-w-[1400px] mx-auto px-8 py-8">
          <motion.div {...fadeUp(0)} className="flex flex-col gap-1 mb-6">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">
              {getGreeting()}, {getFirstName()}.
            </h1>
            <p className="text-[16px] text-[var(--text-secondary)]">Ask the agent, or pick up a workstream.</p>
            <p className="text-[14px] text-[var(--text-muted)] mt-1">
              <span className="text-primary-600 font-medium">{workstreamsData.length}</span> workstreams
              active
              <span className="mx-2">·</span>
              <span className="text-primary-600 font-medium">{totalSkills}</span> skills available
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="flex flex-col gap-3 pt-6 border-t border-neutral-200">
            <div
              className={cn(
                "relative flex flex-col bg-white border shadow-sm transition-colors hover:border-primary-300 focus-within:!border-primary-500",
                dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border-primary)]"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex items-center gap-2 px-4 pt-3 pb-0">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[14px] text-[var(--text-secondary)]">Ask the Petavue agent</span>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-0">
                  {files.map((file, i) => (
                    <span
                      key={`${file.name}-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-mono
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
                  variant="ghost"
                  size="sm"
                  className="!rounded-xl !w-10 !h-10 !p-0"
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
                  placeholder="Why did paid search ROAS drop last week?"
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
                  variant="primary"
                  size="sm"
                  className="!rounded-xl !w-10 !h-10 !p-0 mr-2"
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-2">
                {GLOBAL_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setMessage(suggestion);
                      messageInputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 text-[14px] text-[var(--text-secondary)] bg-white border border-[var(--border-primary)] rounded-full
                  hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Pick up where you left off
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              </div>
              <span className="text-[12px] text-[var(--text-muted)]">Last 14 days</span>
            </div>

            <div className="grid grid-cols-3">
              {RECENT_SESSIONS.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-3 p-4 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                    index > 0 && "-ml-px"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded",
                        item.type === "MEMO"
                          ? "bg-amber-100 text-amber-700 border-amber-700"
                          : "bg-blue-100 text-blue-700 border-blue-700"
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="text-[12px] text-[var(--text-muted)]">{item.timestamp}</span>
                  </div>
                  <h3 className="text-[16px] font-medium text-[var(--text-primary)] leading-snug">{item.title}</h3>
                  <div className="flex items-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {item.tags.map((tag, i) => (
                      <span key={tag}>
                        {tag}
                        {i < item.tags.length - 1 && <span className="mx-1">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Your Workstreams
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              </div>
            </div>

            <div className="grid grid-cols-2">
              {workstreamsData.map((ws, index) => {
                const visibleTags = ws.tags.slice(0, 8);
                const remainingTags = ws.tags.slice(8);
                const isRightColumn = index % 2 === 1;
                const isNotFirstRow = index >= 2;

                return (
                  <div
                    key={ws.id}
                    onClick={() => navigate(`/home/workstreams/${ws.id}`)}
                    className={cn(
                      "flex flex-col gap-3 p-5 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                      isRightColumn && "-ml-px",
                      isNotFirstRow && "-mt-px"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{ws.name}</h3>
                      <span className="text-[12px] text-primary-600 font-medium whitespace-nowrap">
                        {ws.skillCount} SKILLS
                      </span>
                    </div>
                    <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{ws.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {visibleTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-[12px] rounded border transition-colors cursor-pointer bg-white text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-primary-100"
                        >
                          {tag}
                        </span>
                      ))}
                      {remainingTags.length > 0 && (
                        <Tooltip title={remainingTags.join(", ")} placement="top" arrow tooltipActive={tooltipShow}>
                          <span
                            className="px-2 py-1 text-[12px] text-[var(--text-muted)] cursor-default"
                            onMouseEnter={() => setTooltipShow(true)}
                          >
                            +{remainingTags.length}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 py-1.5 px-3 border border-primary-500 rounded-full bg-white">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Most Used
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              </div>
              <span className="text-[12px] text-[var(--text-muted)]">You opened · last 30 days</span>
            </div>

            <div className="grid grid-cols-3">
              {MOST_USED.map((item, index) => {
                const skill = getSkillById(item.skillId);
                if (!skill) return null;
                return (
                  <div
                    key={skill.uid}
                    onClick={() => navigate(`/home/skill/${skill.uid}`)}
                    className={cn(
                      "flex flex-col gap-3 p-4 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                      index > 0 && "-ml-px"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded",
                          skill.renderType === "memo"
                            ? "bg-amber-100 text-amber-700 border-amber-700"
                            : "bg-blue-100 text-blue-700 border-blue-700"
                        )}
                      >
                        {skill.renderType}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)]">{item.opens} opens</span>
                    </div>
                    <h3 className="text-[16px] font-medium text-[var(--text-primary)] leading-snug">{skill.title}</h3>
                    <div className="flex items-center text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {item.tags.map((tag, i) => (
                        <span key={tag}>
                          {tag}
                          {i < item.tags.length - 1 && <span className="mx-1">·</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
