import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Pusher from 'pusher-js'
import {
  ArrowLeft, SquaresFour, CaretRight, Play,
  CircleNotch, CheckCircle, XCircle, Spinner, ArrowsClockwise, PencilSimple, Sparkle,
  ArrowsOutSimple, ArrowsInSimple,
} from '@phosphor-icons/react'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../../../config'
import { apiPost, apiGet, apiDelete, getApiBase, getAuthToken, getCurrentUser } from '../../../api'
import { Button } from '@/common-components'
import RecipeGroupCard from '../../RecipeGroupCard'
import RecipeStepCell from '../../RecipeStepCell'
import OutputPreview from '../../OutputPreview'
import HardeningChat from './HardeningChat'
import MarkdownRenderer from '../../../common-utils/MarkdownRenderer'
import SlackChannelPicker from '../../shared/SlackChannelPicker'
import WidgetListView from './WidgetListView'
import WidgetDetailView from './WidgetDetailView'

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '30']) {
      const hh = String(h).padStart(2, '0')
      const label = `${h === 0 ? '12' : h > 12 ? h - 12 : h}:${m} ${h < 12 ? 'AM' : 'PM'}`
      opts.push({ value: `${hh}:${m}`, label })
    }
  }
  return opts
})()

const COMMON_TIMEZONES = [
  // Americas
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Sao_Paulo',
  // Asia
  'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  // Middle East
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Qatar',
  // Australia / Pacific
  'Australia/Sydney', 'Pacific/Auckland',
  // Europe
  'Europe/Berlin', 'Europe/London', 'Europe/Paris',
  // UTC
  'UTC',
]

function CustomSelect({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current?.contains(e.target)) return
      if (dropRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer hover:border-[var(--accent)]/50 transition-colors text-left"
      >
        <span className="truncate">{selected?.label || value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          style={(() => {
            const rect = btnRef.current?.getBoundingClientRect()
            if (!rect) return { position: 'fixed', zIndex: 9999 }
            const spaceBelow = window.innerHeight - rect.bottom
            const openUp = spaceBelow < 220
            return {
              position: 'fixed',
              ...(openUp
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
              left: rect.left,
              width: Math.max(rect.width, 140),
              zIndex: 9999,
            }
          })()}
          className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[11px] border-none cursor-pointer transition-colors ${
                opt.value === value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

function buildCronExpression(frequency, day, time) {
  const [hh, mm] = time.split(':')
  switch (frequency) {
    case 'daily': return `${mm} ${hh} * * *`
    case 'weekly': return `${mm} ${hh} * * ${day}`
    case 'biweekly': return `${mm} ${hh} 1-7,15-21 * ${day}`
    case 'monthly': return `${mm} ${hh} ${day} * *`
    default: return `${mm} ${hh} * * *`
  }
}

/**
 * Extract a format guide (heading skeleton + structural hints) from markdown.
 * No data values — just section names and formatting patterns.
 */
function extractFormatGuide(markdown) {
  if (!markdown) return ''
  const lines = markdown.split('\n')
  const guide = []
  for (const line of lines) {
    const trimmed = line.trim()
    // Headings
    if (/^#{1,4}\s/.test(trimmed)) {
      guide.push(trimmed.replace(/[0-9,.]+/g, '{value}').replace(/\{value\}\s*/g, '').trim() || trimmed)
    }
    // Table header row (contains |)
    else if (trimmed.startsWith('|') && trimmed.includes('|') && !trimmed.match(/^[\s|:-]+$/)) {
      if (!guide.includes('(markdown table)')) guide.push('(markdown table)')
    }
    // Blockquote
    else if (trimmed.startsWith('>') && !guide.includes('(blockquote)')) {
      guide.push('(blockquote)')
    }
    // Numbered list start
    else if (/^\d+\.\s/.test(trimmed) && !guide[guide.length - 1]?.includes('numbered list')) {
      guide.push('(numbered list)')
    }
    // Bullet list start
    else if (/^[-*]\s/.test(trimmed) && !guide[guide.length - 1]?.includes('bullet list')) {
      guide.push('(bullet list)')
    }
  }
  return guide.join('\n')
}

// Verification flow phases
const PHASE = {
  IDLE: 'idle',
  EXTRACTING: 'extracting',
  PREPARING: 'preparing',
  EXECUTING: 'executing',
  HARDENING: 'hardening',
  REVIEWED: 'reviewed',          // review (and hardening, if recurring) passed — ready to confirm
  CREATING_WORKFLOW: 'creating_workflow',
  DONE: 'done',
  ERROR: 'error',
}

// Wizard steps. "Verify" (per-widget review) is the first step; "Review" is
// the mandatory agentic check that gates publishing.
const STEP = { VERIFY: 'verify', OUTPUTS: 'outputs', FREQUENCY: 'frequency', REVIEW: 'review', CONFIRM: 'confirm' }
const STEP_ORDER = [STEP.VERIFY, STEP.OUTPUTS, STEP.FREQUENCY, STEP.REVIEW, STEP.CONFIRM]
const STEP_LABELS = {
  [STEP.VERIFY]: 'Verify',
  [STEP.OUTPUTS]: 'Outputs',
  [STEP.FREQUENCY]: 'Frequency',
  [STEP.REVIEW]: 'Review',
  [STEP.CONFIRM]: 'Confirm',
}

const PROGRESS_MESSAGES_REFRESH = [
  'Replaying every data query against live sources...',
  'Would your SQL survive a schema change at 2 AM? Let\'s find out.',
  'Did someone sneak a hardcoded date into one of these queries?',
  'What if the CSV your chart depends on comes back empty tomorrow?',
  'Ensuring your charts won\'t show stale numbers next week',
  'Can every SQL query here survive a schema migration?',
  'Removing dates that would freeze your dashboard in time',
  'Verifying file dependencies chain correctly',
  'How many of these date filters will silently freeze next month?',
  'Confirming widget renders produce valid output',
  'Catching fragile patterns before they catch you',
  'Unlike typical AI tools, we verify every step actually runs',
  'Replacing brittle date filters with dynamic expressions',
  'How would this pipeline behave with completely fresh data? Let\'s find out',
  'Ensuring your dashboard is self-sustaining, not prompt-dependent',
  'Double-checking that CSVs have the columns your charts expect',
  'Most AI dashboards break on refresh — yours won\'t',
  'Validating that aggregations match the source schema',
  'Making your dashboard production-grade, not demo-grade',
  'Confirming no query references a table that moved',
  'What\'s hiding in that WHERE clause — a dynamic range or a frozen snapshot?',
  'Testing the full pipeline: query → transform → render',
  'Catching NULL surprises before your stakeholders do',
  'Ensuring every widget can rebuild itself from scratch',
  'Your dashboard is learning to refresh itself',
  'Verifying data flows from source to chart, no gaps',
  'Are those column names stable, or is one schema change away from chaos?',
  'How does a typical AI tool handle this? Hint: it doesn\'t even check',
  'Typical dashboards need babysitting — this one won\'t',
  'Checking that join keys still match across tables',
  'Preparing your dashboard for scheduled auto-refresh',
  'Validating that no step depends on a one-time upload',
  'What if tomorrow\'s data has a format your Python script has never seen?',
  'Running the same pipeline your schedule will run',
  'Catching edge cases that only appear with fresh data',
  'Turning a conversation into a repeatable data pipeline',
  'Making sure your insights stay fresh without manual effort',
  'Verifying that transformations handle empty results gracefully',
  'Your dashboard is graduating from prototype to production',
  'Turning your conversation into something that runs on autopilot — almost there',
]

const PROGRESS_MESSAGES_PUBLISH = [
  'Replaying every data query against live sources...',
  'Verifying that all SQL queries return valid results',
  'Checking that your data transformations produce correct output',
  'Unlike typical AI tools, we verify every step actually runs',
  'Confirming widget renders produce valid output',
  'Double-checking that CSVs have the columns your charts expect',
  'Validating that aggregations match the source schema',
  'Making your dashboard production-grade, not demo-grade',
  'Confirming no query references a table that moved',
  'Testing the full pipeline: query → transform → render',
  'Catching NULL surprises before your stakeholders do',
  'Verifying data flows from source to chart, no gaps',
  'Checking that join keys still match across tables',
  'Are those column names stable, or will a schema change break things?',
  'How does a typical AI tool handle this? Hint: it doesn\'t even check',
  'Verifying file dependencies chain correctly',
  'Ensuring every widget renders without errors',
  'Validating that no step depends on a missing file',
  'Confirming all data files have the expected structure',
  'Running each step to make sure your dashboard is complete and correct',
  'Catching edge cases before your stakeholders do',
  'Your dashboard is graduating from prototype to production',
  'Verifying that transformations handle edge cases gracefully',
  'Almost there — confirming everything looks good',
]

export default function PublishView({
  dashboardTitle = '',
  setDashboardTitle,
  widgets = [],
  widgetCount = 0,
  onWidgetVerified,
  sessionId,
  sessionStatus,
  liveMessages = [],
  onSendFeedback,
  onClose,
  onRequestMaximize,
}) {
  const navigate = useNavigate()
  const isPetavueUser = (getCurrentUser()?.email || '').includes('@petavue.com')

  // Wizard step + review-passed gate
  const [step, setStep] = useState(STEP.VERIFY)
  const [reviewPassed, setReviewPassed] = useState(false)
  const [selectedWidget, setSelectedWidget] = useState(null) // for the Verify step

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [publishDashboardEnabled, setPublishDashboardEnabled] = useState(true)

  // Schedule config
  const [scheduleType, setScheduleType] = useState('data_sync') // 'data_sync' | 'custom'
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly')
  const [scheduleDay, setScheduleDay] = useState('1') // 0=Sun, 1=Mon, ... 6=Sat (or 1-28 for monthly)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleTimezone, setScheduleTimezone] = useState(() => {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone
    return COMMON_TIMEZONES.includes(browser) ? browser : 'UTC'
  })

  // Existing workflow detection
  const [existingWorkflows, setExistingWorkflows] = useState(null)
  const [existingLoading, setExistingLoading] = useState(true)
  const [updateMode, setUpdateMode] = useState(null) // null = not decided, workflow obj = update, false = create new
  const [showExistingDropdown, setShowExistingDropdown] = useState(false)

  // Verification state
  const [phase, setPhase] = useState(PHASE.IDLE)
  const [phaseMessage, setPhaseMessage] = useState('')
  const [totalSteps, setTotalSteps] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [progressQuip, setProgressQuip] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [workflowId, setWorkflowId] = useState(null)
  const [dashboardId, setDashboardId] = useState(null)
  const [wasUpdate, setWasUpdate] = useState(false)
  const quipIndexRef = useRef(0)
  const progressMessagesRef = useRef(PROGRESS_MESSAGES_REFRESH)

  // Draft state
  const [draftInfo, setDraftInfo] = useState(null) // { exec_session_id, step_results, hardening_status, diffs, total_steps, steps_completed, stale }
  const [draftLoading, setDraftLoading] = useState(true)

  // Hardening state (when autoRefresh is on)
  const [recipe, setRecipe] = useState(null)
  const [stepResults, setStepResults] = useState({})
  const [hardeningStatus, setHardeningStatus] = useState({})
  const [codeDiffs, setCodeDiffs] = useState({})
  const [hardeningPhase, setHardeningPhase] = useState(null) // null | 'running' | 'complete'
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [hardeningLoading, setHardeningLoading] = useState(false)
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [collapsedSteps, setCollapsedSteps] = useState({})
  const [adjustmentSplitPct, setAdjustmentSplitPct] = useState(50)
  const adjustmentDragging = useRef(false)
  const adjustmentContainerRef = useRef(null)
  const [publishSplitPct, setPublishSplitPct] = useState(35) // left panel % of total width
  const publishDragging = useRef(false)
  const publishContainerRef = useRef(null)
  const hardeningQuipRef = useRef(0)
  const hardeningQuipIntervalRef = useRef(null)
  const [hardeningQuip, setHardeningQuip] = useState('')
  const agentRunningRef = useRef(false) // true while execution or hardening is actively running on backend

  // AI Preview state (agent_memo)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiFilename, setAiFilename] = useState('memo')
  const [aiPreviewRunning, setAiPreviewRunning] = useState(false)
  const [aiPreviewContent, setAiPreviewContent] = useState(null)
  const [aiPreviewError, setAiPreviewError] = useState('')
  const [aiPreviewMemoPath, setAiPreviewMemoPath] = useState(null)
  const aiPreviewSessionRef = useRef(null)
  const aiPusherRef = useRef(null)
  const publishPollRef = useRef(null)

  // Slack notification state
  const [slackChannels, setSlackChannels] = useState([])
  const [slackDmUsers, setSlackDmUsers] = useState([])

  // Action block toggles
  const [aiBlockEnabled, setAiBlockEnabled] = useState(false)
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [slackTestSending, setSlackTestSending] = useState(false)

  // Refs for cleanup
  const pusherRef = useRef(null)
  const pollRef = useRef(null)
  const aliveRef = useRef(true)
  const execSessionIdRef = useRef(null)
  const workflowCreatedRef = useRef(false)
  const autoRefreshRef = useRef(autoRefresh)

  useEffect(() => { autoRefreshRef.current = autoRefresh }, [autoRefresh])

  const stepResultsRef = useRef(stepResults)
  useEffect(() => { stepResultsRef.current = stepResults }, [stepResults])
  const recipeRef = useRef(recipe)
  useEffect(() => { recipeRef.current = recipe }, [recipe])

  // Derived hardening counts
  const hardeningProcessedCount = Object.values(hardeningStatus).filter(s => s.status && s.status !== 'pending').length
  const adjustmentCount = Object.values(hardeningStatus).filter(s => s.status === 'hardened').length
  const totalHardeningSteps = recipe?.steps?.length || totalSteps

  // Hardening quip rotation
  useEffect(() => {
    if (hardeningPhase === 'running') {
      const msgs = PROGRESS_MESSAGES_REFRESH
      setHardeningQuip(msgs[hardeningQuipRef.current % msgs.length])
      hardeningQuipRef.current++
      hardeningQuipIntervalRef.current = setInterval(() => {
        setHardeningQuip(msgs[hardeningQuipRef.current % msgs.length])
        hardeningQuipRef.current++
      }, 15000)
    }
    return () => {
      if (hardeningQuipIntervalRef.current) {
        clearInterval(hardeningQuipIntervalRef.current)
        hardeningQuipIntervalRef.current = null
      }
    }
  }, [hardeningPhase])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (pusherRef.current) { pusherRef.current.disconnect(); pusherRef.current = null }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (aiPusherRef.current) { aiPusherRef.current.disconnect(); aiPusherRef.current = null }
      if (aiPollRef.current) { clearInterval(aiPollRef.current); aiPollRef.current = null }
      if (publishPollRef.current) { clearInterval(publishPollRef.current); publishPollRef.current = null }
      // Cancel if agent is actively running (execution or hardening)
      const execSid = execSessionIdRef.current
      if (execSid && sessionId && agentRunningRef.current) {
        apiPost(`/api/sessions/${sessionId}/recipe/exec/cancel`, {
          exec_session_id: execSid,
        }).catch(() => {})
      }
      // Clean up AI preview session
      const execSidForCleanup = execSessionIdRef.current
      if (execSidForCleanup && sessionId) {
        apiDelete(`/api/sessions/${sessionId}/ai-preview?exec_session_id=${encodeURIComponent(execSidForCleanup)}`).catch(() => {})
      }
      execSessionIdRef.current = null
    }
  }, [])

  // Warn on browser refresh while agent is running
  useEffect(() => {
    const handler = (e) => {
      if (agentRunningRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Check for existing workflows on mount
  useEffect(() => {
    if (!sessionId) { setExistingLoading(false); return }
    apiGet(`/api/workflows/check?session_id=${encodeURIComponent(sessionId)}&target_file=${encodeURIComponent('output/dashboard/index.html')}`)
      .then((data) => {
        if (!aliveRef.current) return
        if (data?.exists && data.workflows?.length > 0) {
          setExistingWorkflows(data.workflows)
          // Default to create new — let user decide to update existing
          setUpdateMode(false)
        }
        setExistingLoading(false)
      })
      .catch(() => { if (aliveRef.current) setExistingLoading(false) })
  }, [sessionId])

  // Populate action block states when user selects an existing workflow to update
  useEffect(() => {
    if (!updateMode || !updateMode.workflow_id) return
    const blocks = updateMode.blocks || []
    const schedule = updateMode.schedule || {}

    // AI block
    const aiBlock = blocks.find(b => b.type === 'ai_summarize')
    if (aiBlock?.config) {
      setAiBlockEnabled(true)
      setAiPrompt(aiBlock.config.prompt || '')
      const outFile = aiBlock.config.output_file || ''
      const match = outFile.match(/^agent_memo\/(.+)\.md$/)
      if (match) setAiFilename(match[1])
    } else {
      setAiBlockEnabled(false)
    }

    // Slack block
    const slackBlock = blocks.find(b => b.type === 'send_slack')
    if (slackBlock?.config) {
      setSlackEnabled(true)
      setSlackChannels(slackBlock.config.channels || [])
      setSlackDmUsers(slackBlock.config.dm_users || [])
    } else {
      setSlackEnabled(false)
      setSlackChannels([])
      setSlackDmUsers([])
    }

    // Publish dashboard block
    const hasDashboard = blocks.some(b => b.type === 'publish_dashboard')
    setPublishDashboardEnabled(hasDashboard)

    // Schedule
    if (schedule.type === 'custom' && schedule.cron) {
      setScheduleType('custom')
      setScheduleTimezone(schedule.timezone || 'UTC')
      // Parse cron back to frequency/day/time
      const parts = schedule.cron.split(/\s+/)
      if (parts.length === 5) {
        const [mm, hh, dom, , dow] = parts
        const time = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
        setScheduleTime(time)
        if (dom === '*' && dow === '*') {
          setScheduleFrequency('daily')
        } else if (dom !== '*' && dom.includes(',')) {
          setScheduleFrequency('biweekly')
          setScheduleDay(dow)
        } else if (dom !== '*') {
          setScheduleFrequency('monthly')
          setScheduleDay(dom)
        } else {
          setScheduleFrequency('weekly')
          setScheduleDay(dow)
        }
      }
    } else {
      setScheduleType('data_sync')
    }
  }, [updateMode])

  // Check for existing draft on mount
  useEffect(() => {
    if (!sessionId) { setDraftLoading(false); return }
    ;(async () => {
      try {
        const [draftResult, recipeResult] = await Promise.all([
          apiGet(`/api/sessions/${sessionId}/recipe/exec/draft`).catch(() => ({ has_draft: false })),
          apiPost(`/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`, {}).catch(() => null),
        ])
        if (!aliveRef.current) return

        if (draftResult?.has_draft && draftResult.exec_session_id) {
          setDraftInfo({
            exec_session_id: draftResult.exec_session_id,
            step_results: draftResult.step_results || {},
            hardening_status: draftResult.hardening_status || {},
            hardening_pending: draftResult.hardening_pending || 0,
            diffs: draftResult.diffs || {},
            total_steps: draftResult.total_steps || 0,
            steps_completed: draftResult.steps_completed || 0,
            recipe: recipeResult?.recipe || null,
            stale: draftResult.stale || false,
          })
        }
      } catch { /* no draft */ }
      if (aliveRef.current) setDraftLoading(false)
    })()
  }, [sessionId])

  // Agent actively working (review running or publishing) — lock inputs/nav.
  const isReviewRunning = phase === PHASE.EXTRACTING || phase === PHASE.PREPARING || phase === PHASE.EXECUTING || (phase === PHASE.HARDENING && hardeningPhase === 'running')
  const isPublishing = phase === PHASE.CREATING_WORKFLOW
  const isAgentBusy = isReviewRunning || isPublishing
  // Legacy alias used by renderExistingBanner (hide banner only while reviewing).
  const isVerifying = isReviewRunning
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
  const hasOutput = publishDashboardEnabled || slackEnabled

  // ── Helper: create Pusher instance ──
  const createPusher = useCallback(() => {
    const apiBase = getApiBase()
    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      userAuthentication: { endpoint: `${apiBase}/api/pusher/user-auth`, transport: 'ajax', headers },
      channelAuthorization: { endpoint: `${apiBase}/api/pusher/channel-auth`, transport: 'ajax', headers },
    })
  }, [])

  // ── Helper: start AI preview ──
  const aiPollRef = useRef(null)

  const _fetchAiResult = useCallback(async (execSid) => {
    try {
      const data = await apiGet(
        `/api/sessions/${sessionId}/ai-preview/result?exec_session_id=${encodeURIComponent(execSid)}`
      )
      if (data?.has_result && data.content) {
        // Result ready — stop everything
        if (aiPollRef.current) { clearInterval(aiPollRef.current); aiPollRef.current = null }
        if (aiPusherRef.current) { aiPusherRef.current.disconnect(); aiPusherRef.current = null }
        setAiPreviewRunning(false)
        setAiPreviewContent(data.content)
        return true
      }
    } catch { /* poll continues */ }
    return false
  }, [sessionId])

  const handleAiPreview = useCallback(async () => {
    if (!sessionId || !execSessionIdRef.current || !aiPrompt.trim()) return

    setAiPreviewRunning(true)
    setAiPreviewContent(null)
    setAiPreviewError('')

    // Clean up previous Pusher + poll
    if (aiPusherRef.current) { aiPusherRef.current.disconnect(); aiPusherRef.current = null }
    if (aiPollRef.current) { clearInterval(aiPollRef.current); aiPollRef.current = null }

    try {
      const result = await apiPost(`/api/sessions/${sessionId}/ai-preview/start`, {
        exec_session_id: execSessionIdRef.current,
        prompt: aiPrompt,
        filename: aiFilename || 'memo',
      })

      if (!aliveRef.current) return
      aiPreviewSessionRef.current = result.preview_session_id
      setAiPreviewMemoPath(result.memo_path)
      const execSid = execSessionIdRef.current

      // Pusher for real-time done signal
      const aiPusher = createPusher()
      aiPusher.connection.bind('connected', () => aiPusher.signin())
      const ch = aiPusher.subscribe(result.channel)
      aiPusherRef.current = aiPusher

      ch.bind('agent-event', (event) => {
        if (!aliveRef.current) return
        const etype = event?.type || ''
        if (etype === 'done') {
          _fetchAiResult(execSid)
        } else if (etype === 'error') {
          if (aiPollRef.current) { clearInterval(aiPollRef.current); aiPollRef.current = null }
          setAiPreviewRunning(false)
          setAiPreviewError(event.error || 'An error occurred during preview generation.')
          ch.unbind_all()
          aiPusher.unsubscribe(result.channel)
          aiPusher.disconnect()
          aiPusherRef.current = null
        }
      })

      // Polling fallback — catches result if Pusher event is missed
      aiPollRef.current = setInterval(() => {
        if (!aliveRef.current) {
          clearInterval(aiPollRef.current)
          aiPollRef.current = null
          return
        }
        _fetchAiResult(execSid)
      }, 10000)

    } catch (e) {
      if (!aliveRef.current) return
      setAiPreviewRunning(false)
      setAiPreviewError(e.message || 'Failed to start AI preview')
    }
  }, [sessionId, aiPrompt, aiFilename, createPusher, _fetchAiResult])

  // ── Helper: auto-create workflow + dashboard ──
  const createWorkflow = useCallback(async (execSid) => {
    if (!aliveRef.current) return
    if (workflowCreatedRef.current) return
    workflowCreatedRef.current = true
    setPhase(PHASE.CREATING_WORKFLOW)

    const isUpdate = updateMode && updateMode.workflow_id
    setPhaseMessage(isUpdate ? 'Updating your dashboard...' : 'Publishing your dashboard...')
    setWasUpdate(!!isUpdate)

    try {
      const wfName = isUpdate ? updateMode.name : (dashboardTitle || 'Untitled Dashboard')
      const extraBlocks = []

      // AI summarize block — only if toggled on and prompt provided
      if (aiBlockEnabled && aiPrompt.trim()) {
        const safeName = (aiFilename || 'memo').trim().replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/ /g, '_') || 'memo'
        const blockConfig = {
          prompt: aiPrompt,
          output_file: `agent_memo/${safeName}.md`,
        }
        // Extract format guide from preview output (headings + structure only, no data)
        const guide = extractFormatGuide(aiPreviewContent)
        if (guide) blockConfig.format_guide = guide

        extraBlocks.push({
          id: 'blk_ai_memo',
          type: 'ai_summarize',
          label: 'AI Summary',
          config: blockConfig,
        })
      }

      // Slack notification block — only if toggled on and targets selected
      if (slackEnabled && (slackChannels.length > 0 || slackDmUsers.length > 0)) {
        const slackConfig = {
          channels: slackChannels,
          dm_users: slackDmUsers,
          mode: 'content_from',
          content_from: aiPrompt.trim() ? 'agent_memo/' + ((aiFilename || 'memo').trim().replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/ /g, '_') || 'memo') + '.md' : '',
        }
        extraBlocks.push({
          id: 'blk_slack',
          type: 'send_slack',
          label: 'Send Slack Alert',
          config: slackConfig,
        })
      }

      if (publishDashboardEnabled) {
        extraBlocks.push({
          id: 'blk_publish',
          type: 'publish_dashboard',
          label: 'Publish Dashboard',
          config: { name: isUpdate ? (updateMode.dashboard_name || wfName) : (dashboardTitle || 'Untitled Dashboard'), shared: false },
        })
      }

      // Build schedule config
      let scheduleConfig = { type: 'data_sync' }
      if (autoRefresh && scheduleType === 'custom') {
        scheduleConfig = {
          type: 'custom',
          cron: buildCronExpression(scheduleFrequency, scheduleDay, scheduleTime),
          timezone: scheduleTimezone,
        }
      }

      const body = {
        name: wfName,
        source_session_id: execSid,
        target_file: 'output/dashboard/index.html',
        extra_blocks: extraBlocks,
        skipped_steps: [],
        verify_session_id: execSid,
        auto_refresh: autoRefresh,
        schedule: scheduleConfig,
      }

      if (isUpdate) {
        body.workflow_id = updateMode.workflow_id
      }

      const result = await apiPost('/api/workflows', body)

      if (!aliveRef.current) return
      setWorkflowId(result.workflow_id)

      const wfId = result.workflow_id

      // Finalization (S3 archive + dashboard) runs in background.
      // Listen via Pusher + poll fallback for completion.
      const _onPublishComplete = (dashId) => {
        if (!aliveRef.current) return
        setDashboardId(dashId || (isUpdate ? updateMode.dashboard_id : null))
        const doneExecSid = execSessionIdRef.current
        execSessionIdRef.current = null
        agentRunningRef.current = false
        if (doneExecSid) {
          apiDelete(`/api/sessions/${doneExecSid}?archive=false`).catch(() => {})
        }
        setPhase(PHASE.DONE)
        setPhaseMessage(isUpdate ? 'Dashboard updated successfully!' : 'Dashboard published successfully!')
        toast.success(isUpdate ? 'Dashboard updated!' : 'Dashboard published!')
      }

      // If no publish_dashboard block, finalization is instant (no S3/dashboard work)
      if (!publishDashboardEnabled) {
        _onPublishComplete(null)
        return
      }

      // Pusher: listen for workflow-published event
      const wfPusher = createPusher()
      wfPusher.connection.bind('connected', () => wfPusher.signin())
      const wfCh = wfPusher.subscribe(`workflow-${wfId}`)

      let publishResolved = false
      const _cleanup = () => {
        publishResolved = true
        wfCh.unbind_all()
        wfPusher.unsubscribe(`workflow-${wfId}`)
        wfPusher.disconnect()
        if (publishPollRef.current) { clearInterval(publishPollRef.current); publishPollRef.current = null }
      }

      wfCh.bind('workflow-published', (event) => {
        if (publishResolved) return
        _cleanup()
        _onPublishComplete(event?.dashboard_id)
      })

      // Polling fallback: check every 10s
      publishPollRef.current = setInterval(async () => {
        if (publishResolved || !aliveRef.current) {
          clearInterval(publishPollRef.current)
          publishPollRef.current = null
          return
        }
        try {
          const status = await apiGet(`/api/workflows/${wfId}/publish-status`)
          if (status?.publish_complete) {
            _cleanup()
            _onPublishComplete(status.dashboard_id)
          }
        } catch { /* keep polling */ }
      }, 10000)
    } catch (e) {
      if (!aliveRef.current) return
      setPhase(PHASE.ERROR)
      setErrorMessage(`Failed to ${isUpdate ? 'update' : 'create'} workflow: ${e.message}`)
      toast.error(`Failed: ${e.message}`)
    }
  }, [sessionId, dashboardTitle, updateMode, autoRefresh,
      aiBlockEnabled, aiPrompt, aiFilename, aiPreviewContent,
      slackEnabled, slackChannels, slackDmUsers,
      publishDashboardEnabled,
      scheduleType, scheduleFrequency, scheduleDay, scheduleTime, scheduleTimezone])

  // ── Resume from draft ──
  const handleResumeDraft = useCallback(async () => {
    if (!draftInfo) return
    const draftRecipe = draftInfo.recipe
    if (!draftRecipe) { toast.error('Recipe not available — please start fresh'); return }

    const execSid = draftInfo.exec_session_id
    const stepCount = draftRecipe.steps?.length || 0
    const stepsCompleted = draftInfo.steps_completed || 0
    const allStepsDone = stepsCompleted >= stepCount
    const hardeningEntries = Object.keys(draftInfo.hardening_status || {}).length
    const hardeningAllDone = allStepsDone && hardeningEntries > 0 && (draftInfo.hardening_pending || 0) === 0

    // Load state from draft
    setRecipe(draftRecipe)
    setTotalSteps(stepCount)
    setCompletedSteps(stepsCompleted)
    setStepResults(draftInfo.step_results || {})
    setHardeningStatus(draftInfo.hardening_status || {})
    // Transform raw diff strings from API to {diff, field, truncated} format
    const rawDiffs = draftInfo.diffs || {}
    const transformed = {}
    for (const [stepId, val] of Object.entries(rawDiffs)) {
      transformed[stepId] = typeof val === 'string'
        ? { diff: val, field: 'code', truncated: false }
        : val
    }
    setCodeDiffs(transformed)
    execSessionIdRef.current = execSid
    workflowCreatedRef.current = false
    setDraftInfo(null)

    // Case 1: Hardening fully complete — just show results, no backend call needed
    if (hardeningAllDone) {
      setHardeningPhase('complete')
      setReviewPassed(true)
      setPhase(PHASE.REVIEWED)
      return
    }

    // Case 2: Execution incomplete — show progress bar and resume from where it left off
    // Case 3: Execution done but hardening pending — backend will skip to hardening automatically
    if (!allStepsDone) {
      setPhase(PHASE.EXECUTING)
      setPhaseMessage('Resuming data pipeline checks...')
      progressMessagesRef.current = PROGRESS_MESSAGES_PUBLISH
      setProgressQuip(PROGRESS_MESSAGES_PUBLISH[0])
      quipIndexRef.current = 1
    } else {
      // All steps done, hardening pending/partial — enter hardening phase directly
      setPhase(PHASE.HARDENING)
      setHardeningPhase('running')
      setHardeningLoading(true)
    }

    try {
      // Call backend to resume — it picks up from where it left off
      agentRunningRef.current = true
      const skipHardening = !autoRefreshRef.current
      const startResult = await apiPost(`/api/sessions/${sessionId}/recipe/exec/start`, {
        exec_session_id: execSid,
        resume: true,
        skip_hardening: skipHardening,
      })

      // Agent already running (e.g. browser refresh) — sync current state then reconnect
      let reconnectSyncSteps = null
      if (startResult.status === 'already_running') {
        try {
          const sync = await apiGet(
            `/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${encodeURIComponent(execSid)}&source=disk`
          )
          if (sync?.steps && aliveRef.current) {
            reconnectSyncSteps = sync.steps
            let doneCount = 0
            for (const s of sync.steps) {
              if (s.status === 'success' || s.status === 'completed' || s.status === 'skipped') doneCount++
            }
            setCompletedSteps(doneCount)
            setHardeningStatus(prev => {
              const updated = { ...prev }
              for (const s of sync.steps) {
                if (s.hardening_status && s.hardening_status !== 'pending') {
                  updated[s.id] = { status: s.hardening_status, reason: s.hardening_reason || '' }
                }
              }
              return updated
            })
          }
        } catch {}

        if (startResult.phase === 'hardening') {
          setPhase(PHASE.HARDENING)
          setHardeningPhase('running')
          setHardeningLoading(true)
          try {
            const freshRecipe = await apiPost(
              `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`,
              {}
            )
            if (freshRecipe?.recipe && aliveRef.current) setRecipe(freshRecipe.recipe)
          } catch {}
          if (aliveRef.current) setHardeningLoading(false)
        } else {
          setPhase(PHASE.EXECUTING)
          setPhaseMessage('Reconnecting to review in progress...')
        }
      }

      // Re-fetch recipe for code-to-English summaries if entering hardening
      if (startResult.status !== 'already_running' && allStepsDone) {
        try {
          const freshRecipe = await apiPost(
            `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`,
            {}
          )
          if (freshRecipe?.recipe && aliveRef.current) setRecipe(freshRecipe.recipe)
        } catch {}
        if (aliveRef.current) setHardeningLoading(false)
      }

      if (!aliveRef.current) return

      // Subscribe to Pusher events — same as handleStartVerification
      const execPusher = createPusher()
      execPusher.connection.bind('connected', () => execPusher.signin())
      const ch = execPusher.subscribe(startResult.channel)
      pusherRef.current = execPusher

      const doneSet = new Set()
      // Pre-populate doneSet with already completed steps
      if (reconnectSyncSteps) {
        for (const s of reconnectSyncSteps) {
          if (s.status === 'success' || s.status === 'completed' || s.status === 'skipped') doneSet.add(s.id)
        }
      } else {
        for (const [sid, r] of Object.entries(draftInfo.step_results || {})) {
          if (r.status === 'success' || r.status === 'skipped') doneSet.add(sid)
        }
      }

      const markDone = (stepId) => {
        if (!stepId || doneSet.has(stepId)) return
        doneSet.add(stepId)
        setCompletedSteps(doneSet.size)
        setProgressQuip(progressMessagesRef.current[quipIndexRef.current % progressMessagesRef.current.length])
        quipIndexRef.current++
      }

      ch.bind('step-success', (data) => {
        if (!aliveRef.current) return
        markDone(data.step_id)
        setStepResults(prev => ({
          ...prev,
          [data.step_id]: {
            step_id: data.step_id, status: 'success',
            duration_s: data.duration_s, output_files: data.output_files || [],
          },
        }))
        if (data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
      })

      ch.bind('step-result', (data) => {
        if (!aliveRef.current) return
        if (data.status === 'success' || data.status === 'skipped') markDone(data.step_id)
        setStepResults(prev => ({ ...prev, [data.step_id]: data }))
        if (data.status === 'success' && data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
      })

      ch.bind('step-marked', (data) => {
        if (!aliveRef.current) return
        if (data.status === 'completed' || data.status === 'skipped') markDone(data.step_id)
        const status = data.status === 'completed' ? 'success' : data.status === 'skipped' ? 'skipped' : 'failed'
        setStepResults(prev => {
          const existing = prev[data.step_id] || {}
          if (existing.status === 'success') return prev
          const result = { ...existing, step_id: data.step_id, status }
          if (data.reason) result.skip_reason = data.reason
          return { ...prev, [data.step_id]: result }
        })
      })

      ch.bind('step-diff', (data) => {
        if (!aliveRef.current) return
        setCodeDiffs(prev => ({
          ...prev,
          [data.step_id]: { diff: data.diff, field: data.field, truncated: data.diff_truncated },
        }))
      })

      const cleanupPusher = () => {
        ch.unbind_all()
        execPusher.unsubscribe(startResult.channel)
        execPusher.disconnect()
        pusherRef.current = null
        agentRunningRef.current = false
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      }

      ch.bind('all-complete', async () => {
        if (!aliveRef.current) return
        setCompletedSteps(stepCount)
        if (autoRefreshRef.current) {
          setPhase(PHASE.HARDENING)
          setHardeningPhase('running')
          setHardeningLoading(true)
          try {
            const freshRecipe = await apiPost(
              `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`,
              {}
            )
            if (freshRecipe?.recipe && aliveRef.current) setRecipe(freshRecipe.recipe)
          } catch {}
          if (aliveRef.current) setHardeningLoading(false)
        } else {
          // One-time: review passed — advance to confirm, don't auto-publish.
          cleanupPusher()
          setReviewPassed(true)
          setPhase(PHASE.REVIEWED)
        }
      })

      ch.bind('hardening-started', () => {
        if (!aliveRef.current) return
        setPhase(PHASE.HARDENING)
        setHardeningPhase('running')
      })

      ch.bind('step-reviewing', (data) => {
        if (!aliveRef.current) return
        setHardeningStatus(prev => ({ ...prev, [data.step_id]: { status: 'reviewing', reason: '' } }))
      })

      ch.bind('step-hardened', (data) => {
        if (!aliveRef.current) return
        setHardeningStatus(prev => ({ ...prev, [data.step_id]: { status: data.status, reason: data.reason || '' } }))
      })

      ch.bind('hardening-complete', () => {
        if (!aliveRef.current) return
        setHardeningPhase('complete')
        setReviewPassed(true)
        setPhase(PHASE.REVIEWED)
        cleanupPusher()
      })

      ch.bind('hardening-error', () => {
        if (!aliveRef.current) return
        setHardeningPhase('complete')
        cleanupPusher()
      })

      ch.bind('exec-error', (data) => {
        if (!aliveRef.current) return
        cleanupPusher()
        setPhase(PHASE.ERROR)
        setErrorMessage(data?.error || 'Execution failed')
      })

      ch.bind('exec-blocked', (data) => {
        if (!aliveRef.current) return
        cleanupPusher()
        setPhase(PHASE.ERROR)
        setErrorMessage(data?.message || data?.reason || 'Execution blocked')
      })

      ch.bind('agent-cancelled', () => {
        if (!aliveRef.current) return
        cleanupPusher()
        setPhase(PHASE.ERROR)
        setErrorMessage('Review was cancelled')
      })

    } catch (e) {
      agentRunningRef.current = false
      if (!aliveRef.current) return
      setPhase(PHASE.ERROR)
      setErrorMessage('Failed to resume: ' + (e.message || 'Unknown error'))
      toast.error('Failed to resume: ' + e.message)
    }
  }, [draftInfo, sessionId, autoRefresh, createPusher, createWorkflow])

  // ── Discard draft and start fresh ──
  const handleDiscardDraft = useCallback(async () => {
    if (draftInfo?.exec_session_id) {
      try { await apiDelete(`/api/sessions/${draftInfo.exec_session_id}?archive=false`) } catch {}
    }
    setDraftInfo(null)
  }, [draftInfo])

  // ── Main flow: Start Review ──
  const handleStartVerification = useCallback(async () => {
    if (!sessionId) return
    workflowCreatedRef.current = false
    setReviewPassed(false)
    setPhase(PHASE.EXTRACTING)
    setPhaseMessage('Analyzing your dashboard...')
    setCompletedSteps(0)
    setTotalSteps(0)
    setStepResults({})
    setHardeningStatus({})
    setCodeDiffs({})
    setHardeningPhase(null)
    setSelectedOutput(null)
    setShowAdjustments(false)
    progressMessagesRef.current = PROGRESS_MESSAGES_PUBLISH
    setProgressQuip(PROGRESS_MESSAGES_PUBLISH[0])
    quipIndexRef.current = 1
    setErrorMessage('')

    try {
      // Step 1: Delete any stale draft
      try {
        const draftResult = await apiGet(`/api/sessions/${sessionId}/recipe/exec/draft`)
        if (draftResult?.has_draft && draftResult.exec_session_id) {
          await apiDelete(`/api/sessions/${draftResult.exec_session_id}?archive=false`)
        }
      } catch { /* no draft — fine */ }

      // Step 2: Extract recipe
      const recipeResult = await apiPost(
        `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`,
        {}
      )
      if (!recipeResult?.recipe) {
        throw new Error('No recipe steps found. Ensure the session has completed tool calls.')
      }
      const extractedRecipe = recipeResult.recipe
      const stepCount = extractedRecipe.steps?.length || 0
      setTotalSteps(stepCount)
      setRecipe(extractedRecipe)

      if (!aliveRef.current) return

      // Step 3: Init exec session
      setPhase(PHASE.PREPARING)
      setPhaseMessage('Setting up verification environment...')

      const execResult = await apiPost(
        `/api/sessions/${sessionId}/recipe/exec/init`,
        { recipe: extractedRecipe, model: 'claude-sonnet-4-6' }
      )
      const execSid = execResult.exec_session_id
      execSessionIdRef.current = execSid
      const execChannel = execResult.channel

      if (!aliveRef.current) return

      // Step 4: Wait for exec-ready (or proceed if already ready)
      const startExecution = async () => {
        if (!aliveRef.current) return
        setPhase(PHASE.EXECUTING)
        setPhaseMessage('Running data pipeline checks...')

        // When auto-refresh is on, run hardening after execution
        agentRunningRef.current = true
        const skipHardening = !autoRefreshRef.current
        const startResult = await apiPost(`/api/sessions/${sessionId}/recipe/exec/start`, {
          exec_session_id: execSid,
          resume: false,
          skip_hardening: skipHardening,
        })

        // Agent already running (e.g. browser refresh) — sync counts then reconnect
        let reconnectSyncSteps2 = null
        if (startResult.status === 'already_running') {
          try {
            const sync = await apiGet(
              `/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${encodeURIComponent(execSid)}&source=disk`
            )
            if (sync?.steps && aliveRef.current) {
              reconnectSyncSteps2 = sync.steps
              let doneCount = 0
              for (const s of sync.steps) {
                if (s.status === 'success' || s.status === 'completed' || s.status === 'skipped') doneCount++
              }
              setCompletedSteps(doneCount)
              setHardeningStatus(prev => {
                const updated = { ...prev }
                for (const s of sync.steps) {
                  if (s.hardening_status && s.hardening_status !== 'pending') {
                    updated[s.id] = { status: s.hardening_status, reason: s.hardening_reason || '' }
                  }
                }
                return updated
              })
            }
          } catch {}

          if (startResult.phase === 'hardening') {
            setPhase(PHASE.HARDENING)
            setHardeningPhase('running')
          } else {
            setPhaseMessage('Reconnecting to review in progress...')
          }
        }

        // Subscribe to execution events on the channel
        const execPusher = createPusher()
        execPusher.connection.bind('connected', () => execPusher.signin())
        const ch = execPusher.subscribe(startResult.channel)
        pusherRef.current = execPusher

        const doneSet = new Set()
        if (reconnectSyncSteps2) {
          for (const s of reconnectSyncSteps2) {
            if (s.status === 'success' || s.status === 'completed' || s.status === 'skipped') doneSet.add(s.id)
          }
        }
        const markDone = (stepId) => {
          if (!stepId || doneSet.has(stepId)) return
          doneSet.add(stepId)
          setCompletedSteps(doneSet.size)
          setProgressQuip(progressMessagesRef.current[quipIndexRef.current % progressMessagesRef.current.length])
          quipIndexRef.current++
        }

        // Track step results for hardening view
        ch.bind('step-success', (data) => {
          if (!aliveRef.current) return
          markDone(data.step_id)
          setStepResults(prev => ({
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

        ch.bind('step-result', (data) => {
          if (!aliveRef.current) return
          if (data.status === 'success' || data.status === 'skipped') markDone(data.step_id)
          setStepResults(prev => ({ ...prev, [data.step_id]: data }))
          if (data.status === 'success' && data.output_files?.length > 0) setSelectedOutput(data.output_files[0])
        })

        ch.bind('step-marked', (data) => {
          if (!aliveRef.current) return
          if (data.status === 'completed' || data.status === 'skipped') markDone(data.step_id)
          const status = data.status === 'completed' ? 'success'
            : data.status === 'skipped' ? 'skipped' : 'failed'
          setStepResults(prev => {
            const existing = prev[data.step_id] || {}
            if (existing.status === 'success') return prev
            const result = { ...existing, step_id: data.step_id, status }
            if (data.reason) result.skip_reason = data.reason
            return { ...prev, [data.step_id]: result }
          })
        })

        // Step diffs (code changes by agent during execution or hardening)
        ch.bind('step-diff', (data) => {
          if (!aliveRef.current) return
          setCodeDiffs(prev => ({
            ...prev,
            [data.step_id]: { diff: data.diff, field: data.field, truncated: data.diff_truncated },
          }))
        })

        const cleanupPusher = () => {
          ch.unbind_all()
          execPusher.unsubscribe(startResult.channel)
          execPusher.disconnect()
          pusherRef.current = null
          agentRunningRef.current = false
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }

        ch.bind('all-complete', async () => {
          if (!aliveRef.current) return
          setCompletedSteps(stepCount)
          if (autoRefreshRef.current) {
            setPhase(PHASE.HARDENING)
            setHardeningPhase('running')
            setHardeningLoading(true)
            try {
              const freshRecipe = await apiPost(
                `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent('output/dashboard/index.html')}&ai_mode=true`,
                {}
              )
              if (freshRecipe?.recipe && aliveRef.current) {
                setRecipe(freshRecipe.recipe)
              }
            } catch {}
            if (aliveRef.current) setHardeningLoading(false)
          } else {
            // One-time: review passed — advance to confirm, don't auto-publish.
            cleanupPusher()
            setReviewPassed(true)
            setPhase(PHASE.REVIEWED)
          }
        })

        ch.bind('hardening-started', () => {
          if (!aliveRef.current) return
          setPhase(PHASE.HARDENING)
          setHardeningPhase('running')
        })

        ch.bind('step-reviewing', (data) => {
          if (!aliveRef.current) return
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: 'reviewing', reason: '' },
          }))
        })

        ch.bind('step-hardened', (data) => {
          if (!aliveRef.current) return
          setHardeningStatus(prev => ({
            ...prev,
            [data.step_id]: { status: data.status, reason: data.reason || '' },
          }))
        })

        ch.bind('hardening-complete', () => {
          if (!aliveRef.current) return
          setHardeningPhase('complete')
          setReviewPassed(true)
          setPhase(PHASE.REVIEWED)
          cleanupPusher()
        })

        ch.bind('hardening-error', () => {
          if (!aliveRef.current) return
          setHardeningPhase('complete')
          setReviewPassed(true)
          setPhase(PHASE.REVIEWED)
          cleanupPusher()
        })

        ch.bind('exec-error', (data) => {
          if (!aliveRef.current) return
          cleanupPusher()
          setPhase(PHASE.ERROR)
          setErrorMessage(data?.error || 'Recipe execution failed')
        })

        ch.bind('exec-blocked', (data) => {
          if (!aliveRef.current) return
          cleanupPusher()
          setPhase(PHASE.ERROR)
          setErrorMessage(data?.message || data?.reason || 'Execution blocked — infrastructure error')
        })

        ch.bind('agent-cancelled', () => {
          if (!aliveRef.current) return
          cleanupPusher()
          if (hardeningPhase === 'running') {
            setHardeningPhase('complete')
          } else {
            setPhase(PHASE.ERROR)
            setErrorMessage('Verification was cancelled')
          }
        })

        // Polling fallback (every 30s)
        pollRef.current = setInterval(async () => {
          try {
            const sync = await apiGet(
              `/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${encodeURIComponent(execSid)}`
            )
            if (!aliveRef.current) return

            // Sync step results
            if (sync.steps) {
              for (const s of sync.steps) {
                if (s.status === 'success' || s.status === 'completed' || s.status === 'skipped') {
                  markDone(s.id || s.step_id)
                }
              }
              // Sync step results for hardening view
              setStepResults(prev => {
                const updated = { ...prev }
                for (const step of sync.steps) {
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
              // Sync hardening statuses
              setHardeningStatus(prev => {
                const updated = { ...prev }
                for (const step of sync.steps) {
                  if (step.hardening_status && step.hardening_status !== 'pending') {
                    updated[step.id] = { status: step.hardening_status, reason: step.hardening_reason || '' }
                  }
                }
                return updated
              })
            }
            // Sync code diffs
            if (sync.diffs && Object.keys(sync.diffs).length > 0) {
              setCodeDiffs(prev => {
                const updated = { ...prev }
                for (const [stepId, diff] of Object.entries(sync.diffs)) {
                  if (!updated[stepId]) updated[stepId] = { diff, field: 'code', truncated: false }
                }
                return updated
              })
            }

            if (sync.status === 'hardening') {
              setPhase(PHASE.HARDENING)
              setHardeningPhase('running')
            } else if (sync.status === 'success' || sync.status === 'incomplete') {
              cleanupPusher()
              setCompletedSteps(stepCount)
              if (autoRefreshRef.current && phase !== PHASE.HARDENING) {
                setHardeningPhase('complete')
              }
              // Review passed (either path) → advance to confirm, don't auto-publish.
              setReviewPassed(true)
              setPhase(PHASE.REVIEWED)
            }
          } catch { /* ignore poll errors */ }
        }, 30000)
      }

      if (execResult.status === 'preparing') {
        // Wait for exec-ready Pusher event
        const prepPusher = createPusher()
        prepPusher.connection.bind('connected', () => prepPusher.signin())
        const prepCh = prepPusher.subscribe(execChannel)
        pusherRef.current = prepPusher

        prepCh.bind('exec-ready', () => {
          prepCh.unbind_all()
          prepPusher.unsubscribe(execChannel)
          prepPusher.disconnect()
          pusherRef.current = null
          startExecution()
        })

        prepCh.bind('exec-error', (data) => {
          prepCh.unbind_all()
          prepPusher.disconnect()
          pusherRef.current = null
          setPhase(PHASE.ERROR)
          setErrorMessage('Workspace preparation failed: ' + (data?.error || 'Unknown error'))
        })
      } else {
        await startExecution()
      }

    } catch (e) {
      agentRunningRef.current = false
      if (!aliveRef.current) return
      setPhase(PHASE.ERROR)
      setErrorMessage(e.message || 'Verification failed')
      toast.error('Verification failed: ' + e.message)
    }
  }, [sessionId, createPusher, createWorkflow])

  // ── Render: existing workflow banner ──
  const renderExistingBanner = () => {
    if (existingLoading || !existingWorkflows?.length || isVerifying || phase === PHASE.DONE) return null

    const selectedWf = updateMode && updateMode.workflow_id ? updateMode : null

    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 mb-4">
        <div className="flex items-start gap-3">
          <ArrowsClockwise size={16} weight="bold" className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-amber-800 m-0">
                {existingWorkflows.length === 1
                  ? '1 existing dashboard is linked to this session'
                  : `${existingWorkflows.length} existing dashboards are linked to this session`}
              </p>
            </div>

            {selectedWf ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <PencilSimple size={10} weight="bold" className="text-amber-700 shrink-0" />
                <span className="text-[11px] text-amber-700 truncate font-medium">
                  Updating: {selectedWf.dashboard_name || selectedWf.name}
                </span>
              </div>
            ) : updateMode === false ? (
              <p className="text-[11px] text-amber-700 m-0 mt-1.5 font-medium">
                Creating new dashboard
              </p>
            ) : null}

            <div className="flex items-center gap-2 mt-2 relative">
              {/* Dropdown trigger for selecting which workflow to update */}
              <div className="relative">
                <button
                  onClick={() => setShowExistingDropdown(!showExistingDropdown)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                    selectedWf
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <PencilSimple size={10} weight="bold" className="inline mr-1" />
                  Update existing
                  {existingWorkflows.length > 1 && (
                    <span className="ml-1 opacity-70">({existingWorkflows.length})</span>
                  )}
                </button>

                {showExistingDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1 z-20">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                      Select dashboard to update
                    </div>
                    {existingWorkflows.map((wf) => (
                      <button
                        key={wf.workflow_id}
                        onClick={() => { setUpdateMode(wf); setShowExistingDropdown(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left border-none cursor-pointer transition-colors ${
                          selectedWf?.workflow_id === wf.workflow_id
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        }`}
                      >
                        <PencilSimple size={11} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-[12px] truncate" title={wf.dashboard_name || wf.name}>
                          {wf.dashboard_name || wf.name}
                        </span>
                        {selectedWf?.workflow_id === wf.workflow_id && (
                          <CheckCircle size={12} weight="fill" className="text-amber-600 shrink-0 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setUpdateMode(false); setShowExistingDropdown(false) }}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                  updateMode === false
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                }`}
              >
                Create new
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: verification progress section ──

  // ════════════════════════════════════════════════════════════════════
  //  Wizard render (Outputs → Frequency → Review → Confirm)
  // ════════════════════════════════════════════════════════════════════

  // ── Schedule controls (Step 2, recurring only) ──
  const renderScheduleControls = () => (
    <div className="mt-4 space-y-2.5">
      <p className="text-[11px] text-[var(--text-muted)] m-0">This schedule applies to everything you publish.</p>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="radio" name="schedule-type" checked={scheduleType === 'data_sync'} onChange={() => setScheduleType('data_sync')} disabled={isAgentBusy} className="mt-0.5 w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer" />
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-[var(--text-primary)] block">Every data sync</span>
          <span className="text-[10px] text-[var(--text-muted)] block">Refreshes whenever new data arrives</span>
        </div>
      </label>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="radio" name="schedule-type" checked={scheduleType === 'custom'} onChange={() => setScheduleType('custom')} disabled={isAgentBusy} className="mt-0.5 w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer" />
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-medium text-[var(--text-primary)] block">Custom schedule</span>
          <span className="text-[10px] text-[var(--text-muted)] block">Pick your own frequency and time</span>
        </div>
      </label>
      {scheduleType === 'custom' && (
        <div className="ml-6 space-y-2">
          <div className="flex flex-wrap gap-2">
            <CustomSelect value={scheduleFrequency} onChange={(v) => { setScheduleFrequency(v); if (v === 'monthly') setScheduleDay('1'); else if (v === 'daily') setScheduleDay(''); else setScheduleDay('1') }} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Biweekly' }, { value: 'monthly', label: 'Monthly' }]} className="flex-1 min-w-[80px]" />
            {scheduleFrequency !== 'daily' && (
              <CustomSelect value={scheduleDay} onChange={setScheduleDay} options={scheduleFrequency === 'monthly' ? Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Day ${i + 1}` })) : DAYS_OF_WEEK} className="flex-1 min-w-[90px]" />
            )}
            <CustomSelect value={scheduleTime} onChange={setScheduleTime} options={TIME_OPTIONS} className="flex-1 min-w-[80px]" />
          </div>
          <CustomSelect value={scheduleTimezone} onChange={setScheduleTimezone} options={COMMON_TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))} className="w-full" />
        </div>
      )}
    </div>
  )

  // ── AI analysis + Slack blocks (Step 4) ──
  const renderAiBlock = () => (
    <div className={`border border-[var(--border-primary)] rounded-xl overflow-hidden transition-colors ${aiBlockEnabled ? 'bg-[var(--accent)]/5' : 'bg-[var(--bg-primary)]'}`}>
      <button type="button" onClick={() => setAiBlockEnabled(!aiBlockEnabled)} className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${aiBlockEnabled ? 'bg-[var(--accent)]/15' : 'bg-[var(--bg-hover)]'}`}>
          <Sparkle size={14} weight="fill" className={aiBlockEnabled ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[12px] font-semibold block ${aiBlockEnabled ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>AI analysis</span>
          <span className="text-[10px] text-[var(--text-muted)] block">Write a summary or recommendations, saved as a memo</span>
        </div>
        <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${aiBlockEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-primary)]'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${aiBlockEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </button>
      {aiBlockEnabled && (
        <div className="px-4 pb-4 space-y-2.5">
          <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Summarize the key revenue trends and flag at-risk accounts…" rows={3} disabled={aiPreviewRunning} className="w-full text-[12px] border border-[var(--border-primary)] rounded-lg px-3 py-2 outline-none resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-secondary)] focus:border-[var(--accent)] transition-colors disabled:opacity-60" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">Saved to agent_memo /</span>
            <input value={aiFilename} onChange={(e) => setAiFilename(e.target.value)} placeholder="memo" disabled={aiPreviewRunning} className="flex-1 min-w-0 text-[10px] border border-[var(--border-primary)] rounded px-2 py-1 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-secondary)] focus:border-[var(--accent)] transition-colors disabled:opacity-60" />
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">.md</span>
          </div>
          <button onClick={handleAiPreview} disabled={aiPreviewRunning || !aiPrompt.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent)] text-white hover:opacity-90">
            {aiPreviewRunning ? (<><CircleNotch size={14} className="animate-spin" /><span>Generating preview…</span></>) : aiPreviewContent ? (<><ArrowsClockwise size={14} weight="bold" /><span>Regenerate preview</span></>) : (<><Play size={14} weight="fill" /><span>Preview analysis</span></>)}
          </button>
          {aiPreviewError && <p className="text-[11px] text-red-500">{aiPreviewError}</p>}
          {aiPreviewContent && !aiPreviewRunning && (
            <div className="pt-2.5 border-t border-[var(--border-primary)]">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={13} weight="fill" className="text-green-500" />
                <span className="text-[11px] font-medium text-green-600">Preview ready</span>
                {aiPreviewMemoPath && <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">{aiPreviewMemoPath}</span>}
              </div>
              <div className="max-h-[220px] overflow-y-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
                <MarkdownRenderer content={aiPreviewContent} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSlackBlock = () => (
    <div className={`border border-[var(--border-primary)] rounded-xl overflow-hidden transition-colors ${slackEnabled ? 'bg-[#4A154B]/3' : 'bg-[var(--bg-primary)]'}`}>
      <button type="button" onClick={() => setSlackEnabled(!slackEnabled)} className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${slackEnabled ? 'bg-[#4A154B]/10' : 'bg-[var(--bg-hover)]'}`}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="none"><path d="M221.13,128A32,32,0,0,0,184,76.31V56a32,32,0,0,0-56-21.13A32,32,0,0,0,76.31,72H56a32,32,0,0,0-21.13,56A32,32,0,0,0,72,179.69V200a32,32,0,0,0,56,21.13A32,32,0,0,0,179.69,184H200a32,32,0,0,0,21.13-56ZM72,152a16,16,0,1,1-16-16H72Zm48,48a16,16,0,0,1-32,0V152a16,16,0,0,1,16-16h16Zm0-80H56a16,16,0,0,1,0-32h48a16,16,0,0,1,16,16Zm0-48H104a16,16,0,1,1,16-16Zm16-16a16,16,0,0,1,32,0v48a16,16,0,0,1-16,16H136Zm16,160a16,16,0,0,1-16-16V184h16a16,16,0,0,1,0,32Zm48-48H152a16,16,0,0,1-16-16V136h64a16,16,0,0,1,0,32Zm0-48H184V104a16,16,0,1,1,16,16Z" fill={slackEnabled ? '#4A154B' : '#999'}/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[12px] font-semibold block ${slackEnabled ? 'text-[#4A154B]' : 'text-[var(--text-primary)]'}`}>Slack alert</span>
          <span className="text-[10px] text-[var(--text-muted)] block">{autoRefresh ? 'Notify channels or people on each refresh' : 'Notify channels or people when published'}</span>
        </div>
        <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${slackEnabled ? 'bg-[#4A154B]' : 'bg-[var(--border-primary)]'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${slackEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </button>
      {slackEnabled && (
        <div className="px-4 pb-4">
          <SlackChannelPicker selectedChannels={slackChannels} onChannelsChange={setSlackChannels} selectedDmUsers={slackDmUsers} onDmUsersChange={setSlackDmUsers} disabled={false} />
          {(slackChannels.length > 0 || slackDmUsers.length > 0) && (
            <button onClick={async () => { setSlackTestSending(true); try { await apiPost(`/api/sessions/${sessionId}/slack-test`, { exec_session_id: execSessionIdRef.current, channels: slackChannels, dm_users: slackDmUsers, content: aiPreviewContent || null }); toast.success('Test notification sent!') } catch (e) { toast.error(e.message || 'Failed to send test notification') } finally { setSlackTestSending(false) } }} disabled={slackTestSending} className="mt-2.5 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {slackTestSending ? (<><CircleNotch size={12} className="animate-spin" /><span>Sending…</span></>) : (<><Play size={12} weight="fill" /><span>Test notification</span></>)}
            </button>
          )}
        </div>
      )}
    </div>
  )

  // ── STEP — Verify (per-widget review; first step) ──
  const renderVerifyStep = () => (
    selectedWidget ? (
      <WidgetDetailView
        widget={selectedWidget}
        sessionId={sessionId}
        sessionStatus={sessionStatus}
        liveMessages={liveMessages}
        onSendFeedback={onSendFeedback}
        onBack={() => setSelectedWidget(null)}
        onVerified={onWidgetVerified}
        onBackToSession={() => onClose?.()}
        onContinueToPublish={() => { setSelectedWidget(null); setStep(STEP.OUTPUTS) }}
      />
    ) : (
      <WidgetListView
        widgets={widgets}
        widgetCount={widgets.length}
        verifiedCount={widgets.filter((w) => w.verified).length}
        onSelectWidget={(w) => setSelectedWidget(w)}
        onContinueToPublish={() => setStep(STEP.OUTPUTS)}
        onBack={() => onClose?.()}
        titleMissing={false}
      />
    )
  )

  // ── STEP 1 — Outputs ──
  const OutputCard = ({ active, onToggle, icon, title, desc, accent }) => (
    <button type="button" onClick={onToggle} disabled={isAgentBusy} className={`w-full flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${active ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/40'}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[var(--accent)]/10' : 'bg-[var(--bg-hover)]'}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <span className={`text-[13px] font-semibold block ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{title}</span>
        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5 leading-relaxed">{desc}</span>
      </div>
      <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${active ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-primary)]'}`}>
        {active && <CheckCircle size={14} weight="fill" className="text-white" />}
      </div>
    </button>
  )

  const renderOutputsStep = () => (
    <div className="px-6 py-6 max-w-[560px] mx-auto">
      <h2 className="text-[16px] font-semibold text-[var(--text-primary)] m-0">What do you want to publish?</h2>
      <p className="text-[12px] text-[var(--text-muted)] mt-1.5 mb-5">Pick one or both — you're choosing the outputs, not publishing yet.</p>
      <div className="space-y-3">
        <OutputCard active={publishDashboardEnabled} onToggle={() => !isAgentBusy && setPublishDashboardEnabled(v => !v)} icon={<SquaresFour size={20} weight="duotone" className={publishDashboardEnabled ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />} title="Dashboard" desc="A live dashboard on your Dashboards page." />
        {isPetavueUser && (
          <OutputCard active={slackEnabled} onToggle={() => !isAgentBusy && setSlackEnabled(v => !v)} icon={<svg width="20" height="20" viewBox="0 0 256 256" fill="none"><path d="M221.13,128A32,32,0,0,0,184,76.31V56a32,32,0,0,0-56-21.13A32,32,0,0,0,76.31,72H56a32,32,0,0,0-21.13,56A32,32,0,0,0,72,179.69V200a32,32,0,0,0,56,21.13A32,32,0,0,0,179.69,184H200a32,32,0,0,0,21.13-56ZM72,152a16,16,0,1,1-16-16H72Zm48,48a16,16,0,0,1-32,0V152a16,16,0,0,1,16-16h16Zm0-80H56a16,16,0,0,1,0-32h48a16,16,0,0,1,16,16Zm0-48H104a16,16,0,1,1,16-16Zm16-16a16,16,0,0,1,32,0v48a16,16,0,0,1-16,16H136Zm16,160a16,16,0,0,1-16-16V184h16a16,16,0,0,1,0,32Zm48-48H152a16,16,0,0,1-16-16V136h64a16,16,0,0,1,0,32Zm0-48H184V104a16,16,0,1,1,16,16Z" fill={slackEnabled ? '#4A154B' : '#999'}/></svg>} title="Slack alert" desc="Notify a channel or people when the data updates." />
        )}
      </div>
    </div>
  )

  // ── STEP 2 — Frequency ──
  const renderFrequencyStep = () => (
    <div className="px-6 py-6 max-w-[560px] mx-auto">
      <h2 className="text-[16px] font-semibold text-[var(--text-primary)] m-0">How often should this run?</h2>
      <p className="text-[12px] text-[var(--text-muted)] mt-1.5 mb-5">The same schedule applies to everything you chose to publish.</p>
      <div className="space-y-3">
        <OutputCard active={!autoRefresh} onToggle={() => !isReviewRunning && setAutoRefresh(false)} icon={<CheckCircle size={20} weight="duotone" className={!autoRefresh ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />} title="One time" desc="A snapshot from today's data. You can refresh it manually later." />
        <OutputCard active={autoRefresh} onToggle={() => !isReviewRunning && setAutoRefresh(true)} icon={<ArrowsClockwise size={20} weight="duotone" className={autoRefresh ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />} title="Recurring" desc="Refreshes automatically on a schedule, always up to date." />
      </div>
      {autoRefresh && isPetavueUser && renderScheduleControls()}
    </div>
  )

  // ── STEP 3 — Review (the mandatory gate) ──
  const renderReviewStep = () => {
    const reviewItems = [
      { active: 'Analyzing your dashboard', done: 'Analyzed your dashboard', phases: [PHASE.EXTRACTING, PHASE.PREPARING] },
      { active: 'Testing data sources & recomputing the numbers', done: 'Tested data sources & recomputed the numbers', phases: [PHASE.EXECUTING] },
    ]
    if (autoRefresh) reviewItems.push({ active: 'Preparing it for reliable scheduled refresh', done: 'Prepared it for reliable scheduled refresh', phases: [PHASE.HARDENING] })
    const order = [PHASE.EXTRACTING, PHASE.PREPARING, PHASE.EXECUTING, PHASE.HARDENING]
    const curIdx = order.indexOf(phase)

    return (
      <div className="px-6 py-6 max-w-[600px] mx-auto">
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)] m-0">Agentic Review</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1 mb-1">
          {autoRefresh
            ? 'An AI agent will check your dashboard to ensure every refresh runs without issues.'
            : 'An AI agent will check your dashboard to ensure everything works correctly.'}
        </p>
        {!reviewPassed && phase !== PHASE.DONE && (
          <p className="text-[12px] text-[var(--accent)] font-medium mt-1.5 mb-5">Your dashboard can't be published until this review passes.</p>
        )}
        {(reviewPassed || phase === PHASE.DONE) && <div className="mb-5" />}

        {phase === PHASE.ERROR ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2.5">
              <XCircle size={20} weight="fill" className="text-red-500 shrink-0" />
              <h3 className="text-[14px] font-semibold text-red-700 m-0">We found a problem</h3>
            </div>
            <p className="text-[12px] text-red-700/90 mt-2 mb-1 leading-relaxed">{errorMessage}</p>
            <p className="text-[11px] text-red-700/70 m-0">Fix this in your session, then run the review again.</p>
            <Button btnColor="primary" btnSize="sm" mainBtnClassName="mt-4" onClick={handleStartVerification}>
              <Play size={14} weight="fill" /><span className="text-[12px]">Run review again</span>
            </Button>
          </div>
        ) : reviewPassed ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={20} weight="fill" className="text-green-500 shrink-0" />
              <h3 className="text-[14px] font-semibold text-green-700 m-0">Review passed</h3>
            </div>
            <p className="text-[12px] text-green-700/90 mt-2 mb-0 leading-relaxed">
              {autoRefresh
                ? 'Your dashboard works and will keep working on every scheduled refresh'
                : 'Your dashboard works and is ready to publish'}
              {autoRefresh && adjustmentCount > 0 ? ` — the agent made ${adjustmentCount} fix${adjustmentCount !== 1 ? 'es' : ''} to harden it.` : '.'}
            </p>
            {autoRefresh && adjustmentCount > 0 && (
              <button onClick={() => { const c = {}; (recipe?.steps || []).forEach(s => { if (hardeningStatus[s.id]?.status === 'hardened') c[s.id] = true }); setCollapsedSteps(c); if (recipe?.target_file) setSelectedOutput({ path: recipe.target_file, type: 'html' }); setShowAdjustments(true) }} className="mt-3 text-[12px] text-green-700 font-medium underline bg-transparent border-none cursor-pointer p-0">
                See what changed
              </button>
            )}
          </div>
        ) : isReviewRunning ? (
          <div>
            {phase !== PHASE.HARDENING && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{phase === PHASE.EXECUTING ? `${completedSteps} of ${totalSteps} checks done` : 'Getting started…'}</span>
                  {phase === PHASE.EXECUTING && totalSteps > 0 && <span className="text-[11px] font-semibold text-[var(--accent)]">{progressPct}%</span>}
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out" style={{ width: phase === PHASE.EXECUTING && totalSteps > 0 ? `${progressPct}%` : '8%' }} />
                </div>
              </div>
            )}
            <div className="space-y-3">
              {reviewItems.map((item, i) => {
                const itemIdx = Math.max(...item.phases.map(p => order.indexOf(p)))
                const isActive = item.phases.includes(phase)
                const isDone = curIdx > itemIdx
                return (
                  <div key={i} className="flex items-center gap-3">
                    {isDone ? <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" /> : isActive ? <Spinner size={16} className="text-[var(--accent)] animate-spin shrink-0" /> : <CircleNotch size={16} className="text-[var(--text-muted)] shrink-0" />}
                    <span className={`text-[12px] flex-1 ${isDone ? 'text-green-600 font-medium' : isActive ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>{isDone ? item.done : item.active}</span>
                  </div>
                )
              })}
            </div>
            {progressQuip && phase === PHASE.EXECUTING && <p key={progressQuip} className="text-[11px] text-[var(--text-muted)] italic mt-4 animate-fade-in">— {progressQuip}</p>}
            {phase === PHASE.HARDENING && hardeningPhase === 'running' && (
              <p className="text-[11px] text-[var(--text-muted)] mt-4">Preparing your dashboard so every scheduled refresh runs cleanly{hardeningQuip ? ` — ${hardeningQuip}` : '…'}</p>
            )}
          </div>
        ) : draftLoading ? (
          <div className="py-6 flex items-center justify-center"><Spinner size={18} className="animate-spin text-[var(--text-muted)]" /></div>
        ) : draftInfo ? (
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
            <p className="text-[13px] font-medium text-[var(--text-primary)] m-0">We found a previous review</p>
            {draftInfo.stale && <p className="text-[11px] text-amber-600 m-0 mt-1.5 leading-relaxed">You've changed things since this check — resuming won't include your latest edits.</p>}
            <div className="flex items-center gap-3 mt-4">
              <Button btnColor="primary" btnSize="sm" onClick={handleResumeDraft}><Play size={14} weight="fill" /><span className="text-[12px]">Resume review</span></Button>
              <button onClick={() => { handleDiscardDraft(); handleStartVerification() }} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer underline">Start fresh</button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 mb-5">
              <p className="text-[12px] text-[var(--text-secondary)] m-0 mb-3 leading-relaxed">
                {autoRefresh
                  ? 'Before publishing, an AI agent will run through your dashboard to check that everything works correctly on every scheduled refresh:'
                  : 'Before publishing, an AI agent will run through your dashboard to confirm everything is ready to go live:'}
              </p>
              <ul className="m-0 pl-0 space-y-2.5 list-none">
                {['Run all data queries against the latest data', 'Check all calculations and data processing steps', 'Confirm all widgets display correctly', autoRefresh ? 'Prepare your dashboard for reliable scheduled refresh' : 'Flag any potential issues in data queries or calculations'].map((t, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[12px] text-[var(--text-primary)]"><span className="shrink-0 w-[5px] h-[5px] rounded-full bg-[var(--accent)]" />{t}</li>
                ))}
              </ul>
            </div>
            <Button btnColor="primary" btnSize="md" mainBtnClassName="w-full justify-center py-3" onClick={handleStartVerification}>
              <Play size={15} weight="fill" /><span className="text-[13px] font-semibold">Start Review</span>
            </Button>
          </>
        )}
      </div>
    )
  }

  // ── STEP 4 — Confirm + post-publish actions ──
  const scheduleSummary = !autoRefresh ? 'One-time snapshot' : scheduleType === 'data_sync' ? 'Refreshes on every data sync' : `Refreshes ${scheduleFrequency}`
  const renderConfirmStep = () => {
    if (phase === PHASE.DONE) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle size={32} weight="fill" className="text-green-500" /></div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] m-0">{wasUpdate ? 'Dashboard updated!' : 'Dashboard published!'}</h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">{completedSteps} checks passed{autoRefresh ? ` · ${scheduleSummary.toLowerCase()}` : ''}</p>
          </div>
          <Button btnColor="primary" btnSize="sm" onClick={() => { onClose?.(); if (dashboardId) navigate(`/dashboards/${dashboardId}`); else if (workflowId) navigate(`/workflows/${workflowId}`) }}>
            <span className="text-[12px]">View dashboard</span>
          </Button>
        </div>
      )
    }
    if (isPublishing) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-3">
          <Spinner size={28} className="animate-spin text-[var(--accent)]" />
          <p className="text-[13px] font-medium text-[var(--text-primary)] m-0">{phaseMessage || (wasUpdate ? 'Updating your dashboard…' : 'Publishing your dashboard…')}</p>
        </div>
      )
    }
    return (
      <div className="px-6 py-6 max-w-[600px] mx-auto">
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)] m-0">Ready to publish</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1.5 mb-5">Give it a name and confirm. Here's what's going live:</p>

        {renderExistingBanner()}

        {publishDashboardEnabled && (
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Dashboard name</label>
            <input value={dashboardTitle} onChange={(e) => setDashboardTitle && setDashboardTitle(e.target.value)} placeholder="Name your dashboard" className="w-full text-[13px] border border-[var(--border-primary)] rounded-lg px-3 py-2 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-primary)] focus:border-[var(--accent)] transition-colors" />
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 mb-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><CheckCircle size={14} weight="fill" className="text-green-500 shrink-0" />Checked &amp; working</div>
          {publishDashboardEnabled && <div className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><SquaresFour size={14} weight="duotone" className="text-[var(--accent)] shrink-0" />Dashboard · {scheduleSummary.toLowerCase()}</div>}
          {slackEnabled && (slackChannels.length > 0 || slackDmUsers.length > 0) && <div className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><span className="shrink-0 w-3.5 h-3.5"><svg width="14" height="14" viewBox="0 0 256 256"><path d="M221.13,128A32,32,0,0,0,184,76.31V56a32,32,0,0,0-56-21.13A32,32,0,0,0,76.31,72H56a32,32,0,0,0-21.13,56A32,32,0,0,0,72,179.69V200a32,32,0,0,0,56,21.13A32,32,0,0,0,179.69,184H200a32,32,0,0,0,21.13-56ZM72,152a16,16,0,1,1-16-16H72Zm48,48a16,16,0,0,1-32,0V152a16,16,0,0,1,16-16h16Zm0-80H56a16,16,0,0,1,0-32h48a16,16,0,0,1,16,16Zm0-48H104a16,16,0,1,1,16-16Zm16-16a16,16,0,0,1,32,0v48a16,16,0,0,1-16,16H136Zm16,160a16,16,0,0,1-16-16V184h16a16,16,0,0,1,0,32Zm48-48H152a16,16,0,0,1-16-16V136h64a16,16,0,0,1,0,32Zm0-48H184V104a16,16,0,1,1,16,16Z" fill="#4A154B"/></svg></span>Slack alert to {slackChannels.length + slackDmUsers.length} target{(slackChannels.length + slackDmUsers.length) !== 1 ? 's' : ''}</div>}
        </div>

        {isPetavueUser && (
          <div className="mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">{autoRefresh ? 'After each refresh' : 'Notifications'}</span>
            {/* Slack block always renders so its toggle stays available (toggling
                off collapses the config, it doesn't remove the whole block). */}
            <div className="space-y-3">
              {autoRefresh && renderAiBlock()}
              {renderSlackBlock()}
            </div>
          </div>
        )}

        {!autoRefresh && (
          <p className="text-[11px] text-amber-600 mt-3 flex items-center gap-1.5"><ArrowsClockwise size={12} weight="bold" />This is a one-time snapshot — it won't refresh automatically.</p>
        )}
      </div>
    )
  }

  // ── Progress indicator ──
  const stepIdx = STEP_ORDER.indexOf(step)
  const renderStepper = () => (
    <div className="shrink-0 flex items-center gap-1.5 px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/40">
      {STEP_ORDER.map((s, i) => {
        const isCurrent = s === step
        const isDone = i < stepIdx || (s === STEP.REVIEW && reviewPassed && step !== STEP.REVIEW)
        const reachable = i <= stepIdx || (i === stepIdx + 1 && (s !== STEP.CONFIRM || reviewPassed)) || (s === STEP.CONFIRM && reviewPassed) || i < stepIdx
        const locked = s === STEP.CONFIRM && !reviewPassed
        return (
          <div key={s} className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isAgentBusy || locked || !reachable}
              onClick={() => { if (!isAgentBusy && reachable && !locked) setStep(s) }}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border-none bg-transparent ${(!isAgentBusy && reachable && !locked) ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${isCurrent ? 'bg-[var(--accent)] text-white' : isDone ? 'bg-green-500 text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'}`}>
                {isDone ? <CheckCircle size={12} weight="fill" /> : i + 1}
              </span>
              <span className={`text-[12px] ${isCurrent ? 'font-semibold text-[var(--text-primary)]' : isDone ? 'font-medium text-green-600' : 'text-[var(--text-muted)]'}`}>{STEP_LABELS[s]}{s === STEP.REVIEW ? ' *' : ''}</span>
            </button>
            {i < STEP_ORDER.length - 1 && <CaretRight size={11} weight="bold" className="text-[var(--text-muted)] shrink-0" />}
          </div>
        )
      })}
      <span className="ml-auto text-[10px] text-[var(--text-muted)]">* required</span>
    </div>
  )

  // ── Footer (context-aware nav) ──
  const renderFooter = () => {
    const backBtn = (target, label = 'Back') => (
      <button onClick={() => setStep(target)} disabled={isAgentBusy} className="flex items-center gap-1.5 text-[12px] bg-transparent border-none p-0 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
        <ArrowLeft size={13} weight="bold" />{label}
      </button>
    )
    const canPublish = hasOutput && (!publishDashboardEnabled || (dashboardTitle || '').trim().length > 0)
    const publishReason = !hasOutput ? 'Choose at least one output' : !canPublish ? 'Name your dashboard' : ''

    return (
      <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div>
          {step === STEP.OUTPUTS && backBtn(STEP.VERIFY)}
          {step === STEP.FREQUENCY && backBtn(STEP.OUTPUTS)}
          {step === STEP.REVIEW && backBtn(STEP.FREQUENCY)}
          {step === STEP.CONFIRM && phase !== PHASE.DONE && backBtn(STEP.REVIEW)}
        </div>
        <div>
          {step === STEP.OUTPUTS && (
            <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" disabled={!hasOutput} onClick={() => setStep(STEP.FREQUENCY)} title={!hasOutput ? 'Choose at least one output' : ''}>
              <span className="text-[12px]">Continue</span><CaretRight size={13} weight="bold" />
            </Button>
          )}
          {step === STEP.FREQUENCY && (
            <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" onClick={() => setStep(STEP.REVIEW)}>
              <span className="text-[12px]">Continue</span><CaretRight size={13} weight="bold" />
            </Button>
          )}
          {step === STEP.REVIEW && (
            reviewPassed ? (
              <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" onClick={() => setStep(STEP.CONFIRM)}>
                <span className="text-[12px]">Continue</span><CaretRight size={13} weight="bold" />
              </Button>
            ) : isReviewRunning ? (
              <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" disabled><Spinner size={13} className="animate-spin" /><span className="text-[12px]">Reviewing…</span></Button>
            ) : null
          )}
          {step === STEP.CONFIRM && (
            phase === PHASE.DONE ? (
              <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" onClick={onClose}><span className="text-[12px]">Done</span></Button>
            ) : (
              <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" disabled={isPublishing || !canPublish} onClick={() => createWorkflow(execSessionIdRef.current)} title={publishReason}>
                {isPublishing ? <><Spinner size={13} className="animate-spin" /><span className="text-[12px]">Publishing…</span></> : <><span className="text-[12px]">Publish</span><CaretRight size={13} weight="bold" /></>}
              </Button>
            )
          )}
        </div>
      </div>
    )
  }

  // ── Adjustments overlay (reachable from the Review success "See what changed") ──
  if (showAdjustments && reviewPassed) {
    const hardenedSteps = (recipe?.steps || []).filter(s => hardeningStatus[s.id]?.status === 'hardened')
    const allCollapsed = hardenedSteps.every(s => collapsedSteps[s.id])

    const handleFeedbackUpdate = (steps, diffs) => {
      if (steps?.length > 0) {
        setStepResults(prev => {
          const updated = { ...prev }
          for (const st of steps) {
            if (updated[st.id]?.status === 'success') continue
            const s2 = st.status === 'completed' ? 'success' : st.status === 'skipped' ? 'skipped' : st.status === 'failed' ? 'failed' : null
            if (s2) { updated[st.id] = { ...updated[st.id], step_id: st.id, status: s2 }; if (st.skip_reason) updated[st.id].skip_reason = st.skip_reason }
          }
          return updated
        })
        setHardeningStatus(prev => {
          const updated = { ...prev }
          for (const st of steps) { if (st.hardening_status && st.hardening_status !== 'pending') updated[st.id] = { status: st.hardening_status, reason: st.hardening_reason || '' } }
          return updated
        })
      }
      if (diffs && Object.keys(diffs).length > 0) {
        setCodeDiffs(prev => { const updated = { ...prev }; for (const [stepId, diff] of Object.entries(diffs)) { if (!updated[stepId]) updated[stepId] = { diff, field: 'code', truncated: false } } return updated })
      }
    }

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-[var(--border-primary)]">
          <button onClick={() => setShowAdjustments(false)} className="flex items-center gap-1.5 text-[12px] bg-transparent border-none p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"><ArrowLeft size={13} weight="bold" />Back to check</button>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] ml-2">What changed ({adjustmentCount})</span>
        </div>
        <div className="flex-1 min-h-0 flex overflow-hidden" ref={adjustmentContainerRef}>
          <div className="flex flex-col overflow-y-auto" style={{ width: selectedOutput ? `${adjustmentSplitPct}%` : '100%' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">We made {adjustmentCount} fix{adjustmentCount !== 1 ? 'es' : ''} so it keeps working</h3>
              <button onClick={() => { const next = {}; const target = !allCollapsed; hardenedSteps.forEach(s => { next[s.id] = target }); setCollapsedSteps(prev => ({ ...prev, ...next })) }} className="p-1 rounded hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]" title={allCollapsed ? 'Expand all' : 'Collapse all'}>{allCollapsed ? <ArrowsOutSimple size={14} weight="bold" /> : <ArrowsInSimple size={14} weight="bold" />}</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 s-diff-dark">
              {hardenedSteps.map((s) => {
                const idx = recipe.steps.indexOf(s)
                return <RecipeStepCell key={s.id} step={s} stepIndex={idx} result={stepResults[s.id]} onRun={() => {}} onViewOutput={(f) => setSelectedOutput(f)} canRun={false} isRunning={false} removed={false} onRemove={() => {}} onRestore={() => {}} viewMode="card" summaryLoading={false} isFixed={false} codeDiff={codeDiffs[s.id] || null} skipReason={stepResults[s.id]?.skip_reason || null} hideRunButton hardeningInfo={hardeningStatus[s.id] || null} collapsed={!!collapsedSteps[s.id]} onToggleCollapse={() => setCollapsedSteps(prev => ({ ...prev, [s.id]: !prev[s.id] }))} />
              })}
              {recipe?.target_file && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border cursor-pointer transition-all ${selectedOutput?.path === recipe.target_file ? 'border-[var(--accent)] bg-[var(--accent)]/6' : 'border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 hover:border-[var(--accent)]/50'}`} onClick={() => setSelectedOutput({ path: recipe.target_file, type: 'html' })}>
                  <SquaresFour size={14} weight="duotone" className="text-[var(--accent)] shrink-0" />
                  <div className="flex-1 min-w-0 flex items-baseline"><span className="text-[12px] font-semibold text-[var(--text-primary)] shrink-0">Dashboard</span><span className="text-[11px] text-[var(--text-muted)] ml-2 font-mono truncate min-w-0">{recipe.target_file}</span></div>
                  <span className="text-[11px] text-[var(--accent)] font-medium shrink-0 whitespace-nowrap">{selectedOutput?.path === recipe.target_file ? 'Viewing →' : 'Preview →'}</span>
                </div>
              )}
              {execSessionIdRef.current && (
                <div className="mt-3 pt-3 border-t border-dashed border-[var(--border-primary)]/50">
                  <HardeningChat sessionId={sessionId} execSessionId={execSessionIdRef.current} disabled={false} onStepUpdate={(stepId, data) => { handleFeedbackUpdate([{ ...data, id: stepId }], null) }} onDiffUpdate={(stepId, diff) => { handleFeedbackUpdate(null, { [stepId]: diff.diff }) }} />
                </div>
              )}
            </div>
          </div>
          {selectedOutput && (
            <>
              <div className="shrink-0 w-px cursor-col-resize bg-[var(--border-primary)] hover:bg-[var(--accent)]/40 transition-colors relative" onMouseDown={(e) => { e.preventDefault(); adjustmentDragging.current = true; const onMove = (ev) => { if (!adjustmentDragging.current || !adjustmentContainerRef.current) return; const rect = adjustmentContainerRef.current.getBoundingClientRect(); const pct = ((ev.clientX - rect.left) / rect.width) * 100; setAdjustmentSplitPct(Math.min(75, Math.max(25, pct))) }; const onUp = () => { adjustmentDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp) }}><div className="absolute inset-y-0 -left-1 -right-1" /></div>
              <div className="min-w-0 self-stretch flex flex-col" style={{ width: `${100 - adjustmentSplitPct}%` }}>
                <OutputPreview sessionId={execSessionIdRef.current} file={selectedOutput} onClose={() => setSelectedOutput(null)} />
              </div>
            </>
          )}
        </div>
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <button onClick={() => setShowAdjustments(false)} className="flex items-center gap-1.5 text-[12px] bg-transparent border-none p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"><ArrowLeft size={13} weight="bold" />Back to check</button>
          <Button btnColor="primary" btnSize="sm" mainBtnClassName="py-2 px-5 rounded-lg" onClick={() => { setShowAdjustments(false); setStep(STEP.CONFIRM) }}><span className="text-[12px]">Continue</span><CaretRight size={13} weight="bold" /></Button>
        </div>
      </div>
    )
  }

  // ── Main wizard return ──
  // The Verify step renders the widget views, which bring their own footer; all
  // other steps use the shared wizard footer.
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {renderStepper()}
      {step === STEP.VERIFY ? (
        <div className="flex-1 min-h-0">{renderVerifyStep()}</div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {step === STEP.OUTPUTS && renderOutputsStep()}
            {step === STEP.FREQUENCY && renderFrequencyStep()}
            {step === STEP.REVIEW && renderReviewStep()}
            {step === STEP.CONFIRM && renderConfirmStep()}
          </div>
          {renderFooter()}
        </>
      )}
    </div>
  )
}
