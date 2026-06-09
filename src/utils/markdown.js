import { marked } from 'marked'

// Configure marked with GFM and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
})

export function renderMarkdown(text) {
  return marked.parse(text || '')
}
