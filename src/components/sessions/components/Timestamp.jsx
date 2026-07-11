import { useState, useEffect } from 'react'
import { Tooltip } from '@/ui'

function getRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 0) return 'now'

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function formatBrowserTime(timestamp) {
  const date = new Date(timestamp)

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getUpdateInterval(timestamp) {
  const diff = Date.now() - timestamp
  const hours = diff / (1000 * 60 * 60)

  if (hours < 1) return 60 * 1000
  if (hours < 24) return 10 * 60 * 1000
  return 60 * 60 * 1000
}

export default function Timestamp({ timestamp, align = 'left', messagesWrapperRef }) {
  const [, setTick] = useState(0)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  useEffect(() => {
    if (!timestamp) return

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, getUpdateInterval(timestamp))

    return () => clearInterval(interval)
  }, [timestamp])

  useEffect(() => {
    const wrapper = messagesWrapperRef?.current
    if (!wrapper) return

    function handleScroll() {
      setTooltipVisible(false)
    }

    wrapper.addEventListener('scroll', handleScroll)
    return () => wrapper.removeEventListener('scroll', handleScroll)
  }, [messagesWrapperRef])

  if (!timestamp) return null

  const relativeTime = getRelativeTime(timestamp)
  const absoluteTime = formatBrowserTime(timestamp)

  const alignClass = align === 'right' ? ' s-chat-timestamp--right' : ' s-chat-timestamp--left'

  return (
    <div className={`s-chat-timestamp${alignClass}`}>
      <Tooltip title={absoluteTime} placement="top" tooltipActive={tooltipVisible}>
        <span
          className="s-chat-timestamp__badge"
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          {relativeTime}
        </span>
      </Tooltip>
    </div>
  )
}
