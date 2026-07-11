import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Play, Pause, Pencil, Trash2, Clock, X, Plus, Calendar, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogContent } from '@/ui/components/OverlayDialog/OverlayDialog'
import { Button } from '@/ui'
import { Badge } from '@/ui'
import { cn } from '../utils/cn'
import ScheduleFormModal from './ScheduleFormModal'
import ScheduleRunHistory from './ScheduleRunHistory'

export default function SchedulesPanel({
  schedules,
  loading,
  error,
  selectedSchedule,
  runs,
  runsLoading,
  onFetch,
  onCreate,
  onUpdate,
  onDelete,
  onTrigger,
  onSelect,
  onFetchRuns,
  onClearSelection,
  onClose,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showRunHistory, setShowRunHistory] = useState(false)
  const [triggeringId, setTriggeringId] = useState(null)

  useEffect(() => {
    onFetch()
  }, [onFetch])

  const handleCreate = async (body) => {
    await onCreate(body)
    setShowForm(false)
  }

  const handleEdit = (sched) => {
    setEditingSchedule(sched)
    setShowForm(true)
  }

  const handleUpdate = async (body) => {
    await onUpdate(editingSchedule.schedule_id, body)
    setShowForm(false)
    setEditingSchedule(null)
  }

  const handleToggleStatus = async (sched) => {
    const newStatus = sched.status === 'active' ? 'paused' : 'active'
    await onUpdate(sched.schedule_id, { status: newStatus })
  }

  const handleDelete = async (sched) => {
    if (!window.confirm(`Delete "${sched.name}"?`)) return
    await onDelete(sched.schedule_id)
  }

  const handleTrigger = async (sched) => {
    setTriggeringId(sched.schedule_id)
    try {
      await onTrigger(sched.schedule_id)
      setTimeout(() => onFetch(), 500)
    } catch (e) {
      toast.error('Trigger failed: ' + e.message)
    } finally {
      setTriggeringId(null)
    }
  }

  const handleViewRuns = async (sched) => {
    await onSelect(sched.schedule_id)
    setShowRunHistory(true)
  }

  const handleBackFromRuns = () => {
    setShowRunHistory(false)
    onClearSelection()
  }

  return (
    <Dialog open onClose={onClose} className="w-full max-w-2xl">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            {showRunHistory && selectedSchedule
              ? `Runs: ${selectedSchedule.name}`
              : 'Scheduled Reports'}
          </h3>
        </div>
        {!showRunHistory && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSchedule(null)
              setShowForm(true)
            }}
            className="gap-1"
          >
            <Plus size={13} />
            New
          </Button>
        )}
      </DialogHeader>

      <DialogContent className="!p-0">
        {showRunHistory && selectedSchedule ? (
          <ScheduleRunHistory
            runs={runs}
            loading={runsLoading}
            onBack={handleBackFromRuns}
          />
        ) : (
          <div className="p-2">
            {loading && (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">Loading...</div>
            )}

            {error && (
              <div className="text-center py-4 text-[var(--error)] text-sm">{error}</div>
            )}

            {!loading && schedules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
                  <Inbox size={18} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">No schedules yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingSchedule(null)
                    setShowForm(true)
                  }}
                >
                  Create your first schedule
                </Button>
              </div>
            )}

            {!loading &&
              schedules.map((sched, i) => (
                <motion.div
                  key={sched.schedule_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="px-4 py-3 rounded-xl mb-1 hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                          {sched.name}
                        </span>
                        <Badge variant={sched.status === 'active' ? 'success' : 'muted'}>
                          {sched.status}
                        </Badge>
                        {sched.running && (
                          <Badge variant="warning" className="animate-pulse">running</Badge>
                        )}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] truncate">
                        {sched.cron_description || sched.cron_expression} &middot; {sched.timezone}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                        {sched.prompt?.slice(0, 80)}{sched.prompt?.length > 80 ? '...' : ''}
                      </div>
                      {sched.recipients?.length > 0 && (
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          To: {sched.recipients.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleTrigger(sched)}
                        disabled={sched.running || triggeringId === sched.schedule_id}
                        title="Trigger run"
                        className="text-[var(--action-success)] hover:bg-[var(--action-success)]/10"
                      >
                        <Play size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleStatus(sched)}
                        title={sched.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {sched.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleViewRuns(sched)}
                        title="View runs"
                      >
                        <Clock size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(sched)}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(sched)}
                        title="Delete"
                        className="text-[var(--action-danger)] hover:bg-[var(--action-danger)]/10"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </DialogContent>

      {/* Form modal */}
      {showForm && (
        <ScheduleFormModal
          schedule={editingSchedule}
          onSave={editingSchedule ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false)
            setEditingSchedule(null)
          }}
        />
      )}
    </Dialog>
  )
}
