import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { apiPost, apiGet, getApiBase, getAuthToken } from '../../../api'

export default function HardeningFeedbackInput({ sessionId, execSessionId, disabled, onAgentRestart, onAgentDone }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return
    setSending(true)
    try {
      await apiPost(`/api/sessions/${sessionId}/recipe/exec/feedback`, {
        exec_session_id: execSessionId,
        message: text.trim(),
      })
      setText('')
      if (onAgentRestart) onAgentRestart()

      const apiBase = getApiBase()
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const resp = await fetch(`${apiBase}/api/sessions/${sessionId}/recipe/exec/sync?exec_session_id=${execSessionId}`, { headers })
          const data = await resp.json()
          if (data.status !== 'running' && data.status !== 'preparing') {
            clearInterval(pollRef.current)
            pollRef.current = null
            setSending(false)
            if (onAgentDone) onAgentDone(data.steps, data.diffs)
          }
        } catch {}
      }, 10000)
    } catch (e) {
      console.error('Feedback failed:', e)
      setSending(false)
    }
  }

  const isDisabled = disabled || sending

  return (
    <div className="flex items-center gap-2 mt-3 px-1 pb-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder={isDisabled ? 'Agent is working...' : 'Tell the system if any adjustment doesn\'t look right...'}
        disabled={isDisabled}
        className="flex-1 text-[12px] border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={isDisabled || !text.trim()}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-none transition-colors ${
          isDisabled || !text.trim()
            ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
            : 'bg-[var(--accent)] text-white cursor-pointer hover:opacity-90'
        }`}
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </div>
  )
}
