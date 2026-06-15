import { useState } from 'react'
import { CheckCircle, CaretRight, Check } from '@phosphor-icons/react'
import { Button } from '@/common-components'

const FILTERS = ['All', 'Pending', 'Verified']

export default function WidgetListView({
  widgets = [],
  widgetCount = 0,
  verifiedCount = 0,
  onSelectWidget,
  onToggleVerified,
  onVerifyAll,
  onContinueToPublish,
  onBack,
  titleMissing = false,
  footerStart = null,
}) {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = widgets.filter((w) => {
    if (activeFilter === 'Pending') return !w.verified
    if (activeFilter === 'Verified') return w.verified
    return true
  })

  const pendingCount = widgetCount - verifiedCount
  const pct = widgetCount > 0 ? Math.round((verifiedCount / widgetCount) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Step intro */}
      <div className="shrink-0 px-6 pt-4 pb-3 border-b border-[var(--border-primary)]">
        <h2 className="text-[16px] font-semibold text-[var(--text-primary)] m-0">User Review</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1 m-0 leading-relaxed">Confirm each widget renders with the right numbers. Verify directly from the list, or open a widget to inspect it. This step is optional — you can skip ahead to the agentic review.</p>
      </div>

      {/* Progress + filters + verify all */}
      <div className="shrink-0 px-6 py-2.5 border-b border-[var(--border-primary)] space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 shrink-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-md border-none cursor-pointer transition-colors ${
                  activeFilter === f
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">{verifiedCount} / {widgetCount} verified</span>
            {pendingCount > 0 && (
              <button
                onClick={onVerifyAll}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/40 transition-colors"
              >
                <Check size={13} weight="bold" />Verify all
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Widget rows */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 bg-[#FCFCFC]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
            No {activeFilter.toLowerCase()} widgets
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((widget) => {
              const name = widget.name || widget.file?.split('/').pop()?.replace('.jsx', '') || 'Untitled widget'
              return (
                <div
                  key={widget.id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/30 transition-all group"
                >
                  {/* Open to inspect — name area */}
                  <button
                    onClick={() => onSelectWidget?.(widget)}
                    className="flex-1 min-w-0 flex items-center gap-3.5 text-left bg-transparent border-none cursor-pointer p-0"
                    title="Open to inspect"
                  >
                    <div
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        widget.verified ? 'bg-green-500 border-green-500' : 'border-[var(--border-primary)] bg-[var(--bg-primary)]'
                      }`}
                    >
                      {widget.verified && <Check size={10} weight="bold" className="text-white" />}
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] truncate">{name}</span>
                  </button>

                  {/* Verify toggle — the prominent, never-missable action */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleVerified?.(widget) }}
                    title={widget.verified ? 'Verified — click to undo' : 'Mark as verified'}
                    className={`shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      widget.verified
                        ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                        : 'bg-[var(--accent)]/8 border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/14'
                    }`}
                  >
                    {widget.verified ? <><CheckCircle size={14} weight="fill" />Verified</> : <><Check size={13} weight="bold" />Verify</>}
                  </button>

                  {/* Open chevron */}
                  <button onClick={() => onSelectWidget?.(widget)} title="Open to inspect" className="shrink-0 bg-transparent border-none cursor-pointer p-0">
                    <CaretRight size={14} weight="bold" className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between gap-5 px-6 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {footerStart || <span />}
        <Button
          btnColor="primary"
          btnSize="sm"
          mainBtnClassName="py-2 px-5 rounded-lg shrink-0"
          onClick={onContinueToPublish}
          disabled={titleMissing}
          title={titleMissing ? 'Enter a dashboard title first' : 'Continue to publish'}
        >
          <span className="text-[12px]">Continue</span>
          <CaretRight size={13} weight="bold" />
        </Button>
      </div>
    </div>
  )
}
