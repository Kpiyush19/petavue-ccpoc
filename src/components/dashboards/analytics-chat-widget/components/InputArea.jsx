import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";
import { Badge } from "./ui/Badge";
import Composer from "./Composer";
import EventLog from "./EventLog";
import { Tooltip } from "@/common-components";

const AI_DISCLAIMER = "AI can make mistakes. Ask how a result was calculated to verify the response.";

export default function InputArea({
  onSend,
  onCancel,
  disabled,
  isThinking,
  eventLog,
  leftSlot,
  filesTraySlot,
  readOnly = false,
  sessionId,
  connectionStatus,
  subscriptionError,
  initialInputValue = "",
  onInputChange
}) {
  const [showLog, setShowLog] = useState(false);

  // Compute disabled state and placeholder based on connection status
  const isConnectionIssue = connectionStatus && connectionStatus !== "connected" && !readOnly;

  const getPlaceholder = () => {
    if (readOnly) return "Ask a question about your data...";
    if (!connectionStatus || connectionStatus === "connected") {
      return "Ask a question about your data...";
    }
    switch (connectionStatus) {
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      case "error":
        return subscriptionError || "Connection error";
      default:
        return "Ask a question about your data...";
    }
  };

  return (
    <div className="input-area">
      <div className="input-area__inner">
        {/* Slots row above input */}
        {(leftSlot || filesTraySlot) && (
          <div className="flex items-center justify-center w-full mb-2 gap-2">
            {/* Buttons centered in the container */}
            <div className="flex items-center gap-2">
              {/* Left slot (e.g., chat history) */}
              {leftSlot}
              {/* Divider */}
              {leftSlot && filesTraySlot && <div className="w-px h-5 bg-[var(--pv-neutral-grey-200)]" />}
              {/* Right slot (e.g., files tray) */}
              {filesTraySlot}
            </div>
          </div>
        )}

        {/* Input row with composer */}
        <div>
          {readOnly ? (
            <div className="flex items-center justify-center h-full min-h-[54px] rounded-lg border border-[var(--pv-neutral-grey-200)] bg-[var(--pv-neutral-grey-50)] text-sm text-[var(--pv-text-secondary-text)]">
              This is an older session and cannot be resumed.
            </div>
          ) : (
            <Composer
              key={sessionId}
              onSend={onSend}
              onCancel={onCancel}
              disabled={disabled || isConnectionIssue}
              isThinking={isThinking}
              placeholder={getPlaceholder()}
              initialValue={initialInputValue}
              onInputChange={onInputChange}
            />
          )}
        </div>

        {/* Footer row with event log toggle */}
        <div className="input-area__footer">
          <Tooltip title={AI_DISCLAIMER} placement="top" displayTooltipOnOverflow>
            <span className="input-area__disclaimer">{AI_DISCLAIMER}</span>
          </Tooltip>
          {/* <button
            onClick={() => setShowLog(!showLog)}
            className="event-log-toggle"
          >
            <ChevronDown
              size={12}
              className={cn(
                'event-log-toggle__icon',
                showLog && 'event-log-toggle__icon--open'
              )}
            />
            <span>Event log</span>
            {eventLog.length > 0 && (
              <Badge variant="muted" className="font-mono h-5">
                {eventLog.length}
              </Badge>
            )}
          </button> */}
        </div>

        {showLog && <EventLog entries={eventLog} />}
      </div>
    </div>
  );
}
