import { Sparkle } from '@phosphor-icons/react'

// Surfaces the agentic-review adjustments the user chose NOT to apply, as
// checkbox rows. Selection is controlled by the parent and is only *staged* —
// checked adjustments are applied when the user continues, not on click.
export default function UnappliedAdjustmentsCard({ adjustments = [], selected = {}, onToggle }) {
  if (adjustments.length === 0) return null

  const selCount = adjustments.filter((a) => selected[a.id]).length

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/60 overflow-hidden my-1">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--border-primary)]">
        <Sparkle size={15} weight="fill" className="text-[var(--accent)] shrink-0" />
        <span className="text-[12px] font-semibold text-[var(--text-primary)]">
          {adjustments.length} reviewed adjustment{adjustments.length !== 1 ? 's' : ''} you haven't applied
        </span>
        {selCount > 0 && <span className="text-[12px] text-[var(--text-muted)]">· {selCount} will apply on continue</span>}
      </div>
      <div className="px-3.5 py-2.5 space-y-2.5">
        {adjustments.map((adj) => (
          <label key={adj.id} className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!selected[adj.id]}
              onChange={() => onToggle?.(adj)}
              title="Check to apply this adjustment when you continue"
              className="w-3.5 h-3.5 accent-[var(--accent)] shrink-0 mt-0.5 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span className={`block text-[12px] font-medium ${selected[adj.id] ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{adj.title}</span>
              {adj.reason && <span className="block text-[12px] text-[var(--text-muted)] leading-snug mt-0.5">{adj.reason}</span>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
