import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react'

export default function AdvisorCard({ text, encrypted, waiting }) {
  const [expanded, setExpanded] = useState(false)
  const isEncrypted = encrypted === true
  const hasContent = !isEncrypted && text && text.length > 0
  const isWaiting = waiting && !hasContent && !isEncrypted

  return (
    <div className="s-advisor-card">
      <button
        type="button"
        className="s-advisor-card__header"
        onClick={() => setExpanded(!expanded)}
        disabled={!hasContent}
      >
        {hasContent ? (
          <ChevronRight
            size={10}
            className={`s-advisor-card__chevron${expanded ? ' s-advisor-card__chevron--expanded' : ''}`}
          />
        ) : isWaiting ? (
          <Loader2 size={10} className="s-advisor-card__icon" style={{ animation: 's-spin 1s linear infinite' }} />
        ) : null}
        <Sparkles size={12} className="s-advisor-card__icon" />
        <span className="s-advisor-card__label">Advisor</span>
        <span className="s-advisor-card__status">
          {isWaiting ? 'consulting...' : isEncrypted ? 'guidance applied' : 'guidance received'}
        </span>
      </button>

      {hasContent && !expanded && (
        <button type="button" className="s-advisor-card__preview" onClick={() => setExpanded(true)}>
          {text.slice(0, 120)}{text.length > 120 ? '...' : ''}
        </button>
      )}

      <AnimatePresence>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="s-advisor-card__body">{text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
