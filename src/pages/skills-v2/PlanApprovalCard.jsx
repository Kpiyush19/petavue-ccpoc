import { Check, Loader2, Sparkles, AlertCircle, Calculator, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'


// Translate an axios error from `/skill/plan-summary` into something a
// user can act on. Different status codes map to different recovery
// paths, so we surface a specific headline + body rather than a raw
// `AxiosError: Request failed with status code 422` string.
function describeError(error) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (status === 404) {
    return {
      title: 'The plan isn\'t ready yet',
      body: 'The planner is still finalising. Refresh in a moment.',
    }
  }
  if (status === 422) {
    return {
      title: 'This plan is in an old format',
      body: 'It was created before a recent update and can\'t be opened. Discard this run from the Skills list to clear it.',
    }
  }
  if (status === 403) {
    return {
      title: 'You don\'t have access to this run',
      body: 'This session belongs to another user.',
    }
  }
  return {
    title: 'We couldn\'t load the plan',
    body: typeof detail === 'string' ? detail : 'Try refreshing in a moment.',
  }
}


// outputType param is no longer rendered as a label (per user request,
// the "DASHBOARD · READY TO BUILD" badge above the title is dropped to
// reclaim vertical space for the plan body). Accepted for API stability
// in case we want to bring it back. The Hero is also now slim — no
// trailing `mb-6` — so the next section sits directly under the outcome
// description instead of separated by an empty band.
function OutcomeHero({ title, outcome }) {
  return (
    <div>
      <h1 className="text-[20px] font-semibold text-[var(--text-primary)] leading-tight mb-2">
        {title || 'Plan ready for your review'}
      </h1>
      {outcome ? (
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          {outcome}
        </p>
      ) : (
        <p className="text-[13px] text-[var(--text-muted)] italic">
          No outcome summary available for this plan.
        </p>
      )}
    </div>
  )
}


function DeliverList({ icon, iconColor, title, items, emptyText }) {
  const ItemIcon = icon
  if (!items?.length && !emptyText) return null
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
        {title}
      </div>
      {items?.length ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-primary)] leading-snug">
              <ItemIcon size={13} className={`shrink-0 mt-0.5 ${iconColor}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-[var(--text-muted)] italic">{emptyText}</p>
      )}
    </div>
  )
}


// Render the Haiku-extracted formulas as a two-column list (name · formula).
// Hides the entire block when the extractor produced nothing — the doc's
// decision: better no section than a broken empty state. Reads the same
// `plan_key_formulas` field the BE persists on the session.
function KeyFormulasList({ formulas }) {
  if (!Array.isArray(formulas) || formulas.length === 0) return null
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
        <Calculator size={11} />
        Key formulas applied
      </div>
      <ul className="space-y-2 border border-[var(--border-primary)] rounded-lg p-3 bg-[var(--bg-primary)]">
        {formulas.map((f, i) => (
          <li
            key={i}
            className="flex flex-col gap-0.5 pb-2 last:pb-0 last:border-0 border-b border-[var(--border-primary)]/60"
          >
            <span className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">
              {f.name}
            </span>
            <span className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-mono">
              {f.formula}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}


export default function PlanApprovalCard({
  summary,
  loading,
  error,
  onApprove,
  onCancel,
  approving,
  discarding,
}) {
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 text-center text-sm text-[var(--text-muted)]">
        <Loader2 size={20} className="inline animate-spin mr-2" />
        Loading plan…
      </div>
    )
  }

  if (error) {
    const { title, body } = describeError(error)
    return (
      <div className="max-w-md mx-auto mt-12 p-5 bg-[var(--pv-error-bg)] border border-[var(--pv-error-text)]/30 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-[var(--pv-error-text)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">{title}</h2>
            <p className="text-[12.5px] text-[var(--text-secondary)] mb-4 leading-snug">{body}</p>
            <Button onClick={onCancel} size="sm" variant="ghost">
              Back to Skills
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="max-w-5xl mx-auto w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl flex flex-col min-h-0 h-full overflow-hidden">
      {/* Sticky header — title + outcome stay in view as the user
          scrolls through the INCLUDES / WON'T INCLUDE / KEY FORMULAS
          body. Tight bottom padding so the next section sits close. */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--border-primary)] shrink-0">
        <OutcomeHero
          title={summary.title}
          outcome={summary.plan_outcome}
        />
      </div>

      {/* Scrollable body — plan content + the Running-with summary live
          here. The Proceed button is pulled OUT into the sticky footer
          below so it stays visible no matter how long the plan is. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-5">
          <DeliverList
            icon={Check}
            iconColor="text-[var(--pv-success-text)]"
            title="Includes"
            items={summary.plan_will_deliver}
            emptyText="(nothing listed)"
          />
          <DeliverList
            icon={X}
            iconColor="text-[var(--text-muted)]"
            title="Won't include"
            items={summary.plan_wont_deliver}
            emptyText="(nothing flagged)"
          />
        </div>
        <KeyFormulasList formulas={summary.plan_key_formulas} />

        {summary.key_choices?.length ? (
          <div className="mt-6 pt-5 border-t border-[var(--border-primary)] text-[12px] text-[var(--text-secondary)]">
            <span className="text-[var(--text-muted)]">Running with: </span>
            {summary.key_choices.map((c) => c.value).join(' · ')}
          </div>
        ) : null}
      </div>

      {/* Sticky footer — Proceed only. Always visible regardless of how
          long the plan is. Per design: the Running-with summary stays
          inside the plan body, the footer is action-only. */}
      <div className="px-6 py-3 border-t border-[var(--border-primary)] shrink-0 flex items-center justify-end bg-[var(--bg-tertiary)]">
        <Button onClick={onApprove} size="md" disabled={approving || discarding}>
          {approving ? (
            <>
              <Loader2 size={14} className="animate-spin mr-1.5" />
              Starting…
            </>
          ) : (
            <>
              <Sparkles size={14} className="mr-1.5" />
              Proceed
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
