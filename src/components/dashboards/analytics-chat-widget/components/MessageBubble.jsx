import { File, Calendar } from 'lucide-react';
import { Button } from '@/ui';
import MarkdownRenderer from '@/utils/MarkdownRenderer';
import Timestamp from './Timestamp';

export default function MessageBubble({
  type,
  text,
  isError,
  isStreaming,
  attachments,
  timestamp,
  timezone = 'UTC',
  onSchedule,
  messagesWrapperRef,
}) {
  if (type === 'system') {
    const isPreparing = text?.includes('Preparing workspace');
    return (
      <div
        className={`msg-system ${isPreparing ? 'msg-system--preparing' : ''}`}
      >
        {isPreparing && (
          <span className="msg-system__dots">
            <span className="msg-system__dot" />
            <span className="msg-system__dot" />
            <span className="msg-system__dot" />
          </span>
        )}
        {text}
      </div>
    );
  }

  if (type === 'user') {
    const hasAttachments = attachments && attachments.length > 0;
    return (
      <div className="msg-user-wrapper group/msg">
        <div className="msg-user">
          {text && <div className="msg-user__text">{text}</div>}
          {hasAttachments && (
            <div
              className={`msg-user__attachments ${text ? 'msg-user__attachments--with-text' : ''}`}
            >
              {attachments.map((name, i) => (
                <span key={i} className="msg-attachment">
                  <File size={11} />
                  <span className="truncate max-w-[120px]">{name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <Timestamp
          timestamp={timestamp}
          align="right"
          messagesWrapperRef={messagesWrapperRef}
        />
      </div>
    );
  }

  return (
    <div className="msg-assistant group/msg mt-2">
      <div className="flex h-6 w-6">
        <img
          src="/petavue-logo.svg"
          alt="petavue logo"
          className="h-5 w-5 my-auto"
        />
      </div>
      <div className="msg-assistant__content">
        <MarkdownRenderer
          content={text || ''}
          className={isError ? 'msg-assistant--error' : ''}
        />
        {onSchedule && !isStreaming && text && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              label="Schedule"
              onClick={onSchedule}
              className="msg-schedule-btn"
            >
              <Calendar size={12} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
