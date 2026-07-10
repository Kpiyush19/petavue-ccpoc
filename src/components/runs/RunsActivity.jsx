import { useMemo, useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flask, CaretRight, X } from '@phosphor-icons/react'
import { apiGet } from '../../api'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { PHASE_LABEL } from '../../pages/skills-v2/statusMap'

// Skill-run activity. The trigger lives INSIDE the left menu (above the
// profile footer) as a single button — collapsed rail it's a spinner/badge,
// expanded it's a "N runs in progress" summary. Clicking it opens the per-run
// list as a popover BESIDE the menu (not inline), so the menu chrome stays
// compact. Backed by the shared ['skills-v2-active-runs'] query so completions
// land even after navigating away.

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
    // private mode / quota — just won't remember dismissals across reloads
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

export default function RunsActivity({ expanded = false }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(loadDismissed)
  const [open, setOpen] = useState(false)
  // Rail width so the popover sits just outside the menu's right edge whether
  // the menu is collapsed (52px) or expanded (~230px).
  const [railW, setRailW] = useState(52)
  useEffect(() => {
    const el = document.querySelector('.menubar') || document.querySelector('aside')
    if (!el) return undefined
    const update = () => setRailW(el.offsetWidth || 52)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const { data } = useQuery({
    queryKey: ['skills-v2-active-runs'],
    queryFn: () => apiGet('/api/skill-runs/active'),
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
    retry: false,
  })

  const runs = useMemo(() => {
    const list = (data?.active_runs || []).filter((r) => r?.session_id && !dismissed.has(r.session_id))
    const ready = list.filter((r) => READY_PHASES.has(r.phase))
    const running = list.filter((r) => !READY_PHASES.has(r.phase))
    return { ready, running, all: [...ready, ...running] }
  }, [data, dismissed])

  useEffect(() => {
    if (runs.all.length === 0 && open) setOpen(false)
  }, [runs.all.length, open])

  const dismiss = useCallback((sid) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(sid)
      persistDismissed(next)
      return next
    })
  }, [])

  const openRun = useCallback((r) => {
    setOpen(false)
    if (READY_PHASES.has(r.phase)) {
      dismiss(r.session_id)
      navigate(`/session/${r.session_id}`)
    } else {
      navigate(`/skills/run/${r.session_id}`)
    }
  }, [dismiss, navigate])

  if (runs.all.length === 0) return null

  const runningCount = runs.running.length
  const readyCount = runs.ready.length
  const total = runs.all.length
  const summary = runningCount > 0
    ? `${total} run${total === 1 ? '' : 's'} in progress`
    : `${readyCount} ready`

  // The trigger button, rendered inside the menu slot (rail vs expanded).
  const trigger = !expanded ? (
    <div className="runs-activity-slot mt-auto w-full px-1.5 pb-1.5 flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={summary}
        aria-label={summary}
        className="group relative w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
      >
        {runningCount > 0 ? (
          <Spinner size={16} />
        ) : (
          <Flask size={16} weight="fill" className="text-[var(--accent)]" />
        )}
        {readyCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--accent)] text-white text-[9px] font-semibold leading-none ring-2 ring-[var(--bg-surface)]">
            {readyCount}
          </span>
        )}
      </button>
    </div>
  ) : (
    <div className="runs-activity-slot mt-auto shrink-0 w-full px-2 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-2.5 h-10 rounded-xl border border-[var(--pv-neutral-grey-150)] text-left bg-white hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
      >
        {runningCount > 0 ? (
          <Spinner size={13} className="shrink-0" />
        ) : (
          <Flask size={14} weight="fill" className="text-[var(--accent)] shrink-0" />
        )}
        <span className="flex-1 min-w-0 truncate text-[12.5px] font-medium text-[var(--text-primary)]">
          {summary}
        </span>
        <CaretRight size={13} className="text-[var(--text-muted)] shrink-0" />
      </button>
    </div>
  )

  return (
    <>
      {trigger}
      {open ? (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div
            style={{ left: railW + 8 }}
            className="fixed bottom-3 z-[56] w-80 max-w-[calc(100vw-72px)] flex flex-col bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl shadow-[0_16px_40px_-8px_rgba(16,24,40,0.28)] overflow-hidden"
          >
            <div className="flex items-center gap-2 h-11 px-3.5 shrink-0 border-b border-[var(--border-primary)]">
              {runningCount > 0 ? <Spinner size={13} className="shrink-0" /> : null}
              <span className="flex-1 min-w-0 text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {summary}{runningCount > 0 && readyCount > 0 ? ` · ${readyCount} ready` : ''}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-1" style={{ overscrollBehavior: 'contain' }}>
              {runs.all.map((r) => {
                const ready = READY_PHASES.has(r.phase)
                return (
                  <div key={r.session_id} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-[var(--text-primary)] truncate leading-tight">
                        {r.skill_title || 'Skill run'}
                      </div>
                      <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5 leading-tight truncate">
                        {ready ? 'Draft ready' : PHASE_LABEL[r.phase] || r.phase}
                        {relTime(r.created_at) ? ` · ${relTime(r.created_at)}` : ''}
                      </div>
                    </div>
                    <Button size="sm" variant={ready ? 'primary' : 'secondary'} className="shrink-0" onClick={() => openRun(r)}>
                      {ready ? 'Open' : 'View'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
