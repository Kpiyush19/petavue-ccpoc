import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle, Globe, ArrowLeft, Workflow, Lightbulb, X, ChevronDown, ChevronRight, Database, Code, FileText, Save } from 'lucide-react'
import { Button } from '@/ui'
import { Badge } from '@/ui'
import { apiGet, apiPost, getApiBase, getAuthToken } from '../api'
import { timeAgo } from '@/utils/relativeTimeDiff'
import { useSessionContext } from '../contexts/SessionContext'

const BLOCK_TYPE_ICONS = {
  athena_query: Database,
  python_code: Code,
  write_file: FileText,
  save_output: Save,
}

const BLOCK_TYPE_LABELS = {
  athena_query: 'Data Query',
  python_code: 'Python Code',
  write_file: 'Write File',
  save_output: 'Save Output',
}

export default function DashboardDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useSessionContext()
  const [artifact, setArtifact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)

  // Find out how
  const [showExplanation, setShowExplanation] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState(new Set())
  const [showCode, setShowCode] = useState(new Set())
  const [panelWidth, setPanelWidth] = useState(420)

  // Drag resize
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(420)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth

    const handleMouseMove = (e) => {
      if (!dragging.current) return
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.min(Math.max(dragStartWidth.current + delta, 320), window.innerWidth * 0.85)
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [panelWidth])

  const fetchedFor = useRef(null)
  useEffect(() => {
    if (!id) return
    if (fetchedFor.current === id) return
    fetchedFor.current = id

    apiGet(`/api/workflows/dashboards/${id}`)
      .then((data) => setArtifact(data))
      .catch(() => {
        toast.error('Dashboard not found')
        navigate('/dashboards', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleChat = async () => {
    if (!artifact) return
    setChatLoading(true)
    try {
      let data
      if (artifact.source === 'workflow') {
        data = await apiPost(`/api/workflows/${artifact.workflow_id}/chat`, {})
      } else {
        data = await apiPost(`/api/published/${id}/chat`, {})
      }
      if (data.session_id) {
        await session.resumeSession(data.session_id)
        navigate(`/session/${data.session_id}`)
      }
    } catch (e) {
      toast.error('Failed to start chat: ' + e.message)
    } finally {
      setChatLoading(false)
    }
  }

  const handleFindOutHow = async () => {
    if (explanation) {
      setShowExplanation(true)
      return
    }
    setShowExplanation(true)
    setExplanationLoading(true)
    try {
      const data = await apiGet(`/api/workflows/dashboards/${id}/explanation`)
      if (data.explanation) {
        setExplanation(data)
        setExpandedSteps(new Set())
      } else {
        toast.error(data.reason || 'No explanation available')
        setShowExplanation(false)
      }
    } catch (e) {
      toast.error('Failed to load explanation')
      setShowExplanation(false)
    } finally {
      setExplanationLoading(false)
    }
  }

  const toggleStep = (stepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const toggleCode = (stepId) => {
    setShowCode((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-[var(--text-muted)] animate-thinking">Loading dashboard...</div>
      </div>
    )
  }

  if (!artifact) return null

  const isWorkflow = artifact.source === 'workflow'
  const dashboardId = artifact.dashboard_id || artifact.published_id || id

  let iframeUrl = null
  if (artifact.latest_run) {
    if (isWorkflow) {
      iframeUrl = `${getApiBase()}/api/workflows/dashboards/${dashboardId}/files/${artifact.target_file}?token=${encodeURIComponent(getAuthToken() || '')}`
    } else {
      iframeUrl = `${getApiBase()}/api/published/${dashboardId}/files/${artifact.target_file}?token=${encodeURIComponent(getAuthToken() || '')}`
    }
  }

  const DashIcon = isWorkflow ? Workflow : Globe

  const renderSteps = () => {
    if (!explanation?.explanation?.steps) return null
    const steps = explanation.explanation.steps
    const groups = explanation.explanation.groups || []
    const blockMeta = explanation.block_meta || {}

    if (groups.length > 0) {
      return groups.map((group, gi) => {
        const title = group.group_title || group.group_name || `Group ${gi + 1}`
        const desc = group.summary || group.group_explanation || group.group_description || ''
        return (
          <div key={gi} className="mb-5">
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-semibold text-[var(--accent)]">
                {gi + 1}
              </div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">{title}</div>
            </div>
            {desc && (
              <p className="text-[12px] text-[var(--text-secondary)] mb-2.5 px-1 ml-7 leading-relaxed">{desc}</p>
            )}
            <div className="ml-3 border-l-2 border-[var(--accent)]/15 pl-4">
              {(group.step_ids || []).map((stepId) => {
                const step = steps[stepId]
                if (!step) return null
                return renderStepCard(stepId, step, blockMeta[stepId])
              })}
            </div>
          </div>
        )
      })
    }

    return Object.entries(steps).map(([stepId, step]) =>
      renderStepCard(stepId, step, blockMeta[stepId])
    )
  }

  const renderStepCard = (stepId, step, meta) => {
    const isExpanded = expandedSteps.has(stepId)
    const isCodeVisible = showCode.has(stepId)
    const TypeIcon = BLOCK_TYPE_ICONS[meta?.type] || Code
    const typeLabel = BLOCK_TYPE_LABELS[meta?.type] || meta?.type || 'Step'
    const hasCode = meta?.code && (meta.type === 'athena_query' || meta.type === 'python_code')

    const explanationText = step.explanation || ''
    const hasBullets = explanationText.includes('\n- ')

    return (
      <div
        key={stepId}
        className="mb-2 border border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-tertiary)]"
      >
        {/* Step header */}
        <button
          onClick={() => toggleStep(stepId)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left bg-transparent border-none cursor-pointer
            hover:bg-[var(--bg-hover)] transition-colors"
        >
          {isExpanded
            ? <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
            : <ChevronRight size={12} className="text-[var(--text-muted)] shrink-0" />
          }
          <div className="w-6 h-6 rounded-md bg-[var(--accent)]/8 flex items-center justify-center shrink-0">
            <TypeIcon size={12} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium text-[var(--text-primary)] truncate">
              {step.title || meta?.label || stepId}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">{typeLabel}</div>
          </div>
        </button>

        {/* Step body */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 ml-[42px]">
            {/* Explanation */}
            {explanationText && (
              hasBullets ? (
                <ul className="text-[12px] text-[var(--text-secondary)] space-y-1 list-disc list-inside mb-2">
                  {explanationText.split('\n').filter((l) => l.trim()).map((line, i) => (
                    <li key={i}>{line.replace(/^-\s*/, '')}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-2">{explanationText}</p>
              )
            )}

            {/* Code toggle */}
            {hasCode && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleCode(stepId) }}
                  className="flex items-center gap-1 text-[12px] text-[var(--accent)] hover:underline
                    bg-transparent border-none cursor-pointer mb-1"
                >
                  <Code size={10} />
                  {isCodeVisible ? 'Hide code' : `View ${meta.code_language === 'sql' ? 'SQL' : 'Python'}`}
                </button>
                {isCodeVisible && (
                  <pre className="text-[12px] leading-relaxed bg-[var(--bg-primary)] border border-[var(--border-primary)]
                    rounded-md p-2.5 overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-[var(--text-secondary)]
                    whitespace-pre-wrap break-words">
                    {meta.code}
                  </pre>
                )}
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboards')} title="Back to dashboards">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <DashIcon size={14} className="text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{artifact.name}</h2>
              {artifact.shared && <Badge variant="accent">Shared</Badge>}
              {artifact.paused && <Badge variant="warning">Paused</Badge>}
              {isWorkflow && <Badge variant="muted">Workflow</Badge>}
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 ml-6">
              {artifact.target_file}
              {artifact.latest_run && ` · Refreshed ${timeAgo(artifact.latest_run.refreshed_at)}`}
              {artifact.schedule && ` · ${artifact.schedule.cron_description}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isWorkflow && (
            <Button variant="ghost" size="sm" onClick={handleFindOutHow}>
              <Lightbulb size={14} />
              Find out how
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleChat} disabled={chatLoading || !artifact.latest_run}>
            <MessageCircle size={14} />
            {chatLoading ? 'Starting...' : 'Sage (Beta)'}
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-0 relative">
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title={artifact.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
            No refresh completed yet. Trigger a refresh first.
          </div>
        )}

        {/* Slide-in explanation overlay */}
        {showExplanation && (
          <>
            <div
              className="absolute inset-0 bg-black/20 z-[10]"
              onClick={() => setShowExplanation(false)}
            />

            <div
              className="absolute top-0 right-0 h-full z-[20]
                bg-[var(--bg-surface)] border-l border-[var(--border-primary)] shadow-2xl
                flex flex-col"
              style={{ width: panelWidth, animation: 'slideInRight 0.25s ease-out' }}
            >
              {/* Drag handle */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize z-[30]
                  hover:bg-[var(--accent)]/20 active:bg-[var(--accent)]/30 transition-colors"
                title="Drag to resize"
              />

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)] shrink-0">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-[var(--accent)]" />
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">How this dashboard is built</h3>
                    {explanation?.workflow_name && (
                      <p className="text-[12px] text-[var(--text-muted)]">{explanation.workflow_name}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {explanationLoading && (
                  <div className="text-center py-12 text-sm text-[var(--text-muted)] animate-thinking">
                    Loading explanation...
                  </div>
                )}

                {!explanationLoading && !explanation && (
                  <div className="text-center py-12 text-sm text-[var(--text-muted)]">
                    No explanation available.
                  </div>
                )}

                {!explanationLoading && explanation && renderSteps()}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
