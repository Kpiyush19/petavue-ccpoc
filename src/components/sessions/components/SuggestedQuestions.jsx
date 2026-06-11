import { motion } from "motion/react";
import { StackSimple, ArrowBendUpRight, BellSlash } from "@phosphor-icons/react";

// "Related" follow-up suggestions for the latest turn (max 3). Matches the
// Figma "Related" design: a header with a stack icon, then full-width rows —
// one line each (truncated), an arrow-bend icon on the right, a light bottom
// divider at rest and a blue rounded highlight on hover. A click sends the
// question immediately. Provenance (the KD/skill it was grounded in) is
// hover-only via the button `title`.
const SKELETON_WIDTHS = ["45%", "62%", "38%"];

export default function SuggestedQuestions({ questions, onSelect, disabled, loading, onMute }) {
  const items = (questions || []).slice(0, 3);
  if (!loading && items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3 mt-4"
      role="group"
      aria-label="Follow-up questions"
      aria-busy={loading || undefined}
    >
      <div className="flex items-center gap-2">
        <StackSimple size={20} className="text-[var(--text-primary)] shrink-0" aria-hidden="true" />
        <span className="text-[16px] text-[var(--text-primary)]">Follow-ups</span>
        {onMute && (
          <button
            type="button"
            onClick={onMute}
            title="Hide follow-up suggestions for this session"
            aria-label="Hide follow-ups"
            className="ml-auto flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <BellSlash size={14} weight="bold" aria-hidden="true" />
            Hide
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col">
          {SKELETON_WIDTHS.map((w, i) => (
            <div
              key={i}
              className="flex h-9 w-full items-center justify-between gap-2 px-4 border border-transparent border-b-[#eef0f7]"
            >
              <div className="s-skel h-5 rounded-md" style={{ width: w }} />
              <div className="s-skel h-5 w-5 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
      <div className="flex flex-col">
        {items.map((q, i) => (
          <button
            key={`${q.grounded_in || "q"}-${i}`}
            type="button"
            onClick={() => onSelect(q.question)}
            disabled={disabled}
            title={q.grounded_in ? `Based on ${q.grounded_in}` : undefined}
            className="group flex h-9 w-full items-center justify-between gap-2 px-4 text-left border border-transparent border-b-[#eef0f7] bg-transparent cursor-pointer transition-colors hover:bg-white hover:border-[#90a6ee] hover:rounded-lg disabled:opacity-50 disabled:cursor-default"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
              {q.question}
            </span>
            <ArrowBendUpRight
              size={16}
              className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      )}
    </motion.div>
  );
}
