import { motion } from 'motion/react'
import { ChevronLeft, Inbox } from 'lucide-react'
import { Badge } from '@/ui'
import { Button } from '@/ui'

const STATUS_VARIANT = {
  running: 'warning',
  completed: 'success',
  failed: 'danger',
}

function formatDuration(ms) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

export default function ScheduleRunHistory({ runs, loading, onBack }) {
  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="px-4 py-2 border-b border-[var(--border-primary)] shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 -ml-2"
        >
          <ChevronLeft size={14} />
          Back to schedules
        </Button>
      </div>

      {/* Runs list */}
      <div className="overflow-y-auto flex-1 p-2">
        {loading && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">Loading runs...</div>
        )}

        {!loading && runs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <Inbox size={18} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">No runs yet</p>
          </div>
        )}

        {!loading &&
          runs.map((run, i) => (
            <motion.div
              key={run.run_id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="px-3 py-2.5 rounded-xl mb-1 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={STATUS_VARIANT[run.status] || 'muted'}>
                  {run.status}
                </Badge>
                <span className="text-[12px] text-[var(--text-muted)]">
                  {run.trigger_type === 'cron' ? 'Scheduled' : 'Manual'}
                </span>
                <span className="flex-1" />
                <span className="text-[12px] text-[var(--text-muted)] font-mono">
                  {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                <span>Duration: {formatDuration(run.duration_ms)}</span>
                {run.total_input_tokens > 0 && (
                  <span className="font-mono">
                    {(run.total_input_tokens + run.total_output_tokens).toLocaleString()} tok
                  </span>
                )}
                {run.outputs?.length > 0 && <span>{run.outputs.length} output(s)</span>}
                {run.email_sent && (
                  <Badge variant="success">Email sent</Badge>
                )}
                {run.email_error && (
                  <Badge variant="danger" title={run.email_error}>Email failed</Badge>
                )}
              </div>
              {run.error && (
                <div className="mt-1 text-[12px] text-[var(--error)] bg-[var(--error)]/5 px-2 py-1 rounded font-mono">
                  {run.error}
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  )
}
