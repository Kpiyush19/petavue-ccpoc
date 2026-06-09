import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Info, X, Plus, ArrowUp, ArrowDown, Pencil, Check,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'


// BE-injected sentinel for the "Other (please specify)" option on
// single_select / multi_select clarifications. Mirrors
// `CUSTOM_ANSWER_SENTINEL` in src/routes/skill_run.py. Never used as a
// final answer value — the FE replaces it with the user's typed text
// before sending.
const CUSTOM_SENTINEL = '__custom__'


// Pull a sensible initial answer. If the user previously answered this
// clarification (then navigated back via Previous), restore that value.
// Otherwise fall back to the planner's `default`, then to an empty
// type-appropriate value.
//
// CUSTOM_SENTINEL stripping: MultiSelect emits the sentinel into the array
// as an "Other checked but text empty" marker; on Previous/Next remount,
// we strip it so the text input doesn't render the literal `__custom__`
// string back to the user. The MultiSelect's local `customChecked` state
// resets to false on remount; the user must re-check Other if they want
// to type a custom value.
function defaultFor(c, existing) {
  if (existing !== undefined && existing !== null) {
    if (Array.isArray(existing)) {
      return existing.filter((v) => v !== CUSTOM_SENTINEL)
    }
    return existing === CUSTOM_SENTINEL ? '' : existing
  }
  const d = c?.default
  if (d !== undefined && d !== null) return d
  switch (c?.answer_type) {
    case 'multi_select':
    case 'editable_list':
    case 'ordered_list':
      return []
    case 'free_text':
      return ''
    case 'single_select': {
      // Pick the first option that isn't the appended __custom__ sentinel.
      // Otherwise a single_select with allow_custom would pre-select Other.
      const first = (c?.options || []).find((o) => o?.value !== CUSTOM_SENTINEL)
      return first?.value ?? ''
    }
    default:
      return ''
  }
}


// Visual progress indicator for the multi-question wizard. ≤15 questions
// render as a row of capsule segments (current one elongated); >15 collapse
// to a continuous bar with an "N of M" caption since 16+ dots become
// unreadable.
// Small badge surfacing WHY a clarification is being asked. The
// `always_asked` variant carries a native title tooltip explaining the
// "we re-confirm each run" policy — answers the implicit question users
// have when they see the same question on a second run of the same skill.
function SurfacedTag({ reason }) {
  if (!reason) return null
  const isAlways = reason === 'always_asked'
  const label = isAlways
    ? 'Asked every time'
    : reason.startsWith('detection:')
    ? `Detected: ${reason.slice('detection:'.length)}`
    : reason
  const tooltip = isAlways
    ? 'Confirmed fresh each run to prevent stale configurations.'
    : undefined
  return (
    <span
      title={tooltip}
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-primary)]"
    >
      {label}
    </span>
  )
}


function WizardStepDots({ index, total }) {
  if (total <= 1) return null
  if (total > 15) {
    const pct = Math.round(((index + 1) / total) * 100)
    return (
      <div className="mb-4">
        <div className="h-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < index
              ? 'w-3 bg-[var(--accent)]'
              : i === index
              ? 'w-6 bg-[var(--accent)]'
              : 'w-3 bg-[var(--bg-hover)]'
          }`}
        />
      ))}
    </div>
  )
}


function SingleSelect({ options = [], value, onChange, allowCustom = false }) {
  // Set of known (planner-authored) option values — excludes the BE-injected
  // __custom__ sentinel so we can detect "is the current value custom?" by
  // checking whether it's a string outside this set.
  const knownValues = new Set(
    options.map((o) => o?.value).filter((v) => v !== CUSTOM_SENTINEL),
  )

  // Custom mode is on when the value is a non-empty string that isn't a
  // known option. We initialize from the current value (so resumed runs
  // re-open in custom mode) but track locally so the input stays open
  // even when the user has typed nothing yet.
  const initialCustom =
    allowCustom &&
    typeof value === 'string' &&
    value !== '' &&
    !knownValues.has(value)
  const [customMode, setCustomMode] = useState(initialCustom)

  function selectOption(v) {
    if (v === CUSTOM_SENTINEL) {
      setCustomMode(true)
      // Clear value so isAnswered() blocks submit until the user types
      // something. The text input below has autoFocus so the prompt is
      // immediate.
      onChange('')
    } else {
      setCustomMode(false)
      onChange(v)
    }
  }

  const checkedValue = customMode ? CUSTOM_SENTINEL : value

  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        // Skip the __custom__ option if the BE didn't enable allow_custom.
        // Defensive — the BE only appends when allow_custom is true, but a
        // future bug shouldn't render an Other radio for vanilla selects.
        if (opt?.value === CUSTOM_SENTINEL && !allowCustom) return null
        const selected = opt.value === checkedValue
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <input
              type="radio"
              className="mt-0.5 accent-[var(--accent)]"
              checked={selected}
              onChange={() => selectOption(opt.value)}
            />
            <span className="text-[13px] text-[var(--text-primary)] leading-snug">
              {opt.label}
            </span>
          </label>
        )
      })}
      {customMode && (
        <input
          type="text"
          autoFocus
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
      )}
    </div>
  )
}


function MultiSelect({ options = [], value = [], onChange, allowCustom = false }) {
  // Split the incoming value array into known option values vs custom
  // (free-form) entries. Both halves are recombined on emit so the parent
  // sees a single array.
  const knownValues = new Set(
    options.map((o) => o?.value).filter((v) => v !== CUSTOM_SENTINEL),
  )
  const incoming = Array.isArray(value) ? value : []
  const incomingKnown = incoming.filter((v) => knownValues.has(v))
  const incomingCustom = incoming.filter(
    (v) => typeof v === 'string' && !knownValues.has(v),
  )
  // We track a single custom slot — multi-select supports any number of
  // known options PLUS one free-form entry. (The doc covers the "mixed
  // answers" case; a single Other slot is enough for the planner's
  // tolerance contract.)
  const initialCustomText = incomingCustom[0] || ''
  const [customChecked, setCustomChecked] = useState(
    allowCustom && initialCustomText !== '',
  )
  const [customText, setCustomText] = useState(initialCustomText)

  function emit(known, checked, text) {
    const out = [...known]
    if (allowCustom && checked) {
      // Push the typed text when present, otherwise the sentinel so
      // `isAnswered` can flag the "Other checked but empty" state and
      // disable submit. The sentinel never reaches the BE — once the
      // user types a value it replaces the sentinel in `out`.
      out.push(text.trim() || CUSTOM_SENTINEL)
    }
    onChange(out)
  }

  function toggleKnown(v) {
    const next = new Set(incomingKnown)
    if (next.has(v)) next.delete(v); else next.add(v)
    emit(Array.from(next), customChecked, customText)
  }

  function toggleCustom() {
    const nc = !customChecked
    setCustomChecked(nc)
    emit(incomingKnown, nc, customText)
  }

  function onCustomTextChange(t) {
    setCustomText(t)
    emit(incomingKnown, customChecked, t)
  }

  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        // We render the custom checkbox separately below — skip the
        // BE-injected sentinel option in the main list to avoid a
        // duplicate Other row.
        if (opt?.value === CUSTOM_SENTINEL) return null
        const selected = incomingKnown.includes(opt.value)
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--accent)]"
              checked={selected}
              onChange={() => toggleKnown(opt.value)}
            />
            <span className="text-[13px] text-[var(--text-primary)] leading-snug">
              {opt.label}
            </span>
          </label>
        )
      })}
      {allowCustom && (
        <>
          <label
            className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${customChecked ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--accent)]"
              checked={customChecked}
              onChange={toggleCustom}
            />
            <span className="text-[13px] text-[var(--text-primary)] leading-snug">
              Other (please specify)
            </span>
          </label>
          {customChecked && (
            <input
              type="text"
              autoFocus
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="Type your custom value…"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            />
          )}
        </>
      )}
    </div>
  )
}


function FreeText({ value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-y"
      placeholder="Type your answer…"
    />
  )
}


function EditableList({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : []
  const [editingIdx, setEditingIdx] = useState(-1)
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState('')

  function startEdit(i) {
    setEditingIdx(i)
    setDraft(items[i])
  }
  function commitEdit() {
    if (editingIdx < 0) return
    const trimmed = draft.trim()
    if (!trimmed) { setEditingIdx(-1); return }
    const next = items.slice()
    next[editingIdx] = trimmed
    onChange(next)
    setEditingIdx(-1)
  }
  function cancelEdit() {
    setEditingIdx(-1)
    setDraft('')
  }
  function remove(i) {
    const next = items.filter((_, idx) => idx !== i)
    onChange(next)
  }
  function commitNew() {
    const trimmed = newItem.trim()
    if (!trimmed) { setAdding(false); setNewItem(''); return }
    onChange([...items, trimmed])
    setNewItem('')
    setAdding(false)
  }

  return (
    <div>
      <ul className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]"
          >
            {editingIdx === i ? (
              <>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className="flex-1 min-w-0 bg-transparent text-[13px] text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={commitEdit}
                  className="p-0.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Save edit"
                >
                  <Check size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 min-w-0 text-[13px] text-[var(--text-primary)] truncate">
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  aria-label="Edit item"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--pv-error-text)] hover:bg-[var(--bg-hover)]"
                  aria-label="Remove item"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5">
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew()
              if (e.key === 'Escape') { setAdding(false); setNewItem('') }
            }}
            placeholder="Add an item…"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-[var(--text-primary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={commitNew}
            className="p-0.5 rounded text-[var(--accent)] hover:bg-[var(--bg-hover)]"
            aria-label="Add item"
          >
            <Check size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
        >
          <Plus size={13} />
          Add item
        </button>
      )}
    </div>
  )
}


function OrderedList({ value = [], onChange, allowAddCustom = false }) {
  // `value` is an ordered list of string item labels. Reorder is always
  // allowed; when `allowAddCustom` is true the user can append free-form
  // items below the list and remove any item (custom or planner-seeded).
  const items = Array.isArray(value) ? value : []
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function move(i, delta) {
    const j = i + delta
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function commitNew() {
    const trimmed = draft.trim()
    if (!trimmed) { setAdding(false); setDraft(''); return }
    onChange([...items, trimmed])
    setDraft('')
    setAdding(false)
  }

  return (
    <div>
      <ul className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <li
            key={`${item}-${i}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]"
          >
            <span className="w-5 shrink-0 text-[11px] text-[var(--text-muted)] tabular-nums">
              {i + 1}.
            </span>
            <span className="flex-1 min-w-0 text-[13px] text-[var(--text-primary)] truncate">
              {item}
            </span>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move up"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              <ArrowDown size={13} />
            </button>
            {allowAddCustom && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--pv-error-text)] hover:bg-[var(--bg-hover)]"
                aria-label="Remove item"
              >
                <X size={13} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {allowAddCustom && (
        adding ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNew()
                if (e.key === 'Escape') { setAdding(false); setDraft('') }
              }}
              placeholder="Add a custom item…"
              className="flex-1 min-w-0 bg-transparent text-[13px] text-[var(--text-primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={commitNew}
              className="p-0.5 rounded text-[var(--accent)] hover:bg-[var(--bg-hover)]"
              aria-label="Add item"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
          >
            <Plus size={13} />
            Add custom item
          </button>
        )
      )}
    </div>
  )
}


function UnknownTypeFallback({ type, value, onChange }) {
  // Closed enum at src/skills/constants.py:ANSWER_TYPES has only the 5
  // shapes we render explicitly. Anything else is a contract violation —
  // but blocking the user is worse than letting them type. Free-text
  // fallback + small note so they (and any debugger) know.
  return (
    <div>
      <p className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)] mb-2">
        <Info size={11} className="shrink-0 mt-0.5" />
        <span>
          Unrecognized answer type <code className="font-mono">{type || '(missing)'}</code> — falling back to free text.
        </span>
      </p>
      <FreeText value={value} onChange={onChange} />
    </div>
  )
}


function isAnswered(c, value) {
  if (!c?.required) return true
  switch (c?.answer_type) {
    case 'multi_select':
      // Reject the "Other checked, text empty" state — MultiSelect emits
      // the CUSTOM_SENTINEL string into the array when the user has the
      // Other box checked but hasn't typed anything. Disabling submit
      // matches the design doc's "input cannot be empty" rule and avoids
      // silently dropping the user's half-finished custom entry.
      return (
        Array.isArray(value)
        && value.length > 0
        && !value.includes(CUSTOM_SENTINEL)
      )
    case 'editable_list':
    case 'ordered_list':
      return Array.isArray(value) && value.length > 0
    case 'free_text':
      return typeof value === 'string' && value.trim().length > 0
    case 'single_select':
      // Single-select with custom mode: when the user picks Other and
      // hasn't typed yet, value is '' — the existing empty-string check
      // already disables submit. No extra logic needed.
      return value !== '' && value !== undefined && value !== null
    default:
      return value !== '' && value !== undefined && value !== null
  }
}


export default function ClarificationCard({
  clarification,
  existingAnswer,
  index,
  total,
  onNext,
  onPrevious,
  submitting,
}) {
  // The caller passes `key={clarification.id}` so this component remounts
  // when the active question changes — no useEffect needed to reset state.
  // `existingAnswer` is the value the user previously entered (if they
  // navigated back via Previous); on remount, we initialize with it so the
  // prior answer is editable rather than reset to the planner default.
  const [value, setValue] = useState(() => defaultFor(clarification, existingAnswer))

  if (!clarification) return null

  const {
    id, question, help_text, answer_type, options, surfaced_reason,
    allow_custom, allow_add_custom,
  } = clarification

  const canSubmit = isAnswered(clarification, value) && !submitting
  const isFirst = index === 0
  const isLast = index + 1 === total

  let input
  switch (answer_type) {
    case 'single_select':
      input = (
        <SingleSelect
          options={options}
          value={value}
          onChange={setValue}
          allowCustom={!!allow_custom}
        />
      )
      break
    case 'multi_select':
      input = (
        <MultiSelect
          options={options}
          value={value}
          onChange={setValue}
          allowCustom={!!allow_custom}
        />
      )
      break
    case 'free_text':
      input = <FreeText value={value} onChange={setValue} />
      break
    case 'editable_list':
      input = <EditableList value={value} onChange={setValue} />
      break
    case 'ordered_list':
      input = (
        <OrderedList
          value={value}
          onChange={setValue}
          allowAddCustom={!!allow_add_custom}
        />
      )
      break
    default:
      input = <UnknownTypeFallback type={answer_type} value={value} onChange={setValue} />
  }

  return (
    <div className="max-w-3xl mx-auto bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl p-5">
      <WizardStepDots index={index} total={total} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          Configuration {index + 1} of {total}
        </span>
        <SurfacedTag reason={surfaced_reason} />
      </div>

      <h2 className="text-[14px] font-medium text-[var(--text-primary)] leading-snug mb-2">
        {question}
      </h2>

      {help_text ? (
        <p className="flex items-start gap-1.5 text-[12px] text-[var(--text-muted)] mb-3">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>{help_text}</span>
        </p>
      ) : (
        <div className="mb-3" />
      )}

      <div className="mb-4">
        {input}
      </div>

      <div className="flex items-center justify-between gap-2">
        {!isFirst ? (
          <Button
            onClick={() => onPrevious({ id, answer: value })}
            disabled={submitting}
            size="md"
            variant="ghost"
          >
            <ChevronLeft size={14} className="mr-1" />
            Previous
          </Button>
        ) : (
          <span />
        )}
        <Button
          onClick={() => onNext({ id, answer: value })}
          disabled={!canSubmit}
          size="md"
        >
          {isLast ? 'Submit answers' : 'Next'}
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
