import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Hash, Search, X, User, Users, ChevronDown, Loader2, AlertCircle,
} from 'lucide-react'
import { apiGet } from '../../api'

/**
 * Reusable Slack channel + DM user picker.
 * Extracted from SlackBlockConfigForm in WorkflowCreateModal.jsx — same API
 * endpoints (/api/slack/channels, /api/slack/users), same dropdown patterns.
 *
 * Props:
 *   selectedChannels: Array<{ id, name, is_private? }>
 *   onChannelsChange: (channels) => void
 *   selectedDmUsers: Array<{ id, name, real_name, display_name?, avatar_url? }>
 *   onDmUsersChange: (users) => void
 *   disabled: boolean
 */
export default function SlackChannelPicker({
  selectedChannels = [],
  onChannelsChange,
  selectedDmUsers = [],
  onDmUsersChange,
  disabled = false,
}) {
  // ── Channel state ──
  const [channels, setChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [slackConnected, setSlackConnected] = useState(true)
  const [channelSearch, setChannelSearch] = useState('')
  const [showChannelDropdown, setShowChannelDropdown] = useState(false)
  const [channelNextCursor, setChannelNextCursor] = useState('')
  const [channelsLoadingMore, setChannelsLoadingMore] = useState(false)
  const channelDropdownRef = useRef(null)

  // ── DM user state ──
  const [slackUsers, setSlackUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersLoadingMore, setUsersLoadingMore] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userNextCursor, setUserNextCursor] = useState('')
  const [hasDmScope, setHasDmScope] = useState(true)
  const userDropdownRef = useRef(null)

  // ── Channel API ──
  const fetchChannels = useCallback(async (search = '', cursor = '') => {
    if (cursor) { setChannelsLoadingMore(true) } else { setChannelsLoading(true) }
    try {
      const params = new URLSearchParams({ search, cursor, limit: '10' })
      const data = await apiGet(`/api/slack/channels?${params}`)
      setSlackConnected(data?.connected !== false)
      if (cursor) {
        setChannels((prev) => [...prev, ...(data?.channels || [])])
      } else {
        setChannels(data?.channels || [])
      }
      setChannelNextCursor(data?.next_cursor || '')
    } catch {
      if (!cursor) { setSlackConnected(false); setChannels([]) }
      setChannelNextCursor('')
    } finally {
      setChannelsLoading(false)
      setChannelsLoadingMore(false)
    }
  }, [])

  const channelSearchInitRef = useRef(true)
  useEffect(() => { fetchChannels() }, [fetchChannels])

  const channelSearchTimerRef = useRef(null)
  useEffect(() => {
    if (channelSearchInitRef.current) { channelSearchInitRef.current = false; return }
    if (channelSearchTimerRef.current) clearTimeout(channelSearchTimerRef.current)
    channelSearchTimerRef.current = setTimeout(() => fetchChannels(channelSearch), 300)
    return () => { if (channelSearchTimerRef.current) clearTimeout(channelSearchTimerRef.current) }
  }, [channelSearch, fetchChannels])

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inBtn = channelBtnRef.current?.contains(e.target)
      const inDrop = channelDropdownRef.current?.contains(e.target)
      if (!inBtn && !inDrop) setShowChannelDropdown(false)
    }
    if (showChannelDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showChannelDropdown])

  // ── DM User API ──
  const fetchUsers = useCallback(async (search = '', cursor = '') => {
    if (cursor) { setUsersLoadingMore(true) } else { setUsersLoading(true) }
    try {
      const params = new URLSearchParams({ search, cursor, limit: '10' })
      const data = await apiGet(`/api/slack/users?${params}`)
      setHasDmScope(data?.has_dm_scope !== false)
      if (cursor) {
        setSlackUsers((prev) => [...prev, ...(data?.users || [])])
      } else {
        setSlackUsers(data?.users || [])
      }
      setUserNextCursor(data?.next_cursor || '')
    } catch {
      if (!cursor) setSlackUsers([])
      setUserNextCursor('')
    } finally {
      setUsersLoading(false)
      setUsersLoadingMore(false)
    }
  }, [])

  const userSearchInitRef = useRef(true)
  useEffect(() => { if (slackConnected) fetchUsers() }, [slackConnected, fetchUsers])

  const userSearchTimerRef = useRef(null)
  useEffect(() => {
    if (userSearchInitRef.current) { userSearchInitRef.current = false; return }
    if (!slackConnected) return
    if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current)
    userSearchTimerRef.current = setTimeout(() => fetchUsers(userSearch), 300)
    return () => { if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current) }
  }, [userSearch, slackConnected, fetchUsers])

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inBtn = userBtnRef.current?.contains(e.target)
      const inDrop = userDropdownRef.current?.contains(e.target)
      if (!inBtn && !inDrop) setShowUserDropdown(false)
    }
    if (showUserDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserDropdown])

  const isDisabled = disabled || !slackConnected

  // Ref-based positioning for portaled dropdowns (escapes overflow:hidden parents)
  const channelBtnRef = useRef(null)
  const userBtnRef = useRef(null)

  const getDropdownStyle = (btnRef) => {
    if (!btnRef.current) return {}
    const rect = btnRef.current.getBoundingClientRect()
    return {
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    }
  }

  return (
    <div className="space-y-3">
      {/* Slack not connected warning */}
      {!slackConnected && !channelsLoading && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800 leading-relaxed">
            Slack is not connected. <a href="/settings/integrations" className="text-[var(--accent)] font-semibold underline">Connect your workspace</a> first.
          </div>
        </div>
      )}

      {/* ── Channels ── */}
      <div>
        <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
          <Hash size={11} />
          Channels
        </label>

        <div className="relative mt-1.5" ref={channelDropdownRef}>
          <button
            ref={channelBtnRef}
            type="button"
            onClick={() => !isDisabled && setShowChannelDropdown(!showChannelDropdown)}
            disabled={isDisabled || channelsLoading}
            className={`w-full flex items-center justify-between gap-2 min-h-[39px] px-2.5 py-1 text-left bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[12px] transition-colors ${
              !isDisabled ? 'cursor-pointer hover:border-[var(--accent)]/50' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 py-0.5">
              <Hash size={13} className="text-[var(--text-muted)] shrink-0" />
              {channelsLoading ? (
                <span className="text-[var(--text-muted)]">Loading channels...</span>
              ) : selectedChannels.length > 0 ? (
                selectedChannels.map((ch) => (
                  <span key={ch.id} className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 text-[11px] font-medium rounded bg-[var(--pv-primary-50)] text-[var(--accent)] border border-[var(--pv-primary-200)]">
                    <Hash size={9} />{ch.name}
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); if (!isDisabled) onChannelsChange(selectedChannels.filter(c => c.id !== ch.id)) }} className="ml-0.5 cursor-pointer text-[var(--text-muted)] hover:text-red-500 transition-colors inline-flex"><X size={10} /></span>
                  </span>
                ))
              ) : (
                <span className="text-[var(--text-muted)]">Select channels</span>
              )}
            </div>
            {channelsLoading ? (
              <Loader2 size={13} className="text-[var(--text-muted)] animate-spin shrink-0" />
            ) : (
              <ChevronDown size={13} className={`text-[var(--text-muted)] transition-transform shrink-0 ${showChannelDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {showChannelDropdown && createPortal(
            <div ref={channelDropdownRef} style={getDropdownStyle(channelBtnRef)} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <Search size={12} className="text-[var(--text-muted)] shrink-0" />
                  <input
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="Search channels..."
                    className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {channelsLoading ? (
                  <div className="px-3 py-3 flex items-center justify-center gap-2">
                    <Loader2 size={14} className="text-[var(--text-muted)] animate-spin" />
                    <span className="text-[11px] text-[var(--text-muted)]">Loading channels...</span>
                  </div>
                ) : channels.filter(ch => !selectedChannels.some(sc => sc.id === ch.id)).length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-[var(--text-muted)] text-center">
                    {channels.length === 0 ? 'No channels found' : 'All channels selected'}
                  </div>
                ) : (
                  <>
                    {channels.filter(ch => !selectedChannels.some(sc => sc.id === ch.id)).map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          onChannelsChange([...selectedChannels, { id: ch.id, name: ch.name, is_private: ch.is_private }])
                          setChannelSearch('')
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer transition-colors"
                      >
                        <Hash size={13} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-[12px] text-[var(--text-primary)] flex-1">{ch.name}</span>
                        {ch.is_private && (
                          <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">Private</span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)]">{ch.num_members} members</span>
                      </button>
                    ))}
                    {channelNextCursor && (
                      <button
                        type="button"
                        disabled={channelsLoadingMore}
                        onClick={(e) => { e.stopPropagation(); fetchChannels(channelSearch, channelNextCursor) }}
                        className="w-full py-2 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--bg-hover)] bg-transparent border-none border-t border-[var(--border-primary)] cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {channelsLoadingMore ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" /> Loading...
                          </span>
                        ) : 'Load more channels'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>,
            document.body,
          )}
        </div>
      </div>

      {/* ── DM Recipients ── */}
      <div>
        <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
          <Users size={11} />
          Direct Messages
        </label>

        {!hasDmScope && slackConnected && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mt-1">
            <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 leading-relaxed">
              DM support requires reconnecting Slack. <a href="/settings/integrations" className="text-[var(--accent)] font-semibold underline">Reconnect</a> to enable.
            </div>
          </div>
        )}

        <div className="relative mt-1.5" ref={userDropdownRef}>
          <button
            ref={userBtnRef}
            type="button"
            onClick={() => hasDmScope && !isDisabled && setShowUserDropdown(!showUserDropdown)}
            disabled={isDisabled || !hasDmScope}
            className={`w-full flex items-center justify-between gap-2 min-h-[39px] px-2.5 py-1 text-left bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[12px] transition-colors ${
              !isDisabled && hasDmScope ? 'cursor-pointer hover:border-[var(--accent)]/50' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 py-0.5">
              <User size={13} className="text-[var(--text-muted)] shrink-0" />
              {usersLoading ? (
                <span className="text-[var(--text-muted)]">Loading users...</span>
              ) : selectedDmUsers.length > 0 ? (
                selectedDmUsers.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1 pl-1 pr-1 py-0.5 text-[11px] font-medium rounded bg-[var(--pv-primary-50)] text-[var(--accent)] border border-[var(--pv-primary-200)]">
                    {u.avatar_url && <img src={u.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />}
                    {u.real_name || u.display_name || u.name}
                    <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); if (!isDisabled) onDmUsersChange(selectedDmUsers.filter(su => su.id !== u.id)) }} className="ml-0.5 cursor-pointer text-[var(--text-muted)] hover:text-red-500 transition-colors inline-flex"><X size={10} /></span>
                  </span>
                ))
              ) : (
                <span className="text-[var(--text-muted)]">Add DM recipient...</span>
              )}
            </div>
            {usersLoading ? (
              <Loader2 size={13} className="text-[var(--text-muted)] animate-spin shrink-0" />
            ) : (
              <ChevronDown size={13} className={`text-[var(--text-muted)] transition-transform shrink-0 ${showUserDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {showUserDropdown && createPortal(
            <div ref={userDropdownRef} style={getDropdownStyle(userBtnRef)} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <Search size={12} className="text-[var(--text-muted)] shrink-0" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 bg-transparent border-none outline-none text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {usersLoading ? (
                  <div className="px-3 py-3 flex items-center justify-center gap-2">
                    <Loader2 size={14} className="text-[var(--text-muted)] animate-spin" />
                    <span className="text-[11px] text-[var(--text-muted)]">Loading users...</span>
                  </div>
                ) : (() => {
                  const filtered = slackUsers.filter(u => !selectedDmUsers.some(su => su.id === u.id))
                  if (filtered.length === 0) {
                    return (
                      <div className="px-3 py-3 text-[11px] text-[var(--text-muted)] text-center">
                        {userSearch ? 'No users found' : 'All users already added'}
                      </div>
                    )
                  }
                  return (
                    <>
                      {filtered.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onDmUsersChange([...selectedDmUsers, {
                              id: u.id, name: u.name, real_name: u.real_name,
                              display_name: u.display_name, avatar_url: u.avatar_url,
                            }])
                            setUserSearch('')
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer transition-colors"
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                              <User size={12} className="text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-[var(--text-primary)] truncate">{u.real_name || u.name}</div>
                            {u.display_name && (
                              <div className="text-[10px] text-[var(--text-muted)] truncate">@{u.display_name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                      {userNextCursor && (
                        <button
                          type="button"
                          disabled={usersLoadingMore}
                          onClick={(e) => { e.stopPropagation(); fetchUsers(userSearch, userNextCursor) }}
                          className="w-full py-2 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--bg-hover)] bg-transparent border-none border-t border-[var(--border-primary)] cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {usersLoadingMore ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" /> Loading...
                            </span>
                          ) : 'Load more users'}
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>,
            document.body,
          )}
        </div>
      </div>
    </div>
  )
}
