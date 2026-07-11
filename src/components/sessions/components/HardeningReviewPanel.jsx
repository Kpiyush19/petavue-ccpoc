import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  CheckCircle2, ChevronsUpDown, AlignLeft, ListTree, LayoutGrid,
  FileText, ShieldCheck, Loader2,
} from 'lucide-react'
import { getCurrentUser } from '../../../api'
import RecipeGroupCard from '../../RecipeGroupCard'
import RecipeStepCell from '../../RecipeStepCell'
import OutputPreview from '../../OutputPreview'
import HardeningChat from './HardeningChat'

function DragDivider({ onDrag }) {
  const dragging = useRef(false)
  const onDragRef = useRef(onDrag)
  onDragRef.current = onDrag

  const stopDrag = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.querySelectorAll('iframe').forEach((f) => { f.style.pointerEvents = '' })
  }, [])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.querySelectorAll('iframe').forEach((f) => { f.style.pointerEvents = 'none' })
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging.current) return
      onDragRef.current(e.clientX)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopDrag)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', stopDrag)
      stopDrag()
    }
  }, [stopDrag])

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-[5px] shrink-0 cursor-col-resize bg-transparent hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors"
    />
  )
}

export default function HardeningReviewPanel({
  recipe,
  sessionId,
  execSessionId,
  stepResults,
  hardeningStatus,
  codeDiffs,
  hardeningPhase,
  selectedOutput,
  onSelectOutput,
  onFeedbackRestart,
  onFeedbackDone,
  loading,
}) {
  const [splitPercent, setSplitPercent] = useState(55)
  const [expandedGroups, setExpandedGroups] = useState(() => {
    return {}
  })
  const [viewMode, setViewMode] = useState('card')
  const [activeWidget, setActiveWidget] = useState(null)
  const containerRef = useRef(null)

  const steps = recipe?.steps || []
  const groups = recipe?.groups || []
  const isGrouped = groups.length > 0
  const codeToNl = steps.some(s => s.summary)

  const isPetavueUser = (getCurrentUser()?.email || '').includes('@petavue.com')
  const widgetMap = recipe?.widget_map || {}
  const widgetEntries = useMemo(() => {
    if (!isPetavueUser || !widgetMap || !Object.keys(widgetMap).length) return []
    return Object.entries(widgetMap)
      .filter(([, info]) => info?.label && Array.isArray(info?.step_ids) && info.step_ids.length > 0)
      .map(([wid, info], idx) => ({
        id: wid,
        label: info.label,
        stepIds: new Set(info.step_ids),
        colorIndex: idx,
      }))
  }, [widgetMap, isPetavueUser])

  const getWidgetTagsForStep = useCallback((stepId) => {
    if (!activeWidget) return []
    const entry = widgetEntries.find(e => e.id === activeWidget)
    if (!entry || !entry.stepIds.has(stepId)) return []
    return [{ label: entry.label, colorIndex: entry.colorIndex }]
  }, [activeWidget, widgetEntries])

  const getWidgetTagsForGroup = useCallback((groupStepIds) => {
    if (!activeWidget) return []
    const entry = widgetEntries.find(e => e.id === activeWidget)
    if (!entry) return []
    const hasMatch = groupStepIds.some(sid => entry.stepIds.has(sid))
    if (!hasMatch) return []
    return [{ label: entry.label, colorIndex: entry.colorIndex }]
  }, [activeWidget, widgetEntries])

  // When a widget is active, filter groups/steps to only those matching
  const activeWidgetEntry = activeWidget ? widgetEntries.find(e => e.id === activeWidget) : null
  const filteredGroups = useMemo(() => {
    if (!activeWidgetEntry || !isGrouped) return groups
    return groups.filter(g => g.step_ids.some(sid => activeWidgetEntry.stepIds.has(sid)))
  }, [groups, activeWidgetEntry, isGrouped])

  const filteredSteps = useMemo(() => {
    if (!activeWidgetEntry) return steps
    return steps.filter(s => activeWidgetEntry.stepIds.has(s.id))
  }, [steps, activeWidgetEntry])

  const hardenedCount = Object.values(hardeningStatus).filter(h => h.status === 'hardened').length
  const reviewedTotal = Object.values(hardeningStatus).filter(h => h.status === 'reviewed' || h.status === 'hardened').length
  const hardeningDone = hardeningPhase === 'complete'

  const allExpanded = useMemo(() => {
    const g = isGrouped ? filteredGroups : groups
    if (!g.length) return false
    return g.every((_, i) => expandedGroups[i])
  }, [expandedGroups, filteredGroups, groups, isGrouped])

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedGroups({})
    } else {
      const all = {}
      const g = isGrouped ? filteredGroups : groups
      g.forEach((_, i) => { all[i] = true })
      setExpandedGroups(all)
    }
  }, [allExpanded, filteredGroups, groups, isGrouped])

  const handleDrag = useCallback((clientX) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSplitPercent(Math.min(75, Math.max(25, pct)))
  }, [])

  // Auto-preview target HTML when hardening completes
  const prevHardeningDone = useRef(false)
  useEffect(() => {
    if (hardeningDone && !prevHardeningDone.current && recipe?.target_file) {
      onSelectOutput?.({ path: recipe.target_file })
    }
    prevHardeningDone.current = hardeningDone
  }, [hardeningDone, recipe?.target_file, onSelectOutput])

  // Auto-preview is event-driven from PublishView Pusher handlers
  // (same pattern as RecipeVerifyStep) — no useEffect scan here.

  // Skeleton loader while recipe is being re-fetched for code-to-English
  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-4 w-16 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-4 w-20 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--border-primary)] overflow-hidden animate-pulse">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div className="w-5 h-5 rounded bg-[var(--bg-hover)]" />
              <div className="h-3.5 rounded bg-[var(--bg-hover)] w-[35%]" />
              <div className="ml-auto h-3 rounded bg-[var(--bg-hover)] w-[12%]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar — single compact row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">
            Recipe Steps
          </span>
          {hardeningDone ? (
            <span className="text-[12px] text-[var(--text-muted)] font-mono">
              {steps.length} steps
            </span>
          ) : (
            <span className="text-[12px] text-[var(--text-muted)] font-mono">
              {reviewedTotal}/{steps.length} reviewed
            </span>
          )}
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]
              bg-transparent border border-[var(--border-primary)] rounded-md px-2 py-0.5 cursor-pointer transition-colors"
          >
            <ChevronsUpDown size={11} />
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          {codeToNl && (
            <div className="flex items-center border border-[var(--border-primary)] rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('summary')}
                title="Explain"
                className={`flex items-center justify-center w-7 h-[22px] cursor-pointer transition-colors border-none
                  ${viewMode === 'summary'
                    ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                <AlignLeft size={13} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                title="Inspect"
                className={`flex items-center justify-center w-7 h-[22px] cursor-pointer transition-colors border-none
                  ${viewMode === 'card'
                    ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)]'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                <ListTree size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hardeningPhase === 'running' && (
            <span className="flex items-center gap-1.5 text-[12px] text-amber-600 font-medium">
              <Loader2 size={12} className="animate-spin" />
              Hardening for schedule safety...
            </span>
          )}
          {hardeningDone && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-green)] font-medium">
              <CheckCircle2 size={12} />
              All passed
              {hardenedCount > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <ShieldCheck size={11} /> {hardenedCount} hardened
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Widget filter pills */}
      {widgetEntries.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border-primary)] shrink-0 flex-wrap">
          <span className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] font-medium shrink-0">
            <LayoutGrid size={11} /> Widgets:
          </span>
          <button
            onClick={() => setActiveWidget(null)}
            className={`text-[12px] font-medium px-2 py-0.5 rounded-full border cursor-pointer transition-colors
              ${!activeWidget
                ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)] border-[var(--color-primary-200)]'
                : 'bg-transparent text-[var(--text-muted)] border-[var(--border-primary)] hover:text-[var(--text-secondary)]'
              }`}
          >
            All
          </button>
          {widgetEntries.map((entry) => {
            const isActive = activeWidget === entry.id
            return (
              <button
                key={entry.id}
                onClick={() => setActiveWidget(isActive ? null : entry.id)}
                className={`text-[12px] font-medium px-2 py-0.5 rounded-full border cursor-pointer transition-colors
                  ${isActive
                    ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-500)] border-[var(--color-primary-200)]'
                    : 'bg-transparent text-[var(--text-muted)] border-[var(--border-primary)] hover:text-[var(--text-secondary)]'
                  }`}
              >
                {entry.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Two-column: steps + output preview */}
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left: step list */}
        <div
          className="overflow-y-auto"
          style={{ width: selectedOutput ? `${splitPercent}%` : '100%' }}
        >
          <div className="p-3 space-y-3">
            {isGrouped ? (
              filteredGroups.map((group, gIdx) => {
                const origIdx = groups.indexOf(group)
                let groupSteps = group.step_ids
                  .map((id) => steps.find((s) => s.id === id))
                  .filter(Boolean)
                if (activeWidgetEntry) {
                  groupSteps = groupSteps.filter(s => activeWidgetEntry.stepIds.has(s.id))
                }

                return (
                  <RecipeGroupCard
                    key={group.group_name}
                    group={group}
                    groupIndex={origIdx}
                    steps={groupSteps}
                    expanded={!!expandedGroups[origIdx]}
                    onToggle={() => setExpandedGroups(prev => ({ ...prev, [origIdx]: !prev[origIdx] }))}
                    onRunGroup={() => {}}
                    hideRunButton
                    groupRunInfo={{ canRun: false }}
                    isRunning={false}
                    disabled
                    stepResults={stepResults}
                    removedSteps={new Set()}
                    widgetTags={getWidgetTagsForGroup(group.step_ids)}
                    hardeningStatus={hardeningStatus}
                  >
                    {groupSteps.map((step) => {
                      const idx = steps.indexOf(step)
                      return (
                        <RecipeStepCell
                          key={step.id}
                          step={step}
                          stepIndex={idx}
                          result={stepResults[step.id]}
                          onRun={() => {}}
                          onViewOutput={(f) => onSelectOutput?.(f)}
                          canRun={false}
                          isRunning={false}
                          removed={false}
                          onRemove={() => {}}
                          onRestore={() => {}}
                          viewMode={viewMode}
                          summaryLoading={false}
                          widgetTags={getWidgetTagsForStep(step.id)}
                          isFixed={false}
                          codeDiff={codeDiffs[step.id] || null}
                          skipReason={stepResults[step.id]?.skip_reason || null}
                          hideRunButton
                          hardeningInfo={hardeningStatus[step.id] || null}
                        />
                      )
                    })}
                  </RecipeGroupCard>
                )
              })
            ) : (
              filteredSteps.map((step) => {
                const idx = steps.indexOf(step)
                return (
                  <RecipeStepCell
                    key={step.id}
                    step={step}
                    stepIndex={idx}
                    result={stepResults[step.id]}
                    onRun={() => {}}
                    onViewOutput={(f) => onSelectOutput?.(f)}
                    canRun={false}
                    isRunning={false}
                    removed={false}
                    onRemove={() => {}}
                    onRestore={() => {}}
                    viewMode={viewMode}
                    summaryLoading={false}
                    widgetTags={getWidgetTagsForStep(step.id)}
                    codeDiff={codeDiffs[step.id] || null}
                    skipReason={stepResults[step.id]?.skip_reason || null}
                    hideRunButton
                    hardeningInfo={hardeningStatus[step.id] || null}
                  />
                )
              })
            )}

            {/* Target output card */}
            {recipe?.target_file && !activeWidget && (
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                  selectedOutput?.path === recipe.target_file
                    ? 'border-[var(--accent)] bg-[var(--accent)]/6'
                    : 'border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/4'
                }`}
                onClick={() => onSelectOutput?.({ path: recipe.target_file, type: 'html' })}
              >
                <FileText size={14} className="text-[var(--accent)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">Target Output</span>
                  <span className="text-[12px] text-[var(--text-muted)] ml-2 font-mono">{recipe.target_file}</span>
                </div>
                {hardeningDone && (
                  <span className="text-[10px] text-[var(--color-green)] font-medium">Ready to preview</span>
                )}
              </div>
            )}

            {/* Chat */}
            {execSessionId && !activeWidget && (
              <HardeningChat
                sessionId={sessionId}
                execSessionId={execSessionId}
                disabled={hardeningPhase === 'running'}
                onStepUpdate={(stepId, data) => {
                  onFeedbackRestart?.()
                  onFeedbackDone?.([{ ...data, id: stepId }], null)
                }}
                onDiffUpdate={(stepId, diff) => {
                  onFeedbackDone?.(null, { [stepId]: diff.diff })
                }}
              />
            )}
          </div>
        </div>

        {/* Drag divider + output preview */}
        {selectedOutput && (
          <>
            <DragDivider onDrag={handleDrag} />
            <div className="min-w-0 self-stretch" style={{ width: `${100 - splitPercent}%` }}>
              <OutputPreview
                sessionId={execSessionId}
                file={selectedOutput}
                onClose={() => onSelectOutput?.(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
