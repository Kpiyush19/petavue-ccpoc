import { useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'


// Amber callout rendered on COMPLETE-with-disclosure runs. The schema is the
// 4-field structure produced by the BE Haiku translator
// (src/skills/disclosure.py):
//   { headline, what_missing, what_works, suggested_followup }
// Returns null if there's nothing user-visible to render. The suggested
// follow-up renders as a chip — clicking it calls `onUseFollowup(text)` so
// the parent can pre-fill the chat composer (or hand it to the handoff
// flow) without the user having to retype.
//
// Collapsible: a small caret in the top-right toggles the body. We default
// to expanded so first-load surfaces the full message; once the user has
// read it they can minimize to free vertical space above the artifact
// without dismissing the gap entirely. Local state — intentionally not
// persisted across navigations (the disclosure is a per-run "thing the
// user should see"; refreshing should re-expose it).
//
// Visual decoupling: this component renders chrome only (its own rounded
// border + background). Positioning it above (rather than inside) the
// artifact card is the caller's responsibility — see ExecutionProgress.jsx
// where the right pane now lays out [DisclosureCallout, ArtifactCard]
// vertically with gap so the amber callout reads as a SEPARATE banner from
// the dashboard/memo, not as part of it.
export default function DisclosureCallout({ summary, onUseFollowup }) {
  const [collapsed, setCollapsed] = useState(false)
  if (!summary || typeof summary !== 'object') return null
  const { headline, what_missing, what_works, suggested_followup } = summary
  // No headline AND no body text = legacy session with empty payload. Hide.
  if (!headline && !what_missing && !what_works) return null

  return (
    <div
      className="rounded-xl border shrink-0"
      style={{
        backgroundColor: 'var(--pv-warning-bg)',
        borderColor: 'var(--pv-warning-700)',
      }}
    >
      <div className="flex items-start gap-3 p-3">
        <AlertTriangle
          size={18}
          className="shrink-0 mt-0.5"
          style={{ color: 'var(--pv-warning-700)' }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0" style={{ color: 'var(--pv-warning-700)' }}>
          {headline && (
            <div className="text-[13.5px] font-semibold leading-snug">
              {headline}
            </div>
          )}
          {!collapsed && (
            <>
              {what_missing && (
                <div className="text-[12.5px] mt-1.5 leading-relaxed opacity-95">
                  {what_missing}
                </div>
              )}
              {what_works && (
                <div className="text-[12px] mt-1.5 leading-relaxed opacity-80">
                  {what_works}
                </div>
              )}
              {suggested_followup && onUseFollowup && (
                <button
                  type="button"
                  onClick={() => onUseFollowup(suggested_followup)}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md border transition-colors cursor-pointer hover:opacity-90"
                  style={{
                    backgroundColor: 'rgba(180, 83, 9, 0.12)',
                    borderColor: 'var(--pv-warning-700)',
                    color: 'var(--pv-warning-700)',
                  }}
                  title="Click to use this as a follow-up question"
                >
                  Ask the agent: &quot;{suggested_followup}&quot;
                  <ArrowRight size={12} />
                </button>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand details' : 'Minimize'}
          title={collapsed ? 'Expand details' : 'Minimize'}
          className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors cursor-pointer"
          style={{ color: 'var(--pv-warning-700)' }}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    </div>
  )
}
