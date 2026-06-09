export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatToolInput(input) {
  if (!input) return '';
  try {
    if (typeof input === 'string') {
      return escapeHtml(input).replace(/\\n/g, '\n');
    }
    const s = JSON.stringify(input, null, 2);
    // Convert escaped newlines to actual newlines for better readability
    return escapeHtml(s).replace(/\\n/g, '\n');
  } catch {
    return escapeHtml(String(input));
  }
}
