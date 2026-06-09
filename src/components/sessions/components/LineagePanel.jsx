import { useState } from 'react'
import { Database, Code, FileText, PenLine, ChevronDown, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react'
import { CardView, hasCardContent } from '../../shared/CardRenderer'

// Pure-presentation lineage timeline + siblings panel. Extracted from
// LineageDrawer for reuse inside WidgetFocusModal. The modal owns the
// lineage fetch (so it can also pass mainChatEditsCount down to
// WidgetChatPanel without double-fetching) and passes the result here as
// props.
//
// Intentionally excluded:
//   - Skills / Key Definitions sections (still computed and sent to LLM
//     via scope_block; just not surfaced in the UI here)
//   - Chat / textarea (the modal renders WidgetChatPanel separately)
//   - Bridge banner (rendered inside WidgetChatPanel, kept in chat column)

const TOOL_ICONS = {
  query_athena: Database,
  query_pg: Database,
  execute_code: Code,
  write_file: FileText,
  edit_file: PenLine,
  save_output: FileText,
}

function StepCard({ step, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TOOL_ICONS[step.tool] || Code
  const isError = step.status === 'error'
  const title = step.llm_title || step.summary

  return (
    <div className="relative pl-6">
      {!isLast && (
        <div className="absolute left-[11px] top-7 bottom-[-8px] w-px bg-[var(--border-primary)]" />
      )}
      <div className={`absolute left-[5px] top-[7px] w-[13px] h-[13px] rounded-full border-2 ${
        isError ? 'border-red-400 bg-red-400/20' : 'border-[var(--accent)] bg-[var(--accent)]/20'
      }`} />

      <div className="pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left bg-[var(--bg-hover)] rounded-lg p-2.5 hover:bg-[var(--bg-hover)]/80 transition-colors cursor-pointer border-none"
        >
          <div className="flex items-center gap-2">
            <Icon size={14} className={isError ? 'text-red-400' : 'text-[var(--accent)]'} />
            <span className="text-[12px] font-semibold text-[var(--text-primary)] flex-1 truncate">
              {title}
            </span>
            {expanded ? <ChevronDown size={13} className="text-[var(--text-muted)]" /> : <ChevronRight size={13} className="text-[var(--text-muted)]" />}
          </div>
        </button>

        {expanded && (
          <div className="mt-1.5 ml-1 text-[11px] space-y-2">
            {step.llm_card && hasCardContent(step.llm_card) ? (
              <CardView card={step.llm_card} />
            ) : step.llm_description ? (
              <ul className="m-0 pl-3.5 space-y-0.5 list-disc">
                {step.llm_description.split('\n').filter(l => l.trim()).map((line, i) => (
                  <li key={i} className="text-[var(--text-secondary)] leading-relaxed">
                    {line.replace(/^-\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : null}
            {step.code_preview && (
              <div>
                <span className="text-[var(--text-muted)] font-medium">Code:</span>
                <pre className="mt-1 p-2 bg-[var(--bg-primary)] rounded text-[10px] text-[var(--text-secondary)] overflow-x-auto max-h-[150px] overflow-y-auto whitespace-pre-wrap">{step.code_preview}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SiblingChip({ sibling }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[11px] text-[var(--accent)] font-medium">
      {sibling.widget_name}
    </span>
  )
}

export default function LineagePanel({ lineage, loading, error }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
      {loading && (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-muted)]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[12px]">Loading...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-[12px]">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {lineage && !loading && (
        <>
          <div className="mb-4">
            <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">
              Data pipeline ({lineage.chain.length} steps)
            </h4>
            {lineage.chain.map((step, i) => (
              <StepCard key={step.id} step={step} isLast={i === lineage.chain.length - 1} />
            ))}
          </div>

          {lineage.also_feeds_into && lineage.also_feeds_into.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">
                Related widgets
              </h4>
              <p className="text-[10px] text-[var(--text-muted)] mb-2 mt-0">
                These widgets use the same data pipeline
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lineage.also_feeds_into.map(s => (
                  <SiblingChip key={s.file_path} sibling={s} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
