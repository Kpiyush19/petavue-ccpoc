import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import ToolCard from './ToolCard'

const formatToolName = (name) => (name === 'query_athena' ? 'query_db' : name)

export default function ToolCallGroup({ tool, calls, onExpand }) {
  const [expanded, setExpanded] = useState(false)

  const count = calls.length
  const isRunning = calls.some((c) => c.status === 'running')
  const isDone = !isRunning
  const lengths = calls.map((c) => c.resultLength).filter((v) => v != null)
  let charLabel = ''
  if (lengths.length > 0) {
    const min = Math.min(...lengths)
    const max = Math.max(...lengths)
    charLabel = min === max ? `${min} chars` : `${min}–${max} chars`
  }

  const statusText = isRunning ? 'running...' : charLabel || 'done'

  return (
    <div className="s-timeline-item">
      <span className={`s-timeline-item__dot${isDone ? '' : ' s-timeline-item__dot--running'}`} />
      <div className="s-timeline-item__content">
        <button type="button" className="s-timeline-item__header" onClick={() => setExpanded(!expanded)}>
          <div className="s-timeline-item__info">
            <span className="s-timeline-item__name">
              {formatToolName(tool)}
              <span className={`s-timeline-item__count${isRunning ? ' s-timeline-item__count--running' : ''}`}>
                ×{count}
              </span>
            </span>
            <span className={`s-timeline-item__meta${isRunning ? ' s-timeline-item__meta--running' : ''}`}>
              {statusText}
            </span>
          </div>
          <ChevronDown
            size={12}
            className={`s-timeline-item__chevron${expanded ? ' s-timeline-item__chevron--expanded' : ''}`}
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="s-timeline-item__group">
                {calls.map((call) => (
                  <ToolCard key={call.id} {...call} onExpand={onExpand} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
