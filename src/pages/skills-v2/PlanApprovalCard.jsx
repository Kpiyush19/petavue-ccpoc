import { useState, useEffect } from 'react'
import { Check, Loader2, Sparkles, AlertCircle, Calculator, X, MessageSquare, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Button as PvButton } from '../../petavue'
import { PaperPlaneRight, CircleNotch } from '@phosphor-icons/react'
import { WidgetPreview } from './WidgetSchematic'

const Spinner = (props) => <CircleNotch {...props} className="animate-spin" />


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


// Widget schematics (WidgetPreview + the Mini* previews) moved to the shared
// WidgetSchematic module so the build screen can reuse them.


export default function PlanApprovalCard({
  summary,
  loading,
  error,
  onApprove,
  onCancel,
  approving,
  discarding,
  onRequestChanges,
  requesting,
  onReviewProgress,
}) {
  // "Request changes" reveals a feedback box — the user tells Sage what's
  // wrong with the plan instead of being forced to Proceed. It hands off to
  // chat so the planner can revise, the same channel the blocked state uses.
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [note, setNote] = useState('')
  // Per-widget review state: a note per widget, the set of dropped widgets,
  // and the set of approved (reviewed-and-OK) widgets.
  const [widgetNotes, setWidgetNotes] = useState({})
  const [dropped, setDropped] = useState(() => new Set())
  const [approved, setApproved] = useState(() => new Set())
  // Which widget row is shown in the detail pane (null = default to first).
  const [selectedId, setSelectedId] = useState(null)

  // Review completeness — computed BEFORE the early returns so the effect
  // below is always called (hooks can't run conditionally). `summary?` guards
  // the loading / no-summary renders.
  const widgets = Array.isArray(summary?.widgets) ? summary.widgets : []
  const reviewedCount = widgets.filter((w) => approved.has(w.id) || dropped.has(w.id)).length
  const allReviewed = widgets.length > 0 && reviewedCount === widgets.length
  const remaining = widgets.length - reviewedCount
  // Report it up so the run-page footer can gate Build it until every widget
  // is Approved or Dropped.
  useEffect(() => {
    onReviewProgress?.({ allReviewed, remaining, total: widgets.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewedCount, widgets.length])

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
            <PvButton onClick={onCancel} size="sm" variant="ghost" label="Back to Skills" />
          </div>
        </div>
      </div>
    )
  }

  if (!summary) return null

  const isMemo = summary.output_type === 'memo'
  // The widget shown in the detail pane — defaults to the first so the pane
  // is never empty.
  const selected = widgets.find((w) => w.id === selectedId) || widgets[0] || null
  const changeCount = widgets.filter((w) => dropped.has(w.id) || (widgetNotes[w.id] || '').trim()).length
  const toggleDropped = (id) => {
    setDropped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    // Dropping and approving are mutually exclusive.
    setApproved((prev) => { const next = new Set(prev); next.delete(id); return next })
  }
  const toggleApproved = (id) => {
    setApproved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setDropped((prev) => { const next = new Set(prev); next.delete(id); return next })
  }
  const approveAll = () => setApproved(new Set(widgets.filter((w) => !dropped.has(w.id)).map((w) => w.id)))
  // Roll the per-widget notes + drops into one message for Request changes.
  const compileWidgetFeedback = () => {
    const unit = isMemo ? 'section' : 'widget'
    return widgets
      .map((w) => {
        if (dropped.has(w.id)) return `Drop the "${w.name}" ${unit}.`
        if ((widgetNotes[w.id] || '').trim()) return `For "${w.name}": ${widgetNotes[w.id].trim()}`
        return null
      })
      .filter(Boolean)
      .join('\n')
  }
  const openRequestChanges = () => {
    const compiled = compileWidgetFeedback()
    if (compiled) setNote((n) => (n.trim() ? n : compiled))
    setFeedbackOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto w-full bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl flex flex-col min-h-0 h-full overflow-hidden">
      {/* Sticky header — title + outcome stay in view as the user
          scrolls through the INCLUDES / WON'T INCLUDE / KEY FORMULAS
          body. Tight bottom padding so the next section sits close. */}
      <div className="px-6 pt-4 pb-4 border-b border-[var(--border-primary)] shrink-0">
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Review the plan</div>
        <OutcomeHero
          title={summary.title}
          outcome={summary.plan_outcome}
        />
        {widgets.length > 0 && (
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mt-2">
            Pick a {isMemo ? 'section' : 'widget'} on the left to see it and adjust or drop it, then build. Nothing runs until you do.
          </p>
        )}
      </div>

      {/* Body — assumptions strip on top, then a 2-pane review: the ordered
          widget list (left) and the selected widget's detail + sample layout
          (right) so you can see what you're reviewing. Build it lives in the
          run-page footer, so the card carries no action bar of its own. */}
      {widgets.length > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Assumptions — the definitions an operator most needs to check */}
          {summary.key_choices?.length ? (
            <div className="px-6 py-3 shrink-0 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Assumptions</span>
                {summary.key_choices.map((c, i) => (
                  <span key={i} className="text-[12px]">
                    <span className="text-[var(--text-muted)]">{c.label}: </span>
                    <span className="font-medium text-[var(--text-primary)]">{c.value}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex-1 min-h-0 flex">
            {/* LEFT — ordered widget list + Ask Sage */}
            <div className="w-[264px] shrink-0 flex flex-col min-h-0 border-r border-[var(--border-primary)]">
              <div className="px-4 pt-3 pb-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold text-[var(--text-primary)]">What we&apos;ll build</h3>
                  {!allReviewed ? (
                    <button
                      type="button"
                      onClick={approveAll}
                      className="text-[11px] font-medium text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer shrink-0"
                    >
                      Approve all
                    </button>
                  ) : null}
                </div>
                <div className="text-[10.5px] mt-0.5 tabular-nums flex items-center gap-1">
                  {allReviewed ? (
                    <span className="inline-flex items-center gap-1 text-[var(--pv-success-text)] font-medium"><Check size={11} strokeWidth={3} />All reviewed</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">{reviewedCount} of {widgets.length} reviewed</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
                {widgets.map((w, i) => {
                  const sel = selected?.id === w.id
                  const isDropped = dropped.has(w.id)
                  const isApproved = approved.has(w.id)
                  const hasNote = (widgetNotes[w.id] || '').trim()
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedId(w.id)}
                      className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left border transition-colors cursor-pointer ${sel ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40' : 'border-transparent hover:bg-[var(--bg-hover)]'}`}
                    >
                      {isApproved ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--pv-success-text)] shrink-0"><Check size={12} className="text-white" strokeWidth={3} /></span>
                      ) : (
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0 tabular-nums ${sel ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>{i + 1}</span>
                      )}
                      <span className={`flex-1 min-w-0 truncate text-[12.5px] ${isDropped ? 'line-through text-[var(--text-muted)]' : sel ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>{w.name}</span>
                      {isDropped ? (
                        <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)] shrink-0">dropped</span>
                      ) : hasNote ? (
                        <MessageSquare size={11} className="text-[var(--accent)] shrink-0" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
              {/* Plan-level change — Ask Sage. Compiles any per-widget notes/drops. */}
              {onRequestChanges ? (
                <div className="px-3 py-3 border-t border-[var(--border-primary)] shrink-0">
                  {feedbackOpen ? (
                    <div className="flex flex-col gap-2">
                      <div className="text-[12px] font-medium text-[var(--text-primary)]">What should Sage change?</div>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        autoFocus
                        placeholder="e.g. Use W-shaped attribution, not last-touch."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-white text-[12px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <PvButton onClick={() => setFeedbackOpen(false)} size="sm" variant="ghost" disabled={requesting} label="Cancel" />
                        <PvButton onClick={() => onRequestChanges(note.trim())} size="sm" variant="primary" disabled={!note.trim() || requesting} label={requesting ? 'Sending…' : 'Send'} icon={requesting ? Spinner : PaperPlaneRight} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openRequestChanges}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] bg-transparent cursor-pointer transition-colors"
                    >
                      <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
                      <span className="text-[12px] font-medium truncate">
                        {changeCount > 0 ? `Send ${changeCount} change${changeCount > 1 ? 's' : ''}` : 'Ask Sage to change'}
                      </span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* RIGHT — selected widget detail + sample layout */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {selected ? (
                <div className="px-6 py-5 flex flex-col gap-5 max-w-2xl">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      {isMemo ? 'Section' : 'Widget'} {widgets.findIndex((x) => x.id === selected.id) + 1} of {widgets.length}
                    </div>
                    <h2 className={`text-[17px] font-semibold leading-tight ${dropped.has(selected.id) ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{selected.name}</h2>
                    {selected.desc ? <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mt-1.5">{selected.desc}</p> : null}
                  </div>

                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Sample layout</div>
                    <WidgetPreview widget={selected} />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Layout only — your real numbers fill in when it&apos;s built.</p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-primary)] flex flex-col gap-3">
                    {/* Per-widget actions — Approve (reviewed & OK) or Drop it */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleApproved(selected.id)}
                        size="sm"
                        variant={approved.has(selected.id) ? 'success' : 'primary'}
                      >
                        <Check size={14} className="mr-1.5" />
                        {approved.has(selected.id) ? 'Approved' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => toggleDropped(selected.id)}
                        size="sm"
                        variant={dropped.has(selected.id) ? 'secondary' : 'danger-ghost'}
                      >
                        {dropped.has(selected.id) ? (
                          <><Check size={14} className="mr-1.5" />Keep it</>
                        ) : (
                          <><X size={14} className="mr-1.5" />Drop it</>
                        )}
                      </Button>
                    </div>

                    {/* Change input for this widget */}
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
                        Request a change to this {isMemo ? 'section' : 'widget'}
                      </label>
                      <textarea
                        value={widgetNotes[selected.id] || ''}
                        onChange={(e) => setWidgetNotes((m) => ({ ...m, [selected.id]: e.target.value }))}
                        rows={3}
                        placeholder={`e.g. break "${selected.name}" down by channel, or use a different metric…`}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-white text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
                      />
                      {(widgetNotes[selected.id] || '').trim() ? (
                        <p className="flex items-start gap-1.5 text-[11.5px] text-[var(--text-secondary)] mt-2">
                          <Sparkles size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                          <span>Saved. Send it with the button on the left to have Sage revise the plan before building.</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-[12px] text-[var(--text-muted)] px-6">
                  Select a {isMemo ? 'section' : 'widget'} on the left to review it.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No widget breakdown — plain plan summary (assumptions + includes). */
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {summary.key_choices?.length ? (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] divide-y divide-[var(--border-primary)]">
                {summary.key_choices.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                    <span className="text-[12px] text-[var(--text-muted)] shrink-0">{c.label}</span>
                    <span className="text-[12.5px] font-medium text-[var(--text-primary)] text-right">{c.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DeliverList icon={Check} iconColor="text-[var(--pv-success-text)]" title="Includes" items={summary.plan_will_deliver} emptyText="(nothing listed)" />
              <DeliverList icon={X} iconColor="text-[var(--text-muted)]" title="Won't include" items={summary.plan_wont_deliver} emptyText="(nothing flagged)" />
            </div>
            <KeyFormulasList formulas={summary.plan_key_formulas} />
            {onRequestChanges ? (
              feedbackOpen ? (
                <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/[0.03] p-3.5 flex flex-col gap-2">
                  <div className="text-[12.5px] font-medium text-[var(--text-primary)]">What should Sage change?</div>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus placeholder="e.g. Use W-shaped attribution, not last-touch." className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-white text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y" />
                  <div className="flex items-center justify-end gap-2">
                    <PvButton onClick={() => setFeedbackOpen(false)} size="sm" variant="ghost" disabled={requesting} label="Cancel" />
                    <PvButton onClick={() => onRequestChanges(note.trim())} size="sm" variant="primary" disabled={!note.trim() || requesting} label={requesting ? 'Sending…' : 'Send to Sage'} icon={requesting ? Spinner : PaperPlaneRight} />
                  </div>
                </div>
              ) : (
                <button type="button" onClick={openRequestChanges} className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-dashed border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] bg-transparent cursor-pointer transition-colors">
                  <Sparkles size={15} className="text-[var(--accent)] shrink-0" />
                  <span className="text-[12.5px] font-medium">Ask Sage to change the plan</span>
                </button>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
