import { useRef, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, BellOff } from "lucide-react";
import { Button } from "@/common-components";
import MessageBubble from "./components/MessageBubble";
import DeleteMessageModal from "./components/DeleteMessageModal";
import ToolCallsContainer from "./components/ToolCallsContainer";
import AdvisorCard from "./components/AdvisorCard";
import OutputsPanel from "./components/OutputsPanel";
import WelcomeState from "./components/WelcomeState";
import Timestamp from "./components/Timestamp";
import ChatSkeleton from "./components/ChatSkeleton";
import SuggestedQuestions from "./components/SuggestedQuestions";

function CompactionDivider({ messagesCompacted, emergency }) {
  return (
    <div className="s-compaction-divider">
      <div className="s-compaction-divider__line" />
      <div className="s-compaction-divider__badge">
        <span className="s-compaction-divider__text">
          {emergency ? "Emergency context compaction" : "Context compacted"}
        </span>
        {messagesCompacted > 0 && (
          <span className="s-compaction-divider__detail">· {messagesCompacted} messages summarized</span>
        )}
      </div>
      <div className="s-compaction-divider__line" />
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
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: includeYear ? "numeric" : undefined,
          hour: "numeric",
          minute: "2-digit"
        });
      })()
    : null;

  return (
    <div className="s-refresh-divider">
      <div className="s-refresh-divider__line" />
      <div className="s-refresh-divider__badge">
        <span>{text || "Dashboard refreshed"}</span>
        {formattedTime && <span className="s-refresh-divider__time">{formattedTime}</span>}
      </div>
      <div className="s-refresh-divider__line" />
    </div>
  );
}

function ThinkingIndicator({ isCompacting }) {
  const color = isCompacting ? "var(--status-warning)" : "var(--accent)";
  const label = isCompacting ? "Compacting context..." : "Thinking...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="s-thinking-indicator"
    >
      <div className="flex h-6 w-6">
        <img src="/petavue-logo.svg" alt="" className="h-5 w-5 my-auto" />
      </div>
      <div className="s-thinking-indicator__dots">
        <span className="s-thinking-indicator__dot" style={{ backgroundColor: color }} />
        <span className="s-thinking-indicator__dot" style={{ backgroundColor: color, animationDelay: "0.2s" }} />
        <span className="s-thinking-indicator__dot" style={{ backgroundColor: color, animationDelay: "0.4s" }} />
      </div>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </motion.div>
  );
}

function groupMessages(messages) {
  const out = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (msg.type === "tool_call") {
      let j = i + 1;
      while (j < messages.length && messages[j].type === "tool_call") {
        j++;
      }
      const allCalls = messages.slice(i, j);
      out.push({
        type: "tool_calls_container",
        calls: allCalls,
        id: `tools-${allCalls[0].id}`
      });
      i = j;
      continue;
    }
    out.push(msg);
    i++;
  }
  return out;
}

const SCROLL_THRESHOLD = 50;

export default function ChatArea({
  messages,
  sessionId,
  urlSessionId,
  isResumed,
  onOpenArtifact,
  onDeleteLastMessage,
  isThinking,
  isCompacting,
  onSend,
  disabled,
  onOpenWidgetChat,
  suggestedQuestions = [],
  suggestionsLoading = false,
  onMuteFollowups,
  followupsMuted = false,
  onUnmuteFollowups
}) {
  const bottomRef = useRef(null);
  const messagesWrapperRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const grouped = useMemo(() => groupMessages(messages), [messages]);

  const isInitMessage =
    messages.length === 1 && messages[0].type === "system" && messages[0].text?.includes("Create a session");
  const hasConversation = messages.some((m) =>
    m.type === "user" || m.type === "assistant" || m.type === "skill_handoff_banner"
  );
  const showFullChat = !(
    (urlSessionId && disabled && !hasConversation) ||
    (urlSessionId && !disabled && !hasConversation && isResumed) ||
    (!urlSessionId && (messages.length === 0 || isInitMessage))
  );

  const { turnEndInfo, lastTurnEndIndex, lastToolContainerIdx } = useMemo(() => {
    const info = {};
    let lastAssistantTimestamp = 0;
    let lastAssistantContentIdx = -1;
    let lastIdx = -1;
    let lastToolIdx = -1;

    for (let i = 0; i < grouped.length; i++) {
      const msg = grouped[i];

      if (msg.type === "tool_calls_container") {
        lastToolIdx = i;
        lastAssistantContentIdx = i;
      }

      if (msg.type === "assistant") {
        lastAssistantContentIdx = i;
        if (msg.timestamp) {
          lastAssistantTimestamp = msg.timestamp;
        }
      }

      const isLastMessage = i === grouped.length - 1;
      const nextMsg = i < grouped.length - 1 ? grouped[i + 1] : null;
      const nextIsUserOrDivider = nextMsg && (nextMsg.type === "user" || nextMsg.type === "refresh_divider");
      const nextIsSystemAfterAssistant = nextMsg && nextMsg.type === "system" && lastAssistantContentIdx >= 0;

      const isTurnEnd = isLastMessage || nextIsUserOrDivider || nextIsSystemAfterAssistant;
      const isAssistantContent =
        msg.type === "assistant" || msg.type === "tool_calls_container" || msg.type === "outputs";

      if (isTurnEnd && isAssistantContent) {
        info[i] = lastAssistantTimestamp || null;
        lastIdx = i;
        lastAssistantTimestamp = 0;
        lastAssistantContentIdx = -1;
      }
    }

    return { turnEndInfo: info, lastTurnEndIndex: lastIdx, lastToolContainerIdx: lastToolIdx };
  }, [grouped]);

  const scrollToBottom = (behavior = "smooth") => {
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
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [showFullChat]);

  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.type === "user").length;
    if (userMessageCount > prevUserMessageCountRef.current) {
      isNearBottomRef.current = true;
    }
    prevUserMessageCountRef.current = userMessageCount;
  }, [messages]);

  useEffect(() => {
    const isInitialLoad = prevMessageCountRef.current === 0 && messages.length > 0;
    prevMessageCountRef.current = messages.length;
    if (isInitialLoad || isNearBottomRef.current) {
      scrollToBottom(isInitialLoad ? "instant" : "smooth");
    }
  }, [messages]);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      if (isNearBottomRef.current) {
        scrollToBottom("smooth");
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isThinking]);

  if (urlSessionId && disabled && !hasConversation) {
    return <ChatSkeleton />;
  }

  if (urlSessionId && !disabled && !hasConversation && isResumed) {
    return (
      <div className="s-chat-area s-chat-area--empty">
        <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)]">
          <p>This session has no messages.</p>
        </div>
      </div>
    );
  }

  if (!urlSessionId && (messages.length === 0 || isInitMessage)) {
    return (
      <div className="s-chat-area s-chat-area--empty">
        <WelcomeState onSend={onSend} disabled={disabled} />
      </div>
    );
  }

  const canDelete = !isThinking && !disabled && !isInitMessage && onDeleteLastMessage && messages.length > 0;

  const renderTimestampRow = (timestamp, idx) => {
    const isLastTurn = idx === lastTurnEndIndex;
    if (isLastTurn && isThinking) return null;
    const showDelete = canDelete && isLastTurn;
    const showTimestamp = timestamp && timestamp > 0;
    const showUnmute = isLastTurn && followupsMuted && !!onUnmuteFollowups;
    if (!showTimestamp && !showDelete && !showUnmute) return null;
    return (
      <div className="s-chat-timestamp-row">
        {showTimestamp && <Timestamp timestamp={timestamp} messagesWrapperRef={messagesWrapperRef} />}
        {showDelete && (
          <Button
            btnColor="transparent"
            btnSize="sm"
            onClick={() => setShowDeleteModal(true)}
            mainBtnClassName="px-2 py-1 hover:border-pv-neutral-grey-400 active:border-pv-neutral-grey-200"
          >
            <Trash2 size={14} />
          </Button>
        )}
        {showUnmute && (
          <button
            type="button"
            onClick={onUnmuteFollowups}
            title="Show follow-up suggestions again"
            className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <BellOff size={13} />
            Show follow-ups
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="s-chat-area" ref={messagesWrapperRef}>
      <div className="s-chat-area__messages">
        <AnimatePresence initial={false}>
          {grouped.map((msg, idx) => {
            const isTurnEnd = idx in turnEndInfo;
            const turnTimestamp = turnEndInfo[idx];

            switch (msg.type) {
              case "user":
              case "assistant":
              case "system":
              case "skill_handoff_banner": {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MessageBubble
                      {...msg}
                      messagesWrapperRef={messagesWrapperRef}
                      onOpenWidgetChat={onOpenWidgetChat}
                      onOpenArtifact={onOpenArtifact}
                    />
                    {isTurnEnd && renderTimestampRow(turnTimestamp, idx)}
                  </motion.div>
                );
              }
              case "tool_calls_container":
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToolCallsContainer calls={msg.calls} isStreaming={isThinking && idx === lastToolContainerIdx} />
                    {isTurnEnd && renderTimestampRow(turnTimestamp, idx)}
                  </motion.div>
                );
              case "outputs":
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OutputsPanel outputs={msg.outputs} sessionId={sessionId} onOpenArtifact={onOpenArtifact} />
                    {isTurnEnd && renderTimestampRow(turnTimestamp, idx)}
                  </motion.div>
                );
              case "advisor_call":
              case "advisor_result":
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AdvisorCard text={msg.text} encrypted={msg.encrypted} waiting={msg.waiting} />
                    {isTurnEnd && renderTimestampRow(turnTimestamp, idx)}
                  </motion.div>
                );
              case "compaction_marker":
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CompactionDivider messagesCompacted={msg.messagesCompacted} emergency={msg.emergency} />
                  </motion.div>
                );
              case "refresh_divider":
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
          {isThinking && <ThinkingIndicator key="thinking" isCompacting={isCompacting} />}
        </AnimatePresence>
        {!isThinking && !disabled && (suggestionsLoading || suggestedQuestions.length > 0) && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={(q) => onSend(q)}
            disabled={disabled}
            loading={suggestionsLoading}
            onMute={onMuteFollowups}
          />
        )}
        <div ref={bottomRef} />
      </div>

      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={onDeleteLastMessage}
      />
    </div>
  );
}
