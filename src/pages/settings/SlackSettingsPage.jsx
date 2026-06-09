import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, RefreshCw, Loader2, Hash, Lock, Users,
  ExternalLink, Shield, Unplug, Plus, Trash2, AlertTriangle,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { apiGet, apiPost, apiDelete, getApiBase, getAuthToken } from '../../api'

/**
 * SlackSettingsPage — Manage Slack workspace connection for the workflow engine.
 * Wired to real backend APIs: /api/slack/connection, /api/slack/channels, etc.
 */

export default function SlackSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [connection, setConnection] = useState(null)
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const isConnected = connection?.connected && connection?.status === 'active'

  // ── Fetch connection status + channels + messages on mount ──────────
  useEffect(() => {
    fetchConnection()
  }, [])

  // ── Detect ?connected=true after OAuth callback redirect ───────────
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast.success('Slack workspace connected successfully')
      // Clean up URL params
      setSearchParams({}, { replace: true })
      // Re-fetch to show updated state
      fetchConnection()
    }
  }, [searchParams])

  const fetchConnection = async () => {
    setLoading(true)
    try {
      const data = await apiGet('/api/slack/connection')
      setConnection(data)

      // If connected, also fetch channels and messages
      if (data?.connected && data?.status === 'active') {
        const [channelsRes, messagesRes] = await Promise.all([
          apiGet('/api/slack/channels').catch(() => ({ channels: [] })),
          apiGet('/api/slack/messages').catch(() => ({ messages: [] })),
        ])
        setChannels(channelsRes?.channels || [])
        setMessages(messagesRes?.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch Slack connection:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Connect: full-page redirect to OAuth install endpoint ──────────
  const handleConnect = async () => {
    const token = getAuthToken()
    if (!token) {
      toast.error('Not authenticated — please log in first')
      return
    }

    try {
      // Fetch Slack OAuth URL from integration-srv
      const integrationSrvBase = getApiBase().replace('/api', '/api/v1/integration')
      const response = await fetch(`${integrationSrvBase}/integrations/source`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      const slackIntegration = data.integrations?.find(i => i.slug === 'slack')

      if (slackIntegration?.authentication_url) {
        // Redirect to Slack OAuth via integration-srv
        window.location.href = slackIntegration.authentication_url
      } else {
        toast.error('Failed to get Slack OAuth URL')
      }
    } catch (err) {
      console.error('Failed to fetch Slack OAuth URL:', err)
      toast.error('Failed to initiate Slack connection')
    }
  }

  // ── Validate: call auth.test via backend ───────────────────────────
  const handleValidate = async () => {
    setValidating(true)
    try {
      const result = await apiPost('/api/slack/validate')
      if (result?.valid) {
        toast.success('Slack connection validated successfully')
        // Refresh connection data (updates last_validated_at)
        fetchConnection()
      } else {
        toast.error(result?.error || 'Validation failed')
      }
    } catch {
      toast.error('Failed to validate Slack connection')
    } finally {
      setValidating(false)
    }
  }

  // ── Disconnect: revoke token + mark revoked (via integration-srv) ──
  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const token = getAuthToken()
      const integrationSrvBase = getApiBase().replace('/api', '/api/v1/integration')

      await fetch(`${integrationSrvBase}/slack`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      toast.success('Slack workspace disconnected')
      setShowDisconnect(false)
      setConnection({ connected: false })
      setChannels([])
      setMessages([])
    } catch (err) {
      console.error('Failed to disconnect Slack:', err)
      toast.error('Failed to disconnect Slack workspace')
    } finally {
      setDisconnecting(false)
    }
  }

  const formatDate = (val) => {
    if (!val) return '—'
    // Handle epoch ms (number) or ISO string
    const d = typeof val === 'number' ? new Date(val) : new Date(val)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  const timeAgo = (val) => {
    if (!val) return '—'
    const d = typeof val === 'number' ? new Date(val) : new Date(val)
    const ms = Date.now() - d.getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center gap-2 text-[var(--pv-neutral-grey-400)]">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">Loading Slack settings...</span>
      </div>
    )
  }

  // ── Feature not enabled ─────────────────────────────────────────
  if (connection && connection.feature_enabled === false) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-[var(--pv-neutral-grey-200)] bg-white p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-[var(--pv-neutral-grey-100)] flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-[var(--pv-neutral-grey-400)]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--pv-neutral-grey-900)] mb-2">
            Slack Integration Not Available
          </h3>
          <p className="text-[13px] text-[var(--pv-neutral-grey-500)] max-w-md mx-auto">
            The Slack integration is not enabled for your organization.
            Please contact your administrator to enable this feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Connection Status Card */}
      <div className="rounded-xl border border-[var(--pv-neutral-grey-200)] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--pv-neutral-grey-150)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Slack logo */}
            <div className="w-10 h-10 rounded-lg bg-[#4A154B] flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 54 54">
                <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
                <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
                <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
                <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-[var(--pv-neutral-grey-900)]">
                  {isConnected ? connection.workspace_name : 'Slack Workspace'}
                </h3>
                {isConnected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="muted">Not Connected</Badge>
                )}
              </div>
              {isConnected && connection.connected_at && (
                <p className="text-[12px] text-[var(--pv-neutral-grey-500)] mt-0.5">
                  Connected {connection.connected_by ? `by ${connection.connected_by} ` : ''}on {formatDate(connection.connected_at)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  {validating ? 'Validating...' : 'Validate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisconnect(true)}
                  className="text-[var(--pv-error-text)] hover:bg-[var(--pv-error-text)]/8"
                >
                  <Unplug size={13} />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={handleConnect}>
                <Plus size={13} />
                Connect Workspace
              </Button>
            )}
          </div>
        </div>

        {/* Disconnect confirmation */}
        {showDisconnect && (
          <div className="px-5 py-3 bg-[var(--pv-error-text)]/5 border-b border-[var(--pv-error-text)]/15 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-[var(--pv-error-text)]">
              <AlertTriangle size={14} />
              <span className="font-medium">Disconnecting will disable all Slack alert workflow steps. Are you sure?</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDisconnect(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="px-5 py-4 space-y-4">
            {/* Bot & Scopes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--pv-neutral-grey-500)] uppercase tracking-wider">
                  Bot User ID
                </label>
                <p className="text-[13px] text-[var(--pv-neutral-grey-900)] font-medium mt-1 font-mono">
                  {connection.bot_user_id || '—'}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--pv-neutral-grey-500)] uppercase tracking-wider">
                  Last Validated
                </label>
                <p className="text-[13px] text-[var(--pv-neutral-grey-900)] font-medium mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-[var(--pv-success-text)]" />
                  {formatDate(connection.last_validated_at)}
                </p>
              </div>
            </div>

            {/* Scopes */}
            {connection.scopes?.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-[var(--pv-neutral-grey-500)] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={11} />
                  OAuth Scopes
                </label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {connection.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="inline-flex items-center text-[11px] font-mono text-[var(--pv-neutral-grey-600)] bg-[var(--pv-neutral-grey-50)] border border-[var(--pv-neutral-grey-200)] px-2 py-0.5 rounded-md"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--pv-primary-50)] border border-[var(--pv-primary-100)]">
              <Shield size={14} className="text-[var(--pv-primary-500)] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--pv-neutral-grey-600)] leading-relaxed">
                OAuth and token management handled by integration service. Bot tokens are <strong>never</strong> exposed to the LLM agent.
                Workflow Slack messages are queued via SQS for reliable delivery with rate limiting and retries.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Channels */}
      {isConnected && (
        <div className="rounded-xl border border-[var(--pv-neutral-grey-200)] bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--pv-neutral-grey-150)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={15} className="text-[var(--pv-neutral-grey-500)]" />
              <h3 className="text-[14px] font-semibold text-[var(--pv-neutral-grey-900)]">
                Available Channels
              </h3>
              <span className="text-[11px] text-white bg-[var(--pv-primary-500)] px-1.5 py-0.5 rounded-md font-medium">
                {channels.length}
              </span>
            </div>
            <p className="text-[11px] text-[var(--pv-neutral-grey-500)]">
              Channels visible to the Petavue Alerts bot
            </p>
          </div>

          {channels.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-[var(--pv-neutral-grey-400)]">
              No channels found. Invite the Petavue Alerts bot to channels to see them here.
            </div>
          ) : (
            <div className="divide-y divide-[var(--pv-neutral-grey-100)]">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--pv-neutral-grey-50)] transition-colors">
                  <div className="w-8 h-8 rounded-md bg-[var(--pv-neutral-grey-100)] flex items-center justify-center shrink-0">
                    {ch.is_private ? (
                      <Lock size={14} className="text-[var(--pv-neutral-grey-500)]" />
                    ) : (
                      <Hash size={14} className="text-[var(--pv-neutral-grey-500)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--pv-neutral-grey-900)]">
                        #{ch.name}
                      </span>
                      {ch.is_private && (
                        <Badge variant="muted">Private</Badge>
                      )}
                    </div>
                    {ch.topic && (
                      <p className="text-[11px] text-[var(--pv-neutral-grey-500)] truncate mt-0.5">
                        {ch.topic}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--pv-neutral-grey-400)] shrink-0">
                    <Users size={12} />
                    {ch.num_members}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Slack Messages */}
      {isConnected && (
        <div className="rounded-xl border border-[var(--pv-neutral-grey-200)] bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--pv-neutral-grey-150)]">
            <h3 className="text-[14px] font-semibold text-[var(--pv-neutral-grey-900)] flex items-center gap-2">
              <ExternalLink size={14} className="text-[var(--pv-neutral-grey-500)]" />
              Recent Alert Deliveries
            </h3>
          </div>

          {messages.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-[var(--pv-neutral-grey-400)]">
              No alert deliveries yet. Run a workflow with a Slack step to see messages here.
            </div>
          ) : (
            <div className="divide-y divide-[var(--pv-neutral-grey-100)]">
              {messages.map((msg, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="shrink-0">
                    {msg.status === 'delivered' ? (
                      <CheckCircle2 size={16} className="text-[var(--pv-success-text)]" />
                    ) : (
                      <XCircle size={16} className="text-[var(--pv-error-text)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--pv-neutral-grey-900)]">
                        {msg.workflow_name}
                      </span>
                      <span className="text-[11px] text-[var(--pv-neutral-grey-400)]">
                        &rarr;
                      </span>
                      <span className="text-[12px] text-[var(--pv-neutral-grey-600)] font-mono">
                        #{msg.channel}
                      </span>
                    </div>
                    {msg.error && (
                      <p className="text-[11px] text-[var(--pv-error-text)] mt-0.5">{msg.error}</p>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--pv-neutral-grey-400)] shrink-0">
                    {timeAgo(msg.sent_at)}
                  </div>
                  <Badge variant={msg.status === 'delivered' ? 'success' : 'danger'}>
                    {msg.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Slack Tools Reference */}
      {isConnected && (
        <div className="rounded-xl border border-[var(--pv-neutral-grey-200)] bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--pv-neutral-grey-150)]">
            <h3 className="text-[14px] font-semibold text-[var(--pv-neutral-grey-900)] flex items-center gap-2">
              <Shield size={14} className="text-[var(--pv-neutral-grey-500)]" />
              Available Slack Tools
            </h3>
            <p className="text-[11px] text-[var(--pv-neutral-grey-500)] mt-0.5">
              Pre-built tools used by the agent — auth handled internally, never exposed to LLM
            </p>
          </div>

          <div className="divide-y divide-[var(--pv-neutral-grey-100)]">
            {[
              { name: 'slack_fetch_channels', desc: 'Returns list of channels from the connected Slack workspace', status: 'active' },
              { name: 'slack_send_message', desc: 'Sends a Block Kit message to a specified channel', status: 'active' },
              { name: 'slack_send_message_with_actions', desc: 'Sends a message with interactive button blocks', status: 'active' },
              { name: 'slack_get_channel_info', desc: 'Returns metadata for a specific channel (name, type, member count)', status: 'active' },
              { name: 'slack_validate_connection', desc: 'Validates that the connected Slack workspace is reachable and auth is valid', status: 'active' },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-md bg-[#4A154B]/8 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 54 54" className="opacity-70">
                    <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
                    <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
                    <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
                    <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-mono font-medium text-[var(--pv-neutral-grey-900)]">
                    {tool.name}
                  </span>
                  <p className="text-[11px] text-[var(--pv-neutral-grey-500)] mt-0.5">
                    {tool.desc}
                  </p>
                </div>
                <Badge variant="success">{tool.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
