import { Input, Select, Label } from '@/ui/components/FormControls/FormControls'
import { Button } from '@/ui'
import { DialogContent, DialogFooter } from '@/ui/components/OverlayDialog/OverlayDialog'

const CRON_PRESETS = [
  { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
  { label: 'Weekly on Monday at 9:00 AM', value: '0 9 * * 1' },
  { label: 'Weekdays at 9:00 AM', value: '0 9 * * 1-5' },
  { label: 'Monthly on the 1st at 9:00 AM', value: '0 9 1 * *' },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Kolkata',
  'Asia/Tokyo',
]

export default function PublishFormStep({
  name, setName,
  targetFile,
  shared, setShared,
  cronPreset, setCronPreset,
  timezone, setTimezone,
  recipients, setRecipients,
  onCancel, onNext, extracting,
  isUpdate = false,
}) {
  return (
    <>
      <DialogContent className="space-y-4 !p-5">
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HubSpot Deals Dashboard"
            required
          />
        </div>

        <div>
          <Label>Output File</Label>
          <Input value={targetFile} readOnly className="opacity-60" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label>Refresh Frequency</Label>
            <Select value={cronPreset} onChange={(e) => setCronPreset(e.target.value)}>
              {CRON_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Label>Timezone</Label>
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              Share with all users in your organization
            </span>
          </label>
        </div>

        <div>
          <Label>Email Recipients <span className="text-[var(--text-muted)] font-normal">(optional)</span></Label>
          <Input
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
          />
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="button" onClick={onNext} disabled={extracting || !name.trim()}>
          {extracting ? 'Extracting recipe...' : isUpdate ? 'Next: Verify Updated Steps' : 'Next: Verify Steps'}
        </Button>
      </DialogFooter>
    </>
  )
}
