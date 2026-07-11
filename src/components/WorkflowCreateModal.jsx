import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Workflow, Plus, Trash2, Brain, Mail, LayoutDashboard, RotateCcw,
  ChevronDown, ChevronRight, Loader2, Maximize2, Minimize2, Pencil,
  MessageSquare, Hash, Search, Eye, ChevronUp, Sparkles, AlertCircle,
  Zap, FileText, BrainCircuit, Users, X, User,
} from 'lucide-react'
import Pusher from 'pusher-js'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../config'
import { Dialog, DialogHeader } from '@/ui/components/OverlayDialog/OverlayDialog'
import { Button } from '@/ui'
import { Badge } from '@/ui'
import { Input, Textarea, Label } from '@/ui/components/FormControls/FormControls'
import { apiPost, apiGet, apiDelete, getApiBase, getAuthToken } from '../api'
import RecipeVerifyStep from './RecipeVerifyStep'
import SlackMessagePreview from './SlackMessagePreview'

const AI_BLOCK_OPTIONS = [
  { type: 'ai_summarize', label: 'AI Summary', desc: 'Summarize the data using AI' },
  { type: 'ai_analyze', label: 'AI Analysis', desc: 'Analyze data and generate insights' },
]

const ACTION_BLOCK_OPTIONS = [
  { type: 'publish_dashboard', label: 'Publish Dashboard', desc: 'Publish HTML output as a viewable dashboard' },
  { type: 'send_email', label: 'Send Email', desc: 'Send results via email' },
  { type: 'send_slack', label: 'Send Slack Alert', desc: 'Send a Block Kit message to a Slack channel' },
]

// Block types that are "extra" (AI + Action), not data blocks
const EXTRA_BLOCK_TYPES = new Set(['ai_summarize', 'ai_analyze', 'ai_condition', 'ai_generate', 'send_email', 'send_slack', 'webhook', 'http_request', 'publish_dashboard'])

/**
 * SlackBlockConfigForm — Configuration form for the Send Slack Alert block.
 * Redesigned around the AI-generated config flow:
 *   1. Channel selection (searchable dropdown, fetched from Slack API)
 *   2. Agent instructions (natural language prompt)
 *   3. "Generate Message" button (calls POST /api/slack/generate-config)
 *   4. Auto-shown preview (from generated config_content)
 *   5. "Edit Config (Advanced)" — collapsed by default
 */
function SlackBlockConfigForm({ block, updateConfig, workflowName, workflowId, sessionId, allBlocks = [] }) {
  // Derive initial mode from config
  // Note: 'template' mode is no longer a separate UI tab — it maps to 'ai' in the toggle,
  // and the classification state tracks whether it's template vs ai_analysis internally.
  const deriveMode = () => {
    const saved = block.config.mode
    if (saved === 'content_from') return 'content_from'
    if (saved === 'template' || saved === 'ai') return 'ai'
    if (block.config.content_from && !block.config.config_content) return 'content_from'
    return 'ai'
  }

  const [mode, setMode] = useState(deriveMode)
  const [channelSearch, setChannelSearch] = useState('')
  const [showChannelDropdown, setShowChannelDropdown] = useState(false)
  const [channelNextCursor, setChannelNextCursor] = useState('')
  const [channelsLoadingMore, setChannelsLoadingMore] = useState(false)
  const [showConfigEditor, setShowConfigEditor] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(!!block.config.config_content)
  const [configEdited, setConfigEdited] = useState(false)
  const [livePreviewMode, setLivePreviewMode] = useState(false)
  const [livePreviewLoading, setLivePreviewLoading] = useState(false)
  const channelDropdownRef = useRef(null)

  // Fetch real channels from Slack API
  const [channels, setChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [slackConnected, setSlackConnected] = useState(true)

  const fetchChannels = useCallback(async (search = '', cursor = '') => {
    if (cursor) {
      setChannelsLoadingMore(true)
    } else {
      setChannelsLoading(true)
    }
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
      if (!cursor) {
        setSlackConnected(false)
        setChannels([])
      }
      setChannelNextCursor('')
    } finally {
      setChannelsLoading(false)
      setChannelsLoadingMore(false)
    }
  }, [])

  const channelSearchInitRef = useRef(true)
  useEffect(() => { fetchChannels() }, [fetchChannels])

  // Debounced server-side channel search
  const channelSearchTimerRef = useRef(null)
  useEffect(() => {
    // Skip the initial mount — fetchChannels() above handles it
    if (channelSearchInitRef.current) { channelSearchInitRef.current = false; return }
    if (channelSearchTimerRef.current) clearTimeout(channelSearchTimerRef.current)
    channelSearchTimerRef.current = setTimeout(() => {
      fetchChannels(channelSearch)
    }, 300)
    return () => { if (channelSearchTimerRef.current) clearTimeout(channelSearchTimerRef.current) }
  }, [channelSearch, fetchChannels])

  // Multi-channel: prefer channels[] array, fall back to legacy channel_id
  const selectedChannels = (() => {
    if (block.config.channels?.length) return block.config.channels
    if (block.config.channel_id) return [{ id: block.config.channel_id, name: (block.config.channel || '').replace(/^#/, '') }]
    return []
  })()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target)) {
        setShowChannelDropdown(false)
      }
    }
    if (showChannelDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showChannelDropdown])

  // DM user picker state
  const [slackUsers, setSlackUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersLoadingMore, setUsersLoadingMore] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userNextCursor, setUserNextCursor] = useState('')
  const [hasDmScope, setHasDmScope] = useState(true)
  const userDropdownRef = useRef(null)
  const selectedDmUsers = block.config.dm_users || []

  const fetchUsers = useCallback(async (search = '', cursor = '') => {
    if (cursor) {
      setUsersLoadingMore(true)
    } else {
      setUsersLoading(true)
    }
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
  useEffect(() => {
    if (slackConnected) fetchUsers()
  }, [slackConnected, fetchUsers])

  // Debounced server-side user search
  const userSearchTimerRef = useRef(null)
  useEffect(() => {
    // Skip the initial mount — fetchUsers() above handles it
    if (userSearchInitRef.current) { userSearchInitRef.current = false; return }
    if (!slackConnected) return
    if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current)
    userSearchTimerRef.current = setTimeout(() => {
      fetchUsers(userSearch)
    }, 300)
    return () => { if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current) }
  }, [userSearch, slackConnected, fetchUsers])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false)
      }
    }
    if (showUserDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserDropdown])

  // AI config generation + classification via POST /api/slack/generate-config
  const [classification, setClassification] = useState(
    block.config.mode === 'template' && block.config.config_content ? 'template'
    : block.config.mode === 'ai' && block.config.instruction ? 'ai_analysis'
    : ''
  )
  const handleGenerateMessage = async () => {
    if (configEdited && generated) {
      if (!window.confirm('You have manually edited the config. Regenerating will overwrite your changes. Continue?')) return
    }

    const instruction = block.config.instruction || ''
    if (!instruction.trim()) {
      toast.error('Please enter an instruction first')
      return
    }

    const channelName = selectedChannels.length > 0 ? `#${selectedChannels[0].name}` : (block.config.channel || '')
    const channelId = selectedChannels.length > 0 ? selectedChannels[0].id : (block.config.channel_id || '')

    setGenerating(true)
    try {
      const result = await apiPost('/api/slack/generate-config', {
        instruction,
        channel: channelName,
        channel_id: channelId,
        workflow_id: workflowId || '',
        block_index: 0,
        session_id: sessionId || '',
      })

      setClassification(result.classification || 'template')

      if (result.classification === 'template' && result.config_content) {
        // Template: store config, set mode to template internally
        updateConfig(block.id, 'config_content', result.config_content)
        updateConfig(block.id, 'mode', 'template')
        setGenerated(true)
        setConfigEdited(false)
      } else {
        // AI analysis: clear any old config, set mode to ai
        updateConfig(block.id, 'config_content', '')
        updateConfig(block.id, 'mode', 'ai')
        setGenerated(false)
      }
    } catch (e) {
      toast.error('Failed to generate config: ' + (e.response?.data?.detail || e.message))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Slack not connected warning */}
      {!slackConnected && !channelsLoading && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[12px] text-amber-800 leading-relaxed">
            Slack is not connected. <a href="/settings/integrations" className="text-[var(--accent)] font-semibold underline">Connect your workspace</a> first to fetch channels and send alerts.
          </div>
        </div>
      )}

      {/* Part 1: Channel Selection (Multi-select) */}
      <div>
        <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
          <Hash size={11} />
          Channels
          <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>

        {/* Selected channel tags */}
        {selectedChannels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selectedChannels.map((ch) => (
              <span
                key={ch.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-lg bg-[var(--color-primary-50)] text-[var(--accent)] border border-[var(--color-primary-200)]"
              >
                <Hash size={10} />
                {ch.name}
                <button
                  type="button"
                  onClick={() => {
                    const updated = selectedChannels.filter(c => c.id !== ch.id)
                    updateConfig(block.id, 'channels', updated)
                    updateConfig(block.id, 'channel', updated.length > 0 ? `#${updated[0].name}` : '')
                    updateConfig(block.id, 'channel_id', updated.length > 0 ? updated[0].id : '')
                  }}
                  className="ml-0.5 p-0 bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative mt-1" ref={channelDropdownRef}>
          <button
            type="button"
            onClick={() => slackConnected && setShowChannelDropdown(!showChannelDropdown)}
            disabled={!slackConnected || channelsLoading}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[12px] transition-colors ${
              slackConnected ? 'cursor-pointer hover:border-[var(--color-primary-300)]' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Hash size={13} className="text-[var(--text-muted)]" />
              <span className={`font-medium ${selectedChannels.length > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {channelsLoading ? 'Loading channels...' : selectedChannels.length > 0
                  ? `${selectedChannels.length} channel${selectedChannels.length > 1 ? 's' : ''} selected`
                  : 'Select channels'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {selectedChannels.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateConfig(block.id, 'channels', [])
                    updateConfig(block.id, 'channel', '')
                    updateConfig(block.id, 'channel_id', '')
                  }}
                  className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={12} />
                </span>
              )}
              {channelsLoading ? (
                <Loader2 size={13} className="text-[var(--text-muted)] animate-spin" />
              ) : (
                <ChevronDown size={13} className={`text-[var(--text-muted)] transition-transform ${showChannelDropdown ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>

          {showChannelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
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
                    <span className="text-[12px] text-[var(--text-muted)]">Loading channels...</span>
                  </div>
                ) : channels.filter(ch => !selectedChannels.some(sc => sc.id === ch.id)).length === 0 ? (
                  <div className="px-3 py-3 text-[12px] text-[var(--text-muted)] text-center">
                    {channels.length === 0 ? 'No channels found' : 'All channels selected'}
                  </div>
                ) : (
                  <>
                    {channels.filter(ch => !selectedChannels.some(sc => sc.id === ch.id)).map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          const updated = [...selectedChannels, { id: ch.id, name: ch.name, is_private: ch.is_private }]
                          updateConfig(block.id, 'channels', updated)
                          updateConfig(block.id, 'channel', `#${updated[0].name}`)
                          updateConfig(block.id, 'channel_id', updated[0].id)
                          setChannelSearch('')
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer transition-colors"
                      >
                        <Hash size={13} className="text-[var(--text-muted)] shrink-0" />
                        <span className="text-[12px] text-[var(--text-primary)] flex-1">{ch.name}</span>
                        {ch.is_private && (
                          <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
                            Private
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {ch.num_members} members
                        </span>
                      </button>
                    ))}
                    {channelNextCursor && (
                      <button
                        type="button"
                        disabled={channelsLoadingMore}
                        onClick={(e) => { e.stopPropagation(); fetchChannels(channelSearch, channelNextCursor) }}
                        className="w-full py-2 text-[12px] font-medium text-[var(--accent)] hover:bg-[var(--bg-hover)] bg-transparent border-none border-t border-[var(--border-primary)] cursor-pointer transition-colors disabled:opacity-50"
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
            </div>
          )}
        </div>
      </div>

      {/* Part 1b: DM Recipients (Multi-select) */}
      <div>
        <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
          <Users size={11} />
          Direct Message Recipients
          <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </label>

        {!hasDmScope && slackConnected && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mt-1">
            <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[10px] text-amber-800 leading-relaxed">
              DM support requires reconnecting Slack. <a href="/settings/integrations" className="text-[var(--accent)] font-semibold underline">Reconnect</a> to enable.
            </div>
          </div>
        )}

        {selectedDmUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selectedDmUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded-lg bg-[var(--color-primary-50)] text-[var(--accent)] border border-[var(--color-primary-200)]"
              >
                {u.avatar_url && (
                  <img src={u.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                )}
                {u.real_name || u.display_name || u.name}
                <button
                  type="button"
                  onClick={() => {
                    const updated = selectedDmUsers.filter(su => su.id !== u.id)
                    updateConfig(block.id, 'dm_users', updated)
                  }}
                  className="ml-0.5 p-0 bg-transparent border-none cursor-pointer text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative mt-1" ref={userDropdownRef}>
          <button
            type="button"
            onClick={() => hasDmScope && slackConnected && setShowUserDropdown(!showUserDropdown)}
            disabled={!slackConnected || !hasDmScope}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[12px] transition-colors ${
              slackConnected && hasDmScope ? 'cursor-pointer hover:border-[var(--color-primary-300)]' : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2">
              <User size={13} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-muted)]">
                {usersLoading ? 'Loading users...' : 'Add DM recipient...'}
              </span>
            </div>
            {usersLoading ? (
              <Loader2 size={13} className="text-[var(--text-muted)] animate-spin" />
            ) : (
              <ChevronDown size={13} className={`text-[var(--text-muted)] transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {showUserDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
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
                {(() => {
                  const filtered = slackUsers.filter((u) => !selectedDmUsers.some(su => su.id === u.id))

                  if (usersLoading) {
                    return (
                      <div className="px-3 py-3 flex items-center justify-center gap-2">
                        <Loader2 size={14} className="text-[var(--text-muted)] animate-spin" />
                        <span className="text-[12px] text-[var(--text-muted)]">Loading users...</span>
                      </div>
                    )
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="px-3 py-3 text-[12px] text-[var(--text-muted)] text-center">
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
                            const updated = [...selectedDmUsers, {
                              id: u.id,
                              name: u.name,
                              real_name: u.real_name,
                              display_name: u.display_name,
                              avatar_url: u.avatar_url,
                            }]
                            updateConfig(block.id, 'dm_users', updated)
                            setUserSearch('')
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer transition-colors"
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full shrink-0" />
                          ) : (
                            <User size={16} className="text-[var(--text-muted)] shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] text-[var(--text-primary)] font-medium truncate">
                              {u.real_name || u.name}
                            </div>
                            {u.display_name && u.display_name !== u.real_name && (
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                @{u.display_name}
                              </div>
                            )}
                          </div>
                          {u.email && (
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[140px]">
                              {u.email}
                            </span>
                          )}
                        </button>
                      ))}
                      {userNextCursor && (
                        <button
                          type="button"
                          disabled={usersLoadingMore}
                          onClick={(e) => { e.stopPropagation(); fetchUsers(userSearch, userNextCursor) }}
                          className="w-full py-2 text-[12px] font-medium text-[var(--accent)] hover:bg-[var(--bg-hover)] bg-transparent border-none border-t border-[var(--border-primary)] cursor-pointer transition-colors disabled:opacity-50"
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
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle — AI Analysis / From AI Block */}
      {(() => {
        const currentIndex = allBlocks.findIndex(b => b.id === block.id)
        const aiBlocks = allBlocks.filter((b, idx) =>
          idx < currentIndex && ['ai_summarize', 'ai_analyze', 'ai_generate'].includes(b.type)
        )

        const handleModeChange = (newMode) => {
          setMode(newMode)
          updateConfig(block.id, 'mode', newMode)
          // Clear fields not relevant to the new mode
          if (newMode === 'ai') {
            updateConfig(block.id, 'content_from', '')
            setClassification('')
            setGenerated(false)
          } else if (newMode === 'content_from') {
            updateConfig(block.id, 'config_content', '')
            updateConfig(block.id, 'instruction', '')
            setClassification('')
            setGenerated(false)
          }
        }

        const modeOptions = [
          { value: 'ai', label: 'AI Analysis', icon: BrainCircuit, desc: 'Describe your alert. AI auto-detects whether to use a static template or dynamic analysis' },
          ...(aiBlocks.length > 0
            ? [{ value: 'content_from', label: 'From AI Block', icon: Brain, desc: 'Send another block\'s output directly' }]
            : []),
        ]

        return (
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5 mb-1.5">
              <Zap size={11} />
              Message Mode
            </label>
            <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
              {modeOptions.map(opt => {
                const Icon = opt.icon
                const isActive = mode === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleModeChange(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer border-none ${
                      isActive
                        ? 'bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm'
                        : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              {modeOptions.find(o => o.value === mode)?.desc}
            </p>

            {/* AI block selector for content_from mode */}
            {mode === 'content_from' && aiBlocks.length > 0 && (
              <select
                value={block.config.content_from || ''}
                onChange={(e) => updateConfig(block.id, 'content_from', e.target.value)}
                className="mt-2 w-full text-[12px] rounded-xl px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] cursor-pointer transition-colors hover:border-[var(--color-primary-300)] outline-none"
              >
                <option value="">Select AI block...</option>
                {aiBlocks.map(ab => (
                  <option key={ab.id} value={ab.id}>
                    {ab.label || ab.type}: send output directly
                  </option>
                ))}
              </select>
            )}
          </div>
        )
      })()}

      {/* Part 2: Instruction — shown for ai mode */}
      {mode !== 'content_from' && (
        <div>
          <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Brain size={11} />
            Instruction
          </label>
          <p className="text-[10px] text-[var(--text-muted)] mb-1">
            Describe what data to include and how to compose the Slack message. AI will auto-detect whether to use a static template or dynamic analysis.
          </p>
          <Textarea
            value={block.config.instruction || ''}
            onChange={(e) => updateConfig(block.id, 'instruction', e.target.value)}
            placeholder="e.g. 'Send weekly revenue summary with total sales and top products' or 'Analyze trends and highlight anomalies'"
            className="mt-1 text-[12px]"
            rows={4}
          />
        </div>
      )}

      {/* Part 3: Generate Message Button — for ai mode */}
      {mode !== 'content_from' && (
        <div>
          <button
            type="button"
            onClick={handleGenerateMessage}
            disabled={generating}
            className={`flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer border-none ${
              generating
                ? 'bg-[var(--accent)]/20 text-[var(--accent)] cursor-wait'
                : 'bg-[var(--accent)] text-white hover:bg-[var(--color-primary-600)] shadow-sm'
            }`}
          >
            {generating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Classifying & generating...
              </>
            ) : (
              <>
                <Sparkles size={13} />
                {classification ? 'Regenerate Message' : 'Generate Message'}
              </>
            )}
          </button>
          {!classification && !generating && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              AI will classify your instruction and generate a config or mark it for dynamic analysis.
            </p>
          )}
          {/* Classification result indicator */}
          {classification && !generating && (
            <div className={`flex items-start gap-2 p-2 rounded-lg mt-2 ${
              classification === 'template'
                ? 'bg-green-50 border border-green-100'
                : 'bg-blue-50 border border-blue-100'
            }`}>
              {classification === 'template' ? (
                <>
                  <FileText size={12} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-green-700 leading-relaxed">
                    <span className="font-semibold">Static template</span>: config saved. Variables like <code className="text-green-800">{'{{ metrics.* }}'}</code> will be resolved at runtime.
                  </p>
                </>
              ) : (
                <>
                  <BrainCircuit size={12} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    <span className="font-semibold">Dynamic analysis</span>: AI will analyze data and generate the Slack message at runtime. Preview available during verification.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Part 4: Preview (auto-shown after generation) — shown when classified as template */}
      {classification === 'template' && generated && block.config.config_content && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Eye size={11} />
              Message Preview
            </label>
          </div>
          <SlackMessagePreview
            config={{
              config_content: block.config.config_content,
              channel: block.config.channel || '#general',
              workflow_name: workflowName || 'Workflow',
            }}
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
            Template variables like <code className="text-[var(--accent)]">{'{{ metrics.* }}'}</code> will be resolved at runtime from previous block outputs.
          </p>
        </div>
      )}

      {/* Part 5: Edit Config (Advanced) — collapsed by default, shown when classified as template */}
      {classification === 'template' && generated && (
        <div>
          <button
            type="button"
            onClick={() => setShowConfigEditor(!showConfigEditor)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] bg-transparent border-none cursor-pointer hover:text-[var(--text-primary)] transition-colors p-0"
          >
            {showConfigEditor ? <ChevronUp size={11} /> : <ChevronRight size={11} />}
            Edit Config (Advanced)
            {configEdited && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium ml-1">
                Modified
              </span>
            )}
          </button>
          {showConfigEditor && (
            <div className="mt-1.5">
              <textarea
                value={block.config.config_content || ''}
                onChange={(e) => {
                  updateConfig(block.id, 'config_content', e.target.value)
                  setConfigEdited(true)
                }}
                className="w-full text-[12px] font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-lg p-3 resize-y min-h-[200px] outline-none focus:border-[var(--color-primary-500)] transition-colors"
                rows={14}
                spellCheck={false}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                YAML front matter + markdown body. Template variables (e.g. <code className="text-[var(--accent)]">{'{{ metrics.revenue }}'}</code>) are resolved at runtime.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info footer */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/15">
        <MessageSquare size={13} className="text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
          {mode === 'content_from'
            ? <>The selected AI block's output will be sent directly to Slack as the message body, with an auto-generated header and footer. Delivered via <code className="text-[var(--accent)] font-semibold">chat.postMessage</code>.</>
            : classification === 'template'
            ? <>The workflow engine will parse the config, resolve template variables from previous block outputs, build a Slack Block Kit payload, and deliver via <code className="text-[var(--accent)] font-semibold">chat.postMessage</code>.</>
            : <>At runtime, the AI agent will read data from previous workflow steps, generate insights, and compose the Slack message dynamically. Delivered via <code className="text-[var(--accent)] font-semibold">chat.postMessage</code>.</>
          }
        </div>
      </div>
    </div>
  )
}

export default function WorkflowCreateModal({ targetFile, targetTitle, sessionId, onClose, aiMode = false }) {
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState(targetTitle || 'Untitled Workflow')

  // Existing workflow detection
  const [existingCheck, setExistingCheck] = useState({ loading: true, exists: false })
  const [editWorkflowId, setEditWorkflowId] = useState(null)
  const [showExistingDropdown, setShowExistingDropdown] = useState(false)

  // Draft state
  const [draftCheck, setDraftCheck] = useState({ loading: true, hasDraft: false })

  // Extra blocks (AI + Action)
  const [extraBlocks, setExtraBlocks] = useState([])
  const [expandedBlock, setExpandedBlock] = useState(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const originalExtraBlocksRef = useRef(null) // snapshot for change detection

  // Recipe verification state
  const [loading, setLoading] = useState(true)
  const [recipe, setRecipe] = useState(null)
  const [verifySessionId, setVerifySessionId] = useState(null)
  const [stepResults, setStepResults] = useState({})
  const [removedSteps, setRemovedSteps] = useState(new Set())
  const [creating, setCreating] = useState(false)

  // AI mode state
  const [execSessionId, setExecSessionId] = useState(null)
  const [aiModel, setAiModel] = useState('claude-sonnet-4-6')
  const [execReady, setExecReady] = useState(false)
  const [savedHardeningStatus, setSavedHardeningStatus] = useState({})
  const [savedHardeningPending, setSavedHardeningPending] = useState(0)
  const execPusherRef = useRef(null)

  // Code-to-English
  const [codeToNl, setCodeToEnglish] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState(null)
  const summaryCleanupRef = useRef(null)

  // StepGraph feature flag
  const [stepGraphEnabled, setStepGraphEnabled] = useState(false)

  // Slack feature flag — hides Send Slack Alert block when disabled for tenant
  const [slackFeatureEnabled, setSlackFeatureEnabled] = useState(true)

  // Layout — start maximized
  const [maximized, setMaximized] = useState(true)

  const verifySessionIdRef = useRef(null)
  const initStarted = useRef(false)

  // Check for existing workflow on mount
  useEffect(() => {
    if (!sessionId || !targetFile) return
    apiGet(`/api/workflows/check?session_id=${encodeURIComponent(sessionId)}&target_file=${encodeURIComponent(targetFile)}`)
      .then((data) => {
        if (data.exists && data.workflows?.length > 0) {
          setExistingCheck({ loading: false, exists: true, workflows: data.workflows })
        } else {
          setExistingCheck({ loading: false, exists: false })
        }
      })
      .catch(() => setExistingCheck({ loading: false, exists: false }))
  }, [sessionId, targetFile])

  // Check if Slack feature is enabled for the tenant
  useEffect(() => {
    apiGet('/api/slack/connection')
      .then((data) => setSlackFeatureEnabled(data?.feature_enabled !== false))
      .catch(() => setSlackFeatureEnabled(false))
  }, [])

  // Choose to update an existing workflow
  const handleUpdateExisting = (wf) => {
    setEditWorkflowId(wf.workflow_id)
    setName(wf.name)
    // Pre-load existing extra blocks (AI + Action)
    const existingExtra = (wf.blocks || []).filter((b) => EXTRA_BLOCK_TYPES.has(b.type))
    if (existingExtra.length > 0) {
      // Use current dashboard name (from published_dashboards) instead of stale block config name
      const dashName = wf.dashboard_name
      if (dashName) {
        existingExtra.forEach((b) => {
          if (b.type === 'publish_dashboard' && b.config) {
            b.config = { ...b.config, name: dashName }
          }
        })
      }
      setExtraBlocks(existingExtra)
      // Snapshot original config for change detection
      originalExtraBlocksRef.current = JSON.stringify(existingExtra.map((b) => b.config))
    }
  }

  // Choose to create new
  const handleCreateNew = () => {
    setEditWorkflowId(null)
    setExtraBlocks([])
    setExpandedBlock(null)
    setName(targetTitle || 'Untitled Workflow')
    originalExtraBlocksRef.current = null
  }

  // Check for draft AND extract recipe in parallel on mount
  useEffect(() => {
    if (!sessionId || !targetFile || initStarted.current) return
    initStarted.current = true

    ;(async () => {
      // Run draft check and recipe extraction in parallel
      const [draftResult, recipeResult] = await Promise.all([
        aiMode
          ? apiGet(`/api/sessions/${sessionId}/recipe/exec/draft`).catch(() => ({ has_draft: false }))
          : apiGet(`/api/sessions/${sessionId}/recipe/verify/draft?target_file=${encodeURIComponent(targetFile)}`).catch(() => ({ has_draft: false })),
        apiPost(`/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent(targetFile)}${aiMode ? '&ai_mode=true' : ''}`, {})
          .catch((e) => { toast.error('Failed to extract recipe: ' + e.message); return null }),
      ])

      // If draft found, show resume screen
      if (draftResult.has_draft) {
        if (aiMode) {
          // AI mode draft — show resume/discard screen (same as non-AI mode)
          setDraftCheck({
            loading: false,
            hasDraft: true,
            execSessionId: draftResult.exec_session_id,
            stepsCompleted: draftResult.steps_completed,
            totalSteps: draftResult.total_steps,
            stepResults: draftResult.step_results,
            extractedRecipe: recipeResult?.recipe || null,
            extractedCodeToNl: recipeResult?.code_to_nl === true,
            summaryChannel: recipeResult?.summary_channel || null,
            hardeningStatus: draftResult.hardening_status || {},
            hardeningPending: draftResult.hardening_pending || 0,
          })
          setLoading(false)
          return
        }
        // Non-AI draft
        const fv = draftResult.form_values
        if (fv?.name) setName(fv.name)
        setDraftCheck({
          loading: false,
          hasDraft: true,
          verifySessionId: draftResult.verify_session_id,
          stepsCompleted: draftResult.steps_completed,
          totalSteps: draftResult.total_steps,
          recipe: draftResult.recipe,
          stepResults: draftResult.step_results,
          codeToNl: draftResult.code_to_nl === true,
        })
        setLoading(false)
        return
      }

      setDraftCheck({ loading: false, hasDraft: false })

      // No draft — use recipe extraction result
      if (!recipeResult) { setLoading(false); return }

      const extractedRecipe = recipeResult.recipe
      const isCodeToEnglish = recipeResult.code_to_nl === true
      setCodeToEnglish(isCodeToEnglish)
      setStepGraphEnabled(recipeResult.step_graph === true)
      setRecipe(extractedRecipe)

      // Show skeleton + subscribe only when summaries are being generated (not cached)
      if (isCodeToEnglish && recipeResult.summary_channel) {
        setSummaryStatus('Generating summaries...')
        subscribeSummaryChannel(recipeResult.summary_channel)
      }

      // Init verify session (runs after recipe is set so UI shows steps/skeleton)
      try {
        if (aiMode) {
          // AI mode: init exec session (may resume existing or create new)
          const execResult = await apiPost(
            `/api/sessions/${sessionId}/recipe/exec/init`,
            { recipe: extractedRecipe, model: aiModel }
          )
          setExecSessionId(execResult.exec_session_id)
          setVerifySessionId(execResult.exec_session_id)
          verifySessionIdRef.current = execResult.exec_session_id

          if (execResult.status === 'resumed') {
            // Resumed from existing session — load step results immediately
            if (execResult.step_results) setStepResults(execResult.step_results)
            setExecReady(true)
          } else if (execResult.status === 'running') {
            // Agent still running from previous open — ready to execute/subscribe
            setExecReady(true)
          } else {
            // New session — subscribe to Pusher for exec-ready event
            const apiBase = getApiBase()
            const token = getAuthToken()
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const pusher = new Pusher(PUSHER_KEY, {
              cluster: PUSHER_CLUSTER,
              userAuthentication: { endpoint: `${apiBase}/api/pusher/user-auth`, transport: 'ajax', headers },
              channelAuthorization: { endpoint: `${apiBase}/api/pusher/channel-auth`, transport: 'ajax', headers },
            })
            pusher.connection.bind('connected', () => pusher.signin())
            const ch = pusher.subscribe(execResult.channel)
            ch.bind('exec-ready', () => {
              setExecReady(true)
              pusher.disconnect()
              execPusherRef.current = null
            })
            ch.bind('exec-error', (data) => {
              toast.error('Workspace preparation failed: ' + (data.error || 'Unknown error'))
              pusher.disconnect()
              execPusherRef.current = null
            })
            execPusherRef.current = pusher
          }
        } else {
          const initResult = await apiPost(
            `/api/sessions/${sessionId}/recipe/verify/init`,
            { recipe: extractedRecipe, form_values: { name: name.trim() } }
          )
          setVerifySessionId(initResult.verify_session_id)
          verifySessionIdRef.current = initResult.verify_session_id
        }
      } catch (e) {
        toast.error('Failed to init session: ' + e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [sessionId, targetFile])

  // Resume draft
  const handleResumeDraft = () => {
    const d = draftCheck
    if (aiMode && d.execSessionId) {
      // AI mode resume: use extracted recipe but load step results from draft
      const extractedRecipe = d.extractedRecipe
      if (!extractedRecipe) { toast.error('Recipe extraction failed'); return }
      setCodeToEnglish(d.extractedCodeToNl || false)
      setRecipe(extractedRecipe)
      if (d.extractedCodeToNl && d.summaryChannel) {
        setSummaryStatus('Generating summaries...')
        subscribeSummaryChannel(d.summaryChannel)
      }
      setExecSessionId(d.execSessionId)
      setVerifySessionId(d.execSessionId)
      verifySessionIdRef.current = d.execSessionId
      setStepResults(d.stepResults || {})
      setSavedHardeningStatus(d.hardeningStatus || {})
      setSavedHardeningPending(d.hardeningPending || 0)
      setExecReady(true)
      setDraftCheck({ loading: false, hasDraft: false })
      return
    }
    setCodeToEnglish(d.codeToNl || false)
    setRecipe(d.recipe)
    setVerifySessionId(d.verifySessionId)
    verifySessionIdRef.current = d.verifySessionId
    setStepResults(d.stepResults || {})
    setDraftCheck({ ...d, hasDraft: false })
    setLoading(false)
  }

  // Discard draft and start fresh
  const handleDiscardDraft = async () => {
    const discardId = aiMode ? draftCheck.execSessionId : draftCheck.verifySessionId
    setDraftCheck({ loading: false, hasDraft: false })
    setLoading(true)
    if (discardId) {
      try { await apiDelete(`/api/sessions/${discardId}?archive=false`) } catch { toast.error('Failed to discard draft') }
    }

    // Re-extract recipe from scratch
    try {
      const recipeResult = await apiPost(
        `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent(targetFile)}&skip_cache=true${aiMode ? '&ai_mode=true' : ''}`,
        {}
      )
      if (!recipeResult) { setLoading(false); return }

      const extractedRecipe = recipeResult.recipe
      const isCodeToEnglish = recipeResult.code_to_nl === true
      setCodeToEnglish(isCodeToEnglish)
      setStepGraphEnabled(recipeResult.step_graph === true)
      setRecipe(extractedRecipe)
      setStepResults({})

      if (isCodeToEnglish && recipeResult.summary_channel) {
        setSummaryStatus('Generating summaries...')
        subscribeSummaryChannel(recipeResult.summary_channel)
      }

      if (aiMode) {
        setExecReady(false)
        const execResult = await apiPost(
          `/api/sessions/${sessionId}/recipe/exec/init`,
          { recipe: extractedRecipe, model: aiModel }
        )
        setExecSessionId(execResult.exec_session_id)
        setVerifySessionId(execResult.exec_session_id)
        verifySessionIdRef.current = execResult.exec_session_id

        if (execResult.status === 'resumed') {
          if (execResult.step_results) setStepResults(execResult.step_results)
          setExecReady(true)
        } else if (execResult.status === 'running') {
          setExecReady(true)
        } else {
          const apiBase = getApiBase()
          const token = getAuthToken()
          const headers = token ? { Authorization: `Bearer ${token}` } : {}
          const pusher = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
            userAuthentication: { endpoint: `${apiBase}/api/pusher/user-auth`, transport: 'ajax', headers },
            channelAuthorization: { endpoint: `${apiBase}/api/pusher/channel-auth`, transport: 'ajax', headers },
          })
          pusher.connection.bind('connected', () => pusher.signin())
          const ch = pusher.subscribe(execResult.channel)
          ch.bind('exec-ready', () => {
            setExecReady(true)
            pusher.disconnect()
            execPusherRef.current = null
          })
          ch.bind('exec-error', (data) => {
            toast.error('Workspace preparation failed: ' + (data.error || 'Unknown error'))
            pusher.disconnect()
            execPusherRef.current = null
          })
          if (execPusherRef.current) execPusherRef.current.disconnect()
          execPusherRef.current = pusher
        }
      } else {
        const initResult = await apiPost(
          `/api/sessions/${sessionId}/recipe/verify/init`,
          { recipe: extractedRecipe, form_values: { name: name.trim() } }
        )
        setVerifySessionId(initResult.verify_session_id)
        verifySessionIdRef.current = initResult.verify_session_id
      }
    } catch (e) {
      toast.error('Failed to extract recipe: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (summaryCleanupRef.current) summaryCleanupRef.current()
      if (execPusherRef.current) { execPusherRef.current.disconnect(); execPusherRef.current = null }
    }
  }, [])

  // Subscribe to summary Pusher events
  const subscribeSummaryChannel = useCallback((channel) => {
    if (!channel) return
    const apiBase = getApiBase()
    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      userAuthentication: { endpoint: `${apiBase}/api/pusher/user-auth`, transport: 'ajax', headers },
      channelAuthorization: { endpoint: `${apiBase}/api/pusher/channel-auth`, transport: 'ajax', headers },
    })
    pusher.connection.bind('connected', () => pusher.signin())
    const ch = pusher.subscribe(channel)

    const cleanup = () => {
      ch.unbind_all()
      pusher.unsubscribe(channel)
      setTimeout(() => pusher.disconnect(), 100)
      setSummaryStatus(null)
    }
    summaryCleanupRef.current = cleanup

    ch.bind('summary-status', (data) => setSummaryStatus(data.message || 'Generating summaries...'))
    ch.bind('summary-batch', (data) => {
      if (data.summaries) {
        setRecipe(prev => prev ? { ...prev, steps: prev.steps.map(step => data.summaries[step.id] ? { ...step, summary: data.summaries[step.id] } : step) } : prev)
      }
    })
    ch.bind('summary-complete', (data) => {
      setRecipe(prev => {
        if (!prev) return prev
        const updated = { ...prev }
        if (data.groups) updated.groups = data.groups
        updated.summary_metadata = { route: data.route, token_usage: data.token_usage, generated_at: data.generated_at, metrics: data.metrics }
        return updated
      })
      cleanup()
      summaryCleanupRef.current = null
    })
    ch.bind('summary-failed', () => { setSummaryStatus(null); cleanup(); summaryCleanupRef.current = null })
  }, [])

  // Regenerate summaries
  const handleRegenerate = async () => {
    setSummaryStatus('Regenerating...')
    try {
      const recipeResult = await apiPost(
        `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent(targetFile)}&skip_cache=true${aiMode ? '&ai_mode=true' : ''}`,
        {}
      )
      setRecipe(recipeResult.recipe)
      if (recipeResult.summary_channel) subscribeSummaryChannel(recipeResult.summary_channel)
      else setSummaryStatus(null)
    } catch (e) {
      toast.error('Failed to regenerate: ' + e.message)
      setSummaryStatus(null)
    }
  }

  // Cleanup verify session
  const cleanupVerifySession = useCallback(async () => {
    const vsid = verifySessionIdRef.current
    if (vsid) {
      verifySessionIdRef.current = null
      try { await apiDelete(`/api/sessions/${vsid}?archive=false`) } catch { toast.error('Failed to cleanup session') }
    }
  }, [])

  // Create or update workflow
  const noActionWarned = useRef(false)
  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Please enter a workflow name'); return }

    // Warn once if no action blocks added
    const hasActionBlock = extraBlocks.length > 0
    if (!hasActionBlock && !isUpdate && !noActionWarned.current) {
      noActionWarned.current = true
      toast.warning('No action blocks added. Consider adding a Publish Dashboard, AI Summary, or Send Email block to make this workflow useful. Click again to proceed anyway.', { duration: 8000 })
      return
    }

    setCreating(true)
    try {
      const cleanedBlocks = extraBlocks.map((b) => {
        if (b.type === 'send_email' && typeof b.config.to === 'string') {
          return { ...b, config: { ...b.config, to: b.config.to.split(',').map((e) => e.trim()).filter(Boolean) } }
        }
        return b
      })

      // Build explanation from code-to-English summaries (if available)
      let explanation = null
      if (recipe && codeToNl) {
        const steps = {}
        for (const step of (recipe.steps || [])) {
          if (step.summary) {
            steps[step.id] = step.summary
          }
        }
        if (Object.keys(steps).length > 0) {
          explanation = {
            steps,
            groups: recipe.groups || [],
            route: recipe.summary_metadata?.route || 'unknown',
          }
        }
      }

      const body = {
        name: name.trim(),
        source_session_id: aiMode && execSessionId ? execSessionId : sessionId,
        target_file: targetFile,
        extra_blocks: cleanedBlocks,
        skipped_steps: [...removedSteps],
      }
      if (explanation) {
        body.explanation = explanation
      }

      // Pass verify session for first-run optimization
      if (verifySessionId) {
        body.verify_session_id = verifySessionId
      }

      if (editWorkflowId) {
        body.workflow_id = editWorkflowId
      }

      const data = await apiPost('/api/workflows', body)

      const action = data.updated ? 'Workflow updated' : 'Workflow created'
      toast.success(action)
      await cleanupVerifySession()
      onClose()
      navigate(`/workflows/${data.workflow_id}`)
    } catch (e) {
      toast.error('Failed: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  // Auto-save draft: persist form_values whenever step results change
  const prevStepResultsCount = useRef(0)
  useEffect(() => {
    const completedCount = Object.values(stepResults).filter((r) => r.status === 'success').length
    if (completedCount > 0 && completedCount !== prevStepResultsCount.current && verifySessionId) {
      prevStepResultsCount.current = completedCount
      apiPost(`/api/sessions/${sessionId}/recipe/verify/draft-update`, {
        verify_session_id: verifySessionId,
        form_values: { name: name.trim() },
      }).catch(() => toast.error('Failed to auto-save draft'))
    }
  }, [stepResults, verifySessionId, sessionId, name])

  // Close: keep verify session alive if any steps completed (auto-draft), otherwise clean up
  const handleClose = () => {
    // Auto-cancel running AI agent on close — only if steps are still pending
    if (aiMode && execSessionId) {
      const allDone = recipe?.steps?.length > 0 && recipe.steps.every(s =>
        stepResults[s.id]?.status === 'success' || stepResults[s.id]?.status === 'skipped'
      )
      if (!allDone) {
        apiPost(`/api/sessions/${sessionId}/recipe/exec/cancel`, {
          exec_session_id: execSessionId,
        }).catch(() => {})
      }
    }
    const completedCount = Object.values(stepResults).filter((r) => r.status === 'success').length
    if (completedCount > 0 && verifySessionId) {
      // Auto-save form values before closing
      apiPost(`/api/sessions/${sessionId}/recipe/verify/draft-update`, {
        verify_session_id: verifySessionId,
        form_values: { name: name.trim() },
      }).catch(() => toast.error('Failed to auto-save draft'))
      verifySessionIdRef.current = null // prevent cleanup on unmount
    } else {
      cleanupVerifySession()
    }
    onClose()
  }

  // Extra block helpers
  const addExtraBlock = (type, label) => {
    const id = `blk_extra_${extraBlocks.length + 1}`
    const block = { id, type, label, config: {} }
    if (type === 'ai_summarize' || type === 'ai_analyze') {
      block.config = { prompt: '', output_file: 'output/summary.md' }
    } else if (type === 'send_email') {
      block.config = { to: '', subject: `Workflow Report: ${name}`, body_from: '' }
    } else if (type === 'publish_dashboard') {
      block.config = { name: name, shared: false }
    } else if (type === 'send_slack') {
      block.config = {
        channel: '',
        channel_id: '',
        channels: [],
        instruction: '',
        config_content: '',
        content_from: '',
        dm_users: [],
        mode: 'ai',
      }
    }
    setExtraBlocks((prev) => [...prev, block])
    setShowAddMenu(false)
    setExpandedBlock(id)
  }

  const removeExtraBlock = (blockId) => {
    setExtraBlocks((prev) => prev.filter((b) => b.id !== blockId))
    if (expandedBlock === blockId) setExpandedBlock(null)
  }

  const updateExtraBlockConfig = (blockId, key, value) => {
    setExtraBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, config: { ...b.config, [key]: value } } : b))
  }

  const activeSteps = (recipe?.steps || []).filter((s) => !removedSteps.has(s.id))
  const allPassed = activeSteps.length > 0 && activeSteps.every((s) => stepResults[s.id]?.status === 'success')
  const isUpdate = !!editWorkflowId

  // Detect if extra blocks config changed from original (for update mode)
  const hasExtraBlockChanges = isUpdate && originalExtraBlocksRef.current !== null
    && JSON.stringify(extraBlocks.map((b) => b.config)) !== originalExtraBlocksRef.current

  // Check if any send_slack block has no channel and no DM users selected
  const hasIncompleteSlackBlock = extraBlocks.some(
    (b) => b.type === 'send_slack'
      && !b.config.channel_id
      && (!b.config.channels || b.config.channels.length === 0)
      && (!b.config.dm_users || b.config.dm_users.length === 0)
  )

  // Name input bar (rendered at top of RecipeVerifyStep via topBarExtra)
  const nameBar = (
    <div className="shrink-0">
      {/* Draft resume banner */}
      {draftCheck.hasDraft && (
        <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--accent)]/8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">Saved draft found</p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {draftCheck.stepsCompleted}/{draftCheck.totalSteps} steps completed
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="primary" size="sm" onClick={handleResumeDraft}>
                <RotateCcw size={12} /> Resume
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDiscardDraft} title="Discard draft">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Name input + existing workflow indicator (compact) */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <label className="text-[12px] font-medium text-[var(--text-muted)] shrink-0 uppercase tracking-wider">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workflow name"
          disabled={isUpdate}
          className={`flex-1 text-[14px] font-medium border border-[var(--border-primary)] rounded-md px-2.5 py-1 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors ${isUpdate ? 'bg-[var(--bg-secondary)] cursor-not-allowed opacity-70' : 'bg-[var(--bg-primary)] focus:border-[var(--accent)]'}`}
        />
        {/* Update mode indicator */}
        {isUpdate && (
          <span className="flex items-center gap-1 text-[10px] text-[var(--accent)] bg-[var(--accent)]/8 px-2 py-0.5 rounded-full shrink-0">
            <Pencil size={9} /> Updating
            <button
              onClick={handleCreateNew}
              className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer text-[10px]"
              title="Switch to create new"
            >
              &times;
            </button>
          </span>
        )}
        {/* Existing workflows link */}
        {existingCheck.exists && !isUpdate && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowExistingDropdown(!showExistingDropdown)}
              className="flex items-center gap-1 text-[10px] text-[var(--color-orange)] bg-[var(--color-orange)]/8 px-2 py-0.5 rounded-full cursor-pointer bg-transparent border-none hover:bg-[var(--color-orange)]/15 transition-colors"
              title="Existing workflows for this file"
            >
              <Workflow size={9} /> {existingCheck.workflows?.length} existing
            </button>
            {showExistingDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1 z-20">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase">Update existing workflow</div>
                {existingCheck.workflows?.map((wf) => (
                  <button
                    key={wf.workflow_id}
                    onClick={() => { handleUpdateExisting(wf); setShowExistingDropdown(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer"
                  >
                    <Pencil size={11} className="text-[var(--text-muted)] shrink-0" />
                    <span className="text-[12px] text-[var(--text-primary)] truncate" title={wf.name}>{wf.name}</span>
                  </button>
                ))}
                <div className="border-t border-[var(--border-primary)] my-0.5" />
                <button
                  onClick={() => { handleCreateNew(); setShowExistingDropdown(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer text-[12px] text-[var(--text-muted)]"
                >
                  Create new instead
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // AI/Action blocks section (rendered after steps via afterSteps)
  const extraBlocksSection = (
    <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-primary)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-[var(--text-primary)]">
          AI & Action Blocks
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">Run after data steps</span>
      </div>

      {extraBlocks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {extraBlocks.map((block) => {
            const isExpanded = expandedBlock === block.id
            const isAI = block.type.startsWith('ai_')
            const isDashboard = block.type === 'publish_dashboard'
            const isSlack = block.type === 'send_slack'
            const Icon = isAI ? Brain : isDashboard ? LayoutDashboard : isSlack ? MessageSquare : Mail

            return (
              <div key={block.id} className="border border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                >
                  <Icon size={13} className={isAI ? 'text-[var(--color-purple-400)] shrink-0' : isDashboard ? 'text-[var(--accent)] shrink-0' : isSlack ? 'text-[#4A154B] shrink-0' : 'text-[var(--color-red)] shrink-0'} />
                  <span className="text-[12px] font-medium text-[var(--text-primary)] flex-1">{block.label}</span>
                  {isAI ? <Badge variant="accent">AI</Badge> : isDashboard ? <Badge variant="accent">Dashboard</Badge> : isSlack ? <Badge variant="warning">Slack</Badge> : <Badge variant="success">Action</Badge>}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeExtraBlock(block.id) }}
                    className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--action-danger)] bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                  {isExpanded ? <ChevronDown size={12} className="text-[var(--text-muted)]" /> : <ChevronRight size={12} className="text-[var(--text-muted)]" />}
                </div>

                {isExpanded && (
                  <div className="px-3 pb-2.5 border-t border-[var(--border-primary)] pt-2.5 space-y-2">
                    {isAI && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Prompt</label>
                          <Textarea
                            value={block.config.prompt || ''}
                            onChange={(e) => updateExtraBlockConfig(block.id, 'prompt', e.target.value)}
                            placeholder="Analyze the data and summarize key metrics, trends, and insights..."
                            className="mt-1 text-[12px]"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Output file</label>
                          <Input
                            value={block.config.output_file || ''}
                            onChange={(e) => updateExtraBlockConfig(block.id, 'output_file', e.target.value)}
                            placeholder="output/summary.md"
                            className="mt-1 text-[12px]"
                          />
                        </div>
                      </>
                    )}
                    {block.type === 'send_email' && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Recipients (comma-separated)</label>
                          <Input
                            value={typeof block.config.to === 'string' ? block.config.to : (block.config.to || []).join(', ')}
                            onChange={(e) => updateExtraBlockConfig(block.id, 'to', e.target.value)}
                            placeholder="user@example.com"
                            className="mt-1 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Subject</label>
                          <Input
                            value={block.config.subject || ''}
                            onChange={(e) => updateExtraBlockConfig(block.id, 'subject', e.target.value)}
                            placeholder="Workflow Report"
                            className="mt-1 text-[12px]"
                          />
                        </div>
                      </>
                    )}
                    {block.type === 'publish_dashboard' && (
                      <>
                        <div>
                          <label className="text-[12px] font-medium text-[var(--text-secondary)]">Dashboard name</label>
                          <Input
                            value={block.config.name || ''}
                            onChange={(e) => updateExtraBlockConfig(block.id, 'name', e.target.value)}
                            placeholder="Dashboard name"
                            className="mt-1 text-[12px]"
                            disabled={isUpdate}
                          />
                        </div>
                        <div className="text-[12px] text-[var(--text-muted)]">
                          Publishes the HTML output as a viewable dashboard in the Dashboards page.
                        </div>
                      </>
                    )}
                    {block.type === 'send_slack' && (
                      <SlackBlockConfigForm
                        block={block}
                        updateConfig={updateExtraBlockConfig}
                        workflowName={name}
                        workflowId={editWorkflowId}
                        sessionId={sessionId}
                        allBlocks={extraBlocks}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border border-dashed border-[var(--border-primary)] rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
        >
          <Plus size={12} /> Add Block
        </button>
        {showAddMenu && (
          <div className="absolute bottom-full left-0 mb-1 w-64 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-lg py-1 z-10">
            <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase">AI Blocks</div>
            {AI_BLOCK_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => addExtraBlock(opt.type, opt.label)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer"
              >
                <Brain size={12} className="text-[var(--color-purple-400)] shrink-0" />
                <span className="text-[12px] text-[var(--text-primary)]">{opt.label}</span>
              </button>
            ))}
            <div className="border-t border-[var(--border-primary)] my-0.5" />
            <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase">Actions</div>
            {ACTION_BLOCK_OPTIONS.filter((opt) => opt.type !== 'send_slack' || slackFeatureEnabled).map((opt) => {
              const ActionIcon = opt.type === 'publish_dashboard' ? LayoutDashboard : opt.type === 'send_slack' ? MessageSquare : Mail
              const iconColor = opt.type === 'publish_dashboard' ? 'text-[var(--accent)]' : opt.type === 'send_slack' ? 'text-[#4A154B]' : 'text-[var(--color-red)]'
              return (
                <button
                  key={opt.type}
                  onClick={() => addExtraBlock(opt.type, opt.label)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--bg-hover)] bg-transparent border-none cursor-pointer"
                >
                  <ActionIcon size={12} className={`${iconColor} shrink-0`} />
                  <span className="text-[12px] text-[var(--text-primary)]">{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Dialog
      open
      onClose={handleClose}
      className={`w-full transition-all ${maximized ? 'max-w-[95vw] !max-h-[95vh]' : 'max-w-5xl'}`}
    >
      <div className={`flex flex-col ${maximized ? 'h-[95vh]' : 'max-h-[85vh]'}`}>
        <DialogHeader onClose={handleClose}>
          <div className="flex items-center gap-2">
            <Workflow size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              {isUpdate ? 'Update Workflow' : 'Create Workflow'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMaximized((m) => !m)}
            title={maximized ? 'Restore size' : 'Maximize'}
            className="ml-auto mr-1"
          >
            {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </Button>
        </DialogHeader>

        {draftCheck.hasDraft && !recipe ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="text-center">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-1">Saved draft found</p>
              <p className="text-[14px] text-[var(--text-secondary)]">
                {draftCheck.stepsCompleted}/{draftCheck.totalSteps} steps completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleResumeDraft}>
                <RotateCcw size={13} /> Resume Draft
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDiscardDraft}>
                <Trash2 size={13} /> Discard & Start Fresh
              </Button>
            </div>
          </div>
        ) : (loading || draftCheck.loading) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin" />
              {draftCheck.loading ? 'Checking for saved draft...' : 'Extracting workflow steps...'}
            </div>
          </div>
        ) : !recipe ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-[var(--text-muted)]">
              No recipe steps found. Make sure the session has completed tool calls.
            </div>
          </div>
        ) : (
          <RecipeVerifyStep
            recipe={recipe}
            sessionId={sessionId}
            verifySessionId={verifySessionId}
            stepResults={stepResults}
            setStepResults={setStepResults}
            removedSteps={removedSteps}
            setRemovedSteps={setRemovedSteps}
            onPublish={handleCreate}
            onBack={handleClose}
            onSaveDraft={null}
            onRegenerate={codeToNl ? handleRegenerate : undefined}
            publishing={creating}
            summaryStatus={summaryStatus}
            codeToNl={codeToNl}
            isUpdate={isUpdate}
            publishLabel={isUpdate ? 'Update Workflow' : 'Create Workflow'}
            topBarExtra={nameBar}
            afterSteps={extraBlocksSection}
            aiMode={aiMode}
            execSessionId={execSessionId}
            execReady={execReady}
            initialHardeningStatus={savedHardeningStatus}
            initialHardeningPending={savedHardeningPending}
            hasExtraBlockChanges={hasExtraBlockChanges}
            hasIncompleteSlackBlock={hasIncompleteSlackBlock}
          />
        )}
      </div>
    </Dialog>
  )
}
