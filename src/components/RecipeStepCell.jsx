import { useState, useEffect } from 'react'
import { Play, RotateCcw, ChevronDown, ChevronRight, Eye, Loader2, CheckCircle2, XCircle, Clock, Database, Code2, FileText, Trash2, Undo2, AlertTriangle, SkipForward, Shield, ShieldCheck } from 'lucide-react'
import { Button } from './ui/Button'
import { CardView, hasCardContent, stripPills } from './shared/CardRenderer'
import DiffView from './sessions/components/DiffView'

const TOOL_META = {
  query_athena: { icon: Database, label: 'Athena Query', color: 'text-[var(--pv-primary-500)]' },
  query_pg: { icon: Database, label: 'Postgres Query', color: 'text-[var(--pv-primary-500)]' },
  query_snowflake: { icon: Database, label: 'Snowflake Query', color: 'text-[var(--pv-primary-500)]' },
  execute_code: { icon: Code2, label: 'Python Code', color: 'text-[var(--pv-success-text)]' },
  write_file: { icon: FileText, label: 'Write File', color: 'text-[var(--pv-warning-text)]' },
  save_output: { icon: FileText, label: 'Save Output', color: 'text-[var(--pv-warning-text)]' },
}

function getToolMeta(tool) {
  return TOOL_META[tool] || { icon: Code2, label: tool, color: 'text-[var(--text-muted)]' }
}

function getCodePreview(step) {
  const input = step.input || {}
  if (step.tool === 'query_athena') return input.query || ''
  if (step.tool === 'query_pg') return input.query || ''
  if (step.tool === 'query_snowflake') return input.query || ''
  if (step.tool === 'execute_code') return input.code || ''
  if (step.tool === 'write_file') return `path: ${input.path || '?'}`
  if (step.tool === 'save_output') return `path: ${input.path || '?'}`
  return JSON.stringify(input, null, 2)
}

// Pill renderer and CardView now live in ./shared/CardRenderer

const WIDGET_TAG_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
]

export function getWidgetTagColor(index) {
  return WIDGET_TAG_COLORS[index % WIDGET_TAG_COLORS.length]
}

export default function RecipeStepCell({ step, stepIndex, result, onRun, onViewOutput, canRun, isRunning, removed, onRemove, onRestore, collapsed, onToggleCollapse, viewMode = 'summary', summaryLoading = false, widgetTags = [], isFixed = false, llmFixData = null, codeDiff = null, skipReason = null, hideRunButton = false, hardeningInfo = null, leading = null }) {
  const [codeExpanded, setCodeExpanded] = useState(!step.summary)
  const hasCard = hasCardContent(step.summary?.card)
  const effectiveViewMode = (viewMode === 'card' && hasCard) ? 'card' : 'summary'

  // Collapse code when summary arrives via Pusher streaming
  useEffect(() => {
    if (step.summary) setCodeExpanded(false)
  }, [step.summary])
  const meta = getToolMeta(step.tool)
  const ToolIcon = meta.icon
  const status = result?.status || 'pending'
  const codePreview = getCodePreview(step)
  const isCollapsed = onToggleCollapse != null && collapsed && !isRunning

  if (removed) {
    return (
      <div className="border rounded-xl border-[var(--border-primary)] bg-[var(--bg-secondary)] opacity-40">
        <div className="flex items-center gap-2.5 px-3.5 py-2">
          <span className="text-[12px] font-mono text-[var(--text-muted)] shrink-0">
            {stepIndex + 1}
          </span>
          <ToolIcon size={14} className="text-[var(--text-muted)]" />
          <span className="text-[12px] text-[var(--text-muted)] flex-1 truncate line-through">
            {stripPills(step.summary?.title) || meta.label}
          </span>
          <span className="text-[12px] text-[var(--text-muted)]">Skipped</span>
          <Button variant="ghost" size="icon-sm" onClick={() => onRestore(step.id)} title="Restore step">
            <Undo2 size={13} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`
      rounded-xl transition-all duration-200 overflow-hidden
      border border-[var(--border-primary)]
      ${status === 'success' && !hideRunButton ? 'bg-[var(--pv-success-text)]/5' : ''}
      ${status === 'skipped' ? 'bg-[var(--bg-hover)]/30 opacity-60' : ''}
      ${status === 'failed' ? 'bg-[var(--pv-error-text)]/5' : ''}
      ${status === 'pending' && !isRunning ? 'bg-[var(--bg-secondary)]' : ''}
      ${isRunning ? 'bg-[var(--accent)]/5' : ''}
    `}>
      {/* Header — entire row clickable for expand/collapse */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 ${onToggleCollapse ? 'cursor-pointer hover:bg-[var(--bg-hover)]/50 transition-colors' : ''}`}
        onClick={onToggleCollapse || undefined}
      >
        {leading}
        {onToggleCollapse && (
          <span className="text-[var(--text-muted)] shrink-0">
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </span>
        )}
        <span className="text-[12px] font-mono text-[var(--text-muted)] shrink-0">
          {stepIndex + 1}
        </span>
        <ToolIcon size={14} className={meta.color} />
        <span className="text-[12px] font-semibold text-[var(--text-primary)] flex-1 truncate">
          {stripPills(step.summary?.title) || meta.label}
        </span>

        {/* Widget tags */}
        {widgetTags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {widgetTags.map(({ label }) => (
              <span key={label} className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[var(--pv-primary-100)] text-[var(--pv-primary-500)] border border-[var(--pv-primary-200)]">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Status */}
        {isRunning && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--accent)]">
            <Loader2 size={12} className="animate-spin" /> Running...
          </span>
        )}
        {status === 'success' && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--pv-success-text)]">
            <CheckCircle2 size={12} />{!hideRunButton && result?.duration_s != null ? ` ${result.duration_s}s` : ''}
          </span>
        )}
        {isFixed && (
          <span className="text-[12px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            modified
          </span>
        )}
        {hardeningInfo?.status === 'reviewing' && (
          <span className="flex items-center gap-0.5 text-[12px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Loader2 size={10} className="animate-spin" /> reviewing
          </span>
        )}
        {hardeningInfo?.status === 'hardened' && !hideRunButton && (
          <span className="flex items-center gap-0.5 text-[12px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <ShieldCheck size={10} /> hardened
          </span>
        )}
        {hardeningInfo?.status === 'reviewed' && (
          <span className="flex items-center gap-0.5 text-[12px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            <Shield size={10} /> reviewed
          </span>
        )}
        {status === 'skipped' && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
            <SkipForward size={12} /> Redundant
          </span>
        )}
        {status === 'failed' && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--pv-error-text)]">
            <XCircle size={12} /> Failed
          </span>
        )}
        {status === 'pending' && !isRunning && (
          <span className="flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
            <Clock size={12} /> Pending
          </span>
        )}

        {/* Run / Retry button (hidden in hardening/AI adjustments view) */}
        {!isRunning && !hideRunButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onRun(step.id) }}
            disabled={!canRun}
            title={status === 'failed' ? 'Retry' : 'Run step'}
          >
            {status === 'failed' ? <RotateCcw size={13} /> : <Play size={13} />}
          </Button>
        )}

        {/* Skip/Remove button — hidden in AI/hardening mode */}
        {!isRunning && !hideRunButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onRemove(step.id) }}
            title="Skip this step"
            className="text-[var(--text-muted)] hover:text-[var(--pv-error-text)]"
          >
            <Trash2 size={12} />
          </Button>
        )}
      </div>

      {/* Collapsible body */}
      {!isCollapsed && (
        <>
          {/* Skip reason (AI mode — step marked redundant) */}
          {skipReason && (
            <div className="px-3.5 py-2 border-t border-[var(--border-primary)]/50 bg-[var(--bg-hover)]/30">
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                <SkipForward size={11} className="shrink-0" />
                <span>{skipReason}</span>
              </div>
            </div>
          )}

          {/* Summary explanation (prose view) */}
          {step.summary?.explanation && effectiveViewMode === 'summary' && (
            <div className="px-3.5 py-2 border-t border-[var(--border-primary)]/50">
              {step.summary.explanation.includes('\n- ') || step.summary.explanation.startsWith('- ') ? (
                <ul className="text-[12px] text-[var(--text-secondary)] leading-relaxed m-0 pl-4 space-y-0.5 list-disc">
                  {step.summary.explanation.split('\n').filter(l => l.trim()).map((line, i) => (
                    <li key={i} className="m-0">{stripPills(line.replace(/^-\s*/, ''))}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed m-0">
                  {stripPills(step.summary.explanation)}
                </p>
              )}
            </div>
          )}

          {/* Card view — LLM-generated structured explanation */}
          {effectiveViewMode === 'card' && (
            <CardView card={step.summary.card} />
          )}

          {/* Per-step shimmer while summary is loading */}
          {summaryLoading && !step.summary && (
            <div className="px-3.5 py-2 border-t border-[var(--border-primary)]/50 space-y-1.5 animate-pulse">
              <div className="h-3 rounded bg-[var(--bg-hover)] w-[85%]" />
              <div className="h-3 rounded bg-[var(--bg-hover)] w-[70%]" />
              <div className="h-3 rounded bg-[var(--bg-hover)] w-[55%]" />
            </div>
          )}

          {/* Detected output files — hidden when clickable output links are available */}
          {step.summary?.output_files_detected?.length > 0 && !result?.output_files?.length && (
            <div className="px-3.5 py-1.5 border-t border-[var(--border-primary)]/50 flex items-center gap-1.5 flex-wrap">
              <FileText size={11} className="text-[var(--text-muted)] shrink-0" />
              {step.summary.output_files_detected.map(f => (
                <span key={f} className="text-[12px] text-[var(--text-muted)] font-mono bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-primary)]/50">
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Code preview (collapsible) */}
          {codePreview && (
            <div className="border-t border-[var(--border-primary)]/50">
              <button
                onClick={() => setCodeExpanded(!codeExpanded)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 w-full text-left bg-transparent border-none cursor-pointer
                  text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {codeExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {`View Code${meta.label ? ` (${meta.label})` : ''}`}
              </button>
              {codeExpanded && (
                <pre className="px-3.5 pb-2.5 text-[12px] text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto leading-relaxed">
                  {codePreview}
                </pre>
              )}
            </div>
          )}

          {/* Removed: output_warning — produces false positives on write_file/save_output steps */}

          {/* Outputs + error */}
          {(result?.output_files?.length > 0 || result?.error) && (
            <div className="border-t border-[var(--border-primary)]/50 px-3.5 py-2">
              {result.error && (
                <p className="text-[12px] text-[var(--pv-error-text)] font-mono mb-1.5 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto">
                  {result.error}
                </p>
              )}
              {result.output_files?.map((f) => {
                // output_files entries may be plain path strings or { path, size_bytes } objects.
                const fp = typeof f === 'string' ? f : f.path
                const size = typeof f === 'string' ? null : f.size_bytes
                return (
                <button
                  key={fp}
                  onClick={() => onViewOutput({ path: fp })}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--accent)] hover:underline
                    bg-transparent border-none cursor-pointer p-0 mb-0.5"
                >
                  <Eye size={11} />
                  {fp}
                  {size != null && (
                    <span className="text-[var(--text-muted)]">
                      ({size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`})
                    </span>
                  )}
                </button>
                )
              })}
            </div>
          )}

          {/* LLM Fix Activity (AI mode) */}
          {llmFixData && (llmFixData.fixing || llmFixData.activities?.length > 0) && (
            <div className="border-t border-amber-200 px-3.5 py-2 bg-amber-50/30">
              {llmFixData.fixing && (
                <div className="flex items-center gap-1.5 text-[12px] text-amber-700 mb-1.5">
                  <Loader2 size={11} className="animate-spin" /> LLM fixing...
                </div>
              )}
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {(llmFixData.activities || []).map((act, ai) => (
                  <div key={ai} className="text-[12px] text-[var(--text-secondary)]">
                    {act.event_type === 'tool_call' && (
                      <span className="font-mono"><span className="text-amber-600">→ {act.tool}</span></span>
                    )}
                    {act.event_type === 'text' && (
                      <span className="italic">{act.content?.slice(0, 300)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hardening reason */}
          {hardeningInfo?.status === 'hardened' && hardeningInfo.reason && (
            <div className="border-t border-amber-200/50 px-3.5 py-2.5 bg-amber-50/30">
              <div className="flex items-start gap-2 text-[12px]">
                <ShieldCheck size={12} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-amber-700 text-[12px] uppercase block mb-1">What changed</span>
                  <div className="text-[var(--text-secondary)] leading-relaxed text-[12px] space-y-0.5">
                    {hardeningInfo.reason.split('\n').filter(Boolean).map((line, i) => {
                      const trimmed = line.replace(/^[-•]\s*/, '')
                      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•')
                      return (
                        <p key={i} className={`m-0 ${isBullet ? 'pl-3 relative before:content-["•"] before:absolute before:left-0 before:text-amber-500' : ''}`}>
                          {trimmed}
                        </p>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code Diff (AI mode) */}
          {codeDiff && (
            <div className="border-t border-[var(--border-primary)]/50 px-3.5 py-2">
              <div className="text-[12px] font-semibold text-[var(--text-muted)] uppercase mb-1">Code Change</div>
              {codeDiff.diff ? (
                <div className="max-h-[200px] overflow-y-auto text-[12px]">
                  <DiffView diff={codeDiff.diff} />
                  {codeDiff.truncated && (
                    <div className="text-[12px] text-[var(--text-muted)] italic mt-1">Diff truncated due to size</div>
                  )}
                </div>
              ) : codeDiff.original ? (
                <div className="space-y-1.5">
                  <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 font-mono text-[12px] text-red-700 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                    {codeDiff.original}
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5 font-mono text-[12px] text-green-700 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                    {codeDiff.fixed}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
