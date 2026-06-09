import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from './ui/Dialog'
import { Input, Textarea, Select, Label } from './ui/Input'
import { Button } from './ui/Button'

const CRON_PRESETS = [
  { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
  { label: 'Weekly on Monday at 9:00 AM', value: '0 9 * * 1' },
  { label: 'Weekdays at 9:00 AM', value: '0 9 * * 1-5' },
  { label: 'Monthly on the 1st at 9:00 AM', value: '0 9 1 * *' },
  { label: 'Monthly on the 15th at 9:00 AM', value: '0 9 15 * *' },
  { label: 'Daily at 8:00 AM', value: '0 8 * * *' },
  { label: 'Weekly on Friday at 5:00 PM', value: '0 17 * * 5' },
  { label: 'Custom', value: '__custom__' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export default function ScheduleFormModal({ schedule, prefillDashboardId, targetFiles = [], onSave, onClose }) {
  const isEdit = !!(schedule && schedule.schedule_id)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [dashboardId, setDashboardId] = useState('')
  const [targetFile, setTargetFile] = useState('')
  const [cronPreset, setCronPreset] = useState('0 9 * * 1')
  const [customCron, setCustomCron] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [recipients, setRecipients] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (schedule) {
      setName(schedule.name || '')
      setPrompt(schedule.prompt || '')
      setDashboardId(schedule.dashboard_id || '')
      setTimezone(schedule.timezone || 'UTC')
      setRecipients((schedule.recipients || []).join(', '))
      const preset = CRON_PRESETS.find((p) => p.value === schedule.cron_expression)
      if (preset) {
        setCronPreset(schedule.cron_expression)
      } else {
        setCronPreset('__custom__')
        setCustomCron(schedule.cron_expression || '')
      }
    }
  }, [schedule])

  // Auto-select first target file
  useEffect(() => {
    if (targetFiles.length > 0 && !targetFile) {
      setTargetFile(targetFiles[0])
    }
  }, [targetFiles])

  const cronExpression = cronPreset === '__custom__' ? customCron : cronPreset

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !prompt.trim() || !cronExpression.trim()) return
    const effectiveDashboard = prefillDashboardId || dashboardId.trim()

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        prompt: prompt.trim(),
        cron_expression: cronExpression.trim(),
        timezone,
        recipients: recipients
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
      }
      if (!isEdit) body.dashboard_id = effectiveDashboard
      if (targetFile) body.target_file = targetFile
      await onSave(body)
    } catch (e) {
      toast.error('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
        <DialogHeader onClose={onClose}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            {isEdit ? 'Edit Schedule' : prefillDashboardId ? 'Schedule This Analysis' : 'New Schedule'}
          </h3>
        </DialogHeader>

        <DialogContent className="space-y-4 !p-5">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly Pipeline Report"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <Label>Dashboard ID <span className="text-[var(--text-muted)] font-normal">(optional)</span></Label>
              <Input
                value={prefillDashboardId || dashboardId}
                onChange={(e) => setDashboardId(e.target.value)}
                placeholder="Dashboard ID (optional)"
                readOnly={!!prefillDashboardId}
                className={prefillDashboardId ? 'opacity-60' : ''}
              />
            </div>
          )}

          {!isEdit && targetFiles.length > 0 && (
            <div>
              <Label>Target Output File</Label>
              <Select value={targetFile} onChange={(e) => setTargetFile(e.target.value)}>
                {targetFiles.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                The output file to refresh on each scheduled run
              </p>
            </div>
          )}

          <div>
            <Label>Analysis Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Analyze last week's pipeline performance and highlight anomalies..."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Frequency</Label>
              <Select value={cronPreset} onChange={(e) => setCronPreset(e.target.value)}>
                {CRON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Label>Timezone</Label>
              <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {cronPreset === '__custom__' && (
            <div>
              <Label>Cron Expression</Label>
              <Input
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 9 * * 1"
                required
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                5-field cron: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}

          <div>
            <Label>Recipients (comma-separated emails)</Label>
            <Input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="alice@example.com, bob@example.com"
            />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
