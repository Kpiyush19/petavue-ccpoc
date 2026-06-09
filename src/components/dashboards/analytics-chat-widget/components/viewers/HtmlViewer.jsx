import { forwardRef, useState, useEffect } from 'react';
import { getApiBaseUrl, getAuthToken } from '../../api';

const HtmlViewer = forwardRef(function HtmlViewer({ sessionId, path }, ref) {
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const src = `${getApiBaseUrl()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || '')}`;

  useEffect(() => {
    const controller = new AbortController();
    async function checkFile() {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (controller.signal.aborted) return;

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('application/json')) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            const detail = json.detail;
            const msg = typeof detail === 'string'
              ? detail
              : detail ? JSON.stringify(detail) : `Error ${res.status}`;
            setErrorMsg(msg);
          } catch {
            setErrorMsg(`File not found (${res.status})`);
          }
          setStatus('error');
        } else {
          setStatus('ready');
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setErrorMsg(e.message || 'Failed to load file');
          setStatus('error');
        }
      }
    }
    setStatus('loading');
    checkFile();
    return () => { controller.abort(); };
  }, [src]);

  if (status === 'loading') {
    return (
      <div className="viewer-html viewer-html--loading">
        <span>Loading...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="viewer-html viewer-html--error">
        <span>{errorMsg}</span>
      </div>
    );
  }

  return (
    <iframe
      ref={ref}
      src={src}
      sandbox="allow-scripts allow-same-origin allow-modals"
      className="viewer-html"
      title={path}
    />
  );
});

export default HtmlViewer;
