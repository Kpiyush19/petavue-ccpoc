import { useCallback, useRef, useEffect, useState } from 'react'

export default function ResizeHandle({ onResize, side = 'right' }) {
  const [isActive, setIsActive] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragging = useRef(false)
  const rafId = useRef(null)
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  const stopDrag = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    setIsActive(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.querySelectorAll('iframe').forEach((f) => { f.style.pointerEvents = '' })
    // Cancel any pending animation frame
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
  }, [])

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    setIsActive(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.querySelectorAll('iframe').forEach((f) => { f.style.pointerEvents = 'none' })
  }, [])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return

      // Cancel previous frame if still pending
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }

      // Throttle with requestAnimationFrame
      rafId.current = requestAnimationFrame(() => {
        const width = side === 'left' ? e.clientX : window.innerWidth - e.clientX
        onResizeRef.current(width)
        rafId.current = null
      })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', stopDrag)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', stopDrag)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
      stopDrag()
    }
  }, [side, stopDrag])

  const showHighlight = isActive || isHovered

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: 3,
        cursor: 'col-resize',
        background: showHighlight ? 'var(--accent)' : 'var(--border-primary)',
        flexShrink: 0,
        alignSelf: 'stretch',
        transition: isActive ? 'none' : 'background 0.15s ease',
      }}
    >
      {/* Invisible wider hit area */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: -4,
          right: -4,
          cursor: 'col-resize',
        }}
      />
    </div>
  )
}
