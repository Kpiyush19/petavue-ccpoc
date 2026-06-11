import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Loader2, Send, Wrench, Bot, ChevronDown, ChevronRight } from 'lucide-react'
import Pusher from 'pusher-js'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../../../config'
import { apiPost, getApiBase, getAuthToken } from '../../../api'
import MarkdownRenderer from '../../../common-utils/MarkdownRenderer'

export default function HardeningChat({
  sessionId,
  execSessionId,
  disabled,
  onStepUpdate,
  onDiffUpdate,
  fill = false,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [agentActive, setAgentActive] = useState(false)
  const scrollRef = useRef(null)
  const pusherRef = useRef(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (pusherRef.current) { pusherRef.current.disconnect(); pusherRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const createPusher = useCallback(() => {
    const apiBase = getApiBase()
    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      userAuthentication: { endpoint: `${apiBase}/api/pusher/user-auth`, transport: 'ajax', headers },
      channelAuthorization: { endpoint: `${apiBase}/api/pusher/channel-auth`, transport: 'ajax', headers },
    })
  }, [])

  const handleSend = async () => {
    if (!input.trim() || sending || disabled || agentActive) return
    const text = input.trim()
    setInput('')

    setMessages(prev => [...prev, { type: 'user', content: text }])
    setSending(true)
    setAgentActive(true)
    setMessages(prev => [...prev, { type: 'thinking', content: '' }])

    try {
      const result = await apiPost(`/api/sessions/${sessionId}/recipe/exec/feedback`, {
        exec_session_id: execSessionId,
        message: text,
      })

      const pusher = createPusher()
      pusher.connection.bind('connected', () => pusher.signin())
      const ch = pusher.subscribe(result.channel)
      pusherRef.current = pusher

      let currentText = ''

      ch.bind('agent-text', (data) => {
        if (!aliveRef.current) return
        currentText += (data.content || '')
        setMessages(prev => {
          const updated = [...prev]
          const idx = updated.findLastIndex(m => m.type === 'thinking' || m.type === 'assistant-streaming')
          if (idx >= 0) {
            updated[idx] = { type: 'assistant-streaming', content: currentText }
          } else {
            updated.push({ type: 'assistant-streaming', content: currentText })
          }
          return updated
        })
      })

      ch.bind('agent-tool-call', (data) => {
        if (!aliveRef.current) return
        setMessages(prev => {
          const updated = [...prev]
          // Finalize any streaming text before tool calls
          const streamIdx = updated.findLastIndex(m => m.type === 'assistant-streaming')
          if (streamIdx >= 0 && updated[streamIdx].content) {
            updated[streamIdx] = { type: 'assistant', content: updated[streamIdx].content }
          }
          // Remove thinking indicators
          const filtered = updated.filter(m => m.type !== 'thinking')
          // Append tool call
          return [...filtered, {
            type: 'tool-call',
            tool: data.tool,
            preview: data.input_preview || '',
            status: 'running',
          }]
        })
      })

      ch.bind('agent-tool-result', (data) => {
        if (!aliveRef.current) return
        setMessages(prev => {
          const updated = [...prev]
          const toolIdx = updated.findLastIndex(m => m.type === 'tool-call' && m.tool === data.tool && m.status === 'running')
          if (toolIdx >= 0) {
            updated[toolIdx] = { ...updated[toolIdx], status: 'done' }
          }
          return updated
        })
        currentText = ''
      })

      ch.bind('step-diff', (data) => {
        if (!aliveRef.current) return
        onDiffUpdate?.(data.step_id, { diff: data.diff, field: data.field, truncated: data.diff_truncated })
      })

      ch.bind('step-result', (data) => {
        if (!aliveRef.current) return
        onStepUpdate?.(data.step_id, data)
      })

      ch.bind('step-success', (data) => {
        if (!aliveRef.current) return
        onStepUpdate?.(data.step_id, {
          step_id: data.step_id, status: 'success',
          duration_s: data.duration_s, output_files: data.output_files || [],
        })
      })

      const cleanup = () => {
        ch.unbind_all()
        pusher.unsubscribe(result.channel)
        pusher.disconnect()
        pusherRef.current = null
        setSending(false)
        setAgentActive(false)
        // Finalize any pending messages
        setMessages(prev => {
          const updated = prev.filter(m => m.type !== 'thinking')
          const streamIdx = updated.findLastIndex(m => m.type === 'assistant-streaming')
          if (streamIdx >= 0) {
            updated[streamIdx] = { type: 'assistant', content: updated[streamIdx].content }
          }
          return updated
        })
      }

      ch.bind('all-complete', cleanup)
      ch.bind('exec-error', (data) => {
        if (!aliveRef.current) return
        setMessages(prev => [...prev.filter(m => m.type !== 'thinking'), {
          type: 'error', content: data?.error || 'Agent encountered an error',
        }])
        cleanup()
      })
      ch.bind('agent-cancelled', cleanup)

    } catch (e) {
      setSending(false)
      setAgentActive(false)
      setMessages(prev => [...prev.filter(m => m.type !== 'thinking'), {
        type: 'error', content: 'Failed to send: ' + (e.message || 'Unknown error'),
      }])
    }
  }

  // Group consecutive tool-call messages for compact rendering
  const groupedMessages = useMemo(() => {
    const result = []
    let toolGroup = []

    const flushToolGroup = () => {
      if (toolGroup.length > 0) {
        result.push({ type: 'tool-group', tools: [...toolGroup] })
        toolGroup = []
      }
    }

    for (const msg of messages) {
      if (msg.type === 'tool-call') {
        toolGroup.push(msg)
      } else {
        flushToolGroup()
        result.push(msg)
      }
    }
    flushToolGroup()
    return result
  }, [messages])

  const isDisabled = disabled || sending || agentActive

  return (
    <div className={fill ? 'flex flex-col h-full min-h-0' : 'flex flex-col mt-2 mb-1'}>
      {/* Message history — fills available height in `fill` mode so the input pins to the bottom */}
      {fill ? (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2.5 px-1 mb-2 scroll-smooth">
          {groupedMessages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
        </div>
      ) : (
        groupedMessages.length > 0 && (
          <div
            ref={scrollRef}
            className="max-h-[240px] overflow-y-auto space-y-2.5 px-1 mb-2 scroll-smooth"
          >
            {groupedMessages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
          </div>
        )
      )}

      {/* Input */}
      <div className={`flex items-center gap-2 px-1 ${fill ? 'shrink-0' : ''}`}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={isDisabled ? 'Agent is working...' : 'Tell the system if any adjustment doesn\'t look right...'}
          disabled={isDisabled}
          className="flex-1 text-[13px] border border-[var(--border-primary)] rounded-lg px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isDisabled || !input.trim()}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-none transition-colors ${
            isDisabled || !input.trim()
              ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-[var(--accent)] text-white cursor-pointer hover:opacity-90'
          }`}
        >
          {agentActive ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

function ChatMessage({ message }) {
  const { type } = message

  if (type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-[12px] leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  if (type === 'assistant' || type === 'assistant-streaming') {
    return (
      <div className="flex items-start gap-2">
        <Bot size={14} className="shrink-0 mt-1 text-[var(--text-muted)]" />
        <div className="max-w-[85%] px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[13px] text-[var(--text-primary)] leading-relaxed">
          <MarkdownRenderer content={message.content} className="prose-sm prose-p:m-0 prose-p:leading-relaxed prose-li:m-0 prose-ul:my-1 prose-ol:my-1 prose-strong:text-[var(--text-primary)]" />
          {type === 'assistant-streaming' && <span className="inline-block w-1.5 h-3.5 bg-[var(--accent)] animate-pulse ml-0.5 rounded-sm" />}
        </div>
      </div>
    )
  }

  if (type === 'tool-group') {
    return <ToolCallGroup tools={message.tools} />
  }

  if (type === 'thinking') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-[var(--text-muted)] min-h-[28px]">
        <Loader2 size={11} className="animate-spin shrink-0" />
        <span>Thinking...</span>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="px-3 py-2 rounded-lg bg-red-50 text-[12px] text-red-600 leading-relaxed">
        {message.content}
      </div>
    )
  }

  return null
}

function ToolCallGroup({ tools }) {
  const [expanded, setExpanded] = useState(false)
  const allDone = tools.every(t => t.status === 'done')
  const runningTool = tools.find(t => t.status === 'running')

  return (
    <div className="px-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 hover:text-[var(--text-secondary)] transition-colors"
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Wrench size={10} className={allDone ? 'text-green-500' : 'text-amber-500'} />
        <span>
          {allDone
            ? `${tools.length} tool ${tools.length === 1 ? 'call' : 'calls'} completed`
            : `${tools.length} tool ${tools.length === 1 ? 'call' : 'calls'}${runningTool ? ` · ${runningTool.tool}` : ''}`
          }
        </span>
        {!allDone && <Loader2 size={9} className="animate-spin text-amber-500" />}
      </button>
      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {tools.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
              <span className={t.status === 'done' ? 'text-green-500' : 'text-amber-500'}>
                {t.status === 'done' ? '✓' : '⟳'}
              </span>
              <span>{t.tool}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
