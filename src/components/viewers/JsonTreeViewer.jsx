import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { getApiBase, getAuthToken } from '../../api'

const MAX_DEPTH = 20
const PAGE_SIZE = 100

function JsonValue({ value, depth = 0 }) {
  if (depth > MAX_DEPTH) return <span className="text-[var(--text-muted)] italic">... (max depth)</span>
  if (value === null) return <span className="text-[var(--pv-warning-text)] italic">null</span>
  if (typeof value === 'boolean') return <span className="text-[var(--pv-warning-text)]">{value ? 'true' : 'false'}</span>
  if (typeof value === 'number') return <span className="text-[var(--pv-primary-500)]">{value}</span>
  if (typeof value === 'string') {
    const display = value.length > 300 ? value.slice(0, 300) + '...' : value
    return <span className="text-[var(--pv-success-text)]">"{display}"</span>
  }
  if (Array.isArray(value)) return <JsonArray items={value} depth={depth} />
  if (typeof value === 'object') return <JsonObject data={value} depth={depth} />
  return <span className="text-[var(--text-secondary)]">{String(value)}</span>
}

function JsonObject({ data, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const keys = Object.keys(data)

  if (keys.length === 0) return <span className="text-[var(--text-muted)]">{'{}'}</span>

  if (!expanded) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
        className="cursor-pointer hover:bg-[var(--bg-hover)] rounded px-0.5 inline-flex items-center gap-0.5"
      >
        <ChevronRight size={11} className="text-[var(--text-muted)] shrink-0 inline" />
        <span className="text-[var(--text-muted)]">{'{'}</span>
        <span className="text-[var(--text-muted)] text-[10px] italic">{keys.length} {keys.length === 1 ? 'key' : 'keys'}</span>
        <span className="text-[var(--text-muted)]">{'}'}</span>
      </span>
    )
  }

  return (
    <span>
      <span
        onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
        className="cursor-pointer hover:bg-[var(--bg-hover)] rounded px-0.5 inline-flex items-center gap-0.5"
      >
        <ChevronDown size={11} className="text-[var(--text-muted)] shrink-0 inline" />
        <span className="text-[var(--text-muted)]">{'{'}</span>
      </span>
      <div style={{ paddingLeft: 16 }}>
        {keys.map((key, i) => (
          <div key={key}>
            <span className="text-[var(--pv-warning-700)]">"{key}"</span>
            <span className="text-[var(--text-muted)]">: </span>
            <JsonValue value={data[key]} depth={depth + 1} />
            {i < keys.length - 1 && <span className="text-[var(--text-muted)]">,</span>}
          </div>
        ))}
      </div>
      <span className="text-[var(--text-muted)]">{'}'}</span>
    </span>
  )
}

function JsonArray({ items, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (items.length === 0) return <span className="text-[var(--text-muted)]">[]</span>

  if (!expanded) {
    return (
      <span
        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
        className="cursor-pointer hover:bg-[var(--bg-hover)] rounded px-0.5 inline-flex items-center gap-0.5"
      >
        <ChevronRight size={11} className="text-[var(--text-muted)] shrink-0 inline" />
        <span className="text-[var(--text-muted)]">[</span>
        <span className="text-[var(--text-muted)] text-[10px] italic">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        <span className="text-[var(--text-muted)]">]</span>
      </span>
    )
  }

  const visible = items.slice(0, visibleCount)
  const remaining = items.length - visibleCount

  return (
    <span>
      <span
        onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
        className="cursor-pointer hover:bg-[var(--bg-hover)] rounded px-0.5 inline-flex items-center gap-0.5"
      >
        <ChevronDown size={11} className="text-[var(--text-muted)] shrink-0 inline" />
        <span className="text-[var(--text-muted)]">[</span>
      </span>
      <div style={{ paddingLeft: 16 }}>
        {visible.map((item, i) => (
          <div key={i}>
            <JsonValue value={item} depth={depth + 1} />
            {i < items.length - 1 && <span className="text-[var(--text-muted)]">,</span>}
          </div>
        ))}
        {remaining > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setVisibleCount((c) => c + PAGE_SIZE) }}
            className="text-[11px] text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer py-0.5"
          >
            Show {Math.min(remaining, PAGE_SIZE)} more ({remaining} remaining)
          </button>
        )}
      </div>
      <span className="text-[var(--text-muted)]">]</span>
    </span>
  )
}

export default function JsonTreeViewer({ sessionId, path }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = `${getApiBase()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || '')}`
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        return JSON.parse(text)
      })
      .then((json) => setData(json))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId, path])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)] bg-[var(--bg-primary)]">
        <span className="animate-thinking">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--pv-error-text)] bg-[var(--bg-primary)]">
        Failed to load JSON: {error}
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto p-3 font-mono text-[12px] leading-relaxed bg-[var(--bg-primary)]">
      <JsonValue value={data} depth={0} />
    </div>
  )
}
