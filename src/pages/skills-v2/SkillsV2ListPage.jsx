import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FlaskConical, Inbox, Play, Shield, User, Globe,
  LayoutDashboard, FileText, ChevronDown, Loader2, CircleDashed,
  ArrowRight, Trash2,
} from 'lucide-react'
import { Button } from '@/ui'
import { Badge } from '@/ui'
import { apiGet, apiPost, apiPut } from '../../api'
import { PHASE_LABEL } from './statusMap'

const SCOPE_BADGE = {
  tenant: { label: 'Tenant', variant: 'accent', icon: Shield },
  custom: { label: 'My Skill', variant: 'muted', icon: User },
  global: { label: 'Global', variant: 'success', icon: Globe },
}

const OUTPUT_TYPES = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'memo', label: 'Memo', icon: FileText },
]


function OutputTypePill({ skill, isAdmin, onEdited }) {
  const editable =
    skill.scope === 'custom' ||
    (skill.scope === 'tenant' && isAdmin)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (popoverRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const current = OUTPUT_TYPES.find((t) => t.value === skill.output_type)
  const Icon = current?.icon

  async function pickValue(value) {
    if (value === skill.output_type) {
      setOpen(false)
      return
    }
    setSaving(true)
    try {
      await apiPut(`/api/skills/${skill.id}`, { output_type: value })
      toast.success(`Output type set to ${value}`)
      onEdited()
      setOpen(false)
    } catch {
      // axios interceptor surfaces error toast; nothing more to do
    } finally {
      setSaving(false)
    }
  }

  const pillContent = (
    <>
      {Icon
        ? <Icon size={11} className="text-[var(--text-secondary)]" />
        : null}
      <span>{current?.label || 'Not set'}</span>
      {editable && <ChevronDown size={10} className="text-[var(--text-muted)]" />}
    </>
  )

  if (!editable) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
        {pillContent}
      </span>
    )
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] bg-[var(--bg-hover)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 size={11} className="animate-spin" /> : pillContent}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-10 p-1">
          {OUTPUT_TYPES.map((opt) => {
            const ItemIcon = opt.icon
            const selected = opt.value === skill.output_type
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pickValue(opt.value)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-left cursor-pointer hover:bg-[var(--bg-hover)] ${selected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
              >
                <ItemIcon size={13} />
                {opt.label}
                {selected && <span className="ml-auto text-[10px]">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


// Two formatters: one compact relative ("2h ago", "yesterday", "3d ago")
// for fast scanning when many runs share a phase, and one absolute
// ("May 21, 12:18 PM") that surfaces as a tooltip for precision.
//
// "yesterday" / "Nd ago" are computed on calendar-day boundaries — NOT
// rolling 24h windows — so a session from 38h ago on May 19 reads as
// "2d ago" on May 21, not "yesterday".
function formatRelativeTime(ms) {
  if (!ms || typeof ms !== 'number') return '—'
  const now = new Date()
  const then = new Date(ms)
  const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  // Calendar-day delta: zero out the time component on both sides and
  // diff. Same-day local midnight is the canonical reference.
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const thenMidnight = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()
  const days = Math.round((nowMidnight - thenMidnight) / 86400000)
  if (days <= 0) return 'today'      // wall-clock drift / future timestamp
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  // For older runs surface a fast-to-read date. Hover gives the exact ts.
  return then.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })
}

function formatAbsoluteTime(ms) {
  if (!ms || typeof ms !== 'number') return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}


// Split-button: main click runs a new session; the caret opens a menu of
// the user's in-progress runs for this skill. When no runs are active,
// the caret is hidden and the button behaves like a plain primary button.
//
// Each menu row carries both a Resume affordance (the whole row is
// clickable for fast access) and a discard control (the small X on
// the right) so users can sweep abandoned runs without leaving the
// list page.
// `disabled` disables every control in the cluster (transient pending state).
// `runDisabled` + `runDisabledReason` gate ONLY the main Run button — the
// in-progress dropdown stays usable so users can resume existing runs even
// when starting a new one is blocked (e.g. output_type missing).
function RunSplitButton({
  onRun, isRunning, disabled, runDisabled, runDisabledReason,
  activeRuns, onResume, onDiscard,
}) {
  const [open, setOpen] = useState(false)
  // Track which row is currently being discarded so we can show a spinner
  // on just that X without blocking the rest of the dropdown.
  const [discardingId, setDiscardingId] = useState(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (wrapperRef.current?.contains(e.target)) return
      setOpen(false)
    }
    // Listen on both `mousedown` (covers real mouse clicks early — before
    // the click handler on whatever the user tapped fires) and `click`
    // (covers programmatic `.click()` calls + keyboard activation).
    document.addEventListener('mousedown', onClick)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('click', onClick, true)
    }
  }, [open])

  const hasActive = activeRuns.length > 0

  async function handleDiscard(e, sessionId) {
    // The X button lives inside the clickable row — stop propagation so
    // clicking it doesn't also fire the Resume navigation.
    e.preventDefault()
    e.stopPropagation()
    if (discardingId) return
    setDiscardingId(sessionId)
    try {
      await onDiscard(sessionId)
    } finally {
      setDiscardingId(null)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-2 shrink-0" ref={wrapperRef}>
      {/* Wrap the Button in a span when disabled so the native tooltip
          fires on hover — Chrome doesn't dispatch hover events to
          disabled <button> elements. */}
      <span title={runDisabled && runDisabledReason ? runDisabledReason : undefined} className="inline-flex">
        <Button
          onClick={onRun}
          disabled={isRunning || disabled || runDisabled}
          size="sm"
        >
          {isRunning ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1.5" />
              Starting…
            </>
          ) : (
            <>
              <Play size={14} className="mr-1.5" />
              Run
            </>
          )}
        </Button>
      </span>
      {hasActive ? (
        <Button
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          size="sm"
          aria-label={`Show ${activeRuns.length} in-progress run${activeRuns.length === 1 ? '' : 's'}`}
          className="gap-1.5"
        >
          {/* Explicit label so the affordance reads as "open the list of
              in-progress runs" rather than a bare count. */}
          <span className="text-[12px] font-medium leading-none whitespace-nowrap">
            {activeRuns.length} in progress
          </span>
          <ChevronDown size={13} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </Button>
      ) : null}
      {open && hasActive ? (
        // Dropdown is bounded via inline style (more reliable than
        // Tailwind arbitrary values across all build modes). The body
        // div owns the scrollbar; header stays pinned.
        <div
          className="absolute right-0 top-full mt-1 w-80 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-20 flex flex-col overflow-hidden"
          style={{ maxHeight: '360px' }}
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-primary)] shrink-0 flex items-center justify-between">
            <span>In-progress {activeRuns.length === 1 ? 'run' : `runs (${activeRuns.length})`}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-1" style={{ overscrollBehavior: 'contain' }}>
            {activeRuns.map((run) => {
              const isDiscarding = discardingId === run.session_id
              const startedAbs = formatAbsoluteTime(run.created_at)
              return (
                <div
                  key={run.session_id}
                  className={`group flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] ${isDiscarding ? 'opacity-50' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => { setOpen(false); onResume(run.session_id) }}
                    disabled={isDiscarding}
                    className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer disabled:cursor-not-allowed"
                    title={startedAbs ? `Started ${startedAbs}` : undefined}
                  >
                    <CircleDashed size={11} className="text-[var(--accent)] shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight">
                        {PHASE_LABEL[run.phase] || run.phase}
                      </div>
                      <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5 leading-tight">
                        {formatRelativeTime(run.created_at)}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] px-2 py-0.5 rounded border border-[var(--accent)]/30 group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-[var(--accent)] transition-colors shrink-0">
                      View
                      <ArrowRight size={11} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDiscard(e, run.session_id)}
                    disabled={isDiscarding}
                    aria-label="Discard this run"
                    title="Discard. Removes this run from the list. Can't be undone."
                    className="shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-bg)]/40 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isDiscarding
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}


export default function SkillsV2ListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [runningSkillId, setRunningSkillId] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['skills-v2-list'],
    queryFn: () => apiGet('/api/skills?category=skill'),
    retry: false,
  })

  // Surface the user's in-progress runs next to each skill's Run button.
  // `refetchOnWindowFocus` so returning to the tab after a run completes
  // doesn't leave a stale Resume button pointing at a now-COMPLETE session.
  const { data: activeRunsData } = useQuery({
    queryKey: ['skills-v2-active-runs'],
    queryFn: () => apiGet('/api/skill-runs/active'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  })

  // All active runs grouped per skill_id, preserving the server's
  // DESC-by-last_active_at order. The split-button dropdown lists every
  // entry so the user can pick which abandoned run to resume.
  const activeRunsBySkill = useMemo(() => {
    const map = new Map()
    for (const run of activeRunsData?.active_runs || []) {
      if (!run.skill_id) continue
      const arr = map.get(run.skill_id) || []
      arr.push(run)
      map.set(run.skill_id, arr)
    }
    return map
  }, [activeRunsData])

  const isAdmin = data?.is_admin === true
  const skills = (data?.skills || []).filter((s) => s.scope !== 'global' && s.is_active)

  const runMutation = useMutation({
    mutationFn: async (skill) => {
      const res = await apiPost('/api/sessions', { skill_id: skill.name })
      return { skill, response: res }
    },
    onMutate: (skill) => setRunningSkillId(skill.id),
    onSuccess: ({ response }) => {
      const sessionId = response?.session?.session_id
      if (!sessionId) {
        toast.error('Session created but no id returned')
        setRunningSkillId(null)
        return
      }
      navigate(`/skills/run/${sessionId}`)
    },
    onError: () => {
      setRunningSkillId(null)
      // axios interceptor surfaces error toast
    },
  })

  // Discard removes an in-progress run from the user's resumable list
  // by transitioning it to phase=CANCELLED. We invalidate the
  // active-runs query so the row disappears immediately after the
  // mutation resolves. No optimistic update — keeps the UI honest if
  // the server rejects (e.g. session already terminal).
  async function discardRun(sessionId) {
    try {
      await apiPost(`/api/sessions/${sessionId}/skill/discard`, {})
      await queryClient.invalidateQueries({ queryKey: ['skills-v2-active-runs'] })
      toast.success('Run discarded')
    } catch {
      // axios interceptor toasts on failure
    }
  }

  function refetchSkills() {
    queryClient.invalidateQueries({ queryKey: ['skills-v2-list'] })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <FlaskConical size={18} className="text-[var(--accent)]" />
              Skills v2
              <span className="text-xs font-normal text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                Hidden / Petavue only
              </span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Run a skill end-to-end with the planner → executor → verifier flow.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">
            Loading skills…
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">
            Failed to load skills. Try refreshing.
          </div>
        )}

        {!isLoading && !isError && skills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <Inbox size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">No runnable skills yet</p>
            <p className="text-xs text-[var(--text-muted)]">
              Ask an admin to create or enable a tenant skill for your team.
            </p>
          </div>
        )}

        {!isLoading && skills.length > 0 && (
          <div className="space-y-2">
            {skills.map((skill) => {
              const scopeInfo = SCOPE_BADGE[skill.scope] || SCOPE_BADGE.custom
              const ScopeIcon = scopeInfo.icon
              const isRunning = runningSkillId === skill.id
              // Skills are stored on the session via `skill_id` which equals
              // the skill's `name` slug (e.g. "sales-pipeline-health"). The
              // active-runs response keys by that same slug, so we look up
              // by `skill.name`.
              const skillActiveRuns = activeRunsBySkill.get(skill.name) || []
              // Block Run until the skill has an explicit output_type.
              // Server resolves to null when neither the Mongo top-level
              // nor SKILL.md frontmatter sets one — the planner would
              // silently default to "dashboard", so we force authors to
              // pick (via the OutputTypePill on the same row) before
              // letting the run start.
              const needsOutputType = !skill.output_type

              return (
                <div
                  key={skill.id}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-5 py-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                          {skill.name}
                        </span>
                        <Badge variant={scopeInfo.variant}>
                          <ScopeIcon size={9} className="mr-0.5" />
                          {scopeInfo.label}
                        </Badge>
                        <OutputTypePill
                          skill={skill}
                          isAdmin={isAdmin}
                          onEdited={refetchSkills}
                        />
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">
                        {skill.description}
                      </p>
                    </div>

                    <RunSplitButton
                      onRun={() => runMutation.mutate(skill)}
                      isRunning={isRunning}
                      disabled={runMutation.isPending}
                      runDisabled={needsOutputType}
                      runDisabledReason={needsOutputType ? 'Output type needs to be selected.' : undefined}
                      activeRuns={skillActiveRuns}
                      onResume={(sid) => navigate(`/skills/run/${sid}`)}
                      onDiscard={discardRun}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
