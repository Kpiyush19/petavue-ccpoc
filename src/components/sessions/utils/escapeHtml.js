export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatToolInput(input) {
  if (!input) return ''
  try {
    if (typeof input === 'string') return escapeHtml(input)
    const s = JSON.stringify(input, null, 2)
    return escapeHtml(s)
  } catch {
    return escapeHtml(String(input))
  }
}
