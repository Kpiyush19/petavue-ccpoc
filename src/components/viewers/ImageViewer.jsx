import { useState } from 'react'
import { getApiBase, getAuthToken } from '../../api'

export default function ImageViewer({ sessionId, path }) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const src = `${getApiBase()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || '')}`

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--error)]">Failed to load image</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full p-4 overflow-auto bg-[var(--bg-secondary)]">
      {loading && (
        <span className="text-sm text-[var(--text-muted)] animate-thinking absolute">Loading...</span>
      )}
      <img
        src={src}
        alt={path}
        className="max-w-full max-h-full object-contain rounded-lg"
        style={{ imageRendering: 'auto' }}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true) }}
      />
    </div>
  )
}
