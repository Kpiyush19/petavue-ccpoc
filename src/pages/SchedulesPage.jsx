import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, Pencil, Trash2, Clock, Calendar, Inbox, RefreshCw, Globe, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui'
import { Badge } from '@/ui'
import ScheduleFormModal from '../components/ScheduleFormModal'
import ScheduleRunHistory from '../components/ScheduleRunHistory'
import { useSessionContext } from '../contexts/SessionContext'

export default function SchedulesPage() {
  const { sched } = useSessionContext()
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showRunHistory, setShowRunHistory] = useState(false)
  const [triggeringId, setTriggeringId] = useState(null)

  useEffect(() => {
    sched.fetchSchedules()
  }, [])

  const handleEdit = (s) => {
    setEditingSchedule(s)
    setShowForm(true)
  }

  const handleUpdate = async (body) => {
    await sched.updateSchedule(editingSchedule.schedule_id, body)
    setShowForm(false)
    setEditingSchedule(null)
  }

  const handleToggleStatus = async (s) => {
    const newStatus = s.status === 'active' ? 'paused' : 'active'
    await sched.updateSchedule(s.schedule_id, { status: newStatus })
  }

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return
    await sched.deleteSchedule(s.schedule_id)
  }

  const handleTrigger = async (s) => {
    setTriggeringId(s.schedule_id)
    try {
      await sched.triggerRun(s.schedule_id)
      setTimeout(() => sched.fetchSchedules(), 500)
    } catch (e) {
      toast.error('Trigger failed: ' + e.message)
    } finally {
      setTriggeringId(null)
    }
  }

  const handleViewRuns = async (s) => {
    await sched.selectSchedule(s.schedule_id)
    setShowRunHistory(true)
  }

  const handleBackFromRuns = () => {
    setShowRunHistory(false)
    sched.clearSelection()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 h-[64px] border-b border-[var(--border-primary)] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Calendar size={18} className="text-[var(--accent)]" />
            {showRunHistory && sched.selectedSchedule
              ? `Runs: ${sched.selectedSchedule.name}`
              : 'Scheduled Reports'}
          </h1>
          {!showRunHistory && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {sched.schedules.length} schedule{sched.schedules.length !== 1 ? 's' : ''} · automated dashboard refreshes
            </p>
          )}
        </div>
        {showRunHistory && (
          <Button variant="secondary" size="sm" onClick={handleBackFromRuns}>
            Back to schedules
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {showRunHistory && sched.selectedSchedule ? (
          <ScheduleRunHistory
            runs={sched.runs}
            loading={sched.runsLoading}
            onBack={handleBackFromRuns}
          />
        ) : (
          <>
            {sched.loading && (
              <div className="text-center py-16 text-[var(--text-muted)] text-sm animate-thinking">Loading...</div>
            )}

            {sched.error && (
              <div className="text-center py-4 text-[var(--error)] text-sm">{sched.error}</div>
            )}

            {!sched.loading && sched.schedules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
                  <Inbox size={24} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">No schedules yet</p>
              </div>
            )}

            <div className="space-y-2">
              {!sched.loading && sched.schedules.map((s, i) => (
                <motion.div
                  key={s.schedule_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-5 py-4
                    hover:shadow-[var(--shadow-card)] hover:-translate-y-[1px] transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      s.status === 'active'
                        ? 'bg-[var(--accent)]/8'
                        : 'bg-[var(--bg-hover)]'
                    }`}>
                      <RefreshCw size={18} className={
                        s.status === 'active' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                      } />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                          {s.name}
                        </span>
                        <Badge variant={s.status === 'active' ? 'success' : 'muted'}>
                          {s.status}
                        </Badge>
                        {s.running && (
                          <Badge variant="warning" className="animate-pulse">running</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {s.cron_description || s.cron_expression} · {s.timezone}
                        </span>
                      </div>
                      {s.target_file && (
                        <div className="flex items-center gap-1 text-[12px] text-[var(--text-muted)] mt-1">
                          <FileText size={10} />
                          <span className="truncate">{s.target_file}</span>
                        </div>
                      )}
                      {!s.target_file && s.prompt && (
                        <div className="text-[12px] text-[var(--text-muted)] truncate mt-1">
                          {s.prompt.slice(0, 100)}{s.prompt.length > 100 ? '...' : ''}
                        </div>
                      )}
                      {s.recipients?.length > 0 && (
                        <div className="text-[12px] text-[var(--text-muted)] mt-1">
                          Refresh published artifact: {s.target_file || 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleTrigger(s)}
                        disabled={s.running || triggeringId === s.schedule_id}
                        title="Trigger run"
                        className="text-[var(--action-success)] hover:bg-[var(--action-success)]/10"
                      >
                        <Play size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleStatus(s)}
                        title={s.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {s.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleViewRuns(s)}
                        title="View runs"
                      >
                        <Clock size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(s)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(s)}
                        title="Delete"
                        className="text-[var(--action-danger)] hover:bg-[var(--action-danger)]/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form modal (edit only) */}
      {showForm && (
        <ScheduleFormModal
          schedule={editingSchedule}
          onSave={handleUpdate}
          onClose={() => { setShowForm(false); setEditingSchedule(null) }}
        />
      )}
    </div>
  )
}
