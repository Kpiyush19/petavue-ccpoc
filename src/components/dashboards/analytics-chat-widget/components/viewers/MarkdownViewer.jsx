import { useState, useEffect } from 'react';
import { getApiBaseUrl, getAuthToken } from '../../api';
import MarkdownRenderer from '@/utils/MarkdownRenderer';

export default function MarkdownViewer({ sessionId, path }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = `${getApiBaseUrl()}/api/sessions/${sessionId}/files/${path}`;
        const res = await fetch(url, {
          headers: getAuthToken()
            ? { Authorization: `Bearer ${getAuthToken()}` }
            : {},
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, path]);

  if (error) {
    return <div className="viewer-error">Failed to load: {error}</div>;
  }

  return (
    <div className="viewer-markdown">
      <MarkdownRenderer content={content} />
    </div>
  );
}
