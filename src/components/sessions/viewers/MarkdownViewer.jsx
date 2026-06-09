import { useState, useEffect } from 'react'
import { getApiBase, getAuthToken } from '../../../api'
import MarkdownRenderer from '../../../common-utils/MarkdownRenderer'

export default function MarkdownViewer({ sessionId, path, onLoadComplete }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const url = `${getApiBase()}/api/sessions/${sessionId}/files/${path}`
        const res = await fetch(url, {
          headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
        })
        if (!res.ok) throw new Error(`${res.status}`)
        const text = await res.text()
        if (!cancelled) {
          setContent(text)
          onLoadComplete?.()
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          onLoadComplete?.()
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId, path, onLoadComplete])

  if (error) {
    return (
      <div className="p-6 text-[var(--error)] text-sm">
        Failed to load: {error}
      </div>
    )
  }

  return (
    <div className="p-6 overflow-auto h-full text-sm">
      <MarkdownRenderer content={content} />
    </div>
  )
}
