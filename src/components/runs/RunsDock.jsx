import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, CheckCircle2, ChevronDown, ArrowRight } from 'lucide-react'
import { apiGet } from '../../api'
import { PHASE_LABEL } from '../../pages/skills-v2/statusMap'

// A global, always-mounted dock (RootLayout) that surfaces every skill run
// the user has activated — so multiple concurrent runs stay visible and
// resumable from any page, and completed ones announce themselves as
// "ready" without the user sitting on the run page. Backed by the shared
// ['skills-v2-active-runs'] query, polled here so completions land even
// after the user has navigated away.

const READY_PHASES = new Set(['COMPLETE', 'OPEN_CHAT'])
const DISMISS_KEY = 'runs-dock-dismissed'

function loadDismissed() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
function persistDismissed(set) {
  try {
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set]))
  } catch {
    // private mode / quota — dock just won't remember dismissals across reloads
  }
}

function relTime(value) {
  if (!value) return ''
  const t = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function RunsDock() {
  const navigate = useNavigate()
  // The run page has its own bottom footer bar; lift the dock above it there
  // so the two don't overlap. Elsewhere it sits in the normal bottom corner.
  const onRunPage = useLocation().pathname.includes('/skills/run/')
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(loadDismissed)

  const { data } = useQuery({
    queryKey: ['skills-v2-active-runs'],
    queryFn: () => apiGet('/api/skill-runs/active'),
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
    retry: false,
  })

  const runs = useMemo(() => {
    const list = (data?.active_runs || []).filter((r) => r?.session_id && !dismissed.has(r.session_id))
    // Ready (actionable) first, then still-running.
    const ready = list.filter((r) => READY_PHASES.has(r.phase))
    const running = list.filter((r) => !READY_PHASES.has(r.phase))
    return { ready, running, all: [...ready, ...running] }
  }, [data, dismissed])

  // Nothing to show → make sure the panel isn't left hanging open.
  useEffect(() => {
    if (runs.all.length === 0 && expanded) setExpanded(false)
  }, [runs.all.length, expanded])

  const dismiss = useCallback((sid) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(sid)
      persistDismissed(next)
      return next
    })
  }, [])

  if (runs.all.length === 0) return null

  const runningCount = runs.running.length
  const readyCount = runs.ready.length

  return (
    <div className={`fixed right-4 z-[60] pointer-events-none ${onRunPage ? 'bottom-[68px]' : 'bottom-4'}`}>
      {/* One connected card: the summary bar is always visible, and the run
          list expands out of it upward. The same element grows/shrinks on click. */}
      <div className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] flex flex-col bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl shadow-[0_16px_40px_-8px_rgba(16,24,40,0.28)] overflow-hidden">
        {/* Header — always pinned to the top. Expanding pushes it up, revealing
            the run list underneath it. */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`flex items-center gap-2 w-full h-11 px-3.5 shrink-0 text-left bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] border-none cursor-pointer transition-colors ${expanded ? 'border-b border-[var(--border-primary)]' : ''}`}
        >
          {runningCount > 0 ? (
            <Loader2 size={15} className="shrink-0 text-[var(--accent)] animate-spin" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 text-[var(--pv-success-text,#16a34a)]" />
          )}
          <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[var(--text-primary)] truncate">
            {runningCount > 0
              ? `${runningCount} run${runningCount === 1 ? '' : 's'} in progress`
              : `${readyCount} ready`}
          </span>
          {runningCount > 0 && readyCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[var(--pv-success-text,#16a34a)] text-white text-[10px] font-semibold leading-none shrink-0">
              {readyCount}
            </span>
          )}
          <ChevronDown size={16} className={`shrink-0 text-[var(--text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.8 }}
              className="overflow-hidden"
            >
              <div className="max-h-[50vh] overflow-y-auto py-1" style={{ overscrollBehavior: 'contain' }}>
            {runs.all.map((r) => {
              const ready = READY_PHASES.has(r.phase)
              return (
                <div
                  key={r.session_id}
                  className="group flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false)
                      if (ready) {
                        dismiss(r.session_id)
                        navigate(`/session/${r.session_id}`)
                      } else {
                        navigate(`/skills/run/${r.session_id}`)
                      }
                    }}
                    className="flex-1 min-w-0 flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer"
                  >
                    {ready ? (
                      <CheckCircle2 size={15} className="shrink-0 text-[var(--pv-success-text,#16a34a)]" />
                    ) : (
                      <Loader2 size={14} className="shrink-0 text-[var(--accent)] animate-spin" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-[var(--text-primary)] truncate leading-tight">
                        {r.skill_title || 'Skill run'}
                      </div>
                      <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5 leading-tight truncate">
                        {ready ? 'Draft ready' : PHASE_LABEL[r.phase] || r.phase}
                        {relTime(r.created_at) ? ` · ${relTime(r.created_at)}` : ''}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded shrink-0 transition-colors ${
                        ready
                          ? 'text-white bg-[var(--accent)]'
                          : 'text-[var(--accent)] border border-[var(--accent)]/30 group-hover:bg-[var(--accent)] group-hover:text-white'
                      }`}
                    >
                      {ready ? 'Open' : 'View'}
                      <ArrowRight size={11} />
                    </span>
                  </button>
                </div>
              )
            })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
