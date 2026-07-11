import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Shield, Loader2, CheckCircle2, ExternalLink,
  Hash, Users, Bell, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Lock,
} from 'lucide-react'
import { Button } from '@/ui'
import { apiGet } from '../../api'
import { useTestConnection } from '../../components/settings/integrations/api/testConnection'
import { DisconnectIntegrationModal } from '../../components/settings/integrations/components/DisconnectIntegrationModal'
import { useNotificationStore } from '../../components/settings/integrations/stores/notifications'

const SCOPE_DESCRIPTIONS = {
  'channels:history': 'Read message history in public channels',
  'channels:read': 'View basic info about public channels',
  'chat:write': 'Send messages as the bot',
  'chat:write.public': 'Send messages to channels the bot isn\'t a member of',
  'files:write': 'Upload and share files',
  'groups:history': 'Read message history in private channels',
  'groups:write': 'Manage private channels the bot is in',
  'groups:read': 'View basic info about private channels',
  'im:history': 'Read direct message history',
  'im:write': 'Send direct messages',
  'im:read': 'View basic info about direct messages',
  'mpim:write': 'Send messages in group DMs',
  'mpim:read': 'View basic info about group DMs',
  'users:read': 'View people in the workspace',
  'users:read.email': 'View email addresses of people in the workspace',
  'assistant:write': 'Enable AI assistant features (status, suggestions)',
}

const ITEMS_PER_PAGE = 10
const FETCH_BATCH_SIZE = 50

export default function SlackIntegrationDetail({ onBack }) {
  const navigate = useNavigate()
  const { addNotification } = useNotificationStore()

  const [loading, setLoading] = useState(true)
  const [connection, setConnection] = useState(null)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [showAllScopes, setShowAllScopes] = useState(false)

  // Workflows state — server-side batched pagination
  const [workflows, setWorkflows] = useState([])
  const [workflowsLoading, setWorkflowsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMoreOnServer, setHasMoreOnServer] = useState(false)
  const [fetchOffset, setFetchOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const testConnection = useTestConnection()

  const fetchConnection = useCallback(async () => {
    try {
      const data = await apiGet('/api/slack/connection')
      setConnection(data)
    } catch {
      setConnection({ connected: false })
      toast.error('Failed to fetch Slack connection status')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWorkflows = useCallback(async (offset = 0, append = false) => {
    if (!append) setWorkflowsLoading(true)
    else setLoadingMore(true)
    try {
      const params = new URLSearchParams({ limit: String(FETCH_BATCH_SIZE), offset: String(offset) })
      const data = await apiGet(`/api/slack/configured-alerts?${params}`)
      const batch = data?.workflows || []
      if (append) {
        setWorkflows((prev) => [...prev, ...batch])
      } else {
        setWorkflows(batch)
      }
      setHasMoreOnServer(data?.has_more || false)
      setFetchOffset(offset + batch.length)
    } catch {
      if (!append) setWorkflows([])
    } finally {
      setWorkflowsLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchConnection()
    fetchWorkflows(0)
  }, [fetchConnection, fetchWorkflows])

  // Prefetch next batch when user reaches pages that need more data
  const prefetchTriggered = useRef(false)
  useEffect(() => {
    const currentMaxShown = page * ITEMS_PER_PAGE
    if (
      hasMoreOnServer &&
      !loadingMore &&
      !prefetchTriggered.current &&
      currentMaxShown >= workflows.length - ITEMS_PER_PAGE
    ) {
      prefetchTriggered.current = true
      fetchWorkflows(fetchOffset, true).then(() => {
        prefetchTriggered.current = false
      })
    }
  }, [page, workflows.length, hasMoreOnServer, loadingMore, fetchOffset, fetchWorkflows])

  const totalPages = Math.ceil(workflows.length / ITEMS_PER_PAGE)
  const paginatedWorkflows = workflows.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const getSlackTargets = (workflow) => {
    const slackBlocks = workflow.blocks?.filter((b) => b.type === 'send_slack') || []
    const seen = new Set()
    const targets = []
    for (const b of slackBlocks) {
      const config = b.config || {}
      // Multi-channel: read channels[] array first, fall back to legacy channel
      if (config.channels?.length) {
        for (const ch of config.channels) {
          const name = `#${ch.name}`
          if (!seen.has(name)) {
            seen.add(name)
            targets.push({ type: 'channel', label: name })
          }
        }
      } else if (config.channel) {
        const name = config.channel.startsWith('#') ? config.channel : `#${config.channel}`
        if (!seen.has(name)) {
          seen.add(name)
          targets.push({ type: 'channel', label: name })
        }
      }
      if (config.dm_users?.length) {
        for (const u of config.dm_users) {
          const name = u.real_name || u.display_name || u.name
          if (!seen.has(name)) {
            seen.add(name)
            targets.push({ type: 'user', label: name })
          }
        }
      }
    }
    return targets.length > 0 ? targets : [{ type: 'unknown', label: 'Unknown' }]
  }

  // ── Test Connection (uses the same API as old IntegrationDetail) ──
  const handleTestConnection = async () => {
    const response = await testConnection.mutateAsync({
      database: 'Slack',
      connectionId: undefined,
    })
    if (response?.['success']) {
      addNotification({ type: 'success', title: 'Test Connection Successful' })
    } else {
      addNotification({ type: 'error', title: 'Test Connection Failed' })
    }
  }

  const isConnected = connection?.connected && connection?.status === 'active'
  const scopes = connection?.scopes || []
  const PREVIEW_SCOPE_COUNT = 5

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-grey-50)]">
        <Loader2 className="animate-spin text-[var(--color-grey-400)]" size={24} />
      </div>
    )
  }

  if (connection && connection.feature_enabled === false) {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-grey-50)]">
        <div className="flex items-center border-b border-[var(--color-grey-200)] h-[64px] shrink-0 bg-white px-6 py-4">
          <div onClick={onBack} className="cursor-pointer flex items-center mr-4">
            <ArrowLeft size={20} />
          </div>
          <h1 className="text-[var(--color-text-primary)] text-lg leading-7 font-medium">
            Slack Details
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-xl border border-[var(--color-grey-200)] bg-white p-8 text-center max-w-md">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-grey-100)] flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-[var(--color-grey-400)]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--color-grey-900)] mb-2">
              Slack Integration Not Available
            </h3>
            <p className="text-[14px] text-[var(--color-grey-500)]">
              The Slack integration is not enabled for your organization.
              Please contact your administrator to enable this feature.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-[var(--color-grey-50)]">
        {/* Header */}
        <div className="flex items-center border-b border-[var(--color-grey-200)] h-[64px] shrink-0 bg-white px-6 py-4 justify-between">
          <div className="flex items-center gap-4">
            <div onClick={onBack} className="cursor-pointer flex items-center">
              <ArrowLeft size={20} />
            </div>
            <h1 className="text-[var(--color-text-primary)] text-lg leading-7 font-medium">
              Slack Details
            </h1>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                {connection.workspace_name || 'Connected'}
              </span>
            )}
          </div>
          {/* Action buttons — same as old IntegrationDetail */}
          {isConnected && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleTestConnection}
                disabled={testConnection.isLoading}
              >
                {testConnection.isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                variant="red"
                size="lg"
                onClick={() => setShowDisconnect(true)}
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bot Permissions Section */}
          <section className="bg-white rounded-lg border border-[var(--color-grey-200)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-grey-100)] flex items-center gap-2">
              <Shield size={16} className="text-[var(--color-grey-500)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Bot Permissions
              </h2>
              {scopes.length > 0 && (
                <span className="text-xs text-[var(--color-grey-500)]">
                  ({scopes.length} scopes granted)
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              {!isConnected ? (
                <p className="text-sm text-[var(--color-grey-500)]">
                  Slack is not connected. Connect via Settings to view permissions.
                </p>
              ) : scopes.length > 0 ? (
                <>
                  <div className="divide-y divide-[var(--color-grey-100)]">
                    {(showAllScopes ? scopes : scopes.slice(0, PREVIEW_SCOPE_COUNT)).map((scope) => (
                      <div key={scope} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className="inline-flex items-center text-[12px] font-mono text-[var(--color-grey-700)] bg-[var(--color-grey-50)] border border-[var(--color-grey-200)] px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                          {scope}
                        </span>
                        <span className="text-sm text-[var(--color-grey-600)]">
                          {SCOPE_DESCRIPTIONS[scope] || scope}
                        </span>
                      </div>
                    ))}
                  </div>
                  {scopes.length > PREVIEW_SCOPE_COUNT && (
                    <button
                      onClick={() => setShowAllScopes((v) => !v)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {showAllScopes ? (
                        <>Show less <ChevronUp size={12} /></>
                      ) : (
                        <>View all {scopes.length} permissions <ChevronDown size={12} /></>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-grey-500)]">
                  No scope information available.
                </p>
              )}
            </div>
          </section>

          {/* Configured Slack Alerts Section */}
          <section className="bg-white rounded-lg border border-[var(--color-grey-200)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-grey-100)] flex items-center gap-2">
              <Bell size={16} className="text-[var(--color-grey-500)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Configured Slack Alerts
              </h2>
              {workflows.length > 0 && (
                <span className="text-xs text-[var(--color-grey-500)]">
                  ({workflows.length} workflow{workflows.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              {workflowsLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-grey-500)]">
                  <Loader2 size={14} className="animate-spin" />
                  Loading workflows...
                </div>
              ) : workflows.length === 0 ? (
                <p className="text-sm text-[var(--color-grey-500)]">
                  No workflows with Slack alerts configured yet.
                </p>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_1fr_100px_80px] gap-4 px-3 py-2 text-[12px] font-semibold text-[var(--color-grey-500)] uppercase tracking-wider border-b border-[var(--color-grey-100)]">
                    <span>Workflow</span>
                    <span>Target</span>
                    <span>Status</span>
                    <span></span>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-[var(--color-grey-100)]">
                    {paginatedWorkflows.map((wf) => (
                      <div
                        key={wf.workflow_id}
                        className="grid grid-cols-[1fr_1fr_100px_80px] gap-4 px-3 py-3 items-center hover:bg-[var(--color-grey-50)] rounded"
                      >
                        <span className="text-sm text-[var(--color-text-primary)] font-medium truncate">
                          {wf.name || 'Untitled Workflow'}
                        </span>
                        <span className="text-sm text-[var(--color-grey-600)] truncate flex items-center gap-1 flex-wrap">
                          {getSlackTargets(wf).map((t, i) => (
                            <span key={`${t.label}-${i}`} className="inline-flex items-center gap-0.5 shrink-0">
                              {t.type === 'channel' ? (
                                <Hash size={11} className="text-[var(--color-grey-400)]" />
                              ) : (
                                <Users size={11} className="text-[var(--color-grey-400)]" />
                              )}
                              <span>{t.type === 'channel' ? t.label.replace(/^#/, '') : t.label}</span>
                              {i < getSlackTargets(wf).length - 1 && <span className="text-[var(--color-grey-300)] mx-0.5">,</span>}
                            </span>
                          ))}
                        </span>
                        <span>
                          {wf.status === 'active' ? (
                            <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-[var(--color-grey-600)] bg-[var(--color-grey-100)] px-2 py-0.5 rounded-full">
                              Paused
                            </span>
                          )}
                        </span>
                        <span>
                          {wf.workflow_id && (
                            <a
                              href={`/workflows/${wf.workflow_id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              title="Edit this workflow"
                            >
                              Edit
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-grey-500)] mt-3">
                      <Loader2 size={12} className="animate-spin" />
                      Loading more...
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-grey-100)]">
                      <span className="text-xs text-[var(--color-grey-500)]">
                        Page {page} of {totalPages}{hasMoreOnServer ? '+' : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-1.5 rounded hover:bg-[var(--color-grey-100)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-7 h-7 text-xs rounded font-medium ${
                              p === page
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-[var(--color-grey-100)] text-[var(--color-grey-700)]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages && !hasMoreOnServer}
                          className="p-1.5 rounded hover:bg-[var(--color-grey-100)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Disconnect Modal — same as old IntegrationDetail */}
      <DisconnectIntegrationModal
        database="Slack"
        isModalOpen={showDisconnect}
        fetchConnections={fetchConnection}
        title="Slack"
        onClose={() => setShowDisconnect(false)}
        onNavigate={(path) => navigate(path)}
        integrationsPath="/settings/integrations"
      />
    </>
  )
}
