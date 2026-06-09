export function formatDate(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} month${Math.floor(seconds / 2592000) === 1 ? '' : 's'} ago`
  return `${Math.floor(seconds / 31536000)} year${Math.floor(seconds / 31536000) === 1 ? '' : 's'} ago`
}
