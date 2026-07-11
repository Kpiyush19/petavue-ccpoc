import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Play, CheckCircle2, XCircle, Loader2, Save, RotateCcw, Sparkles, ChevronsUpDown, Database, FileText, AlertTriangle, AlignLeft, ListTree, LayoutGrid, BrainCircuit } from 'lucide-react'
import Pusher from 'pusher-js'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../config'
import { apiPost, getApiBase, getAuthToken, getCurrentUser } from '../api'
import { Button } from '@/ui'
import { DialogContent, DialogFooter } from '@/ui/components/OverlayDialog/OverlayDialog'
import RecipeStepCell from './RecipeStepCell'
import RecipeGroupCard from './RecipeGroupCard'
import OutputPreview from './OutputPreview'

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

export default function RecipeVerifyStep({
  recipe,
  sessionId,
  verifySessionId,
  stepResults,
  setStepResults,
  removedSteps,
  setRemovedSteps,
  onPublish,
  onBack,
  onSaveDraft,
  onRegenerate,
  publishing,
  summaryStatus,
  isUpdate = false,
  codeToNl = false,
  publishLabel = null,
  topBarExtra = null,
  afterSteps = null,
  aiMode = false,
  execSessionId = null,
  execReady = false,
  initialHardeningStatus = {},
  initialHardeningPending = 0,
  hasExtraBlockChanges = false,
  hasIncompleteSlackBlock = false,
}) {
  const [runningStep, setRunningStep] = useState(null)
  const [runningAll, setRunningAll] = useState(false)
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [splitPercent, setSplitPercent] = useState(55) // left panel %
  const [expandedGroups, setExpandedGroups] = useState({}) // group index → boolean
  const [viewMode, setViewMode] = useState('card') // 'summary' or 'card' — global toggle (card = detailed inspect view)
  const [collapsedSteps, setCollapsedSteps] = useState(() => {
    // Default all steps to collapsed
    const collapsed = {}
    ;(recipe?.steps || []).forEach(s => { collapsed[s.id] = true })
    return collapsed
  })
  const [activeWidget, setActiveWidget] = useState(null)
  const [llmFixActivity, setLlmFixActivity] = useState({})
  const [codeDiffs, setCodeDiffs] = useState({})
  const [fixedSteps, setFixedSteps] = useState(new Set())
  const [blockedError, setBlockedError] = useState(null)
  const [hardeningPhase, setHardeningPhase] = useState(() => {
    if (initialHardeningPending > 0) return 'running'
    if (Object.keys(initialHardeningStatus).length > 0) return 'complete'
    return null
  })
  const [hardeningStatus, setHardeningStatus] = useState(initialHardeningStatus) // step_id → { status, reason }
  const pusherCleanupRef = useRef(null)
  const containerRef = useRef(null)

  const steps = recipe?.steps || []
  const groupCount = recipe?.groups?.length || 0
  const isGrouped = groupCount > 0

  // Widget-to-step mapping (petavue users only, React dashboards)
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

  const allExpanded = useMemo(() => {
    if (isGrouped) {
      if (!groupCount) return false
      return recipe.groups.every((_, i) => expandedGroups[i])
    } else {
      return steps.length > 0 && steps.every(s => !collapsedSteps[s.id])
    }
  }, [isGrouped, expandedGroups, groupCount, recipe?.groups, steps, collapsedSteps])

  const toggleAll = useCallback(() => {
    if (isGrouped) {
      if (allExpanded) {
        setExpandedGroups({})
      } else {
        const all = {}
        recipe?.groups?.forEach((_, i) => { all[i] = true })
        setExpandedGroups(all)
      }
    } else {
      if (allExpanded) {
        const collapsed = {}
        steps.forEach(s => { collapsed[s.id] = true })
        setCollapsedSteps(collapsed)
      } else {
        setCollapsedSteps({})
      }
    }
  }, [isGrouped, allExpanded, recipe?.groups, steps])

  const toggleGroup = useCallback((index) => {
    setExpandedGroups((prev) => ({ ...prev, [index]: !prev[index] }))
  }, [])

  const activeSteps = steps.filter((s) => !removedSteps.has(s.id))
  const completedCount = activeSteps.filter((s) => stepResults[s.id]?.status === 'success').length
  const skippedCount = activeSteps.filter((s) => stepResults[s.id]?.status === 'skipped').length
  const failedCount = activeSteps.filter((s) => stepResults[s.id]?.status === 'failed').length
  const allPassed = (completedCount + skippedCount) === activeSteps.length && activeSteps.length > 0

  // Auto-preview target HTML file when all steps pass
  // The template HTML is pre-written to workspace by verify/init,
  // but it's not a recipe step — so we need to show it explicitly
  const prevAllPassed = useRef(false)
  const hardeningDone = !aiMode || hardeningPhase === 'complete' || hardeningPhase === null
  useEffect(() => {
    if (allPassed && hardeningDone && !prevAllPassed.current) {
      const targetFile = recipe?.target_file
      if (targetFile) {
        setSelectedOutput({ path: targetFile })
      }
    }
    prevAllPassed.current = allPassed && hardeningDone
  }, [allPassed, hardeningDone, recipe?.target_file])

  // Recipe insights (computed from existing step data)
  const insights = useMemo(() => {
    if (!steps.length) return null
    const queryCount = steps.filter(s => s.tool === 'query_athena' || s.tool === 'query_pg' || s.tool === 'query_snowflake').length

    // Deduplicated output files across all summaries
    const outputFiles = new Set()
    steps.forEach(s => {
      s.summary?.output_files_detected?.forEach(f => outputFiles.add(f))
    })

    // Output coverage
    const stepsWithSummary = steps.filter(s => s.summary)
    const stepsWithoutOutput = stepsWithSummary.filter(s => s.summary.output_warning).length

    const fallbackCount = recipe?.summary_metadata?.metrics?.fallback_count || 0

    return { queryCount, outputFileCount: outputFiles.size, stepsWithoutOutput, stepsWithSummary: stepsWithSummary.length, fallbackCount }
  }, [steps, recipe?.summary_metadata?.metrics?.fallback_count])

  const handleRemoveStep = useCallback((stepId) => {
    setRemovedSteps((prev) => new Set([...prev, stepId]))
  }, [setRemovedSteps])

  const handleRestoreStep = useCallback((stepId) => {
    setRemovedSteps((prev) => {
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [setRemovedSteps])

  // Handle divider drag
  const handleDrag = useCallback((clientX) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setSplitPercent(Math.min(75, Math.max(25, pct)))
  }, [])

  // Check if a step can run (all deps succeeded, skipped, or removed)
  const canRunStep = useCallback((step) => {
    if (runningAll || runningStep) return false
    for (const depId of step.depends_on || []) {
      if (removedSteps.has(depId)) continue
      const depStatus = stepResults[depId]?.status
      if (depStatus !== 'success' && depStatus !== 'skipped') return false
    }
    return true
  }, [stepResults, runningAll, runningStep, removedSteps])

  // Run a single step
  const handleRunStep = useCallback(async (stepId) => {
    setRunningStep(stepId)
    try {
      const endpoint = aiMode && execSessionId
        ? `/api/sessions/${sessionId}/recipe/exec/step`
        : `/api/sessions/${sessionId}/recipe/verify/step`
      const body = aiMode && execSessionId
        ? { step_id: stepId, exec_session_id: execSessionId }
        : { step_id: stepId, verify_session_id: verifySessionId }
      const result = await apiPost(endpoint, body)
      setStepResults((prev) => ({ ...prev, [stepId]: result }))
      // Auto-preview: show first output file on success
      if (result.status === 'success' && result.output_files?.length > 0) {
        setSelectedOutput(result.output_files[0])
      }
    } catch (e) {
      setStepResults((prev) => ({
        ...prev,
        [stepId]: { step_id: stepId, status: 'failed', error: e.message },
      }))
    } finally {
      setRunningStep(null)
    }
  }, [sessionId, verifySessionId, setStepResults])

  // Check if a group can run — dependency-based (external deps must be satisfied)
  const getGroupRunInfo = useCallback((groupIndex) => {
    if (runningAll || runningStep) return { canRun: false }
    const groups = recipe?.groups || []
    const group = groups[groupIndex]
    if (!group) return { canRun: false }
    const groupSet = new Set(group.step_ids)
    for (const sid of group.step_ids) {
      const step = steps.find(s => s.id === sid)
      if (!step || removedSteps.has(sid)) continue
      const sStatus = stepResults[sid]?.status
      if (sStatus === 'success' || sStatus === 'skipped') continue
      for (const depId of step.depends_on || []) {
        if (groupSet.has(depId)) continue // intra-group dep, handled at execution time
        if (removedSteps.has(depId)) continue
        const depStatus = stepResults[depId]?.status
        if (depStatus !== 'success' && depStatus !== 'skipped') return { canRun: false }
      }
    }
    return { canRun: true }
  }, [steps, stepResults, runningAll, runningStep, removedSteps, recipe?.groups])

  // Run all steps in a group sequentially
  const handleRunGroup = useCallback(async (stepIds) => {
    const groupSteps = stepIds
      .map(id => steps.find(s => s.id === id))
      .filter(Boolean)
      .filter(s => !removedSteps.has(s.id))
      .filter(s => stepResults[s.id]?.status !== 'success' && stepResults[s.id]?.status !== 'skipped')

    let lastOutput = null
    for (const step of groupSteps) {
      const depsOk = (step.depends_on || []).every(depId =>
        removedSteps.has(depId) || stepResults[depId]?.status === 'success' || stepResults[depId]?.status === 'skipped'
      )
      if (!depsOk) break

      setRunningStep(step.id)
      try {
        const stepEndpoint = aiMode && execSessionId
          ? `/api/sessions/${sessionId}/recipe/exec/step`
          : `/api/sessions/${sessionId}/recipe/verify/step`
        const stepBody = aiMode && execSessionId
          ? { step_id: step.id, exec_session_id: execSessionId }
          : { step_id: step.id, verify_session_id: verifySessionId }
        const result = await apiPost(stepEndpoint, stepBody)
        setStepResults((prev) => ({ ...prev, [step.id]: result }))
        stepResults[step.id] = result
        // Track last output for auto-preview
        if (result.status === 'success' && result.output_files?.length > 0) {
          lastOutput = result.output_files[0]
        }
        if (result.status === 'failed') break
      } catch (e) {
        const failResult = { step_id: step.id, status: 'failed', error: e.message }
        setStepResults((prev) => ({ ...prev, [step.id]: failResult }))
        break
      }
    }
    // Auto-preview: show last output from the group run
    if (lastOutput) setSelectedOutput(lastOutput)
    setRunningStep(null)
  }, [sessionId, verifySessionId, steps, stepResults, removedSteps, setStepResults])

  // Run all steps
  const handleRunAll = useCallback(async () => {
    setRunningAll(true)
    setBlockedError(null)
    const pending = steps.filter((s) => stepResults[s.id]?.status !== 'success' && stepResults[s.id]?.status !== 'skipped')
    if (pending.length > 0) setRunningStep(pending[0].id)

    try {
      let channel
      if (aiMode && execSessionId) {
        // AI mode: trigger agentic executor (resume=true if some steps already completed)
        const hasCompleted = Object.values(stepResults).some(r => r.status === 'success' || r.status === 'skipped')
        const result = await apiPost(`/api/sessions/${sessionId}/recipe/exec/start`, {
          exec_session_id: execSessionId,
          resume: hasCompleted,
          recipe: recipe,
        })
        if (result.fresh_start) {
          setStepResults({})
          setRunningStep(steps[0]?.id || null)
        }
        channel = result.channel
      } else {
        // Normal mode: deterministic run-all
        const result = await apiPost(`/api/sessions/${sessionId}/recipe/verify/run-all`, {
          verify_session_id: verifySessionId,
        })
        if (result.status === 'already_complete') {
          setRunningAll(false)
          setRunningStep(null)
          return
        }
        channel = result.channel
      }

      const apiBase = getApiBase()
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        userAuthentication: {
          endpoint: `${apiBase}/api/pusher/user-auth`,
          transport: 'ajax',
          headers,
        },
        channelAuthorization: {
          endpoint: `${apiBase}/api/pusher/channel-auth`,
          transport: 'ajax',
          headers,
        },
      })
      pusher.connection.bind('connected', () => pusher.signin())
      const ch = pusher.subscribe(channel)

      let statusPollInterval = null
      const cleanup = () => {
        if (statusPollInterval) clearInterval(statusPollInterval)
        ch.unbind_all()
        pusher.unsubscribe(channel)
        pusher.disconnect()
      }
      pusherCleanupRef.current = cleanup

      ch.bind('step-start', (data) => {
        setRunningStep(data.step_id)
      })

      ch.bind('step-result', (data) => {
        setStepResults((prev) => ({ ...prev, [data.step_id]: data }))
        if (data.fixed) setFixedSteps(prev => new Set([...prev, data.step_id]))
        if (data.status === 'success') {
          if (data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
          const idx = steps.findIndex((s) => s.id === data.step_id)
          const next = steps[idx + 1]
          if (next && stepResults[next.id]?.status !== 'success') {
            setRunningStep(next.id)
          }
        }
      })

      // AI agent mode events
      if (aiMode) {
        // Per-step execution events (from execute_step handler)
        ch.bind('step-running', (data) => {
          setRunningStep(data.step_id)
        })

        ch.bind('step-success', (data) => {
          setStepResults((prev) => ({
            ...prev,
            [data.step_id]: {
              step_id: data.step_id,
              status: 'success',
              duration_s: data.duration_s,
              output_files: data.output_files || [],
            },
          }))
          if (data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
        })

        ch.bind('step-error', (data) => {
          setStepResults((prev) => ({
            ...prev,
            [data.step_id]: { step_id: data.step_id, status: 'failed', error: data.error },
          }))
        })

        // mark_step events (LLM marking steps completed/failed/skipped)
        ch.bind('step-marked', (data) => {
          const status = data.status === 'completed' ? 'success'
            : data.status === 'skipped' ? 'skipped'
            : 'failed'
          setStepResults((prev) => {
            const existing = prev[data.step_id] || {}
            if (existing.status === 'success') return prev
            const result = { ...existing, step_id: data.step_id, status }
            if (data.reason) result.skip_reason = data.reason
            return { ...prev, [data.step_id]: result }
          })
        })

        // Step diffs (code changes made by the agent)
        ch.bind('step-diff', (data) => {
          setCodeDiffs(prev => ({
            ...prev,
            [data.step_id]: { diff: data.diff, field: data.field, truncated: data.diff_truncated }
          }))
        })

        // LLM activity (tool calls, text)
        ch.bind('agent-tool-call', (data) => {
          setLlmFixActivity(prev => {
            const activities = prev._activities || []
            return { ...prev, _activities: [...activities.slice(-30), data] }
          })
        })

        ch.bind('agent-text', (data) => {
          setLlmFixActivity(prev => {
            const activities = prev._activities || []
            return { ...prev, _activities: [...activities.slice(-30), { event_type: 'text', content: data.content }] }
          })
        })

        ch.bind('agent-turn-end', (data) => {
          setRunningStep(null)
          setLlmFixActivity(prev => ({ ...prev, _completed: data.completed, _pending: data.pending }))
        })
      }

      const handleFullCleanup = () => {
        cleanup()
        pusherCleanupRef.current = null
        setRunningAll(false)
        setRunningStep(null)
      }

      const handleExecDone = () => {
        // Don't unlock UI — hardening pass follows. Set hardeningPhase immediately
        // so the Create Workflow button stays disabled (no gap before hardening-started event).
        setRunningStep(null)
        setHardeningPhase('running')
      }

      ch.bind('all-complete', aiMode ? handleExecDone : handleFullCleanup)
      ch.bind('agent-cancelled', handleFullCleanup)
      ch.bind('hardening-complete', handleFullCleanup)
      ch.bind('hardening-error', handleFullCleanup)
      ch.bind('exec-error', (data) => {
        if (data?.error) {
          setBlockedError({ reason: data.error, message: data.error })
        }
        handleFullCleanup()
      })

      if (aiMode) {
        ch.bind('exec-blocked', (data) => {
          setBlockedError({
            stepId: data.step_id,
            reason: data.reason,
            message: data.message,
          })
          handleFullCleanup()
        })

        ch.bind('hardening-started', () => {
          setHardeningPhase('running')
        })

        ch.bind('step-reviewing', (data) => {
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: 'reviewing', reason: '' },
          }))
        })

        ch.bind('step-hardened', (data) => {
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: data.status, reason: data.reason || '' },
          }))
        })

        ch.bind('hardening-complete', () => {
          setHardeningPhase('complete')
        })

        ch.bind('hardening-error', () => {
          setHardeningPhase(null)
        })
      }

      // Fallback: poll status every 30s in case Pusher connection drops during long runs
      if (aiMode) {
        statusPollInterval = setInterval(async () => {
          try {
            const execId = channel.replace('recipe-exec-', '')
            const resp = await fetch(`${apiBase}/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${execId}`, { headers })
            const data = await resp.json()
            // 'hardening' = exec passed, hardening in progress — sync data but don't cleanup
            if (data.status === 'hardening') {
              setHardeningPhase('running')
              // Sync step statuses + hardening info
              if (data.steps?.length > 0) {
                setStepResults(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (updated[step.id]?.status === 'success') continue
                    const status = step.status === 'completed' ? 'success'
                      : step.status === 'skipped' ? 'skipped'
                      : step.status === 'failed' ? 'failed'
                      : null
                    if (status) {
                      updated[step.id] = { ...updated[step.id], step_id: step.id, status }
                      if (step.skip_reason) updated[step.id].skip_reason = step.skip_reason
                      if (step.output_files) updated[step.id].output_files = step.output_files
                    }
                  }
                  return updated
                })
                // Sync hardening statuses
                setHardeningStatus(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (step.hardening_status && step.hardening_status !== 'pending') {
                      updated[step.id] = { status: step.hardening_status, reason: step.hardening_reason || '' }
                    }
                  }
                  return updated
                })
              }
              if (data.diffs && Object.keys(data.diffs).length > 0) {
                setCodeDiffs(prev => {
                  const updated = { ...prev }
                  for (const [stepId, diff] of Object.entries(data.diffs)) {
                    if (!updated[stepId]) {
                      updated[stepId] = { diff, field: 'code', truncated: false }
                    }
                  }
                  return updated
                })
              }
            } else if (data.status === 'success' || data.status === 'incomplete' || data.status === 'error' || data.status === 'blocked') {
              clearInterval(statusPollInterval)
              if (data.status === 'blocked' && data.summary?.blocked_reason) {
                setBlockedError({
                  stepId: data.summary.blocked_step_id,
                  reason: data.summary.blocked_reason,
                  message: `Execution stopped: ${data.summary.blocked_reason}`,
                })
              }
              // Sync step statuses that Pusher may have missed
              if (data.steps?.length > 0) {
                setStepResults(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (updated[step.id]?.status === 'success') continue
                    const status = step.status === 'completed' ? 'success'
                      : step.status === 'skipped' ? 'skipped'
                      : step.status === 'failed' ? 'failed'
                      : null
                    if (status) {
                      updated[step.id] = { ...updated[step.id], step_id: step.id, status }
                      if (step.skip_reason) updated[step.id].skip_reason = step.skip_reason
                      if (step.output_files) updated[step.id].output_files = step.output_files
                    }
                  }
                  return updated
                })
              }
              // Sync hardening statuses from final data
              if (data.steps?.length > 0) {
                setHardeningStatus(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (step.hardening_status && step.hardening_status !== 'pending') {
                      updated[step.id] = { status: step.hardening_status, reason: step.hardening_reason || '' }
                    }
                  }
                  return updated
                })
              }
              // Sync code diffs that Pusher may have missed
              if (data.diffs && Object.keys(data.diffs).length > 0) {
                setCodeDiffs(prev => {
                  const updated = { ...prev }
                  for (const [stepId, diff] of Object.entries(data.diffs)) {
                    if (!updated[stepId]) {
                      updated[stepId] = { diff, field: 'code', truncated: false }
                    }
                  }
                  return updated
                })
              }
              handleFullCleanup()
            }
          } catch {}
        }, 30000)
      }

      if (!aiMode) {
        ch.bind('step-failed', () => {
          cleanup()
          pusherCleanupRef.current = null
          setRunningAll(false)
          setRunningStep(null)
        })
      }

    } catch (e) {
      setRunningAll(false)
      setRunningStep(null)
    }
  }, [sessionId, verifySessionId, steps, stepResults, setStepResults])

  // Re-run all
  const handleRerunAll = useCallback(async () => {
    setStepResults({})
    setSelectedOutput(null)
    setCodeDiffs({})
    setFixedSteps(new Set())
    setLlmFixActivity({})
    setBlockedError(null)
    setRunningAll(true)
    if (steps.length > 0) setRunningStep(steps[0].id)

    try {
      let channel
      if (aiMode && execSessionId) {
        const result = await apiPost(`/api/sessions/${sessionId}/recipe/exec/start`, {
          exec_session_id: execSessionId,
          rerun: true,
          recipe: recipe,
        })
        channel = result.channel
      } else {
        const result = await apiPost(`/api/sessions/${sessionId}/recipe/verify/run-all`, {
          verify_session_id: verifySessionId,
          reset: true,
        })
        if (result.status === 'already_complete') {
          setRunningAll(false)
          setRunningStep(null)
          return
        }
        channel = result.channel
      }

      const apiBase = getApiBase()
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        userAuthentication: {
          endpoint: `${apiBase}/api/pusher/user-auth`,
          transport: 'ajax',
          headers,
        },
        channelAuthorization: {
          endpoint: `${apiBase}/api/pusher/channel-auth`,
          transport: 'ajax',
          headers,
        },
      })
      pusher.connection.bind('connected', () => pusher.signin())
      const ch = pusher.subscribe(channel)

      let statusPollInterval = null
      const cleanup = () => {
        if (statusPollInterval) clearInterval(statusPollInterval)
        ch.unbind_all()
        pusher.unsubscribe(channel)
        pusher.disconnect()
      }
      pusherCleanupRef.current = cleanup

      ch.bind('step-result', (data) => {
        setStepResults((prev) => ({ ...prev, [data.step_id]: data }))
        if (data.fixed) setFixedSteps(prev => new Set([...prev, data.step_id]))
        if (data.status === 'success') {
          if (data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
          const idx = steps.findIndex((s) => s.id === data.step_id)
          const next = steps[idx + 1]
          if (next) setRunningStep(next.id)
        }
      })

      if (aiMode) {
        ch.bind('step-running', (data) => setRunningStep(data.step_id))
        ch.bind('step-success', (data) => {
          setStepResults((prev) => ({
            ...prev,
            [data.step_id]: {
              step_id: data.step_id, status: 'success',
              duration_s: data.duration_s, output_files: data.output_files || [],
            },
          }))
          if (data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
        })
        ch.bind('step-error', (data) => {
          setStepResults((prev) => ({
            ...prev,
            [data.step_id]: { step_id: data.step_id, status: 'failed', error: data.error },
          }))
        })
        ch.bind('step-marked', (data) => {
          const status = data.status === 'completed' ? 'success'
            : data.status === 'skipped' ? 'skipped' : 'failed'
          setStepResults((prev) => {
            const existing = prev[data.step_id] || {}
            if (existing.status === 'success') return prev
            const result = { ...existing, step_id: data.step_id, status }
            if (data.reason) result.skip_reason = data.reason
            return { ...prev, [data.step_id]: result }
          })
        })
        ch.bind('step-diff', (data) => {
          setCodeDiffs(prev => ({
            ...prev,
            [data.step_id]: { diff: data.diff, field: data.field, truncated: data.diff_truncated }
          }))
        })
        ch.bind('agent-tool-call', (data) => {
          setLlmFixActivity(prev => {
            const activities = prev._activities || []
            return { ...prev, _activities: [...activities.slice(-30), data] }
          })
        })
        ch.bind('agent-text', (data) => {
          setLlmFixActivity(prev => {
            const activities = prev._activities || []
            return { ...prev, _activities: [...activities.slice(-30), { event_type: 'text', content: data.content }] }
          })
        })
        ch.bind('agent-turn-end', (data) => {
          setRunningStep(null)
          setLlmFixActivity(prev => ({ ...prev, _completed: data.completed, _pending: data.pending }))
        })
      }

      const handleFullCleanup = () => {
        cleanup()
        pusherCleanupRef.current = null
        setRunningAll(false)
        setRunningStep(null)
      }

      const handleExecDone = () => {
        // Don't unlock UI — hardening pass follows. Set hardeningPhase immediately
        // so the Create Workflow button stays disabled (no gap before hardening-started event).
        setRunningStep(null)
        setHardeningPhase('running')
      }

      ch.bind('all-complete', aiMode ? handleExecDone : handleFullCleanup)
      ch.bind('agent-cancelled', handleFullCleanup)
      ch.bind('hardening-complete', handleFullCleanup)
      ch.bind('hardening-error', handleFullCleanup)
      ch.bind('exec-error', (data) => {
        if (data?.error) {
          setBlockedError({ reason: data.error, message: data.error })
        }
        handleFullCleanup()
      })

      if (aiMode) {
        ch.bind('exec-blocked', (data) => {
          setBlockedError({
            stepId: data.step_id,
            reason: data.reason,
            message: data.message,
          })
          handleFullCleanup()
        })

        ch.bind('hardening-started', () => {
          setHardeningPhase('running')
        })

        ch.bind('step-reviewing', (data) => {
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: 'reviewing', reason: '' },
          }))
        })

        ch.bind('step-hardened', (data) => {
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: data.status, reason: data.reason || '' },
          }))
        })

        ch.bind('step-diff', (data) => {
          setCodeDiffs(prev => ({
            ...prev,
            [data.step_id]: { diff: data.diff, field: data.field, truncated: data.diff_truncated }
          }))
        })
      }

      if (aiMode) {
        statusPollInterval = setInterval(async () => {
          try {
            const execId = channel.replace('recipe-exec-', '')
            const resp = await fetch(`${apiBase}/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${execId}`, { headers })
            const data = await resp.json()
            if (data.status === 'hardening') {
              setHardeningPhase('running')
            } else if (data.status === 'success' || data.status === 'incomplete' || data.status === 'error' || data.status === 'blocked') {
              clearInterval(statusPollInterval)
              if (data.steps?.length > 0) {
                setStepResults(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (updated[step.id]?.status === 'success') continue
                    const status = step.status === 'completed' ? 'success'
                      : step.status === 'skipped' ? 'skipped'
                      : step.status === 'failed' ? 'failed' : null
                    if (status) {
                      updated[step.id] = { ...updated[step.id], step_id: step.id, status }
                      if (step.skip_reason) updated[step.id].skip_reason = step.skip_reason
                      if (step.output_files) updated[step.id].output_files = step.output_files
                    }
                  }
                  return updated
                })
                setHardeningStatus(prev => {
                  const updated = { ...prev }
                  for (const step of data.steps) {
                    if (step.hardening_status && step.hardening_status !== 'pending') {
                      updated[step.id] = { status: step.hardening_status, reason: step.hardening_reason || '' }
                    }
                  }
                  return updated
                })
              }
              if (data.diffs && Object.keys(data.diffs).length > 0) {
                setCodeDiffs(prev => {
                  const updated = { ...prev }
                  for (const [stepId, diff] of Object.entries(data.diffs)) {
                    if (!updated[stepId]) updated[stepId] = { diff, field: 'code', truncated: false }
                  }
                  return updated
                })
              }
              handleFullCleanup()
            }
          } catch {}
        }, 30000)
      }

      if (!aiMode) {
        ch.bind('step-failed', handleFullCleanup)
      }
    } catch (e) {
      setRunningAll(false)
      setRunningStep(null)
    }
  }, [sessionId, verifySessionId, steps, setStepResults, aiMode, execSessionId, recipe])

  // Cleanup Pusher on unmount
  useEffect(() => {
    return () => {
      if (pusherCleanupRef.current) pusherCleanupRef.current()
    }
  }, [])

  return (
    <>
      <DialogContent className="!p-0 flex flex-col !overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              Recipe Steps
            </span>
            <span className="text-[12px] text-[var(--text-muted)] font-mono">
              {completedCount}/{activeSteps.length} completed
              {skippedCount > 0 && ` · ${skippedCount} redundant`}
              {removedSteps.size > 0 && ` (${removedSteps.size} removed)`}
              {isGrouped && ` \u00B7 ${groupCount} section${groupCount !== 1 ? 's' : ''}`}
            </span>
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
            {codeToNl && summaryStatus && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--accent)]">
                <Sparkles size={11} className="animate-pulse" /> {summaryStatus}
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--color-red)]">
                <XCircle size={11} /> {failedCount} failed
              </span>
            )}
            {allPassed && hardeningPhase !== 'running' && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--color-green)]">
                <CheckCircle2 size={11} /> All passed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunAll}
              disabled={runningAll || runningStep !== null || (allPassed && hardeningPhase !== 'running') || (aiMode && !execReady)}
            >
              {runningAll && hardeningPhase === 'running' ? (
                <><Loader2 size={12} className="animate-spin" /> Hardening for schedule safety...</>
              ) : runningAll ? (
                <><Loader2 size={12} className="animate-spin" /> Executing...</>
              ) : aiMode && !execReady ? (
                <><Loader2 size={12} className="animate-spin" /> Preparing...</>
              ) : allPassed && hardeningPhase === 'running' ? (
                <><Play size={12} /> Resume Hardening</>
              ) : (
                <><Play size={12} /> Execute All</>
              )}
            </Button>
            {aiMode && runningAll && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    await apiPost(`/api/sessions/${sessionId}/recipe/exec/cancel`, {
                      exec_session_id: execSessionId,
                    })
                    setRunningAll(false)
                    setRunningStep(null)
                  } catch (e) {
                    console.error('Cancel failed:', e)
                  }
                }}
              >
                <XCircle size={12} /> Cancel
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRegenerate}
                disabled={runningAll || !!summaryStatus}
                title="Re-explain steps"
              >
                <Sparkles size={12} /> Re-explain
              </Button>
            )}
            {aiMode && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                <BrainCircuit size={10} /> AI Mode
              </span>
            )}
          </div>
        </div>

        {/* Blocked Error Banner */}
        {blockedError && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-200 bg-red-50 shrink-0">
            <XCircle size={14} className="text-red-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-red-700">
                Execution stopped
              </span>
              <span className="text-[12px] text-red-600">
                {blockedError.message || blockedError.reason}
              </span>
            </div>
          </div>
        )}

        {/* Recipe Insights Bar (Code-to-English only) */}
        {codeToNl && insights && (
          <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shrink-0 flex-wrap">
            {insights.queryCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--color-primary-500)]">
                <Database size={11} /> {insights.queryCount} {insights.queryCount === 1 ? 'query' : 'queries'}
              </span>
            )}
            {insights.outputFileCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--color-green)]">
                <FileText size={11} /> {insights.outputFileCount} output {insights.outputFileCount === 1 ? 'file' : 'files'}
              </span>
            )}
            {/* Removed: "steps without tracked output" warning — produces false positives on write_file steps */}
            {insights.fallbackCount > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[var(--color-orange)]">
                <AlertTriangle size={11} /> {insights.fallbackCount} generic
              </span>
            )}
          </div>
        )}

        {/* Widget filter pills (petavue users, React dashboards only) */}
        {widgetEntries.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] shrink-0 flex-wrap">
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

        {/* Two-column layout with draggable divider */}
        <div ref={containerRef} className="flex flex-1 min-h-0">
          {/* Left: step list */}
          <div
            className={`overflow-y-auto ${isGrouped ? 'space-y-2' : 'space-y-3'}`}
            style={{ width: selectedOutput ? `${splitPercent}%` : '100%' }}
          >
            {/* Optional top content (e.g. workflow name, banners) — scrolls with steps */}
            {topBarExtra}

            {/* Steps area with padding */}
            <div className="p-3 space-y-3">
            {codeToNl && summaryStatus ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5">
                  <Sparkles size={14} className="text-[var(--accent)] animate-pulse shrink-0" />
                  <span className="text-[14px] text-[var(--accent)] font-medium">{summaryStatus}</span>
                </div>
                {Array.from({ length: Math.min(steps.length || 5, 8) }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden animate-pulse">
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <div className="w-5 h-5 rounded bg-[var(--bg-hover)]" />
                      <div className="h-3.5 rounded bg-[var(--bg-hover)] w-[30%]" />
                      <div className="ml-auto h-3 rounded bg-[var(--bg-hover)] w-[15%]" />
                    </div>
                    <div className="px-3.5 py-2.5 border-t border-[var(--border-primary)]/50 space-y-2">
                      <div className="h-3 rounded bg-[var(--bg-hover)] w-[90%]" />
                      <div className="h-3 rounded bg-[var(--bg-hover)] w-[75%]" />
                      <div className="h-3 rounded bg-[var(--bg-hover)] w-[60%]" />
                    </div>
                  </div>
                ))}
              </>
            ) : isGrouped ? (
              recipe.groups.map((group, gIdx) => {
                const groupSteps = group.step_ids
                  .map((id) => steps.find((s) => s.id === id))
                  .filter(Boolean)

                return (
                  <RecipeGroupCard
                    key={group.group_name}
                    group={group}
                    groupIndex={gIdx}
                    steps={groupSteps}
                    expanded={!!expandedGroups[gIdx]}
                    onToggle={() => toggleGroup(gIdx)}
                    onRunGroup={() => handleRunGroup(group.step_ids)}
                    hideRunButton={aiMode}
                    groupRunInfo={getGroupRunInfo(gIdx)}
                    isRunning={!!runningStep && group.step_ids.includes(runningStep)}
                    disabled={runningAll || !!runningStep}
                    stepResults={stepResults}
                    removedSteps={removedSteps}
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
                          onRun={handleRunStep}
                          onViewOutput={(f) => setSelectedOutput(f)}
                          canRun={canRunStep(step)}
                          isRunning={runningStep === step.id}
                          removed={removedSteps.has(step.id)}
                          onRemove={handleRemoveStep}
                          onRestore={handleRestoreStep}
                          viewMode={viewMode}
                          summaryLoading={false}
                          widgetTags={getWidgetTagsForStep(step.id)}
                          isFixed={fixedSteps.has(step.id)}
                          llmFixData={aiMode ? llmFixActivity[step.id] : null}
                          codeDiff={aiMode ? codeDiffs[step.id] : null}
                          skipReason={stepResults[step.id]?.skip_reason || null}
                          hideRunButton={aiMode}
                          hardeningInfo={hardeningStatus[step.id] || null}
                        />
                      )
                    })}
                  </RecipeGroupCard>
                )
              })
            ) : (
              steps.map((step, idx) => (
                <RecipeStepCell
                  key={step.id}
                  step={step}
                  stepIndex={idx}
                  result={stepResults[step.id]}
                  onRun={handleRunStep}
                  onViewOutput={(f) => setSelectedOutput(f)}
                  canRun={canRunStep(step)}
                  isRunning={runningStep === step.id}
                  removed={removedSteps.has(step.id)}
                  onRemove={handleRemoveStep}
                  onRestore={handleRestoreStep}
                  collapsed={!!collapsedSteps[step.id]}
                  onToggleCollapse={() => setCollapsedSteps(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                  viewMode={viewMode}
                  summaryLoading={false}
                  widgetTags={getWidgetTagsForStep(step.id)}
                  skipReason={stepResults[step.id]?.skip_reason || null}
                  hideRunButton={aiMode}
                  hardeningInfo={hardeningStatus[step.id] || null}
                />
              ))
            )}

            {/* Target file card — always visible, clickable to preview */}
            {recipe?.target_file && (
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                  selectedOutput?.path === recipe.target_file
                    ? 'border-[var(--accent)] bg-[var(--accent)]/6'
                    : 'border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/4'
                }`}
                onClick={() => setSelectedOutput({ path: recipe.target_file, type: recipe.target_file.endsWith('.html') ? 'html' : 'file' })}
              >
                <FileText size={14} className="text-[var(--accent)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">Target Output</span>
                  <span className="text-[12px] text-[var(--text-muted)] ml-2 font-mono">{recipe.target_file}</span>
                </div>
                {allPassed && (
                  <span className="text-[10px] text-[var(--color-green)] font-medium">Ready to preview</span>
                )}
              </div>
            )}

            {/* Optional content after steps (e.g. AI/Action blocks) */}
            {afterSteps}

            {/* Feedback input (AI mode — always visible, disabled while running) */}
            {aiMode && execSessionId && (completedCount > 0 || skippedCount > 0 || failedCount > 0) && (
              <FeedbackInput
                sessionId={sessionId}
                execSessionId={execSessionId}
                disabled={runningAll}
                onAgentRestart={() => setRunningAll(true)}
                onAgentDone={(syncSteps, syncDiffs) => {
                  if (syncSteps?.length > 0) {
                    setStepResults(prev => {
                      const updated = { ...prev }
                      for (const step of syncSteps) {
                        if (updated[step.id]?.status === 'success') continue
                        const st = step.status === 'completed' ? 'success'
                          : step.status === 'skipped' ? 'skipped'
                          : step.status === 'failed' ? 'failed' : null
                        if (st) {
                          updated[step.id] = { ...updated[step.id], step_id: step.id, status: st }
                          if (step.skip_reason) updated[step.id].skip_reason = step.skip_reason
                        }
                      }
                      return updated
                    })
                  }
                  if (syncDiffs && Object.keys(syncDiffs).length > 0) {
                    setCodeDiffs(prev => {
                      const updated = { ...prev }
                      for (const [stepId, diff] of Object.entries(syncDiffs)) {
                        if (!updated[stepId]) updated[stepId] = { diff, field: 'code', truncated: false }
                      }
                      return updated
                    })
                  }
                  setRunningAll(false)
                  setRunningStep(null)
                }}
              />
            )}
            </div>
          </div>

          {/* Draggable divider + Right: output preview */}
          {selectedOutput && (
            <>
              <DragDivider onDrag={handleDrag} />
              <div className="min-w-0 self-stretch" style={{ width: `${100 - splitPercent}%` }}>
                <OutputPreview
                  sessionId={verifySessionId}
                  file={selectedOutput}
                  onClose={() => setSelectedOutput(null)}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>

      <DialogFooter className="!justify-between">
        <Button variant="secondary" type="button" onClick={onBack} disabled={runningAll}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {allPassed && (
            <Button variant="ghost" type="button" onClick={handleRerunAll} disabled={runningAll}>
              <RotateCcw size={13} /> Re-run All
            </Button>
          )}
          {completedCount > 0 && onSaveDraft && (
            <Button variant="ghost" type="button" onClick={onSaveDraft} disabled={runningAll}>
              <Save size={13} /> Save Draft
            </Button>
          )}
          <Button
            variant="primary"
            type="button"
            onClick={onPublish}
            disabled={(!allPassed && !hasExtraBlockChanges) || publishing || runningAll || hardeningPhase === 'running' || hasIncompleteSlackBlock}
          >
            {publishLabel
              ? (publishing ? `${publishLabel}...` : publishLabel)
              : (publishing ? (isUpdate ? 'Updating...' : 'Publishing...') : (isUpdate ? 'Update Dashboard' : 'Publish'))}
          </Button>
        </div>
      </DialogFooter>

    </>
  )
}


function FeedbackInput({ sessionId, execSessionId, disabled, onAgentRestart, onAgentDone }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return
    setSending(true)
    try {
      await apiPost(`/api/sessions/${sessionId}/recipe/exec/feedback`, {
        exec_session_id: execSessionId,
        message: text.trim(),
      })
      setText('')
      if (onAgentRestart) onAgentRestart()

      // Poll /sync until feedback agent finishes
      const apiBase = getApiBase()
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const resp = await fetch(`${apiBase}/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${execSessionId}`, { headers })
          const data = await resp.json()
          if (data.status !== 'running' && data.status !== 'preparing') {
            clearInterval(pollRef.current)
            pollRef.current = null
            setSending(false)
            if (onAgentDone) onAgentDone(data.steps, data.diffs)
          }
        } catch {}
      }, 10000)
    } catch (e) {
      console.error('Feedback failed:', e)
      setSending(false)
    }
  }

  const isDisabled = disabled || sending

  return (
    <div className="flex items-center gap-2 mt-3 px-1 pb-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder={isDisabled ? 'Agent is working...' : 'Give feedback to the agent...'}
        disabled={isDisabled}
        className="flex-1 text-[12px] border border-[var(--border-primary)] rounded-md px-2.5 py-1.5 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)] disabled:opacity-50"
      />
      <Button variant="primary" size="sm" onClick={handleSend} disabled={isDisabled || !text.trim()}>
        {sending ? <Loader2 size={12} className="animate-spin" /> : 'Send'}
      </Button>
    </div>
  )
}
