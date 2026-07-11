import { useEffect, useRef } from 'react'
import { cn } from '../utils/cn'

const EVENT_COLORS = {
  text: 'text-[var(--text-primary)]',
  tool_call: 'text-[var(--tool-name)]',
  tool_result: 'text-[var(--tool-result)]',
  error: 'text-[var(--error)]',
  done: 'text-[var(--status-success)]',
}

export default function EventLog({ entries }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [entries])

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg mt-2 max-h-[180px] overflow-y-auto p-2.5 text-[12px] text-[var(--text-secondary)] font-mono">
      {entries.map((e, i) => (
        <div
          key={i}
          className={cn(
            'py-0.5',
            i < entries.length - 1 && 'border-b border-[var(--border-primary)]',
            EVENT_COLORS[e.type]
          )}
        >
          <span className="text-[var(--text-muted)]">[{e.timestamp}]</span> {e.summary}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
