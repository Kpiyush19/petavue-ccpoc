import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { apiGet } from '../../../api'
import HtmlViewer from '../viewers/HtmlViewer'
import WidgetChatPanel from './WidgetChatPanel'
import LineagePanel from './LineagePanel'

// Focus modal that replaces the legacy lineage drawer for flag-on
// (widget_chat_enabled) users. 3-column vertical split:
//   widget preview (50%) | chat (25%) | lineage (25%)
// All columns full modal height. Side columns (chat, lineage) can each
// minimize to a 32px-wide vertical strip; the freed width is absorbed
// proportionally by the widget + the other side column.
//
// Owns:
//   - Lineage fetch (also passes mainChatEditsCount down to WidgetChatPanel,
//     avoiding a second fetch). Refetched when the session status flips
//     out of 'thinking' so the timeline reflects the agent's new edits.
//   - HtmlViewer refresh key, bumped on the same 'thinking' → not-thinking
//     transition so the widget preview re-renders to show the latest JSX.
//   - Per-instance minimize state (chat / lineage). Lost on close (v1).
//
// Backwards-compat: gated entirely by widget_chat_enabled in ArtifactPanel.
// Flag-off users continue to see the legacy LineageDrawer overlay
// untouched.

// Per-column floor when resizing. 15% on an 1800px modal == ~270px, which is
// enough for the WidgetChatPanel composer / lineage timeline to stay usable
// without column contents wrapping into spaghetti. 50/25/25 sums to 100% so
// using the defaults as floors would freeze the slider — picking a real
// floor unblocks resize.
const MIN_PCT = 15

// Build CSS widths for the three columns given the current pct state and the
// per-side minimize state. When a side column is minimized to a 32px strip,
// its pct is held in `widgetPct` etc. for restore-on-expand and the other two
// columns absorb the freed space proportionally to their current pcts.
function computeWidths(chatMin, lineageMin, widgetPct, chatPct, lineagePct) {
  if (chatMin && lineageMin) return { widget: 'calc(100% - 64px)', chat: '32px', lineage: '32px' }
  if (lineageMin) {
    // Hide lineage column to a 32px strip. Widget + chat split (100% - 32px)
    // proportionally to their stored pcts.
    const visible = widgetPct + chatPct
    const wRatio = widgetPct / visible
    const cRatio = chatPct / visible
    return {
      widget: `calc((100% - 32px) * ${wRatio})`,
      chat: `calc((100% - 32px) * ${cRatio})`,
      lineage: '32px',
    }
  }
  if (chatMin) {
    const visible = widgetPct + lineagePct
    const wRatio = widgetPct / visible
    const lRatio = lineagePct / visible
    return {
      widget: `calc((100% - 32px) * ${wRatio})`,
      chat: '32px',
      lineage: `calc((100% - 32px) * ${lRatio})`,
    }
  }
  return { widget: `${widgetPct}%`, chat: `${chatPct}%`, lineage: `${lineagePct}%` }
}

function MinimizedStrip({ label, onExpand }) {
  return (
    <div className="h-full flex flex-col items-center justify-between py-3 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)]">
      <button
        type="button"
        onClick={onExpand}
        title={`Expand ${label}`}
        className="p-1 rounded hover:bg-[var(--bg-hover)] cursor-pointer border-none bg-transparent text-[var(--text-secondary)]"
      >
        <ArrowLeft size={14} />
      </button>
      <span
        className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {label}
      </span>
      <span aria-hidden="true" />
    </div>
  )
}

function ColumnHeader({ title, onMinimize, minimizeTitle }) {
  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <span className="text-[12px] font-semibold text-[var(--text-primary)] flex-1 truncate">
        {title}
      </span>
      {onMinimize && (
        <button
          type="button"
          onClick={onMinimize}
          title={minimizeTitle}
          className="p-1 rounded hover:bg-[var(--bg-hover)] cursor-pointer border-none bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}

export default function WidgetFocusModal({
  isOpen,
  onClose,
  sessionId,
  widgetPath,
  sessionStatus,
  liveMessages = [],
  onSendFeedback,
}) {
  const [lineage, setLineage] = useState(null)
  const [lineageLoading, setLineageLoading] = useState(true)
  const [lineageError, setLineageError] = useState(null)
  const [chatMin, setChatMin] = useState(false)
  const [lineageMin, setLineageMin] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  // Per-instance column widths (percent). Defaults match the pre-slider
  // fixed-layout (50/25/25). Sliders mutate these via mouse drag. v1: not
  // persisted to localStorage — fresh defaults on every modal open.
  const [widgetPct, setWidgetPct] = useState(50)
  const [chatPct, setChatPct] = useState(25)
  const [lineagePct, setLineagePct] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const bodyRef = useRef(null)
  const prevStatusRef = useRef(sessionStatus)

  const widgetName = widgetPath ? widgetPath.split('/').pop().replace('.jsx', '') : ''

  // Stable callback prevents HtmlViewer from re-fetching on every parent
  // re-render (its useEffect depends on onLoadComplete identity).
  const handleLoadComplete = useCallback(() => {}, [])

  // Slider drag — `which` selects which boundary to move:
  //   'widget-chat'  → drag adjusts widgetPct / chatPct (lineagePct fixed)
  //   'chat-lineage' → drag adjusts chatPct / lineagePct (widgetPct fixed)
  // Floor: MIN_PCT for every column. When the drag would push the neighbor
  // below the floor, we clamp the pair so the pinned column stays at MIN_PCT
  // and the dragged column absorbs the rest. We snapshot starting values on
  // mousedown so move math is absolute (no drift across moves).
  const startDrag = (which) => (e) => {
    e.preventDefault()
    const rect = bodyRef.current?.getBoundingClientRect()
    if (!rect) return
    const startX = e.clientX
    const startWidget = widgetPct
    const startChat = chatPct
    const startLineage = lineagePct
    setIsDragging(true)
    const onMove = (ev) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100
      if (which === 'widget-chat') {
        let newWidget = startWidget + dxPct
        let newChat = startChat - dxPct
        if (newWidget < MIN_PCT) { newWidget = MIN_PCT; newChat = startWidget + startChat - MIN_PCT }
        if (newChat < MIN_PCT) { newChat = MIN_PCT; newWidget = startWidget + startChat - MIN_PCT }
        setWidgetPct(newWidget)
        setChatPct(newChat)
      } else {
        let newChat = startChat + dxPct
        let newLineage = startLineage - dxPct
        if (newChat < MIN_PCT) { newChat = MIN_PCT; newLineage = startChat + startLineage - MIN_PCT }
        if (newLineage < MIN_PCT) { newLineage = MIN_PCT; newChat = startChat + startLineage - MIN_PCT }
        setChatPct(newChat)
        setLineagePct(newLineage)
      }
    }
    const onUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Cancellation guard ref — flipped to false on unmount so an in-flight
  // fetch doesn't setState on an unmounted component (the parent
  // unmounts WidgetFocusModal on close).
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  // Note: kept as a plain function (not useCallback) intentionally —
  // mirrors LineageDrawer's pattern, and a memoized version trips the
  // react-hooks/set-state-in-effect rule on the effects below because
  // the rule then statically follows the function body.
  const fetchLineage = () => {
    if (!sessionId || !widgetPath) return
    setLineageError(null)
    apiGet(`/api/sessions/${sessionId}/widget-lineage?path=${encodeURIComponent(widgetPath)}`)
      .then((data) => {
        if (!aliveRef.current) return
        setLineage(data)
        setLineageLoading(false)
      })
      .catch((err) => {
        if (!aliveRef.current) return
        setLineageError(err.message || 'Failed to load lineage')
        setLineageLoading(false)
      })
  }

  // Initial fetch when modal opens / widget changes. Same shape as
  // LineageDrawer's initial-load effect.
  useEffect(() => {
    if (!isOpen || !sessionId || !widgetPath) return
    setLineageLoading(true)
    setLineage(null)
    fetchLineage()
    // Intentionally omitting `fetchLineage` from deps: it's a plain function
    // (not memoized via useCallback — see comment above) and is recreated on
    // every render. Adding it would re-fetch on every render. The effect
    // should only run when the modal opens or the widget identity changes,
    // which `isOpen + sessionId + widgetPath` fully capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId, widgetPath])

  // Refetch lineage + bump preview key when a widget chat turn completes
  // (status flips out of 'thinking'). Mirrors the LineageDrawer pattern so
  // the user sees fresh lineage + fresh JSX render after the agent edits.
  useEffect(() => {
    if (!isOpen) {
      prevStatusRef.current = sessionStatus
      return
    }
    if (prevStatusRef.current === 'thinking' && sessionStatus !== 'thinking') {
      fetchLineage()
      setRefreshKey((k) => k + 1)
    }
    prevStatusRef.current = sessionStatus
    // Same rationale as above — non-memoized `fetchLineage` must stay out of
    // deps. Only the modal-visibility and session-status changes should
    // trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionStatus])

  // Esc to close + lock background scroll. Preserve prior overflow value
  // so we don't clobber whatever the page set.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  // No explicit reset-on-close effect: parent (ArtifactPanel) entirely
  // unmounts WidgetFocusModal when `lineagePath` clears, so a fresh open
  // already starts with default useState values (chatMin=false,
  // lineageMin=false, refreshKey=0). v1: layout preferences not persisted.

  if (!isOpen || !widgetPath) return null

  const widths = computeWidths(chatMin, lineageMin, widgetPct, chatPct, lineagePct)
  // While dragging, the 150ms transition makes the column lag behind the
  // cursor and feels rubbery. Disable it during drag; restore for the
  // minimize / expand animations.
  const colTransition = isDragging ? 'none' : 'width 150ms ease'
  // Suppress the "Main chat has made N edits…" banner inside the chat
  // column. The banner was useful in the legacy drawer where lineage was
  // visually crowded out, but in the modal the lineage timeline is fully
  // visible in its own right column — the banner is redundant noise.
  // Pass 0 to WidgetChatPanel so its banner branch doesn't render.
  const editsCount = 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Widget chat for ${widgetName}`}
        className="relative bg-[var(--bg-primary)] rounded-lg shadow-2xl border border-[var(--border-primary)] flex flex-col overflow-hidden"
        style={{ width: '92vw', height: '90vh', maxWidth: '1800px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <LayoutDashboard size={16} className="text-[var(--accent)]" />
          <span className="text-[14px] font-semibold text-[var(--text-primary)] flex-1 truncate">
            {widgetName}
          </span>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] cursor-pointer border-none bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3-column body */}
        <div ref={bodyRef} className="flex-1 min-h-0 flex relative">
          {/* Drag shield: while a slider handle is being dragged, overlay
              the entire body with a transparent layer that captures mouse
              events. Without this, dragging into the widget column lets
              the <iframe> swallow mousemove (iframes capture pointer
              events from the parent document), so the drag freezes
              mid-way. This is why chat/lineage could only shrink, not
              grow — growing them required dragging into the iframe area.
              z-50 puts it above the iframe but below the modal header. */}
          {isDragging && (
            <div
              className="absolute inset-0 z-50 cursor-col-resize"
              style={{ background: 'transparent' }}
            />
          )}

          {/* Widget preview (left, default 50%) */}
          <div
            className="h-full min-h-0 flex flex-col border-r border-[var(--border-primary)]"
            style={{ width: widths.widget, transition: colTransition }}
          >
            <div className="flex-1 min-h-0">
              <HtmlViewer
                key={refreshKey}
                sessionId={sessionId}
                path={widgetPath}
                onLoadComplete={handleLoadComplete}
              />
            </div>
          </div>

          {/* Drag handle: widget | chat. Hidden when chat is minimized
              (resizing into a 32px strip is non-sensical). Visually a
              transparent 4px hit area that sits ON TOP of the column
              border via negative margins; on hover/drag it highlights. */}
          {!chatMin && (
            <div
              onMouseDown={startDrag('widget-chat')}
              title="Drag to resize"
              className={`shrink-0 w-1 cursor-col-resize z-10 transition-colors ${
                isDragging ? 'bg-[var(--accent)]' : 'bg-transparent hover:bg-[var(--accent)]/40'
              }`}
              style={{ marginLeft: '-2px', marginRight: '-2px' }}
            />
          )}

          {/* Chat (middle, default 25%) */}
          <div
            className="h-full min-h-0 flex flex-col border-r border-[var(--border-primary)]"
            style={{ width: widths.chat, transition: colTransition }}
          >
            {chatMin ? (
              <MinimizedStrip label="Chat" onExpand={() => setChatMin(false)} />
            ) : (
              <>
                <ColumnHeader
                  title="Chat"
                  onMinimize={() => setChatMin(true)}
                  minimizeTitle="Minimize chat"
                />
                <div className="flex-1 min-h-0 flex flex-col">
                  <WidgetChatPanel
                    widgetPath={widgetPath}
                    sessionId={sessionId}
                    sessionStatus={sessionStatus}
                    onSubmit={(text, scope) => onSendFeedback?.(text, scope)}
                    onClose={onClose}
                    mainChatEditsCount={editsCount}
                    liveMessages={liveMessages}
                  />
                </div>
              </>
            )}
          </div>

          {/* Drag handle: chat | lineage. Hidden when either is minimized. */}
          {!chatMin && !lineageMin && (
            <div
              onMouseDown={startDrag('chat-lineage')}
              title="Drag to resize"
              className={`shrink-0 w-1 cursor-col-resize z-10 transition-colors ${
                isDragging ? 'bg-[var(--accent)]' : 'bg-transparent hover:bg-[var(--accent)]/40'
              }`}
              style={{ marginLeft: '-2px', marginRight: '-2px' }}
            />
          )}

          {/* Lineage (right, default 25%) */}
          <div
            className="h-full min-h-0 flex flex-col"
            style={{ width: widths.lineage, transition: colTransition }}
          >
            {lineageMin ? (
              <MinimizedStrip label="Lineage" onExpand={() => setLineageMin(false)} />
            ) : (
              <>
                <ColumnHeader
                  title="How it's built"
                  onMinimize={() => setLineageMin(true)}
                  minimizeTitle="Minimize lineage"
                />
                <div className="flex-1 min-h-0 flex flex-col">
                  <LineagePanel
                    lineage={lineage}
                    loading={lineageLoading}
                    error={lineageError}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
