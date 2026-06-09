import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp, Paperclip, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../utils/cn";
import { Button, Input } from "../../common-components";
import { useSessionContext } from "../../contexts/SessionContext";
import { MAX_FILES, MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_SET } from "../../utils/upload";
import workstreamsData from "./data/workstreams/workstreams.json";
import recentActivityData from "./data/workstreams/recentActivity.json";
import { getSkillsByWorkstream } from "./data/workstreams/skills";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }
});

export default function WorkstreamsPage() {
  const navigate = useNavigate();
  const { workstreamId } = useParams();
  const { session } = useSessionContext();

  const selectedWorkstreamId = workstreamId || workstreamsData[0]?.id;
  const [skillFilter, setSkillFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleWorkstreamChange = (id) => {
    navigate(`/home/workstreams/${id}`);
    setSkillFilter("all");
  };

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

  const canSend = !createLoading && (message.trim().length > 0 || files.length > 0);

  const selectedWorkstream = workstreamsData.find((ws) => ws.id === selectedWorkstreamId) || workstreamsData[0];

  const skills = getSkillsByWorkstream(selectedWorkstreamId);

  const filteredSkills = useMemo(() => {
    if (skillFilter === "all") return skills;
    return skills.filter((skill) => skill.renderType === skillFilter);
  }, [skills, skillFilter]);

  const dashboardCount = skills.filter((s) => s.renderType === "dashboard").length;
  const memoCount = skills.filter((s) => s.renderType === "memo").length;

  const recentActivity = recentActivityData
    .filter((activity) => activity.workstreamId === selectedWorkstreamId)
    .slice(0, 2);

  return (
    <div className="flex h-full w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-col h-full w-full min-w-[900px] overflow-y-auto bg-pv-neutral-grey-50 pb-4">
        <div className="flex flex-col w-full max-w-[1400px] mx-auto px-8 py-8">
          <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-8 justify-between">
            <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
              <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
              <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Workstreams
              </span>
              <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
            </div>

            <div className="flex items-center gap-1.5 border border-neutral-300 rounded-md p-1 bg-white">
              {workstreamsData.map((ws, ind) => (
                <>
                  {ind > 0 && <span className="flex w-[1px] h-[20px] bg-pv-neutral-grey-300 shrink-0" />}
                  <button
                    key={ws.id}
                    onClick={() => handleWorkstreamChange(ws.id)}
                    className={cn(
                      "px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer border-none",
                      selectedWorkstreamId === ws.id
                        ? `bg-pv-primary-primary-500 text-white shadow-md`
                        : "bg-white text-[var(--text-secondary)] hover:bg-neutral-100"
                    )}
                  >
                    {ws.name}
                  </button>
                </>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="flex flex-col gap-2 mb-6">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)]">{selectedWorkstream.name}</h1>
            <p className="text-[15px] text-[var(--text-secondary)]">{selectedWorkstream.description}</p>
          </motion.div>

          <motion.div
            {...fadeUp(0.1)}
            className={cn(
              "relative flex flex-col bg-white border shadow-sm transition-colors hover:border-pv-primary-primary-300 focus-within:!border-pv-primary-primary-500",
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
                placeholder={selectedWorkstream.workstreamInputPlaceholder}
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

            <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-2">
              {selectedWorkstream.proposedWorkflowAgentQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => {
                    setMessage(question);
                    messageInputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-[13px] text-[var(--text-secondary)] bg-white border border-[var(--border-primary)] rounded-full
                    hover:bg-[var(--bg-hover)] hover:border-[var(--border-secondary)] transition-colors cursor-pointer"
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>

          {recentActivity.length > 0 && (
            <motion.div {...fadeUp(0.15)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Pick up where you left off
                  </span>
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                </div>
                <span className="text-[12px] text-[var(--text-muted)]">Last 14 days</span>
              </div>

              <div className="grid grid-cols-2">
                {recentActivity.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-3 p-4 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-pv-primary-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                      index > 0 && "-ml-px"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded",
                          item.type === "memo"
                            ? "bg-amber-100 text-amber-700 border-amber-700"
                            : "bg-blue-100 text-blue-700 border-blue-700"
                        )}
                      >
                        {item.type}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)]">{item.relativeTime}</span>
                    </div>
                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug">{item.title}</h3>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {item.workstreamName} · {item.type}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.2)} className="flex flex-col gap-4 pt-6 mt-6 border-t border-neutral-200 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 w-full justify-between">
                <div className="flex items-center gap-2 py-1.5 px-3 border border-pv-primary-primary-500 rounded-full bg-white">
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Skills
                  </span>
                  <span className="w-2 h-2 rounded-full bg-pv-primary-primary-500" />
                </div>

                <div className="flex items-center gap-1.5 border border-neutral-300 rounded-md p-1 bg-white">
                  <button
                    onClick={() => setSkillFilter("all")}
                    className={cn(
                      "px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer border-none",
                      skillFilter === "all"
                        ? "bg-pv-primary-primary-500 text-white shadow-md"
                        : "bg-white text-[var(--text-secondary)] hover:bg-neutral-100"
                    )}
                  >
                    All{" "}
                    <span className={skillFilter === "all" ? "text-white/80" : "text-[var(--text-muted)]"}>
                      {`(${skills.length})`}
                    </span>
                  </button>
                  <span className="flex w-px h-5 bg-pv-neutral-grey-300 shrink-0" />
                  <button
                    onClick={() => setSkillFilter("dashboard")}
                    className={cn(
                      "px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer border-none",
                      skillFilter === "dashboard"
                        ? "bg-pv-primary-primary-500 text-white shadow-md"
                        : "bg-white text-[var(--text-secondary)] hover:bg-neutral-100"
                    )}
                  >
                    Dashboards{" "}
                    <span className={skillFilter === "dashboard" ? "text-white/80" : "text-[var(--text-muted)]"}>
                      {`(${dashboardCount})`}
                    </span>
                  </button>
                  <span className="flex w-px h-5 bg-pv-neutral-grey-300 shrink-0" />
                  <button
                    onClick={() => setSkillFilter("memo")}
                    className={cn(
                      "px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer border-none",
                      skillFilter === "memo"
                        ? "bg-pv-primary-primary-500 text-white shadow-md"
                        : "bg-white text-[var(--text-secondary)] hover:bg-neutral-100"
                    )}
                  >
                    Memos{" "}
                    <span className={skillFilter === "memo" ? "text-white/80" : "text-[var(--text-muted)]"}>
                      {`(${memoCount})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3">
              {filteredSkills.map((skill, index) => {
                const isNotFirstColumn = index % 3 !== 0;
                const isNotFirstRow = index >= 3;

                return (
                  <div
                    key={skill.uid}
                    onClick={() => navigate(`/home/skill/${skill.uid}`)}
                    className={cn(
                      "flex flex-col gap-3 p-4 bg-white border border-[var(--border-primary)] cursor-pointer transition-all duration-300 hover:border-pv-primary-primary-500 hover:scale-102 hover:z-10 hover:shadow-lg",
                      isNotFirstColumn && "-ml-px",
                      isNotFirstRow && "-mt-px"
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
                      <span className="text-[12px] text-[var(--text-muted)]">{skill.build_time}</span>
                    </div>

                    <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug">{skill.title}</h3>

                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {skill.tagline}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      {skill.data_sources.map((source) => (
                        <span
                          key={source}
                          className="px-2 py-1 text-[11px] text-[var(--text-secondary)] bg-neutral-100 border border-neutral-200 rounded"
                        >
                          {source}
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
