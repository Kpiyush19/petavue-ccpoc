import { useState, useEffect } from 'react'
import { Check, Sparkles, AlertCircle, Calculator, X, MessageSquare, Info, BarChart3, LineChart, Table2, List, LayoutGrid, AlignLeft } from 'lucide-react'
import { Button as PvButton } from '../../petavue'
import { PaperPlaneRight, CheckCircle, XCircle, ArrowUUpLeft, PencilSimple } from '@phosphor-icons/react'
import { Spinner } from '../../components/ui/Spinner'
import { WidgetPreview, WIDGET_TYPE_BY_ID } from './WidgetSchematic'

// Widget-type chip icon per schematic kind (see WIDGET_TYPE_BY_ID).
const TYPE_ICON = { stats: LayoutGrid, line: LineChart, bars: BarChart3, list: List, table: Table2, text: AlignLeft }


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
  // Which widget row is shown in the detail pane (null = default to the
  // current step in the sequential review).
  const [selectedId, setSelectedId] = useState(null)
  // "Request a change" drawer — slides in from the right, hidden by default.
  const [changePanelOpen, setChangePanelOpen] = useState(false)

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
        <Spinner size={20} className="mr-2 align-[-4px]" />
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
  const isReviewed = (w) => approved.has(w.id) || dropped.has(w.id)
  // Sequential review — one widget at a time. The "current" step is the first
  // unreviewed widget; everything after it is locked until it's handled. When
  // all are reviewed, the last is current (nothing is locked).
  const firstUnreviewedIndex = widgets.findIndex((w) => !isReviewed(w))
  const currentIndex = firstUnreviewedIndex === -1 ? widgets.length - 1 : firstUnreviewedIndex
  const isUnlocked = (i) => i <= currentIndex
  // The widget shown in the detail pane — the selected one if it's unlocked,
  // otherwise the current step. Never lands on a locked row.
  const selIdx = widgets.findIndex((w) => w.id === selectedId)
  const selected = widgets[selIdx !== -1 && isUnlocked(selIdx) ? selIdx : currentIndex] || null
  // After reviewing the current widget, jump to the next unreviewed one so the
  // flow stays one-by-one without the user hunting for what's next.
  const advanceFrom = (id) => {
    const idx = widgets.findIndex((w) => w.id === id)
    const next = widgets.find((w, i) => i > idx && !isReviewed(w))
    if (next) setSelectedId(next.id)
  }
  const toggleDropped = (id) => {
    const willReview = !dropped.has(id)
    setDropped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    // Dropping and approving are mutually exclusive.
    setApproved((prev) => { const next = new Set(prev); next.delete(id); return next })
    if (willReview) advanceFrom(id)
  }
  const toggleApproved = (id) => {
    const willReview = !approved.has(id)
    setApproved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    setDropped((prev) => { const next = new Set(prev); next.delete(id); return next })
    if (willReview) advanceFrom(id)
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

  // Two-pane review that mirrors the PLANNING screen: a widget checklist on
  // the left (like the setup step list) and the selected widget's detail on
  // the right. No full-width hero band — the plan title rides the run header;
  // the plan's assumptions sit on a slim strip under the right-pane header.
  if (widgets.length > 0) {
    return (
      <div className="flex-1 flex min-h-0 h-full relative overflow-hidden">
        {/* LEFT — widget checklist, matching the setup step list */}
        <div className="w-[340px] shrink-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] border-r-0 rounded-l-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 h-12 px-4 shrink-0">
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
              What we&apos;ll build
            </h2>
            {allReviewed ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--accent)] shrink-0">
                <Check size={12} strokeWidth={3} />All reviewed
              </span>
            ) : (
              <PvButton
                onClick={approveAll}
                size="md"
                variant="secondary"
                label="Approve all"
                className="shrink-0 !text-[var(--accent)] !border-[var(--accent)] !bg-white"
              />
            )}
          </div>
          <ul className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {widgets.map((w, i) => {
              const sel = selected?.id === w.id
              const isDropped = dropped.has(w.id)
              const isApproved = approved.has(w.id)
              const locked = !isUnlocked(i)
              const hasNote = (widgetNotes[w.id] || '').trim()
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setSelectedId(w.id)}
                    title={locked ? 'Review the earlier steps first' : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${sel ? 'bg-[var(--accent)]/10' : 'hover:bg-[var(--bg-hover)]'}`}
                  >
                    {isApproved ? (
                      <CheckCircle size={16} weight="fill" className="text-[var(--accent)] shrink-0" />
                    ) : (
                      <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold shrink-0 tabular-nums ${sel ? 'bg-[var(--color-primary-50)] text-[var(--accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>{i + 1}</span>
                    )}
                    <span className={`flex-1 min-w-0 truncate text-[14px] ${isDropped ? 'line-through text-[var(--text-muted)]' : sel ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>{w.name}</span>
                    {!locked && hasNote ? (
                      <MessageSquare size={12} className="text-[var(--accent)] shrink-0" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* RIGHT — selected widget detail + sample layout */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white border border-[var(--pv-neutral-grey-150)] rounded-r-2xl overflow-hidden">
          <div className="flex items-center h-12 px-4 shrink-0">
            <span className={`text-[16px] font-semibold truncate ${selected && dropped.has(selected.id) ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
              {selected ? selected.name : 'Review the plan'}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
            {selected ? (
              <div className="flex flex-col gap-5">
                {/* Meta row — where you are in the review + what shape this one
                    takes, so the reviewer has context before the preview. */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isMemo ? 'Section' : 'Widget'} {widgets.findIndex((x) => x.id === selected.id) + 1} of {widgets.length}
                  </span>
                  {WIDGET_TYPE_BY_ID[selected.id] ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                      {(() => { const I = TYPE_ICON[WIDGET_TYPE_BY_ID[selected.id].kind]; return I ? <I size={11} className="text-[var(--text-muted)]" /> : null })()}
                      {WIDGET_TYPE_BY_ID[selected.id].label}
                    </span>
                  ) : null}
                </div>

                {selected.desc ? (
                  <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">{selected.desc}</p>
                ) : null}

                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Sample layout</div>
                  <div className="max-w-2xl">
                    <WidgetPreview widget={selected} />
                  </div>
                  <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mt-1.5">
                    <Info size={11} className="shrink-0 text-[var(--text-muted)]" />
                    Layout only. Your real numbers fill in when it&apos;s built.
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-primary)] flex flex-col gap-2">
                  {/* Per-widget actions — confirm the widget (approve) or exclude
                      it (remove), plus "Request a change" which opens the drawer.
                      Petavue design-system buttons only: primary + blueGhost
                      (both collision-free; the system has no red/green). */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Suggest a change — left; Remove + Keep pushed to the far
                        right, Keep rightmost as the primary confirm. */}
                    <PvButton
                      onClick={() => setChangePanelOpen(true)}
                      size="md"
                      variant="ghost"
                      icon={PencilSimple}
                      label="Suggest a change"
                    />
                    <div className="ml-auto flex items-center gap-2">
                      <PvButton
                        onClick={() => toggleDropped(selected.id)}
                        size="md"
                        variant="secondary"
                        icon={dropped.has(selected.id) ? ArrowUUpLeft : XCircle}
                        label={dropped.has(selected.id) ? 'Restore' : 'Remove'}
                        // .btn--secondary collides with the design-system CSS and
                        // greys out; force the petavue blue outline.
                        className="!text-[var(--accent)] !border-[var(--accent)] !bg-white"
                      />
                      <PvButton
                        onClick={() => toggleApproved(selected.id)}
                        size="md"
                        variant="primary"
                        icon={CheckCircle}
                        iconWeight={approved.has(selected.id) ? 'fill' : 'regular'}
                        label="Keep"
                      />
                    </div>
                  </div>
                  {(widgetNotes[selected.id] || '').trim() ? (
                    <p className="flex items-start gap-1.5 text-[11.5px] text-[var(--text-secondary)]">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      <span>Change saved. Sage will apply it when it revises the plan.</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-[12px] text-[var(--text-muted)]">
                Select a {isMemo ? 'section' : 'widget'} on the left to review it.
              </div>
            )}
          </div>
        </div>

        {/* "Request a change" drawer — slides in from the right, hidden by
            default. Bound to the selected widget's note; closing keeps the
            note (Sage applies it when it revises the plan). */}
        <div
          className={`absolute inset-0 z-[65] bg-black/20 transition-opacity duration-200 ${changePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setChangePanelOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 z-[70] w-[380px] max-w-[85%] flex flex-col bg-white border-l border-[var(--pv-neutral-grey-150)] transition-transform duration-200 ${changePanelOpen ? 'translate-x-0 shadow-[-8px_0_24px_-12px_rgba(16,24,40,0.25)]' : 'translate-x-full'}`}
          aria-hidden={!changePanelOpen}
        >
          <div className="flex items-center justify-between gap-2 h-12 px-4 shrink-0 border-b border-[var(--pv-neutral-grey-150)]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">Request a change</span>
            <button
              type="button"
              onClick={() => setChangePanelOpen(false)}
              aria-label="Close"
              className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
            <div>
              <div className="text-[14px] uppercase tracking-wider text-[var(--text-muted)] mb-1">{isMemo ? 'Section' : 'Widget'}</div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">{selected?.name}</div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">What should change?</label>
              <textarea
                value={selected ? (widgetNotes[selected.id] || '') : ''}
                onChange={(e) => selected && setWidgetNotes((m) => ({ ...m, [selected.id]: e.target.value }))}
                rows={6}
                placeholder={selected ? `e.g. break "${selected.name}" down by channel, or use a different metric…` : ''}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-white text-[12.5px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
              />
              <p className="flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)] mt-2">
                <Sparkles size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>Sage applies this when it revises the plan, before anything is built.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-3 border-t border-[var(--pv-neutral-grey-150)] shrink-0">
            <PvButton onClick={() => setChangePanelOpen(false)} size="sm" variant="blueGhost" label="Cancel" />
            <PvButton onClick={() => setChangePanelOpen(false)} size="sm" variant="primary" label="Save change" />
          </div>
        </aside>
      </div>
    )
  }

  // No widget breakdown — a single clean card with the plan title/outcome
  // header and the prose summary (assumptions + includes + formulas).
  return (
    <div className="w-full bg-white border border-[var(--pv-neutral-grey-150)] rounded-2xl flex flex-col min-h-0 h-full overflow-hidden">
      <div className="px-6 pt-4 pb-4 border-b border-[var(--border-primary)] shrink-0">
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Review the plan</div>
        <OutcomeHero title={summary.title} outcome={summary.plan_outcome} />
      </div>
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
    </div>
  )
}
