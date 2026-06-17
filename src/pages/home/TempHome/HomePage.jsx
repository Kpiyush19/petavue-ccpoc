import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowUp, ArrowRight, Paperclip, X, Upload, LayoutDashboard, FileText } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, apiGet } from "../../../api";
import { cn } from "../../../utils/cn";
import { useSessionContext } from "../../../contexts/SessionContext";
import { MAX_FILES, MAX_FILE_SIZE, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS, ALLOWED_SET } from "../../../utils/upload";
import { Button, Input, Tooltip, Skeleton } from "../../../common-components";
import { useScrollCleanup } from "../../../common-components/Tooltip/useScrollCleanup";
import { formatSkillName } from "./utils/formatSkillName";
import { SparkleIcon } from "../../../petavue/pages/workbook_home/icons/SparkleIcon";
import { SKILLS_CATALOG } from "../../../skills/skillsCatalog";

// Connector logos (src/assets/integrations). Glob handles filenames with spaces.
const CONNECTOR_ICON_MODULES = import.meta.glob("../../../assets/integrations/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const CONNECTOR_ICON_BY_FILE = Object.fromEntries(
  Object.entries(CONNECTOR_ICON_MODULES).map(([path, url]) => [path.split("/").pop(), url])
);
const CONNECTOR_FILE = {
  "6sense": "6sense.svg",
  GA4: "GA4.svg",
  Gong: "Gong.svg",
  "Google Ads": "Google Ads.svg",
  HubSpot: "HubSpot.svg",
  "LinkedIn Ads": "LinkedIn.svg",
  "LinkedIn Sales Navigator": "LinkedIn.svg",
  "Meta Ads": "Meta Ads.svg",
  Outreach: "Outreach.svg",
  Salesforce: "Salesforce.svg",
};
const connectorIcon = (name) => CONNECTOR_ICON_BY_FILE[CONNECTOR_FILE[name]] || null;

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

  // Skills come from the vetted GTM Skills catalog (parsed from src/skills/*.html).
  const skillsLoading = false;
  const skills = SKILLS_CATALOG.map((s) => ({
    id: s.slug,
    name: s.name,
    description: s.description,
    output_type: s.type === "memo" ? "memo" : "dashboard",
    tags: s.connectors,
    time: s.time,
  }));
  const [skillFilter, setSkillFilter] = useState("all");
  const filteredSkills = skillFilter === "all" ? skills : skills.filter((s) => s.output_type === skillFilter);

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

  const handleSend = () => {
    const trimmed = message.trim();
    if (createLoading) return;
    if (!trimmed && files.length === 0) return;

    // Whatever the user types drops them into the Sage Q2 Revenue Dashboard chat.
    navigate("/sage/q2-revenue-dashboard", {
      state: {
        initialMessage: trimmed || null,
        initialFiles: files.length > 0 ? files : null
      }
    });
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
        <div className="flex flex-col w-full max-w-[1180px] mx-auto px-8">
          {/* Hero — greeting + agent prompt, vertically centered so the skills
              grid peeks from below the fold and scrolling reveals it. */}
          <div className="min-h-[86vh] flex flex-col justify-center items-center gap-7">
            <motion.div {...fadeUp(0)} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-center gap-2">
                <SparkleIcon size={24} />
                <h1 className="text-[24px] leading-[36px] font-medium text-[#232532]">
                  {getGreeting()}, {getFirstName()}.
                </h1>
              </div>
              <p className="text-[14px] leading-[22px] text-[var(--text-secondary)]">Ask the agent, or run a skill.</p>
            </motion.div>

            <motion.div {...fadeUp(0.05)} className="flex flex-col gap-3 w-full max-w-[700px]">
            <div
              className={cn(
                "relative flex flex-col bg-white border rounded-[8px] transition-colors hover:border-pv-primary-primary-300 focus-within:!border-pv-primary-primary-500",
                dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[#d4d9ea]"
              )}
              style={{ boxShadow: "0px 12px 6px rgba(173, 178, 206, 0.12)" }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
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
                <div className="absolute inset-0 bg-[var(--accent)]/5 border-2 border-dashed border-[var(--accent)]/40 flex items-center justify-center z-10 pointer-events-none rounded-[8px]">
                  <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
                    <Upload size={16} />
                    Drop files to attach
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                  className="flex items-center justify-center w-8 h-8 rounded-[8px] shrink-0 border-none bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  <Paperclip size={16} />
                </button>
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
                      wrapper: "border-none py-0 px-0 bg-transparent focus-within:border-none",
                      root: "text-[14px] leading-[22px] text-[var(--text-primary)] placeholder:text-[#adb2ce]"
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send"
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-[8px] shrink-0 border-none transition-colors",
                    canSend
                      ? "bg-pv-primary-primary-500 text-white cursor-pointer hover:bg-pv-primary-primary-600"
                      : "bg-[#eef0f7] text-[#adb2ce] cursor-not-allowed"
                  )}
                >
                  <ArrowUp size={14} strokeWidth={2.75} />
                </button>
              </div>
            </div>
          </motion.div>
          </div>

          <motion.div {...fadeUp(0.1)} className="flex flex-col gap-4 pb-16">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <h2
                  className="workbook-list__breadcrumb"
                  style={{
                    fontSize: "var(--font-size-h2)",
                    fontWeight: "var(--font-weight-medium)",
                    lineHeight: "var(--line-height-h2)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Your Skills
                </h2>
                <span className="text-[12px] text-[var(--text-muted)]">({filteredSkills.length})</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-pv-neutral-grey-100 rounded-lg">
                {[
                  { id: "all", label: "All" },
                  { id: "dashboard", label: "Dashboard" },
                  { id: "memo", label: "Memo" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSkillFilter(f.id)}
                    className={cn(
                      "px-3 py-1.5 text-[13px] font-medium rounded-md border-none cursor-pointer transition-colors",
                      skillFilter === f.id
                        ? "bg-white text-[var(--text-primary)] shadow-sm"
                        : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
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

            {!skillsLoading && filteredSkills.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-[14px] text-[var(--text-muted)]">No skills available yet</p>
              </div>
            )}

            {!skillsLoading && filteredSkills.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {filteredSkills.map((skill) => {
                  const isMemo = skill.output_type === "memo";
                  const OutputIcon = isMemo ? FileText : LayoutDashboard;

                  return (
                    <div
                      key={skill.id}
                      onClick={() => navigate(`/home/skill/${skill.id}`)}
                      className="group flex flex-col gap-3 h-full p-5 bg-white border border-[var(--border-primary)] rounded-lg cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_-4px_rgba(16,24,40,0.08)] hover:-translate-y-0.5 hover:bg-pv-neutral-grey-50 hover:border-pv-primary-primary-300 hover:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_14px_28px_-10px_rgba(16,24,40,0.16)]"
                    >
                      {/* top: type tag ↔ time */}
                      <div className="flex items-center justify-between gap-2.5">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-[12px] font-medium font-['Inter',sans-serif] uppercase",
                            isMemo ? "text-amber-700" : "text-blue-700"
                          )}
                        >
                          <OutputIcon size={12} />
                          {isMemo ? "Memo" : "Dashboard"}
                        </span>
                        {skill.time && (
                          <span className="text-[12px] font-medium text-[var(--pv-success-text)] whitespace-nowrap">{skill.time}</span>
                        )}
                      </div>

                      <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.2px] text-[var(--text-primary)]">
                        {formatSkillName(skill.name)}
                      </h3>
                      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                        {skill.description}
                      </p>

                      {/* footer: connectors + View arrow, pinned to bottom */}
                      <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-[var(--border-primary)]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {(skill.tags || []).slice(0, 5).map((name) => {
                            const url = connectorIcon(name);
                            return url ? (
                              <img
                                key={name}
                                src={url}
                                alt={name}
                                title={name}
                                className="w-[16px] h-[16px] rounded object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span
                                key={name}
                                title={name}
                                className="px-2 py-0.5 text-[11px] rounded border bg-white text-[var(--text-secondary)] border-[var(--border-primary)] whitespace-nowrap"
                              >
                                {name}
                              </span>
                            );
                          })}
                          {skill.tags?.length > 5 && (
                            <span className="text-[11px] text-[var(--text-muted)]" title={skill.tags.slice(5).join(", ")}>
                              +{skill.tags.length - 5}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--text-muted)] group-hover:text-pv-primary-primary-500 transition-colors whitespace-nowrap shrink-0">
                          View
                          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
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
