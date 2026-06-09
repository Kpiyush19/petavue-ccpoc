import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import ToolCard from './ToolCard';
import { formatToolName } from '../../../../utils/toolNames';

export default function ToolCallGroup({ tool, calls, onExpand }) {
  const [expanded, setExpanded] = useState(false);

  const count = calls.length;
  const isRunning = calls.some((c) => c.status === 'running');

  const lengths = calls.map((c) => c.resultLength).filter((v) => v != null);
  let charLabel = '';
  if (lengths.length > 0) {
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    charLabel = min === max ? `${min} chars` : `${min} – ${max} chars`;
  }

  return (
    <div className="tool-card">
      <div
        className={cn('tool-card__bar', isRunning && 'tool-card__bar--running')}
      />

      <div className="tool-card__content">
        <div
          className="tool-card__header"
          onClick={() => setExpanded(!expanded)}
        >
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
              'tool-card__count',
              isRunning && 'tool-card__count--running'
            )}
          >
            &times;{count}
          </span>
          {charLabel && <span className="tool-card__status">{charLabel}</span>}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="tool-card__group-body">
                {calls.map((call) => (
                  <ToolCard key={call.id} {...call} onExpand={onExpand} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
