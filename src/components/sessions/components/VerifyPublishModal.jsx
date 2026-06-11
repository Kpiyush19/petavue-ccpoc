import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { apiGet } from '../../../api'
import PublishView from './PublishView'

export default function VerifyPublishModal({
  isOpen,
  onClose,
  sessionId,
  sessionStatus,
  liveMessages = [],
  onSendFeedback,
}) {
  const [widgets, setWidgets] = useState([])
  const [dashboardTitle, setDashboardTitle] = useState('')
  const [codeHash, setCodeHash] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [maximized, setMaximized] = useState(false)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  useEffect(() => {
    if (!isOpen || !sessionId) return
    setLoading(true)
    setError(null)
    apiGet(`/api/sessions/${sessionId}/dashboard-info`)
      .then((data) => {
        if (!aliveRef.current) return
        setWidgets(data.widgets || [])
        setDashboardTitle(data.title || '')
        setCodeHash(data.code_hash || null)
        setLoading(false)
      })
      .catch((err) => {
        if (!aliveRef.current) return
        setError(err.message || 'Failed to load dashboard info')
        setLoading(false)
      })
  }, [isOpen, sessionId])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [isOpen])

  const handleWidgetVerified = useCallback((widgetId, verified) => {
    setWidgets((prev) =>
      prev.map((w) => w.id === widgetId ? { ...w, verified, verified_at: verified ? new Date().toISOString() : null } : w)
    )
  }, [])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verify & publish dashboard"
        className="relative bg-[var(--bg-primary)] shadow-2xl border border-[var(--border-primary)] flex flex-col overflow-hidden transition-all duration-200 rounded-2xl"
        style={maximized
          ? { width: '95vw', height: '95vh', maxWidth: '95vw', maxHeight: '95vh' }
          : { width: '100%', maxWidth: '1178px', height: '700px', maxHeight: '700px' }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body — PublishView renders its own header (Verify | Publish tabs + close) */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-[14px] text-[var(--text-muted)] animate-pulse">Loading dashboard…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-[14px] text-[var(--pv-error-text)]">{error}</span>
            </div>
          ) : (
            <PublishView
              dashboardTitle={dashboardTitle}
              setDashboardTitle={setDashboardTitle}
              codeHash={codeHash}
              widgets={widgets}
              widgetCount={widgets.length}
              onWidgetVerified={handleWidgetVerified}
              sessionId={sessionId}
              sessionStatus={sessionStatus}
              liveMessages={liveMessages}
              onSendFeedback={onSendFeedback}
              onClose={onClose}
              onRequestMaximize={() => setMaximized(true)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
