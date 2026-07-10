// ─── Widget schematics ─────────────────────────────────────────────────
// Representative "sample layout" previews of each widget type, used both at
// the plan-review stage (what you'll get) and during build (the dashboard
// filling in as steps complete). Illustrative shapes/numbers, never live data
// — the real artifact renders only once the run finishes.

function MiniStats() {
  const tiles = [
    { v: '$1.24M', l: 'Pipeline', d: '+8%', up: true },
    { v: '3.4×', l: 'ROAS', d: '+0.3', up: true },
    { v: '62%', l: 'Win rate', d: '-2%', up: false },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <div key={t.l} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3">
          <div className="text-[15px] font-semibold text-[var(--text-primary)] leading-none">{t.v}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1.5">{t.l}</div>
          <div className={`text-[10px] mt-1 font-medium ${t.up ? 'text-[var(--pv-success-text)]' : 'text-[var(--pv-error-text)]'}`}>{t.d}</div>
        </div>
      ))}
    </div>
  )
}
function MiniBars() {
  const rows = [['Enterprise', 78], ['Mid-market', 54], ['SMB', 40], ['Startup', 28], ['Other', 16]]
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([label, pct]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-20 text-[10.5px] text-[var(--text-muted)] truncate shrink-0">{label}</span>
          <div className="flex-1 h-3 rounded bg-[var(--bg-primary)] overflow-hidden">
            <div className="h-full rounded bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
function MiniLine() {
  return (
    <svg viewBox="0 0 220 80" className="w-full h-[120px]" preserveAspectRatio="none">
      <polygon points="0,60 36,52 72,56 108,40 144,30 180,36 220,18 220,80 0,80" fill="var(--accent)" opacity="0.12" />
      <polyline points="0,60 36,52 72,56 108,40 144,30 180,36 220,18" fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
function MiniList() {
  const items = [
    { t: 'Meta: CAC up 34% vs plan', s: 'high' },
    { t: 'LinkedIn: pacing 12% under', s: 'med' },
    { t: 'Search: steady, on target', s: 'low' },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((it) => (
        <div key={it.t} className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${it.s === 'high' ? 'bg-[var(--pv-error-text)]' : it.s === 'med' ? 'bg-amber-500' : 'bg-[var(--pv-success-text)]'}`} />
          <span className="text-[11.5px] text-[var(--text-primary)] truncate">{it.t}</span>
        </div>
      ))}
    </div>
  )
}
function MiniTable() {
  const rows = [['Google Ads', '$182k', '3.9×'], ['LinkedIn', '$96k', '2.4×'], ['Meta', '$74k', '1.8×'], ['6sense', '$41k', '4.2×']]
  return (
    <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden text-[11px]">
      <div className="grid grid-cols-3 bg-[var(--bg-primary)] px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        <span>Channel</span><span>Spend</span><span>ROAS</span>
      </div>
      {rows.map((r) => (
        <div key={r[0]} className="grid grid-cols-3 px-3 py-1.5 border-t border-[var(--border-primary)] text-[var(--text-primary)]">
          <span className="truncate">{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span>
        </div>
      ))}
    </div>
  )
}
function MiniText() {
  return (
    <div className="flex flex-col gap-1.5">
      {[100, 94, 88, 96, 70].map((w, i) => (
        <div key={i} className="h-2 rounded bg-[var(--bg-primary)]" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

export const PREVIEW_BY_ID = {
  headline: MiniStats, trend: MiniLine, segment: MiniBars, risk: MiniList, table: MiniTable,
  summary: MiniText, findings: MiniStats, drivers: MiniBars, actions: MiniList, method: MiniText,
}

// Human-readable widget/section type per id — surfaced as a chip in the
// plan-review detail so the reviewer knows what shape each one takes. `kind`
// keys into an icon map on the consuming side.
export const WIDGET_TYPE_BY_ID = {
  headline: { label: 'Scorecard', kind: 'stats' },
  trend:    { label: 'Line chart', kind: 'line' },
  segment:  { label: 'Bar chart', kind: 'bars' },
  risk:     { label: 'List', kind: 'list' },
  table:    { label: 'Table', kind: 'table' },
  summary:  { label: 'Narrative', kind: 'text' },
  findings: { label: 'Key numbers', kind: 'stats' },
  drivers:  { label: 'Bar chart', kind: 'bars' },
  actions:  { label: 'List', kind: 'list' },
  method:   { label: 'Narrative', kind: 'text' },
}

// Just the schematic body for a widget id (no card chrome).
export function SchematicBody({ id }) {
  const Body = PREVIEW_BY_ID[id] || MiniStats
  return <Body />
}

// Card-wrapped schematic — used in the plan-review detail pane.
export function WidgetPreview({ widget }) {
  if (!widget) return null
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
      <div className="text-[12px] font-medium text-[var(--text-primary)] mb-3">{widget.name}</div>
      <SchematicBody id={widget.id} />
    </div>
  )
}
