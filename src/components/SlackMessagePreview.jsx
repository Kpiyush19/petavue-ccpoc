import { ExternalLink, BarChart3, RotateCcw, Eye, AlertTriangle } from 'lucide-react'

/**
 * Parse YAML front matter from a markdown config string.
 * Returns { frontMatter: {}, body: "" }
 */
function parseFrontMatter(configContent) {
  if (!configContent) return { frontMatter: {}, body: '' }
  const match = configContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontMatter: {}, body: configContent }

  const yamlStr = match[1]
  const body = match[2]

  // Simple YAML parser for flat key-value pairs
  const frontMatter = {}
  for (const line of yamlStr.split('\n')) {
    const kv = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/)
    if (kv) {
      let val = kv[2].trim()
      if (val === 'true') val = true
      else if (val === 'false') val = false
      else if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1)
      frontMatter[kv[1]] = val
    }
  }
  return { frontMatter, body }
}

/**
 * Parse markdown body into sections: header, body (with metrics), actions.
 */
function parseSections(body) {
  const sections = { header: '', bodyLines: [], actions: [] }
  let currentSection = null

  for (const line of body.split('\n')) {
    if (/^###?\s*Header/i.test(line)) { currentSection = 'header'; continue }
    if (/^###?\s*Body/i.test(line)) { currentSection = 'body'; continue }
    if (/^###?\s*Actions/i.test(line)) { currentSection = 'actions'; continue }
    if (/^##\s*Message Layout/i.test(line)) continue

    if (currentSection === 'header' && line.trim()) {
      sections.header = line.trim()
    } else if (currentSection === 'body') {
      sections.bodyLines.push(line)
    } else if (currentSection === 'actions') {
      const btnMatch = line.match(/^\s*-\s*button:/)
      const labelMatch = line.match(/^\s+label:\s*"(.+)"/)
      const actionIdMatch = line.match(/^\s+action_id:\s*"(.+)"/)
      const urlMatch = line.match(/^\s+url:\s*"(.+)"/)
      const styleMatch = line.match(/^\s+style:\s*"(.+)"/)

      if (btnMatch) {
        sections.actions.push({ label: '', action_id: '', url: '', style: '' })
      } else if (sections.actions.length > 0) {
        const last = sections.actions[sections.actions.length - 1]
        if (labelMatch) last.label = labelMatch[1]
        if (actionIdMatch) last.action_id = actionIdMatch[1]
        if (urlMatch) last.url = urlMatch[1]
        if (styleMatch) last.style = styleMatch[1]
      }
    }
  }

  return sections
}

/**
 * Render a text string, replacing {{ template.vars }} with styled pills.
 */
function TemplatePillText({ text }) {
  if (!text) return null
  const parts = text.split(/(\{\{[^}]+\}\})/)
  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{\s*(.+?)\s*\}\}$/)
        if (match) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-[1px] mx-0.5 rounded bg-[#E8DEF8] text-[#4A148C] text-[12px] font-mono font-medium"
            >
              {match[1]}
            </span>
          )
        }
        // Handle bold markdown
        const boldParts = part.split(/(\*\*[^*]+\*\*)/)
        return boldParts.map((bp, j) => {
          const boldMatch = bp.match(/^\*\*(.+)\*\*$/)
          if (boldMatch) return <strong key={`${i}-${j}`}>{boldMatch[1]}</strong>
          return <span key={`${i}-${j}`}>{bp}</span>
        })
      })}
    </span>
  )
}

/**
 * Render resolved Block Kit blocks (live mode).
 */
function BlockKitRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'header') {
          return (
            <div key={i} className="text-[16px] font-semibold text-[#1d1c1d]">
              {block.text?.text || ''}
            </div>
          )
        }
        if (block.type === 'divider') {
          return <div key={i} className="border-t border-[#ddd]" />
        }
        if (block.type === 'section') {
          const text = block.text?.text || ''
          // Handle mrkdwn: bold, blockquotes, bullet lists
          const lines = text.split('\n')
          return (
            <div key={i} className="text-[16px] text-[#1d1c1d]">
              {lines.map((line, li) => {
                if (line.startsWith('>')) {
                  return (
                    <div key={li} className="border-l-[4px] border-[#3661ED] pl-3 py-0.5">
                      <p className="text-[16px] text-[#616061] italic">{line.slice(1).trim()}</p>
                    </div>
                  )
                }
                if (line.startsWith('• ') || line.startsWith('- ')) {
                  const content = line.slice(2)
                  // Parse bold within bullet
                  const parts = content.split(/(\*[^*]+\*)/)
                  return (
                    <p key={li}>
                      {'• '}
                      {parts.map((p, pi) => {
                        const bold = p.match(/^\*(.+)\*$/)
                        if (bold) return <span key={pi} className="font-semibold">{bold[1]}</span>
                        return <span key={pi}>{p}</span>
                      })}
                    </p>
                  )
                }
                // Bold text
                const parts = line.split(/(\*[^*]+\*)/)
                return (
                  <p key={li}>
                    {parts.map((p, pi) => {
                      const bold = p.match(/^\*(.+)\*$/)
                      if (bold) return <span key={pi} className="font-semibold">{bold[1]}</span>
                      return <span key={pi}>{p}</span>
                    })}
                  </p>
                )
              })}
            </div>
          )
        }
        if (block.type === 'actions') {
          return (
            <div key={i} className="flex items-center gap-2 pt-1">
              {(block.elements || []).map((btn, bi) => {
                const isPrimary = btn.style === 'primary'
                return (
                  <button
                    key={bi}
                    className={`inline-flex items-center gap-1.5 px-3 py-[6px] text-[14px] font-medium rounded-[4px] cursor-default shadow-sm ${
                      isPrimary
                        ? 'text-white bg-[#007a5a] border border-[#007a5a]'
                        : 'text-[#1d1c1d] bg-white border border-[#d0d0d0]'
                    }`}
                  >
                    {btn.url && <ExternalLink size={13} />}
                    {btn.text?.text || ''}
                  </button>
                )
              })}
            </div>
          )
        }
        if (block.type === 'context') {
          return (
            <div key={i} className="flex items-center gap-1.5 text-[12px] text-[#616061]">
              {(block.elements || []).map((el, ei) => (
                <span key={ei}>{el.text || ''}</span>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

/**
 * SlackMessagePreview — renders a visual preview of a Slack Block Kit message.
 *
 * Two modes:
 * 1. Static (authoring): Accepts `config_content` — parses YAML + markdown, shows
 *    template variables as styled pills (e.g., {{ metrics.revenue }} → purple badge)
 * 2. Live (verification): Accepts `blocks` — renders resolved Block Kit JSON with
 *    real data, shows "preview only" indicator
 */
export default function SlackMessagePreview({ config = {}, livePreview = false }) {
  const {
    channel,
    username,
    icon_emoji,
    config_content,
    blocks,        // resolved Block Kit blocks (live mode)
    text,          // resolved fallback text (live mode)
    workflow_name,
  } = config

  // Determine mode
  const isLive = livePreview && blocks && blocks.length > 0
  const isStatic = !isLive && !!config_content

  // Parse static config
  let frontMatter = {}
  let sections = { header: '', bodyLines: [], actions: [] }
  if (isStatic) {
    const parsed = parseFrontMatter(config_content)
    frontMatter = parsed.frontMatter
    sections = parseSections(parsed.body)
  }

  const displayChannel = channel || frontMatter.channel || '#data-alerts'
  const displayUsername = username || frontMatter.username || 'Petavue Alerts'
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-[#e1e1e1] bg-white shadow-sm overflow-hidden" style={{ fontFamily: "'Lato', 'Helvetica Neue', Arial, sans-serif" }}>
        {/* Slack header bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1d21] text-white">
          <svg width="16" height="16" viewBox="0 0 54 54" className="shrink-0">
            <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
            <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
            <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
            <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
          </svg>
          <span className="text-[14px] font-semibold">{displayChannel}</span>
        </div>

        {/* Message content area */}
        <div className="px-4 py-3">
          {/* Bot identity */}
          <div className="flex items-start gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#3661ED] to-[#6B8CF7] flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[16px] font-semibold text-[#1d1c1d]">{displayUsername}</span>
                <span className="text-[12px] font-medium text-[#616061] bg-[#ecedee] px-1.5 py-[1px] rounded">APP</span>
                <span className="text-[12px] text-[#616061]">{timestamp}</span>
              </div>

              {/* Message body — mode-dependent */}
              {isLive ? (
                /* Live mode — render resolved Block Kit JSON */
                <BlockKitRenderer blocks={blocks} />
              ) : isStatic ? (
                /* Static mode — render from parsed config with template pills */
                <div className="space-y-2">
                  {/* Header */}
                  {sections.header && (
                    <div className="text-[16px] font-semibold text-[#1d1c1d]">
                      <TemplatePillText text={sections.header} />
                    </div>
                  )}

                  <div className="border-t border-[#ddd]" />

                  {/* Body lines */}
                  {sections.bodyLines.length > 0 && (
                    <div className="space-y-1">
                      {sections.bodyLines.map((line, i) => {
                        if (!line.trim()) return null
                        // Blockquote
                        if (line.trim().startsWith('>')) {
                          return (
                            <div key={i} className="border-l-[4px] border-[#3661ED] pl-3 py-0.5">
                              <p className="text-[16px] text-[#616061] italic">
                                <TemplatePillText text={line.trim().slice(1).trim()} />
                              </p>
                            </div>
                          )
                        }
                        // Bullet point
                        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                          return (
                            <p key={i} className="text-[16px] text-[#1d1c1d]">
                              {'• '}<TemplatePillText text={line.trim().slice(2)} />
                            </p>
                          )
                        }
                        // Bold header within body
                        if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                          return (
                            <p key={i} className="text-[16px] font-semibold text-[#1d1c1d] mt-1">
                              <TemplatePillText text={line.trim()} />
                            </p>
                          )
                        }
                        // Regular line
                        return (
                          <p key={i} className="text-[16px] text-[#1d1c1d]">
                            <TemplatePillText text={line.trim()} />
                          </p>
                        )
                      })}
                    </div>
                  )}

                  <div className="border-t border-[#ddd]" />

                  {/* Context */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#616061]">
                    <span>Sent via Petavue Workflow Engine</span>
                    <span>•</span>
                    <span>{workflow_name || 'Workflow'}</span>
                  </div>

                  {/* Action buttons */}
                  {sections.actions.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {sections.actions.map((action, i) => {
                        const isPrimary = action.style === 'primary'
                        return (
                          <button
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-3 py-[6px] text-[14px] font-medium rounded-[4px] cursor-default shadow-sm ${
                              isPrimary
                                ? 'text-white bg-[#007a5a] border border-[#007a5a]'
                                : 'text-[#1d1c1d] bg-white border border-[#d0d0d0]'
                            }`}
                          >
                            {action.url && <ExternalLink size={13} />}
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: hardcoded demo preview */
                <div className="space-y-2">
                  <div className="text-[16px] font-semibold text-[#1d1c1d]">
                    [PETAVUE ALERT] {workflow_name || 'Weekly Revenue Report'}, {timestamp}
                  </div>
                  <div className="border-t border-[#ddd]" />
                  <div className="border-l-[4px] border-[#3661ED] pl-3 py-0.5">
                    <p className="text-[16px] text-[#616061] italic">
                      Revenue metrics for the week ending {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} show a strong upward trend with 3 anomalies detected.
                    </p>
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#1d1c1d] mb-1">Key Metrics:</p>
                    <div className="space-y-0.5 text-[16px] text-[#1d1c1d]">
                      <p>• Revenue: <span className="font-semibold text-[#2EB67D]">$1,247,832</span></p>
                      <p>• MoM Change: <span className="font-semibold text-[#2EB67D]">+12.4%</span></p>
                      <p>• Anomalies: <span className="font-semibold text-[#E01E5A]">3</span></p>
                    </div>
                  </div>
                  <div className="border-t border-[#ddd]" />
                  <div className="flex items-center gap-1.5 text-[12px] text-[#616061]">
                    <span>Sent via Petavue Workflow Engine</span>
                    <span>•</span>
                    <span>{workflow_name || 'Weekly Revenue Report'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button className="inline-flex items-center gap-1.5 px-3 py-[6px] text-[14px] font-medium text-white bg-[#007a5a] border border-[#007a5a] rounded-[4px] cursor-default shadow-sm">
                      <ExternalLink size={13} />
                      View Dashboard
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-3 py-[6px] text-[14px] font-medium text-[#1d1c1d] bg-white border border-[#d0d0d0] rounded-[4px] cursor-default shadow-sm">
                      <RotateCcw size={13} />
                      Run Follow-Up Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slack-style footer */}
        <div className="px-4 py-2 bg-[#f8f8f8] border-t border-[#e1e1e1]">
          <div className="flex items-center gap-2 text-[12px] text-[#616061]">
            <span className="inline-flex items-center gap-1 text-[#1264a3] font-medium cursor-default">
              1 reply
            </span>
            <span>•</span>
            <span>Last reply today at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
      </div>

      {/* Live preview indicator */}
      {isLive && (
        <div className="flex items-center gap-1.5 text-[12px] text-amber-600">
          <Eye size={12} />
          Preview only. Message was not sent to Slack
        </div>
      )}
    </div>
  )
}
