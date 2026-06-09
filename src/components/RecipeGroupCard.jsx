import { useMemo } from 'react'
import { ChevronDown, ChevronRight, Play, Loader2, CheckCircle2, XCircle, ShieldCheck, Shield } from 'lucide-react'

export default function RecipeGroupCard({ group, groupIndex, steps, children, expanded: controlledExpanded, onToggle, onRunGroup, groupRunInfo, isRunning, disabled, stepResults, removedSteps, widgetTags = [], hideRunButton = false, hardeningStatus = {} }) {
  const isExpanded = controlledExpanded ?? false
  const stepCount = group.step_ids?.length || 0

  const composition = useMemo(() => {
    if (!steps?.length) return null
    const queryCount = steps.filter(s => s.tool === 'query_athena' || s.tool === 'query_pg' || s.tool === 'query_snowflake').length
    const codeCount = steps.filter(s => s.tool === 'execute_code').length
    const writeCount = steps.filter(s => s.tool === 'write_file' || s.tool === 'save_output').length
    return { queryCount, codeCount, writeCount }
  }, [steps])

  // Group completion status
  const groupStatus = useMemo(() => {
    if (!steps?.length || !stepResults) return { status: 'pending', failedCount: 0 }
    const activeSteps = steps.filter(s => !removedSteps?.has(s.id))
    if (!activeSteps.length) return { status: 'skipped', failedCount: 0 }
    const failedCount = activeSteps.filter(s => stepResults[s.id]?.status === 'failed').length
    const allDone = activeSteps.every(s => stepResults[s.id]?.status === 'success')
    if (allDone) return { status: 'success', failedCount: 0 }
    if (failedCount > 0) return { status: 'failed', failedCount }
    return { status: 'pending', failedCount: 0 }
  }, [steps, stepResults, removedSteps])

  return (
    <div className={`
      rounded-xl overflow-hidden transition-all duration-200
      border border-[var(--border-primary)]
      ${isExpanded ? 'bg-[var(--bg-primary)] shadow-sm' : 'bg-[var(--bg-secondary)]/50'}
    `}>
      {/* Group header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 flex-1 text-left bg-transparent border-none cursor-pointer p-0
            hover:opacity-80 transition-opacity"
        >
          {isExpanded ? <ChevronDown size={14} className="text-[var(--accent)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
          <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
            groupStatus.status === 'success' ? 'bg-[var(--pv-success-text)]/10 text-[var(--pv-success-text)]'
            : groupStatus.status === 'failed' ? 'bg-red-100 text-red-500'
            : 'bg-[var(--accent)]/10 text-[var(--accent)]'
          }`}>
            {groupStatus.status === 'success' ? <CheckCircle2 size={12} />
            : groupStatus.status === 'failed' ? <XCircle size={12} />
            : groupIndex + 1}
          </span>
          <span className={`text-[13px] font-semibold flex-1 truncate ${isExpanded ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {group.group_name}
          </span>
        </button>
        {widgetTags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {widgetTags.map(({ label }) => (
              <span key={label} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--pv-primary-100)] text-[var(--pv-primary-500)] border border-[var(--pv-primary-200)]">
                {label}
              </span>
            ))}
          </div>
        )}
        {composition && (
          <span className="flex items-center gap-2 mr-1">
            {composition.queryCount > 0 && (
              <span className="text-[10px] text-[var(--pv-primary-500)] font-mono">{composition.queryCount} query</span>
            )}
            {composition.codeCount > 0 && (
              <span className="text-[10px] text-[var(--pv-success-text)] font-mono">{composition.codeCount} code</span>
            )}
            {composition.writeCount > 0 && (
              <span className="text-[10px] text-[var(--pv-warning-text)] font-mono">{composition.writeCount} output</span>
            )}
          </span>
        )}
        <span className="text-[11px] text-[var(--text-muted)] font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </span>
        {groupStatus.failedCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
            <XCircle size={11} /> {groupStatus.failedCount} failed
          </span>
        )}
        {/* Group-level hardening badge */}
        {(() => {
          const stepIds = group.step_ids || []
          const reviewingInGroup = stepIds.filter(id => hardeningStatus[id]?.status === 'reviewing').length
          const hardenedInGroup = stepIds.filter(id => hardeningStatus[id]?.status === 'hardened').length
          const reviewedInGroup = stepIds.filter(id => hardeningStatus[id]?.status === 'reviewed').length
          if (reviewingInGroup > 0) {
            return (
              <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <Loader2 size={10} className="animate-spin" /> reviewing
              </span>
            )
          }
          if (hardenedInGroup > 0) {
            return (
              <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <ShieldCheck size={10} /> {hardenedInGroup} hardened
              </span>
            )
          }
          if (reviewedInGroup > 0) {
            return (
              <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                <Shield size={10} /> reviewed
              </span>
            )
          }
          return null
        })()}
        {/* Run Group button */}
        {onRunGroup && groupStatus.status !== 'success' && (
          <button
            onClick={(e) => { e.stopPropagation(); onRunGroup(); }}
            disabled={disabled || isRunning || !groupRunInfo?.canRun || hideRunButton}
            className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:text-[var(--text-primary)]
              bg-transparent border border-[var(--border-primary)] rounded-md px-2 py-0.5 cursor-pointer
              transition-colors disabled:opacity-40 shrink-0"
            title={hideRunButton ? 'Use Execute All in AI mode' : 'Run all steps in this section'}
          >
            {isRunning ? (
              <><Loader2 size={11} className="animate-spin" /> Running</>
            ) : (
              <><Play size={11} /> Run</>
            )}
          </button>
        )}
      </div>

      {/* Group explanation */}
      {isExpanded && group.group_explanation && (
        <div className="px-4 pb-2 pl-[52px]">
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed m-0">
            {group.group_explanation}
          </p>
        </div>
      )}

      {/* Steps (children = RecipeStepCell components) */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}
