import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { formatToolInput } from '../utils/escapeHtml'
import DiffView from './DiffView'

const formatToolName = (name) => (name === 'query_athena' ? 'query_db' : name)

export default function ToolCard({ tool, input, status, resultLength, diff, onExpand }) {
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef(null)

  const statusText = status === 'running'
    ? 'running...'
    : resultLength != null
      ? `${resultLength} chars`
      : 'done'
  const isRunning = status === 'running'
  const isDone = !isRunning
  const hasDiff = tool === 'edit_file' && diff && status === 'done'

  const handleToggle = () => {
    const willExpand = !expanded
    setExpanded(willExpand)
    if (willExpand && onExpand && cardRef.current) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onExpand(cardRef.current)
          })
        })
      }, 150)
    }
  }

  return (
    <div className="s-timeline-item" ref={cardRef}>
      <span className={`s-timeline-item__dot${isDone ? '' : ' s-timeline-item__dot--running'}`} />
      <div className="s-timeline-item__content">
        <button type="button" className="s-timeline-item__header" onClick={handleToggle}>
          <div className="s-timeline-item__info">
            <span className="s-timeline-item__name">{formatToolName(tool)}</span>
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
              <div className="s-timeline-item__details">
                {hasDiff ? (
                  <DiffView diff={diff} />
                ) : (
                  <pre
                    className="s-timeline-item__input"
                    dangerouslySetInnerHTML={{ __html: formatToolInput(input) }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
