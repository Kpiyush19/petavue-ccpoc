import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Search, Trash2, MoreVertical, Pencil, Inbox, Zap, BookOpen, Plus,
  ToggleLeft, ToggleRight, Shield, User, Globe,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { apiGet, apiPost, apiPut, apiDelete, apiPatch, getCurrentUser } from '../api'
import SkillEditorModal from '../components/SkillEditorModal'
import KeyDefinitionEditorModal from '../components/KeyDefinitionEditorModal'

const TABS = [
  { key: 'skill', label: 'Skills', icon: Zap },
  { key: 'key_definition', label: 'Key Definitions', icon: BookOpen },
]

const SCOPE_BADGE = {
  tenant: { label: 'Tenant', variant: 'accent', icon: Shield },
  custom: { label: 'My Skill', variant: 'muted', icon: User },
  global: { label: 'Global', variant: 'success', icon: Globe },
}


export default function SkillsPage() {
  const [tab, setTab] = useState('skill')
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null) // null = create, object = edit
  const [kdEditorOpen, setKdEditorOpen] = useState(false)
  const [editingKd, setEditingKd] = useState(null)
  const menuRef = useRef(null)

  const currentUser = getCurrentUser()
  const currentUserId = currentUser?.userId || currentUser?._id || null

  const fetchSkills = useCallback(async () => {
    try {
      const data = await apiGet(`/api/skills?category=${tab}`)
      setSkills(data.skills || [])
      setIsAdmin(data.is_admin || false)
    } catch {
      toast.error('Failed to load skills')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setLoading(true)
    fetchSkills()
  }, [fetchSkills])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (e.target.closest('[data-menu-trigger]')) return
      setMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const canEdit = (skill) => {
    if (skill.scope === 'global') return false
    if (skill.scope === 'tenant') return isAdmin
    return true // custom = own skill
  }

  const handleToggle = async (skill) => {
    try {
      await apiPatch(`/api/skills/${skill.id}/toggle`, { is_active: !skill.is_active })
      toast.success(skill.is_active ? 'Skill disabled' : 'Skill enabled')
      setMenuOpen(null)
      fetchSkills()
    } catch (e) {
      toast.error('Failed to toggle: ' + e.message)
    }
  }

  const handleDelete = async (skill) => {
    try {
      await apiDelete(`/api/skills/${skill.id}`)
      toast.success(`${tab === 'key_definition' ? 'Key definition' : 'Skill'} deleted`)
      setDeleteConfirm(null)
      setMenuOpen(null)
      fetchSkills()
    } catch (e) {
      toast.error('Failed to delete: ' + e.message)
    }
  }

  const handleEdit = async (skill) => {
    setMenuOpen(null)
    try {
      const full = await apiGet(`/api/skills/${skill.id}`)
      if (tab === 'key_definition') {
        setEditingKd(full)
        setKdEditorOpen(true)
      } else {
        setEditingSkill(full)
        setEditorOpen(true)
      }
    } catch (e) {
      toast.error('Failed to load skill: ' + e.message)
    }
  }

  const handleCreate = () => {
    if (tab === 'key_definition') {
      setEditingKd(null)
      setKdEditorOpen(true)
    } else {
      setEditingSkill(null)
      setEditorOpen(true)
    }
  }

  const handleSaved = () => {
    setEditorOpen(false)
    setKdEditorOpen(false)
    setEditingSkill(null)
    setEditingKd(null)
    fetchSkills()
  }

  const filtered = search.trim()
    ? skills.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      )
    : skills

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-[var(--accent)]" />
              Skills
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Manage agent skills and key definitions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tab === 'key_definition' ? 'key definitions' : 'skills'}...`}
                className="pl-9 h-9 text-sm w-56"
              />
            </div>
            <Button size="sm" onClick={handleCreate}>
              <Plus size={14} />
              {tab === 'key_definition' ? 'New Key Definition' : 'New Skill'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSearch('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  bg-transparent border-none cursor-pointer
                  ${tab === t.key
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm animate-thinking">
            Loading {tab === 'key_definition' ? 'key definitions' : 'skills'}...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <Inbox size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {search
                ? `No matching ${tab === 'key_definition' ? 'key definitions' : 'skills'}`
                : `No ${tab === 'key_definition' ? 'key definitions' : 'skills'} yet`
              }
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {tab === 'key_definition'
                ? 'Define business KPIs, metrics, and formulas for the agent to follow.'
                : 'Create skills with instructions and methodology for the agent.'
              }
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((skill, i) => {
              const scopeInfo = SCOPE_BADGE[skill.scope] || SCOPE_BADGE.custom
              const ScopeIcon = scopeInfo.icon

              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-5 py-4
                    hover:shadow-[var(--shadow-card)] hover:-translate-y-[1px] transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/8 flex items-center justify-center shrink-0 mt-0.5">
                      {tab === 'key_definition'
                        ? <BookOpen size={18} className="text-[var(--accent)]" />
                        : <Zap size={18} className="text-[var(--accent)]" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                          {skill.name}
                        </span>
                        <Badge variant={scopeInfo.variant}>
                          <ScopeIcon size={9} className="mr-0.5" />
                          {scopeInfo.label}
                        </Badge>
                        {skill.type === 'regular' && (
                          <Badge variant="muted">Regular</Badge>
                        )}
                        {skill.type === 'sage' && (
                          <Badge variant="accent">Sage</Badge>
                        )}
                        {!skill.is_active && (
                          <Badge variant="warning">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">
                        {skill.description}
                      </p>
                      {skill.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {skill.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-primary)]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3-dot menu */}
                    {canEdit(skill) && (
                      <button
                        data-menu-trigger
                        onClick={(e) => {
                          e.stopPropagation()
                          if (menuOpen === skill.id) {
                            setMenuOpen(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const menuHeight = 180
                            const spaceBelow = window.innerHeight - rect.bottom
                            const top = spaceBelow < menuHeight ? rect.top - menuHeight + 8 : rect.bottom + 4
                            setMenuCoords({ top, left: rect.right - 192 })
                            setMenuOpen(skill.id)
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0
                          bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="More options"
                      >
                        <MoreVertical size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3-dot dropdown menu — portaled */}
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1"
          style={{ top: menuCoords.top, left: menuCoords.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const skill = skills.find((s) => s.id === menuOpen)
            if (!skill) return null
            return (
              <>
                <button onClick={() => handleEdit(skill)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                  <Pencil size={14} />
                  Edit
                </button>
                <button onClick={() => handleToggle(skill)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                  {skill.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  {skill.is_active ? 'Disable' : 'Enable'}
                </button>
                <div className="border-t border-[var(--border-primary)] my-1" />
                <button onClick={() => { setMenuOpen(null); setDeleteConfirm(skill) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--action-danger)] hover:bg-[var(--action-danger)]/8 transition-colors bg-transparent border-none cursor-pointer">
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )
          })()}
        </div>,
        document.body
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Delete {tab === 'key_definition' ? 'Key Definition' : 'Skill'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              This will remove it from all future sessions.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={13} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Skill editor modal */}
      {editorOpen && (
        <SkillEditorModal
          skill={editingSkill}
          isAdmin={isAdmin}
          onClose={() => { setEditorOpen(false); setEditingSkill(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Key definition editor modal */}
      {kdEditorOpen && (
        <KeyDefinitionEditorModal
          keyDef={editingKd}
          isAdmin={isAdmin}
          onClose={() => { setKdEditorOpen(false); setEditingKd(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
