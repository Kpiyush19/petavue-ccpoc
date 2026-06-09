import { useState } from 'react'
import { CheckCircle, CaretRight, ArrowLeft, Check } from '@phosphor-icons/react'
import { Button } from '@/common-components'

const FILTERS = ['All', 'Pending', 'Verified']

export default function WidgetListView({
  widgets = [],
  widgetCount = 0,
  verifiedCount = 0,
  onSelectWidget,
  onContinueToPublish,
  onBack,
  titleMissing = false,
}) {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = widgets.filter((w) => {
    if (activeFilter === 'Pending') return !w.verified
    if (activeFilter === 'Verified') return w.verified
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Counter row */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-[var(--border-primary)]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
          <CheckCircle size={13} weight="fill" />
          {verifiedCount} / {widgetCount} verified
        </span>
        <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full font-medium">
          {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 flex items-center gap-1 px-5 py-2.5 border-b border-[var(--border-primary)]">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-md border-none cursor-pointer transition-colors ${
              activeFilter === f
                ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Widget rows */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
            No {activeFilter.toLowerCase()} widgets
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((widget) => (
              <button
                key={widget.id}
                onClick={() => onSelectWidget?.(widget)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] cursor-pointer hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]/30 transition-all group"
              >
                {/* Verified circle indicator */}
                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    widget.verified
                      ? 'bg-green-500 border-green-500'
                      : 'border-[var(--border-primary)] bg-[var(--bg-primary)]'
                  }`}
                >
                  {widget.verified && <Check size={10} weight="bold" className="text-white" />}
                </div>

                {/* Widget name */}
                <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] truncate">
                  {widget.name || widget.file?.split('/').pop()?.replace('.jsx', '') || 'Untitled widget'}
                </span>

                {/* Verified badge */}
                {widget.verified && (
                  <span className="shrink-0 text-[10px] font-semibold text-green-600">
                    Verified
                  </span>
                )}

                {/* Chevron */}
                <CaretRight
                  size={14}
                  weight="bold"
                  className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-0 transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Back to Session
        </button>

        <Button
          btnColor="primary"
          btnSize="sm"
          mainBtnClassName="py-2 px-5 rounded-lg"
          onClick={onContinueToPublish}
          disabled={titleMissing}
          title={titleMissing ? 'Enter a dashboard title first' : 'Continue to publish'}
        >
          <span className="text-[12px]">Continue to Publish</span>
          <CaretRight size={13} weight="bold" />
        </Button>
      </div>
    </div>
  )
}
