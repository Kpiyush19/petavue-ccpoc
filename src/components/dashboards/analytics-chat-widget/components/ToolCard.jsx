import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { formatToolInput } from '../utils/escapeHtml';
import { cn } from '../utils/cn';
import DiffView from './DiffView';
import { formatToolName } from '../../../../utils/toolNames';

export default function ToolCard({
  tool,
  input,
  status,
  resultLength,
  diff,
  onExpand,
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);

  const statusText =
    status === 'running'
      ? 'running...'
      : resultLength != null
        ? `${resultLength} chars`
        : 'done';
  const isRunning = status === 'running';
  const hasDiff = tool === 'edit_file' && diff && status === 'done';

  const handleToggle = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && onExpand && cardRef.current) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onExpand(cardRef.current);
          });
        });
      }, 150);
    }
  };

  return (
    <div className="tool-card" ref={cardRef}>
      <div
        className={cn('tool-card__bar', isRunning && 'tool-card__bar--running')}
      />

      <div className="tool-card__content">
        <button type="button" className="tool-card__header" onClick={handleToggle}>
          <ChevronRight
            size={10}
            className={cn(
              'tool-card__chevron',
              expanded && 'tool-card__chevron--expanded'
            )}
          />
          <span className="tool-card__name">{formatToolName(tool)}</span>
          <span
            className={cn(
              'tool-card__status',
              isRunning && 'tool-card__status--running'
            )}
          >
            {statusText}
          </span>
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
              <div className="tool-card__body">
                {hasDiff ? (
                  <DiffView diff={diff} />
                ) : (
                  <div
                    className="tool-card__input"
                    dangerouslySetInnerHTML={{ __html: formatToolInput(input) }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
