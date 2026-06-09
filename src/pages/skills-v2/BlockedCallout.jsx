import { AlertOctagon, Lightbulb, ShieldOff, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'


// Red callout rendered on BLOCKED phase. The schema is the 4-field structure
// produced by the BE Haiku translator (src/skills/disclosure.py):
//   { headline, why_blocked, what_you_can_do: string[], what_system_cannot_do }
//
// Returns null if there's nothing user-visible to render (e.g. an in-flight
// run where the translator hasn't populated yet — block_reason renders via
// the parent's fallback path instead).
//
// `onRerun` (optional): starts a fresh skill run with the same skill_id.
// Rendered below the "What you can do" list when provided — common case
// after the user reads the diagnosis. The old session stays untouched.
//
// Color rule: red is reserved for SIGNALS (border, icon, section labels,
// numbered prefixes) — the visual evidence that you're in a blocked state.
// Body content (headline, why, action descriptions, tail caveat) uses
// neutral text colors so the user can actually read what happened. When
// every line is red, nothing stands out and the body becomes hard to scan.
export default function BlockedCallout({ summary, fallbackReason, onRerun, rerunning }) {
  const hasSummary =
    summary &&
    typeof summary === 'object' &&
    (summary.headline ||
      summary.why_blocked ||
      (Array.isArray(summary.what_you_can_do) && summary.what_you_can_do.length) ||
      summary.what_system_cannot_do)

  // Legacy session or translator hasn't populated yet — fall back to the
  // raw block_reason so the user at least sees the underlying message.
  if (!hasSummary) {
    if (!fallbackReason) return null
    return (
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: 'var(--pv-error-bg)',
          borderColor: 'var(--pv-error-text)',
        }}
      >
        <div className="flex items-start gap-3">
          <AlertOctagon
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: 'var(--pv-error-text)' }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold leading-snug text-[var(--text-primary)]">
              We couldn&apos;t finish this run.
            </div>
            <div className="text-[12.5px] mt-1.5 leading-relaxed text-[var(--text-secondary)]">
              {fallbackReason}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { headline, why_blocked, what_you_can_do, what_system_cannot_do } = summary
  const options = Array.isArray(what_you_can_do) ? what_you_can_do : []

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: 'var(--pv-error-bg)',
        borderColor: 'var(--pv-error-text)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertOctagon
          size={18}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--pv-error-text)' }}
        />
        <div className="flex-1 min-w-0">
          {headline && (
            <div className="text-[13.5px] font-semibold leading-snug text-[var(--text-primary)]">
              {headline}
            </div>
          )}
          {why_blocked && (
            <div className="text-[12.5px] mt-1.5 leading-relaxed text-[var(--text-secondary)]">
              {why_blocked}
            </div>
          )}
        </div>
      </div>

      {options.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-primary)]">
          <div
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold mb-2"
            style={{ color: 'var(--pv-error-text)' }}
          >
            <Lightbulb size={11} />
            What you can do
          </div>
          <ul className="space-y-1.5">
            {options.map((opt, i) => (
              <li
                key={i}
                className="text-[12.5px] leading-relaxed flex items-start gap-2 text-[var(--text-primary)]"
              >
                <span
                  className="font-semibold mt-0.5 shrink-0"
                  style={{ color: 'var(--pv-error-text)' }}
                >
                  {i + 1}.
                </span>
                <span>{opt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onRerun && (
        <div className="mt-3">
          <Button
            onClick={onRerun}
            size="sm"
            variant="primary"
            disabled={rerunning}
          >
            {rerunning ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1.5" />
                Starting…
              </>
            ) : (
              <>
                <RefreshCw size={12} className="mr-1.5" />
                Start a new run
              </>
            )}
          </Button>
        </div>
      )}

      {what_system_cannot_do && (
        <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
          <ShieldOff
            size={12}
            className="shrink-0 mt-0.5"
            style={{ color: 'var(--pv-error-text)' }}
          />
          <span>{what_system_cannot_do}</span>
        </div>
      )}
    </div>
  )
}
