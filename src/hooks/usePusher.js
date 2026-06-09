import { useEffect, useRef, useState } from 'react'
import Pusher from 'pusher-js'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../config'
import { getApiBase, getAuthToken } from '../api'

export function usePusher({ sessionId, onEvent }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const pusherRef = useRef(null)
  const channelRef = useRef(null)
  const onEventRef = useRef(onEvent)

  // Always keep the ref pointing to the latest callback
  useEffect(() => {
    onEventRef.current = onEvent
  })

  useEffect(() => {
    if (!sessionId) {
      setConnectionStatus('disconnected')
      return
    }

    const apiBase = getApiBase()
    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      userAuthentication: {
        endpoint: `${apiBase}/api/pusher/user-auth`,
        transport: 'ajax',
        headers,
      },
      channelAuthorization: {
        endpoint: `${apiBase}/api/pusher/channel-auth`,
        transport: 'ajax',
        headers,
      },
    })

    pusher.connection.bind('connected', () => {
      setConnectionStatus('connected')
      pusher.signin()
    })
    pusher.connection.bind('disconnected', () => {
      setConnectionStatus('disconnected')
    })
    pusher.connection.bind('error', (err) => {
      console.error('[Pusher] Connection error:', err)
      setConnectionStatus('error')
    })

    const channelName = `session-${sessionId}`
    const channel = pusher.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {})
    channel.bind('pusher:subscription_error', (err) => {
      console.error(`[Pusher] Subscription error for ${channelName}:`, err)
    })

    channel.bind('agent-event', (data) => {
      onEventRef.current(data)
    })

    pusherRef.current = pusher
    channelRef.current = channel

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
      pusher.disconnect()
      pusherRef.current = null
      channelRef.current = null
    }
  }, [sessionId])

  return { connectionStatus }
}
