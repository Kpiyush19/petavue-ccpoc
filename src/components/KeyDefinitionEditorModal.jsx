import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { X, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/ui'
import { Input } from '@/ui/components/FormControls/FormControls'
import { apiPost, apiPut } from '../api'

const TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular', desc: 'Normal sessions only' },
  { value: 'sage', label: 'Sage', desc: 'Sage sessions only' },
  { value: 'all', label: 'All Sessions', desc: 'Both regular and Sage' },
]

const SCOPE_OPTIONS = [
  { value: 'custom', label: 'Personal', desc: 'Only visible to me' },
  { value: 'tenant', label: 'Tenant', desc: 'Visible to all users' },
]

// ── Tag input component ────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const inputRef = useRef(null)

  const addTag = (tag) => {
    const clean = tag.toLowerCase().trim()
    if (!clean || tags.includes(clean)) return
    onChange([...tags, clean])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
      setInput('')
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[38px] rounded-lg border border-[var(--border-primary)]
        bg-[var(--bg-primary)] px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-[var(--accent)]/30"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full
            bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)) }}
            className="p-0 bg-transparent border-none cursor-pointer text-[var(--accent)] hover:text-[var(--action-danger)]"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) { addTag(input); setInput('') } }}
        placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
        className="flex-1 min-w-[80px] text-sm bg-transparent text-[var(--text-primary)] border-none outline-none"
      />
    </div>
  )
}

// ── Custom dropdown component ──────────────────────────────────────

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between text-sm rounded-lg border border-[var(--border-primary)]
          bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 text-left cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30
          ${open ? 'ring-2 ring-[var(--accent)]/30' : ''}`}
      >
        <span>{selected.label}</span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left bg-transparent border-none cursor-pointer
                hover:bg-[var(--bg-hover)] transition-colors
                ${opt.value === value ? 'bg-[var(--accent)]/5' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--text-primary)]">{opt.label}</div>
                {opt.desc && <div className="text-[12px] text-[var(--text-muted)]">{opt.desc}</div>}
              </div>
              {opt.value === value && <Check size={14} className="text-[var(--accent)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────

export default function KeyDefinitionEditorModal({ keyDef, isAdmin, onClose, onSaved }) {
  const isEdit = !!keyDef

  const [name, setName] = useState(keyDef?.name || '')
  const [description, setDescription] = useState(keyDef?.description || '')
  const [content, setContent] = useState(keyDef?.content || '')
  const [type, setType] = useState(keyDef?.type || 'all')
  const [scope, setScope] = useState(keyDef?.scope || (isAdmin ? 'tenant' : 'custom'))
  const [tags, setTags] = useState(keyDef?.tags || [])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required')
    if (!description.trim()) return toast.error('Description is required')
    if (!content.trim()) return toast.error('Definition content is required')

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name.trim())) {
      return toast.error('Name must be lowercase, hyphen-separated (e.g. "sales-cycle-length")')
    }

    setSaving(true)
    try {
      if (isEdit) {
        await apiPut(`/api/skills/${keyDef.id}`, {
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          type,
          scope,
          tags,
        })
        toast.success('Key definition updated')
      } else {
        await apiPost('/api/skills', {
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          category: 'key_definition',
          type,
          scope,
          tags,
        })
        toast.success('Key definition created')
      }
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {isEdit ? 'Edit Key Definition' : 'New Key Definition'}
          </h2>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] bg-transparent border-none cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Name <span className="text-[var(--text-muted)]">(lowercase, hyphen-separated)</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. sales-cycle-length"
              className="w-full text-sm"
              disabled={isEdit}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Description <span className="text-[var(--text-muted)]">(2-3 lines)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Average days from opportunity creation to close"
              rows={3}
              className="w-full text-sm rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>

          {/* Type + Scope row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Session Type</label>
              <Dropdown
                value={type}
                options={TYPE_OPTIONS}
                onChange={setType}
              />
            </div>
            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Scope</label>
                <Dropdown
                  value={scope}
                  options={SCOPE_OPTIONS}
                  onChange={setScope}
                />
              </div>
            )}
            {!isAdmin && !isEdit && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Scope</label>
                <Dropdown
                  value={scope}
                  options={SCOPE_OPTIONS.filter((o) => o.value !== 'tenant')}
                  onChange={setScope}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Tags <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Formula / Definition content */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Definition <span className="text-[var(--text-muted)]">(formula, tables, columns, business rules)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Describe the formula, which tables/columns to use, any filters or business rules...\n\nExample:\nSales Cycle Length = closedate - createdate (in days)\nOnly include deals where dealstage = 'closedwon'\nTable: hubspot_deals\nColumns: createdate, closedate, dealstage`}
              rows={10}
              className="w-full text-sm rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-primary)] shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Definition'}
          </Button>
        </div>
      </div>
    </div>
  )
}
