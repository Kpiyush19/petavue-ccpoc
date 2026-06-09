import { useState, useEffect, useRef } from 'react'
import { Database, Code, FileText, PenLine, ChevronDown, ChevronRight, AlertTriangle, ArrowUp } from 'lucide-react'
import { apiGet } from '../../../api'
import WidgetChatPanel from './WidgetChatPanel'

const TOOL_ICONS = {
  query_athena: Database,
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
            {step.llm_description && (
              <ul className="m-0 pl-3.5 space-y-0.5 list-disc">
                {step.llm_description.split('\n').filter(l => l.trim()).map((line, i) => (
                  <li key={i} className="text-[var(--text-secondary)] leading-relaxed">
                    {line.replace(/^-\s*/, '')}
                  </li>
                ))}
              </ul>
            )}
            {step.reads && step.reads.length > 0 && (
              <div>
                <span className="text-[var(--text-muted)] font-medium">Reads:</span>
                <ul className="mt-0.5 ml-3 space-y-0.5 list-none p-0">
                  {step.reads.map(f => <li key={f} className="text-[var(--text-secondary)] font-mono truncate">{f}</li>)}
                </ul>
              </div>
            )}
            {step.writes && step.writes.length > 0 && (
              <div>
                <span className="text-[var(--text-muted)] font-medium">Writes:</span>
                <ul className="mt-0.5 ml-3 space-y-0.5 list-none p-0">
                  {step.writes.map(f => <li key={f} className="text-[var(--text-secondary)] font-mono truncate">{f}</li>)}
                </ul>
              </div>
            )}
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

export default function LineageDrawer({
  sessionId,
  widgetPath,
  onSendFeedback,
  onClose,
  sessionStatus,
  // Phase-feedback fix #5/6: liveMessages threaded down so the widget chat
  // panel can stream tool_call/tool_result events live (no /history poll).
  // Also used to refetch lineage when a widget turn completes (#5).
  liveMessages = [],
}) {
  const [lineage, setLineage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refineText, setRefineText] = useState('')

  // Widget chat: per-user feature flag fetched on mount.
  // When enabled, the bottom textarea is replaced by a multi-message
  // chat panel scoped to this widget. When disabled, today's behavior
  // (single textarea → main chat with [CONTEXT: ...] hint) is preserved.
  const [widgetChatEnabled, setWidgetChatEnabled] = useState(false)

  // Lineage fetcher — used on mount, widget change, AND status transition
  // out of 'thinking' (so a widget edit refreshes the lineage chain
  // automatically when the agent finishes).
  const fetchLineage = () => {
    if (!sessionId || !widgetPath) return
    setError(null)
    apiGet(`/api/sessions/${sessionId}/widget-lineage?path=${encodeURIComponent(widgetPath)}`)
      .then(data => { setLineage(data); setLoading(false) })
      .catch(err => { setError(err.message || 'Failed to load lineage'); setLoading(false) })
  }

  useEffect(() => {
    if (!sessionId || !widgetPath) return
    setLoading(true)
    fetchLineage()
    // Intentionally omitting `fetchLineage` from deps: it's a plain function
    // (not memoized via useCallback) and is recreated on every render. Adding
    // it would trigger this effect on every render. The effect should only
    // re-run when the widget identity changes — sessionId + widgetPath fully
    // capture that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, widgetPath])

  // Phase-feedback fix #5: refetch lineage + edit count when a widget turn
  // completes (status flips out of 'thinking'). The widget JSX or upstream
  // steps may have changed, so the lineage timeline + bridge banner should
  // reflect the new state.
  const prevStatusRef = useRef(sessionStatus)
  useEffect(() => {
    if (prevStatusRef.current === 'thinking' && sessionStatus !== 'thinking') {
      fetchLineage()
    }
    prevStatusRef.current = sessionStatus
    // Same rationale as above — `fetchLineage` is non-memoized; only the
    // status transition should trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus])

  // Fetch the widget_chat_enabled flag once per drawer mount. Effective
  // flag = tenant-level OR user-level (tenant overrides; matches the same
  // resolution used by ExperimentalFeatures.jsx and backend get_effective_flags).
  // Earlier this only checked user-level — users with the flag enabled
  // tenant-wide saw the legacy textarea instead of the chat panel.
  useEffect(() => {
    Promise.all([
      apiGet('/api/users/me/feature-flags').catch(() => ({})),
      apiGet('/api/tenant/feature-flags').catch(() => ({})),
    ]).then(([userData, tenantData]) => {
      const userFlag = !!(userData?.feature_flags?.widget_chat_enabled)
      const tenantFlag = !!(tenantData?.feature_flags?.widget_chat_enabled)
      setWidgetChatEnabled(tenantFlag || userFlag)
    })
  }, [])

  const widgetName = widgetPath.split('/').pop().replace('.jsx', '')

  const handleRefineSubmit = () => {
    if (!refineText.trim() || !onSendFeedback || !lineage) return
    const stepIds = lineage.chain.map(s => s.id).join(', ')
    const contextHint = `\n[CONTEXT: Widget "${widgetName}" at ${widgetPath} — pipeline steps: ${stepIds}]`
    onSendFeedback(refineText.trim() + contextHint)
    setRefineText('')
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <Database size={15} className="text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--text-primary)] flex-1 truncate">
          How it's built
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-sm">
            Loading...
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

      {lineage && onSendFeedback && !widgetChatEnabled && (
        // Legacy single-textarea feedback — kept identical to pre-Phase-5
        // behavior. Submits to main chat with an inline [CONTEXT: ...] hint
        // and closes the drawer.
        <div className="shrink-0 px-3 pb-3 pt-2">
          <div className="relative flex flex-col bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-2xl focus-within:border-[var(--accent)] transition-colors">
            <textarea
              value={refineText}
              onChange={e => setRefineText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineSubmit() } }}
              placeholder="What would you like to change?"
              rows={2}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[var(--text-primary)]
                px-3 py-3 pr-12 min-h-[44px] max-h-[120px]
                placeholder:text-[var(--text-muted)] rounded-2xl"
            />
            <div className="absolute right-2 bottom-2">
              <button
                onClick={handleRefineSubmit}
                disabled={!refineText.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center
                  border-none cursor-pointer transition-colors
                  bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]
                  disabled:bg-[var(--bg-hover)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {lineage && onSendFeedback && widgetChatEnabled && (
        // Widget-scoped chat panel. Replaces the legacy textarea entirely
        // when the flag is on. The drawer stays open across submits — the
        // user can have a multi-turn conversation about the widget without
        // losing the lineage context above.
        //
        // Layout: chat panel uses flex-1 + min-h-0 to share space
        // proportionally with the lineage timeline (which is also flex-1 +
        // scrollable). Replaces a prior fixed `minHeight: 50%` which
        // squeezed tall lineage timelines into 50% of the drawer even when
        // the chat panel was nearly empty.
        <div className="flex-1 min-h-0 border-t border-[var(--border-primary)] flex flex-col">
          <WidgetChatPanel
            widgetPath={widgetPath}
            sessionId={sessionId}
            sessionStatus={sessionStatus}
            onSubmit={(text, scope) => onSendFeedback(text, scope)}
            onClose={onClose}
            mainChatEditsCount={lineage?.main_chat_edits_count || 0}
            liveMessages={liveMessages}
          />
        </div>
      )}
    </div>
  )
}
