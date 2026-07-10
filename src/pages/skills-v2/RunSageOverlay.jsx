import { useMemo, useState, useEffect, useRef } from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'
import { ChatOverlay } from '../../components/dashboards/dashboard-viewer-widget'
// The overlay's positioning (position:fixed, z-index, floating card) lives in
// this stylesheet. The widget index doesn't bundle it, so without this import
// the panel renders in normal flow — below the footer instead of over the page.
import '../../components/dashboards/dashboard-viewer-widget/styles.css'
import { Button as PvButton } from '../../petavue'
import { cn } from '../../utils/cn'

// Context-aware "Ask Sage" for the run flow. Uses the shared ChatOverlay panel
// (chat-overlay__panel) so it's the same Sage surface as everywhere else; only
// the content — intro, suggested questions, answers — adapts to the current step.
// Prototype: answers are canned per phase (no live model call).

const STEP_HELP = {
  PLANNING: {
    step: 'Plan',
    intro: "Hi, I'm Sage. I'm reading your connected data and drafting a plan for the dashboard. Ask me anything about this step.",
    qs: [
      { q: 'What happens in this step?', a: "I review your data and draft a plan: what to compute, which widgets to build, and what to leave out. Nothing is built yet — you'll approve the plan first." },
      { q: 'How long does this take?', a: 'Usually 8 to 12 minutes, not counting any time you spend answering questions.' },
      { q: 'Do I need to do anything?', a: "Not yet. If I need a decision — like the time period — I'll ask. Otherwise sit tight; you can leave and it keeps running." },
    ],
  },
  AWAITING_CONFIRMATION: {
    step: 'Review',
    intro: "Hi, I'm Sage. Your plan is ready for review. Ask me anything before you build it.",
    qs: [
      { q: "What am I reviewing?", a: 'The plan for your dashboard: each widget and what it will show. Review them on the left, and adjust or drop any before I build.' },
      { q: 'What if I disagree?', a: "You're not locked in. Chat with me about any widget, or hit Request changes to send your notes and I'll revise the plan." },
      { q: 'What happens when I build it?', a: 'I build the dashboard on your data (about 5 to 6 minutes), run a quality check, then it opens in chat where you can refine and publish it.' },
    ],
  },
  EXECUTING: {
    step: 'Build',
    intro: "Hi, I'm Sage. I'm building your dashboard now. Ask me anything about what's happening.",
    qs: [
      { q: "What's happening right now?", a: "I'm running the queries, transforming the data, and assembling each widget. You can watch the steps on the left and the results fill in on the right." },
      { q: 'How long is left?', a: 'Build usually takes 5 to 6 minutes. You can leave this page; it keeps running and you can resume from your sessions.' },
      { q: 'Can I stop it?', a: 'Yes. Cancel run in the header stops it and discards progress. Or just leave the page and come back later.' },
    ],
  },
  VERIFYING: {
    step: 'Quality check',
    intro: "Hi, I'm Sage. I'm reviewing the result to make sure every number is right. Ask away.",
    qs: [
      { q: 'What are you checking?', a: 'I review every value to confirm it is source-linked and correct, refine anything that needs it, then run a final check.' },
      { q: 'Is something wrong?', a: 'Not necessarily — this is a routine review. If I find an issue, I fix it and re-check before finishing.' },
    ],
  },
  FIXING: {
    step: 'Quality check',
    intro: "Hi, I'm Sage. I'm refining a few things from the review. Ask me anything.",
    qs: [
      { q: 'What are you fixing?', a: 'The quality check flagged something to tighten up. I am adjusting it and will re-run the check before finishing.' },
    ],
  },
}

const DEFAULT_HELP = {
  step: 'This run',
  intro: "Hi, I'm Sage. Ask me anything about this run.",
  qs: [
    { q: 'What is this?', a: 'This is a skill run. I plan it, build it on your data, quality-check it, then hand it to chat where you can refine and publish it.' },
  ],
}

export default function RunSageOverlay({ phase, open, onClose }) {
  const help = useMemo(() => STEP_HELP[phase] || DEFAULT_HELP, [phase])
  const [chat, setChat] = useState([{ role: 'assistant', text: help.intro }])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const taRef = useRef(null)

  // Reset the thread to the step's intro whenever it opens or the step changes.
  useEffect(() => {
    if (open) setChat([{ role: 'assistant', text: help.intro }])
  }, [open, help])

  // Auto-grow the input up to ~3 lines, then let it scroll internally.
  const MAX_INPUT_H = 76
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_H)}px`
    el.style.overflowY = el.scrollHeight > MAX_INPUT_H ? 'auto' : 'hidden'
  }, [draft])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  const answerFor = (q) => {
    const hit = help.qs.find((x) => x.q === q)
    return hit?.a || "Good question. Short version: you don't have to do anything right now — I'll flag it if I need you. You can leave the page any time and pick it back up from your sessions."
  }
  const ask = (q) => setChat((c) => [...c, { role: 'user', text: q }, { role: 'assistant', text: answerFor(q) }])
  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    ask(text)
  }

  const asked = new Set(chat.filter((m) => m.role === 'user').map((m) => m.text))
  const followups = help.qs.map((x) => x.q).filter((q) => !asked.has(q))
  const lastIsAssistant = chat[chat.length - 1]?.role === 'assistant'

  return (
    <ChatOverlay isOpen={open} onClose={onClose} floating heading="Sage" title={`Ask about the ${help.step} step`}>
      <div className="flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {chat.map((m, i) => (
            <div
              key={i}
              className={cn(
                'text-[13px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%]',
                m.role === 'user'
                  ? 'self-end bg-pv-primary-primary-500 text-white rounded-br-md'
                  : 'self-start bg-pv-neutral-grey-100 text-[var(--text-primary)] rounded-bl-md'
              )}
            >
              {m.text}
            </div>
          ))}
          {lastIsAssistant && followups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {followups.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)] bg-white hover:border-pv-primary-primary-400 hover:text-pv-primary-primary-600 cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 p-3 flex items-end gap-2">
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder={`Ask about the ${help.step} step…`}
            style={{ minHeight: '32px', maxHeight: `${MAX_INPUT_H}px` }}
            className="flex-1 text-[13px] px-3 py-1.5 rounded-lg border border-[var(--border-primary)] focus:border-pv-primary-primary-500 outline-none resize-none"
          />
          <PvButton
            variant="primary"
            size="md"
            icon={PaperPlaneRight}
            disabled={!draft.trim()}
            onClick={send}
            aria-label="Send"
            className="shrink-0"
          />
        </div>
      </div>
    </ChatOverlay>
  )
}
