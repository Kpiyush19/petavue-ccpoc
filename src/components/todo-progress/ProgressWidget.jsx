import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Circle, CircleDot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import useTodoStore from './useTodoStore'

const AUTO_EXPAND_MS = 3000
const VERIFY_RE = /\b(verif|verification)\b/i

function getCounts(todos) {
  const counts = { pending: 0, in_progress: 0, completed: 0 }
  for (const t of todos) {
    if (counts[t.status] !== undefined) counts[t.status] += 1
  }
  return counts
}

function StatusIcon({ status, agentRunning }) {
  if (status === 'completed') {
    return <Check size={12} className="text-[var(--status-success)] shrink-0" />
  }
  if (status === 'in_progress') {
    // Spinner only when the agent is actively running. When the user stops
    // the turn (or it errors out), the task is frozen mid-flight — show a
    // static indicator so the UI doesn't imply work is still happening.
    if (agentRunning) {
      return <Loader2 size={12} className="text-[var(--accent)] shrink-0 animate-spin" />
    }
    return <CircleDot size={12} className="text-[var(--status-warning)] shrink-0" />
  }
  return <Circle size={10} className="text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
}

function TodoItem({ todo, agentRunning }) {
  const isVerify = VERIFY_RE.test(todo.content || '')
  const label = todo.status === 'in_progress' ? (todo.activeForm || todo.content) : todo.content

  let textCls = 'text-[12px] leading-snug'
  if (todo.status === 'completed') textCls += ' text-[var(--text-muted)] line-through'
  else if (todo.status === 'in_progress') textCls += ' text-[var(--text-primary)] font-medium'
  else textCls += ' text-[var(--text-secondary)]'
  if (isVerify) textCls += ' italic'

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="pt-0.5"><StatusIcon status={todo.status} agentRunning={agentRunning} /></div>
      <span className={textCls}>{label}</span>
    </div>
  )
}

export default function ProgressWidget({ artifactPanelOpen = false, agentRunning = false }) {
  const todos = useTodoStore((s) => s.todos)
  const hasEverHadTodos = useTodoStore((s) => s.hasEverHadTodos)
  const autoExpandPending = useTodoStore((s) => s.autoExpandPending)
  const consumeAutoExpand = useTodoStore((s) => s.consumeAutoExpand)

  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close the popover whenever the artifact panel opens (avoid overlap).
  useEffect(() => {
    if (artifactPanelOpen) setOpen(false)
  }, [artifactPanelOpen])

  // Auto-expand briefly on the first todo_write of a session.
  useEffect(() => {
    if (!autoExpandPending) return
    setOpen(true)
    consumeAutoExpand()
    const timer = setTimeout(() => setOpen(false), AUTO_EXPAND_MS)
    return () => clearTimeout(timer)
  }, [autoExpandPending, consumeAutoExpand])

  // Click outside / Escape collapses the panel.
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Hide widget entirely if the agent has never called todo_write for this session.
  if (!hasEverHadTodos) return null

  const counts = getCounts(todos)
  const total = todos.length

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] font-medium transition-colors cursor-pointer',
          'border border-[var(--border-primary)] bg-[var(--bg-secondary)]',
          'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]',
          open && 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
        )}
        title={total === 0 ? 'All tasks complete' : `${counts.completed}/${total} complete`}
      >
        {total > 0 && counts.in_progress > 0 ? (
          agentRunning ? (
            <Loader2 size={11} className="animate-spin text-[var(--accent)]" />
          ) : (
            <CircleDot size={11} className="text-[var(--status-warning)]" />
          )
        ) : null}
        <span className="tabular-nums">
          Progress {total > 0 ? `${counts.completed}/${total}` : '0/0'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute right-0 top-[calc(100%+6px)] z-20',
              'w-[320px] max-h-[60vh] overflow-y-auto',
              'rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]',
              'shadow-lg p-3'
            )}
          >
            {total === 0 ? (
              <div className="text-[12px] text-[var(--text-muted)] py-2 px-1">
                All tasks complete.
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-[var(--border-primary)]">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">Progress</span>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    {counts.completed} done · {counts.in_progress} {agentRunning ? 'active' : 'paused'} · {counts.pending} pending
                  </span>
                </div>
                {todos.map((todo, i) => (
                  <TodoItem key={i} todo={todo} agentRunning={agentRunning} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
