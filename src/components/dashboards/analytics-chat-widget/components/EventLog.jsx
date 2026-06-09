import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

export default function EventLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [entries]);

  return (
    <div className="event-log">
      {entries.map((e, i) => (
        <div
          key={i}
          className={cn('event-log__entry', `event-log__entry--${e.type}`)}
        >
          <span className="event-log__time">[{e.timestamp}]</span> {e.summary}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
