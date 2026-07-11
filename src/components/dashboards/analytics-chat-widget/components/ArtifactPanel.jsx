import { useRef } from 'react';
import { ArrowLeft, Download, File, Globe } from 'lucide-react';
import { Button } from '@/ui';
// import ArtifactTabs from './ArtifactTabs'; // Commented out - may need later
import HtmlViewer from './viewers/HtmlViewer';
import MarkdownViewer from './viewers/MarkdownViewer';
import ImageViewer from './viewers/ImageViewer';
import DataTableViewer from './viewers/DataTableViewer';
import JSONTreeViewer from './viewers/JSONTreeViewer';
import { getApiBaseUrl, getAuthToken } from '../api';

function DownloadCard({ sessionId, path, title }) {
  const downloadRef = useRef(null);
  const downloadUrl = `${getApiBaseUrl()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || '')}`;

  const handleDownload = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (downloadRef.current) {
      downloadRef.current.href = downloadUrl;
      downloadRef.current.download = title || path.split('/').pop();
      downloadRef.current.click();
    }
  };

  return (
    <div className="download-card">
      <a ref={downloadRef} style={{ display: 'none' }} aria-hidden="true" />
      <div className="download-card__icon">
        <File size={22} />
      </div>
      <span className="download-card__title">{title}</span>
      <Button
        variant="primary"
        size="lg"
        label="Download"
        onClick={handleDownload}
      />
    </div>
  );
}

function ViewerContent({ tab, sessionId, htmlIframeRef }) {
  const { contentType, path, title } = tab;
  switch (contentType) {
    case 'html':
      return <HtmlViewer ref={htmlIframeRef} sessionId={sessionId} path={path} />;
    case 'csv':
    case 'jsonl':
      return (
        <DataTableViewer sessionId={sessionId} path={path} type={contentType} />
      );
    case 'json':
      return (
        <JSONTreeViewer sessionId={sessionId} path={path} type={contentType} />
      );
    case 'image':
      return <ImageViewer sessionId={sessionId} path={path} />;
    case 'markdown':
    case 'text':
      return <MarkdownViewer sessionId={sessionId} path={path} />;
    default:
      return <DownloadCard sessionId={sessionId} path={path} title={title} />;
  }
}

export default function ArtifactPanel({
  tabs,
  activeTabId,
  activeTab,
  sessionId,
  onSelectTab,
  onCloseTab,
  onClose,
  onPublish,
}) {
  const htmlIframeRef = useRef(null);
  const downloadRef = useRef(null);
  const isHtml = activeTab?.contentType === 'html';

  const handleDownload = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isHtml && htmlIframeRef.current) {
      try {
        htmlIframeRef.current.contentWindow.print();
      } catch {
        window.open(htmlIframeRef.current.src, '_blank');
      }
    } else if (activeTab?.path && downloadRef.current) {
      const downloadUrl = `${getApiBaseUrl()}/api/sessions/${sessionId}/files/${activeTab.path}?token=${encodeURIComponent(getAuthToken() || '')}`;
      downloadRef.current.href = downloadUrl;
      downloadRef.current.download = activeTab.title || activeTab.path.split('/').pop();
      downloadRef.current.click();
    }
  };

  return (
    <div className="artifact-panel">
      <a ref={downloadRef} style={{ display: 'none' }} aria-hidden="true" />

      <div className="artifact-panel__header">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="artifact-panel__back-btn p-1.5"
        >
          <ArrowLeft size={16} />
        </Button>

        <div className="artifact-panel__title">
          {activeTab?.title || 'Artifact'}
        </div>

        {/* Tabs commented out - may need later
        <div className="artifact-panel__tabs">
          <ArtifactTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={onSelectTab}
            onCloseTab={onCloseTab}
          />
        </div>
        */}

        <div className="artifact-panel__actions">
          {activeTab && activeTab.path && (
            <Button
              variant="secondaryGhost"
              size="sm"
              onClick={handleDownload}
              className="p-1.5"
              title={isHtml ? 'Save as PDF' : `Download ${activeTab.title}`}
            >
              <Download size={13} />
            </Button>
          )}
          {activeTab &&
            activeTab.path &&
            activeTab.path.startsWith('output/') &&
            onPublish && (
              <button
                onClick={() => onPublish(activeTab.path, activeTab.title)}
                className="artifact-panel__action-btn"
                title="Publish & Schedule"
              >
                <Globe size={13} />
              </button>
            )}
        </div>
      </div>

      <div className="artifact-panel__content">
        {activeTab ? (
          <ViewerContent tab={activeTab} sessionId={sessionId} htmlIframeRef={htmlIframeRef} />
        ) : (
          <div className="artifact-panel__empty">No file selected</div>
        )}
      </div>
    </div>
  );
}
