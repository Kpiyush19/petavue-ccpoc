import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MessageBubble from './MessageBubble';
import ToolCallsContainer from './ToolCallsContainer';
import OutputsPanel from './OutputsPanel';
// import DeleteButton from './DeleteButton'; // TODO: Re-enable when needed
import Timestamp from './Timestamp';
import { Sparkle } from '@phosphor-icons/react';

const SCROLL_THRESHOLD = 50;

function WelcomeState({}) {
  return (
    <div className="welcome-state">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="welcome-state__icon-wrapper"
      >
        <div className="welcome-state__icon-glow" />
        <div className="welcome-state__icon">
          <Sparkle size={22} className="c-text-accent" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="welcome-state__text"
      >
        <h2 className="welcome-state__title">How can I help you today?</h2>
        <p className="welcome-state__subtitle">
          Ask a question about your data to get started
        </p>
      </motion.div>
    </div>
  );
}

function CompactionDivider({ messagesCompacted, emergency }) {
  return (
    <div className="compaction-divider">
      <div className="compaction-divider__line" />
      <div className="compaction-divider__badge">
        <span className="compaction-divider__text">
          {emergency ? 'Emergency context compaction' : 'Context compacted'}
        </span>
        {messagesCompacted > 0 && (
          <span className="compaction-divider__detail">
            · {messagesCompacted} messages summarized
          </span>
        )}
      </div>
      <div className="compaction-divider__line" />
    </div>
  );
}

function RefreshDivider({ text, timestamp }) {
  const formattedTime = timestamp
    ? (() => {
        const date = new Date(timestamp);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const includeYear = date < oneYearAgo;
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: includeYear ? 'numeric' : undefined,
          hour: 'numeric',
          minute: '2-digit',
        });
      })()
    : null;

  return (
    <div className="refresh-divider">
      <div className="refresh-divider__line" />
      <div className="refresh-divider__badge">
        <span>{text || 'Dashboard refreshed'}</span>
        {formattedTime && (
          <span className="refresh-divider__time">{formattedTime}</span>
        )}
      </div>
      <div className="refresh-divider__line" />
    </div>
  );
}

function ThinkingIndicator({ isCompacting }) {
  const color = isCompacting ? 'var(--status-warning)' : 'var(--accent)';
  const label = isCompacting ? 'Compacting context...' : 'Thinking...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="thinking-indicator"
    >
      <div className="flex h-6 w-6">
        <img
          src="/petavue-logo.svg"
          alt="petavue logo"
          className="h-5 w-5 my-auto"
        />
      </div>
      <div className="thinking-indicator__dots">
        <span
          className="thinking-indicator__dot"
          style={{ backgroundColor: color }}
        />
        <span
          className="thinking-indicator__dot"
          style={{ backgroundColor: color, animationDelay: '0.2s' }}
        />
        <span
          className="thinking-indicator__dot"
          style={{ backgroundColor: color, animationDelay: '0.4s' }}
        />
      </div>
      <span className="c-text-muted text-xs">{label}</span>
    </motion.div>
  );
}

function groupMessages(messages) {
  const out = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (msg.type === 'tool_call') {
      let j = i + 1;
      while (j < messages.length && messages[j].type === 'tool_call') {
        j++;
      }
      const allCalls = messages.slice(i, j);
      out.push({
        type: 'tool_calls_container',
        calls: allCalls,
        id: `tools-${allCalls[0].id}`,
      });
      i = j;
      continue;
    }
    out.push(msg);
    i++;
  }
  return out;
}

export default function ChatArea({
  messages,
  sessionId,
  timezone = 'UTC',
  onOpenArtifact,
  onDeleteLastMessage,
  onSchedulePrompt,
  isThinking,
  isCompacting,
  onSuggestionClick,
}) {
  const bottomRef = useRef(null);
  const messagesWrapperRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevUserMessageCountRef = useRef(0);
  const prevMessageCountRef = useRef(0);
  const prevSessionIdRef = useRef(sessionId);

  useEffect(() => {
    if (sessionId !== prevSessionIdRef.current) {
      prevSessionIdRef.current = sessionId;
      isNearBottomRef.current = true;
      prevUserMessageCountRef.current = 0;
      prevMessageCountRef.current = 0;
    }
  }, [sessionId]);

  const grouped = useMemo(() => {
    const raw = groupMessages(messages);
    return raw.filter((msg, i) => {
      if (msg.type !== 'refresh_divider') return true;
      const next = raw[i + 1];
      return !next || next.type !== 'refresh_divider';
    });
  }, [messages]);

  const turnEndInfo = useMemo(() => {
    const info = {};
    let lastAssistantTimestamp = 0;

    for (let i = 0; i < grouped.length; i++) {
      const msg = grouped[i];

      if (msg.type === 'assistant' && msg.timestamp) {
        lastAssistantTimestamp = msg.timestamp;
      }

      const isLastMessage = i === grouped.length - 1;
      const nextMsg = i < grouped.length - 1 ? grouped[i + 1] : null;
      const nextIsUserOrDivider =
        nextMsg && (nextMsg.type === 'user' || nextMsg.type === 'refresh_divider');

      if (
        (isLastMessage || nextIsUserOrDivider) &&
        msg.type !== 'user' &&
        msg.type !== 'refresh_divider' &&
        lastAssistantTimestamp
      ) {
        info[i] = lastAssistantTimestamp;
        lastAssistantTimestamp = 0;
      }
    }

    return info;
  }, [grouped]);

  const hasMessages = messages.length > 0;

  const scrollToBottom = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });
  };

  useEffect(() => {
    const el = messagesWrapperRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isNearBottomRef.current = distanceFromBottom <= SCROLL_THRESHOLD;
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasMessages]);

  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.type === 'user').length;
    if (userMessageCount > prevUserMessageCountRef.current) {
      isNearBottomRef.current = true;
    }
    prevUserMessageCountRef.current = userMessageCount;
  }, [messages]);

  useEffect(() => {
    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;
    prevMessageCountRef.current = messages.length;
    if (isInitialLoad || isNearBottomRef.current) {
      scrollToBottom(isInitialLoad ? 'instant' : 'smooth');
    }
  }, [messages]);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isThinking]);

  // TODO: Re-enable delete functionality when needed
  // let hasResponseInCurrentTurn = false;
  //
  // // Find the last user message index in grouped messages
  // let lastUserIdx = -1;
  // for (let i = grouped.length - 1; i >= 0; i--) {
  //   if (grouped[i].type === 'user') {
  //     lastUserIdx = i;
  //     break;
  //   }
  // }
  //
  // // If there's content after the last user message, we have a response to delete
  // if (lastUserIdx >= 0 && lastUserIdx < grouped.length - 1) {
  //   hasResponseInCurrentTurn = true;
  // }

  if (messages.length === 0) {
    return (
      <div className="chat-area chat-area--empty">
        <WelcomeState onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div className="chat-area" ref={messagesWrapperRef}>
      <div className="chat-area__messages">
        <AnimatePresence initial={false}>
          {grouped.map((msg, idx) => {
            switch (msg.type) {
              case 'user':
              case 'assistant':
              case 'system': {
                let scheduleHandler = undefined;
                if (
                  msg.type === 'assistant' &&
                  onSchedulePrompt &&
                  !isThinking
                ) {
                  let prompt = '';
                  for (let j = idx - 1; j >= 0; j--) {
                    if (grouped[j].type === 'user') {
                      prompt = grouped[j].text || '';
                      break;
                    }
                  }
                  if (prompt) {
                    scheduleHandler = () => onSchedulePrompt(prompt);
                  }
                }
                const turnTimestamp = turnEndInfo[idx];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MessageBubble
                      {...msg}
                      timezone={timezone}
                      onSchedule={scheduleHandler}
                      messagesWrapperRef={messagesWrapperRef}
                    />
                    {turnTimestamp && (
                      <Timestamp
                        timestamp={turnTimestamp}
                        messagesWrapperRef={messagesWrapperRef}
                      />
                    )}
                  </motion.div>
                );
              }
              case 'tool_calls_container': {
                const turnTimestamp = turnEndInfo[idx];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToolCallsContainer
                      calls={msg.calls}
                      isStreaming={isThinking}
                    />
                    {turnTimestamp && (
                      <Timestamp
                        timestamp={turnTimestamp}
                        messagesWrapperRef={messagesWrapperRef}
                      />
                    )}
                  </motion.div>
                );
              }
              case 'outputs': {
                const turnTimestamp = turnEndInfo[idx];
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OutputsPanel
                      outputs={msg.outputs}
                      sessionId={sessionId}
                      onOpenArtifact={onOpenArtifact}
                    />
                    {turnTimestamp && (
                      <Timestamp
                        timestamp={turnTimestamp}
                        messagesWrapperRef={messagesWrapperRef}
                      />
                    )}
                  </motion.div>
                );
              }
              case 'compaction_marker':
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CompactionDivider
                      messagesCompacted={msg.messagesCompacted}
                      emergency={msg.emergency}
                    />
                  </motion.div>
                );
              case 'refresh_divider':
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RefreshDivider text={msg.text} timestamp={msg.timestamp} />
                  </motion.div>
                );
              default:
                return null;
            }
          })}
          {isThinking && (
            <ThinkingIndicator key="thinking" isCompacting={isCompacting} />
          )}
        </AnimatePresence>

        {/* Standalone delete button - appears after the last item in current turn */}
        {/* TODO: Re-enable delete functionality when needed
        {hasResponseInCurrentTurn && !isThinking && onDeleteLastMessage && (
          <motion.div
            key="delete-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mt-2"
          >
            <DeleteButton onDelete={onDeleteLastMessage} />
          </motion.div>
        )}
        */}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
