import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Plus, Trash2, FileText, ChevronDown, Check } from 'lucide-react'
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

// ── Custom dropdown component ──────────────────────────────────────

function Dropdown({ value, options, onChange, disabled }) {
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
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between text-sm rounded-lg border border-[var(--border-primary)]
          bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 text-left cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30
          disabled:opacity-50 disabled:cursor-not-allowed
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

// ── Build the frontmatter + title (non-editable portion) ───────────

function buildHeaderBlock(name, description) {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
}

const DEFAULT_BODY = `\n\n## When to Use\n- \n\n## Methodology\n\n### Step 1: \n\n### Step 2: \n\n## Quality Checks\n- \n`

// ── Main component ──────────────────────────────────────────────────

export default function SkillEditorModal({ skill, isAdmin, onClose, onSaved }) {
  const isEdit = !!skill

  const [name, setName] = useState(skill?.name || '')
  const [description, setDescription] = useState(skill?.description || '')
  const [type, setType] = useState(skill?.type || 'regular')
  const [scope, setScope] = useState(skill?.scope || 'custom')
  const [tags, setTags] = useState(skill?.tags || [])
  const [files, setFiles] = useState(skill?.files || [])
  const [saving, setSaving] = useState(false)
  const [addingFile, setAddingFile] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')
  const [newFileContent, setNewFileContent] = useState('')

  // Split existing content into header (frontmatter+title) and body on load
  const [body, setBody] = useState(() => {
    if (!skill?.content) return DEFAULT_BODY
    // Strip the frontmatter + title to extract only the body
    const raw = skill.content
    // Match: ---\n...\n---\n\n# Title line
    const headerEnd = raw.match(/^---\n[\s\S]*?\n---\n+#[^\n]*\n?/)
    if (headerEnd) {
      const remaining = raw.slice(headerEnd[0].length)
      return remaining || DEFAULT_BODY
    }
    // No frontmatter found — treat entire content as body
    return raw
  })

  // Combine header + body into full SKILL.md content
  const fullContent = (name.trim() && description.trim())
    ? buildHeaderBlock(name.trim(), description.trim()) + body
    : body

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required')
    if (!description.trim()) return toast.error('Description is required')
    if (!body.trim()) return toast.error('Skill instructions are required')

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name.trim())) {
      return toast.error('Name must be lowercase, hyphen-separated (e.g. "html-dashboard-builder")')
    }

    setSaving(true)
    try {
      if (isEdit) {
        await apiPut(`/api/skills/${skill.id}`, {
          name: name.trim(),
          description: description.trim(),
          content: fullContent.trim(),
          type,
          scope,
          tags,
          files: files.length > 0 ? files : [],
        })
        toast.success('Skill updated')
      } else {
        await apiPost('/api/skills', {
          name: name.trim(),
          description: description.trim(),
          content: fullContent.trim(),
          category: 'skill',
          type,
          scope,
          tags,
          files: files.length > 0 ? files : [],
        })
        toast.success('Skill created')
      }
      onSaved()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFile = () => {
    if (!newFilePath.trim()) return toast.error('File path is required')
    if (files.some((f) => f.path === newFilePath.trim())) {
      return toast.error('File already exists')
    }
    setFiles([...files, { path: newFilePath.trim(), content: newFileContent }])
    setNewFilePath('')
    setNewFileContent('')
    setAddingFile(false)
  }

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleFileContentChange = (index, newContent) => {
    const updated = [...files]
    updated[index] = { ...updated[index], content: newContent }
    setFiles(updated)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {isEdit ? 'Edit Skill' : 'New Skill'}
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
              placeholder="e.g. html-dashboard-builder"
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
              placeholder="Describe when the agent should use this skill..."
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

          {/* Content (SKILL.md) — split: non-editable header + editable body */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Skill Content <span className="text-[var(--text-muted)]">(SKILL.md - detailed instructions)</span>
            </label>
            <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--accent)]/30">
              {/* Non-editable header — derived from name + description */}
              <div className="bg-[var(--bg-hover)]/60 px-3 py-2 font-mono text-sm text-[var(--text-muted)] select-none border-b border-[var(--border-primary)] border-dashed">
                {name.trim() && description.trim() ? (
                  <>
                    <div className="text-[var(--text-muted)]">---</div>
                    <div><span className="text-[var(--accent)]">name:</span> {name.trim()}</div>
                    <div><span className="text-[var(--accent)]">description:</span> {description.trim()}</div>
                    <div className="text-[var(--text-muted)]">---</div>
                    <div className="mt-2 text-[var(--text-primary)] font-semibold">
                      # {name.trim().split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </div>
                  </>
                ) : (
                  <div className="italic">Fill in name and description above to generate header</div>
                )}
              </div>
              {/* Editable body */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`\n## When to Use\n- Describe trigger conditions...\n\n## Methodology\n\n### Step 1: \n\n### Step 2: \n\n## Quality Checks\n- `}
                rows={10}
                className="w-full text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 resize-y font-mono focus:outline-none border-none"
              />
            </div>
          </div>

          {/* Attached files */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Attached Files <span className="text-[var(--text-muted)]">(optional)</span>
              </label>
              <button
                onClick={() => setAddingFile(true)}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline bg-transparent border-none cursor-pointer"
              >
                <Plus size={12} /> Add file
              </button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-hover)]">
                      <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
                        <FileText size={12} />
                        {file.path}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(i)}
                        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--action-danger)] bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(e) => handleFileContentChange(i, e.target.value)}
                      rows={4}
                      className="w-full text-xs font-mono px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border-none resize-y focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {addingFile && (
              <div className="border border-[var(--border-primary)] rounded-lg p-3 mt-2 space-y-2">
                <Input
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="Relative path (e.g. tool.py, templates/base.html)"
                  className="w-full text-sm"
                  autoFocus
                />
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="File content..."
                  rows={4}
                  className="w-full text-xs font-mono rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 resize-y focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setAddingFile(false); setNewFilePath(''); setNewFileContent('') }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddFile}>Add</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-primary)] shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Skill'}
          </Button>
        </div>
      </div>
    </div>
  )
}
