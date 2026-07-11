import { useState } from 'react'
import { X, RotateCw } from 'lucide-react'
import { Button } from '@/ui'
import { getApiBase, getAuthToken } from '../api'
import DataTableViewer from './viewers/DataTableViewer'
import JsonTreeViewer from './viewers/JsonTreeViewer'
import HtmlViewer from './sessions/viewers/HtmlViewer'

function getFileType(path) {
  const ext = path.split('.').pop().toLowerCase()
  if (ext === 'json') return 'json'
  if (ext === 'csv' || ext === 'jsonl') return 'data'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'jsx') return 'jsx'
  return 'text'
}

export default function OutputPreview({ sessionId, file, onClose }) {
  const [refreshKey, setRefreshKey] = useState(0)

  if (!file || !sessionId) return null
  // Callers pass either a string path or a { path } object — normalize both.
  const filePath = typeof file === 'string' ? file : file.path
  if (!filePath) return null

  const fileType = getFileType(filePath)
  const canRefresh = fileType === 'jsx' || fileType === 'html'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-primary)] shrink-0">
        <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate flex-1 min-w-0">
          {filePath}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {canRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh preview"
            >
              <RotateCw size={12} />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {fileType === 'data' && (
          <DataTableViewer sessionId={sessionId} path={filePath} />
        )}
        {fileType === 'json' && (
          <JsonTreeViewer key={refreshKey} sessionId={sessionId} path={filePath} />
        )}
        {fileType === 'html' && (
          <iframe
            key={refreshKey}
            src={`${getApiBase()}/api/sessions/${sessionId}/files/${filePath}?token=${encodeURIComponent(getAuthToken() || '')}&_r=${refreshKey}`}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
            title={filePath}
          />
        )}
        {fileType === 'jsx' && (
          <HtmlViewer key={refreshKey} sessionId={sessionId} path={filePath} />
        )}
        {fileType === 'text' && (
          <div className="p-3 text-[12px] text-[var(--text-secondary)] font-mono">
            Preview not available for this file type.
          </div>
        )}
      </div>
    </div>
  )
}
