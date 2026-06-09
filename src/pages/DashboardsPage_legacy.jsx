import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Clock, Globe, Search, Workflow,
  Pause, Play, Trash2, MoreVertical, EyeOff, Eye, Pencil, Inbox, ExternalLink,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { apiGet, apiPut, apiDelete, getCurrentUser } from '../api'
import { timeAgo } from '@/common-utils/relativeTimeDiff'

export default function DashboardsPage() {
  const navigate = useNavigate()
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef(null)

  const currentUser = getCurrentUser()
  const currentUserId = currentUser?.userId || currentUser?._id || null

  const fetchArtifacts = useCallback(async () => {
    try {
      const data = await apiGet('/api/workflows/dashboards/all')
      setArtifacts(data.dashboards || [])
    } catch {
      toast.error('Failed to load dashboards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArtifacts() }, [fetchArtifacts])

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

  const dashApi = (art) => `/api/workflows/dashboards/${art.id}`

  const handleTogglePause = async (art) => {
    try {
      await apiPut(dashApi(art), { paused: !art.paused })
      toast.success(art.paused ? 'Schedule resumed' : 'Schedule paused')
      setMenuOpen(null)
      fetchArtifacts()
    } catch (e) { toast.error('Failed: ' + e.message) }
  }

  const handleToggleShare = async (art) => {
    try {
      await apiPut(dashApi(art), { shared: !art.shared })
      toast.success(art.shared ? 'Dashboard unshared' : 'Dashboard shared with team')
      setMenuOpen(null)
      fetchArtifacts()
    } catch (e) { toast.error('Failed: ' + e.message) }
  }

  const handleDelete = async (art) => {
    try {
      await apiDelete(dashApi(art))
      toast.success('Dashboard deleted')
      setDeleteConfirm(null)
      setMenuOpen(null)
      fetchArtifacts()
    } catch (e) { toast.error('Failed to delete: ' + e.message) }
  }

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return
    try {
      await apiPut(dashApi(renaming), { name: renameValue.trim() })
      toast.success('Dashboard renamed')
      setRenaming(null)
      fetchArtifacts()
    } catch (e) { toast.error('Failed to rename: ' + e.message) }
  }

  const isOwner = (art) => currentUserId && art.created_by === currentUserId

  const filtered = search.trim()
    ? artifacts.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : artifacts

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 h-[64px] border-b border-[var(--border-primary)] shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">Published Dashboards</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {artifacts.length} dashboard{artifacts.length !== 1 ? 's' : ''}
            {artifacts.length > 0 && ' · all refreshed automatically'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dashboards..."
              className="pl-9 h-9 text-sm w-56"
            />
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm animate-thinking">Loading dashboards...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <Inbox size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {search ? 'No matching dashboards' : 'No published dashboards yet'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((art, i) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-5 py-4 cursor-pointer
                  hover:shadow-[var(--shadow-card)] hover:-translate-y-[1px] transition-all group"
                onClick={() => navigate(`/dashboards/${art.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={18} className="text-[var(--accent)]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
                        {art.name}
                      </span>
                      {art.shared && <Badge variant="accent">Shared</Badge>}
                      {art.paused && <Badge variant="warning">Paused</Badge>}
                      {art.source === 'workflow' && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] bg-[var(--accent)]/8 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-[var(--accent)]/15 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/workflows/${art.workflow_id}`) }}
                          title="View workflow"
                        >
                          <Workflow size={9} /> Workflow
                        </span>
                      )}
                      <Badge variant="muted">{art.artifact_type || 'html'}</Badge>
                    </div>
                    <div className="text-[12px] text-[var(--text-muted)] truncate">
                      {art.target_file}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
                      {art.latest_run && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Refreshed {timeAgo(art.latest_run.refreshed_at)}
                        </span>
                      )}
                      {art.schedule && (
                        <span>{art.schedule.cron_description}</span>
                      )}
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  {isOwner(art) && (
                    <button
                      data-menu-trigger
                      onClick={(e) => {
                        e.stopPropagation()
                        if (menuOpen === art.id) {
                          setMenuOpen(null)
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const menuHeight = 220
                          const spaceBelow = window.innerHeight - rect.bottom
                          const top = spaceBelow < menuHeight ? rect.top - menuHeight + 8 : rect.bottom + 4
                          setMenuCoords({ top, left: rect.right - 192 })
                          setMenuOpen(art.id)
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
            ))}
          </div>
        )}
      </div>

      {/* 3-dot dropdown menu — portaled outside cards to avoid click propagation */}
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1"
          style={{ top: menuCoords.top, left: menuCoords.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const art = artifacts.find((a) => a.id === menuOpen)
            if (!art) return null
            return (
              <>
                {art.source === 'workflow' && art.workflow_id && (
                  <button onClick={() => { setMenuOpen(null); navigate(`/workflows/${art.workflow_id}`) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                    <Workflow size={14} />
                    View workflow
                  </button>
                )}
                {art.source_session_id && (
                  <button onClick={() => { setMenuOpen(null); navigate(`/session/${art.source_session_id}`) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                    <ExternalLink size={14} />
                    Edit dashboard
                  </button>
                )}
                <button onClick={() => { setMenuOpen(null); setRenaming(art); setRenameValue(art.name) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                  <Pencil size={14} />
                  Rename
                </button>
                <button onClick={() => handleToggleShare(art)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                  {art.shared ? <EyeOff size={14} /> : <Eye size={14} />}
                  {art.shared ? 'Unshare' : 'Share with team'}
                </button>
                <button onClick={() => handleTogglePause(art)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors bg-transparent border-none cursor-pointer">
                  {art.paused ? <Play size={14} /> : <Pause size={14} />}
                  {art.paused ? 'Resume schedule' : 'Pause schedule'}
                </button>
                <div className="border-t border-[var(--border-primary)] my-1" />
                <button onClick={() => { setMenuOpen(null); setDeleteConfirm(art) }}
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
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Delete Dashboard</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              This will also delete the connected schedule.
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

      {/* Rename modal */}
      {renaming && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Rename Dashboard</h3>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
              placeholder="Dashboard name"
              className="w-full text-sm mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRenaming(null)}>Cancel</Button>
              <Button size="sm" onClick={handleRename} disabled={!renameValue.trim() || renameValue.trim() === renaming.name}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



