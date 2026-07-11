import { ChevronRight, FileText } from 'lucide-react'

export function renderWithPills(text) {
  if (!text) return null
  const parts = text.split(/(\{\{[^}]+\}\})/)
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(.+)\}\}$/)
    if (match) {
      return (
        <span key={i} className="inline-flex items-center text-[10px] font-mono font-semibold text-[var(--color-primary-500)] bg-[var(--color-primary-100)] px-1.5 py-0.5 rounded border border-[var(--color-primary-500)]/20 mx-0.5">
          {match[1]}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function stripPills(text) {
  if (!text) return text
  return text.replace(/\{\{([^}]+)\}\}/g, '$1')
}

export function hasCardContent(card) {
  if (!card) return false
  return (
    (card.instructions?.length || 0) > 0 ||
    (card.conditions?.length || 0) > 0 ||
    (card.outputs?.length || 0) > 0
  )
}

export function CardView({ card }) {
  if (!hasCardContent(card)) return null
  const { instructions = [], conditions = [], outputs = [] } = card

  return (
    <div className="px-3.5 py-2.5 border-t border-[var(--border-primary)]/50 space-y-2.5">
      {instructions.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wide">Instructions</span>
          <div className="mt-1 space-y-1">
            {instructions.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                <span className="text-[var(--text-muted)] shrink-0 mt-0.5">
                  <ChevronRight size={10} />
                </span>
                <span className="flex-1 flex flex-wrap items-center gap-y-0.5">{renderWithPills(line)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wide">Conditions</span>
        <div className="mt-1 space-y-1">
          {conditions.length > 0 ? (
            conditions.map((cond, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                <span className="text-[10px] font-semibold text-[var(--color-primary-500)] bg-[var(--color-primary-100)] px-1.5 py-0.5 rounded shrink-0 mt-px">IF</span>
                <span className="flex-1 flex flex-wrap items-center gap-y-0.5">{renderWithPills(cond)}</span>
              </div>
            ))
          ) : (
            <div className="text-[12px] text-[var(--text-muted)] italic leading-relaxed">No conditions</div>
          )}
        </div>
      </div>

      {outputs.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-wide">Outputs</span>
          <div className="mt-1 space-y-1">
            {outputs.map((out, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
                <FileText size={11} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                <span className="flex-1 flex flex-wrap items-center gap-y-0.5">{renderWithPills(out)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
