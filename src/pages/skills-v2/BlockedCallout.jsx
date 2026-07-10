import { useState } from 'react'
import { AlertOctagon, Lightbulb, ShieldOff } from 'lucide-react'
import { Button as PvButton } from '../../petavue'
import { PaperPlaneRight, ArrowsClockwise } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/Spinner'


// Actions for a blocked run. When `onCorrect` is provided, the primary path
// is a correction channel — the user tells Sage where the data actually is
// (or that it exists), and Sage re-plans in chat instead of the run being a
// dead-end. "Start a new run" drops to a secondary option. This is the
// difference between "truly missing" (the tail caveat) and "you can tell me
// where it is" (this box).
function BlockedActions({ onCorrect, correcting, onRerun, rerunning, note, setNote }) {
  if (!onCorrect && !onRerun) return null
  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex flex-col gap-2.5">
      {onCorrect ? (
        <>
          <div className="text-[12.5px] font-semibold text-[var(--text-primary)]">
            Think this is wrong? Tell Sage where the data is.
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
            If the data exists, point Sage to it: the table, the field, or how it&apos;s mapped. It&apos;ll re-plan with your input instead of stopping here.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Stage-change history lives in opportunity_field_history, keyed by opportunity_id."
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y"
          />
          <div className="flex items-center gap-2">
            <PvButton
              onClick={() => onCorrect(note.trim())}
              size="sm"
              variant="primary"
              disabled={!note.trim() || correcting}
              label={correcting ? 'Sending…' : 'Send to Sage'}
              icon={correcting ? Spinner : PaperPlaneRight}
            />
            {onRerun && (
              <PvButton
                onClick={onRerun}
                size="sm"
                variant="ghost"
                disabled={rerunning}
                label={rerunning ? 'Starting…' : 'Start a new run'}
                icon={rerunning ? Spinner : ArrowsClockwise}
              />
            )}
          </div>
        </>
      ) : (
        onRerun && (
          <PvButton
            onClick={onRerun}
            size="sm"
            variant="primary"
            disabled={rerunning}
            label={rerunning ? 'Starting…' : 'Start a new run'}
            icon={rerunning ? Spinner : ArrowsClockwise}
          />
        )
      )}
    </div>
  )
}


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
export default function BlockedCallout({ summary, fallbackReason, onRerun, rerunning, onCorrect, correcting }) {
  const [note, setNote] = useState('')
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
        <BlockedActions
          onCorrect={onCorrect}
          correcting={correcting}
          onRerun={onRerun}
          rerunning={rerunning}
          note={note}
          setNote={setNote}
        />
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

      <BlockedActions
        onCorrect={onCorrect}
        correcting={correcting}
        onRerun={onRerun}
        rerunning={rerunning}
        note={note}
        setNote={setNote}
      />

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
