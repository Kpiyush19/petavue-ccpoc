import { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import ToolCard from './ToolCard';
import ToolCallGroup from './ToolCallGroup';

function groupByTool(calls) {
  const groups = [];
  let i = 0;
  while (i < calls.length) {
    const tool = calls[i].tool;
    let j = i + 1;
    while (j < calls.length && calls[j].tool === tool) {
      j++;
    }
    groups.push({
      tool,
      calls: calls.slice(i, j),
    });
    i = j;
  }
  return groups;
}

export default function ToolCallsContainer({ calls, isStreaming }) {
  const [expanded, setExpanded] = useState(false);
  const prevCountRef = useRef(0);
  const prevGroupCountRef = useRef(0);
  const wasStreamingRef = useRef(false);
  const containerRef = useRef(null);

  const count = calls.length;
  const isRunning = calls.some((c) => c.status === 'running');

  const toolGroups = useMemo(() => groupByTool(calls), [calls]);
  const groupCount = toolGroups.length;

  useEffect(() => {
    // During streaming: expand when new tools arrive
    if (isStreaming && count > prevCountRef.current) {
      setExpanded(true);
    }

    // Streaming just ended (done event) - collapse
    if (!isStreaming && wasStreamingRef.current) {
      setExpanded(false);
    }

    prevCountRef.current = count;
    wasStreamingRef.current = isStreaming;
  }, [count, isStreaming]);

  // Scroll to bottom when a new tool group is added
  useEffect(() => {
    if (
      isStreaming &&
      expanded &&
      groupCount > prevGroupCountRef.current &&
      containerRef.current
    ) {
      // Scroll the container to show the last group
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevGroupCountRef.current = groupCount;
  }, [groupCount, isStreaming, expanded]);

  // Scroll expanded tool to center of container
  const handleToolExpand = (element) => {
    if (!containerRef.current || !element) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate element position relative to container's current scroll
    const elementTopRelative =
      elementRect.top - containerRect.top + container.scrollTop;
    const containerVisibleHeight = container.clientHeight;

    // Scroll to center the element
    const scrollTo =
      elementTopRelative - containerVisibleHeight / 2 + elementRect.height / 2;

    container.scrollTo({
      top: Math.max(0, scrollTo),
      behavior: 'smooth',
    });
  };

  // Count sequential tool groups (not unique tools)
  const toolLabel = `${groupCount} ${groupCount === 1 ? 'tool group' : 'tool groups'}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        'tool-calls-container',
        expanded && 'tool-calls-container--expanded'
      )}
    >
      <div
        className={cn(
          'tool-calls-container__header',
          expanded && 'tool-calls-container__header--expanded'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          size={12}
          className={cn(
            'tool-calls-container__chevron',
            expanded && 'tool-calls-container__chevron--expanded'
          )}
        />
        <span className="tool-calls-container__label">{toolLabel}</span>
        <span
          className={cn(
            'tool-calls-container__count',
            isRunning && 'tool-calls-container__count--running'
          )}
        >
          {count} call{count !== 1 ? 's' : ''}
        </span>
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
            <div className="tool-calls-container__body">
              {toolGroups.map((group, idx) =>
                group.calls.length === 1 ? (
                  <ToolCard
                    key={group.calls[0].id}
                    {...group.calls[0]}
                    onExpand={handleToolExpand}
                  />
                ) : (
                  <ToolCallGroup
                    key={`${group.tool}-${idx}`}
                    tool={group.tool}
                    calls={group.calls}
                    onExpand={handleToolExpand}
                  />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
