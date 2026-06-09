import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { getPusherKey, getPusherCluster } from '../config';
import { getApiBaseUrl, getAuthToken } from '../api';

export function usePusher({ sessionId, onEvent, onError, enabled = true }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [subscriptionError, setSubscriptionError] = useState(null);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!sessionId || !enabled) {
      setConnectionStatus('disconnected');
      setSubscriptionError(null);
      return;
    }

    const pusherKey = getPusherKey();
    const pusherCluster = getPusherCluster();

    if (!pusherKey || !pusherCluster) {
      console.warn('[Pusher] Missing pusherKey or pusherCluster');
      return;
    }

    // Set connecting status immediately when starting to connect
    setConnectionStatus('connecting');

    // Track if effect is still active to prevent stale setState
    let isActive = true;

    const apiBase = getApiBaseUrl();
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
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
    });

    // Connection state handlers - must be unbound in cleanup
    const handleStateChange = ({ current }) => {
      if (!isActive) return;
      // Map Pusher states to our simplified status
      // Pusher states: initialized, connecting, connected, unavailable, failed, disconnected
      switch (current) {
        case 'connected':
          setConnectionStatus('connected');
          break;
        case 'connecting':
          setConnectionStatus('connecting');
          break;
        case 'unavailable':
        case 'failed':
          setConnectionStatus('error');
          break;
        case 'disconnected':
        default:
          setConnectionStatus('disconnected');
      }
    };

    const handleConnectionError = (err) => {
      if (!isActive) return;
      console.error('[Pusher] Connection error:', err);
      setConnectionStatus('error');
      onErrorRef.current?.(
        new Error(`Pusher connection error: ${err?.message || 'Unknown error'}`)
      );
    };

    pusher.connection.bind('state_change', handleStateChange);
    pusher.connection.bind('error', handleConnectionError);

    // Sign in after connection established
    pusher.connection.bind('connected', () => {
      if (!isActive) return;
      pusher.signin();
    });

    const channelName = `session-${sessionId}`;
    const channel = pusher.subscribe(channelName);

    // Channel event handler
    const handleAgentEvent = (data) => {
      if (!isActive) return;
      onEventRef.current(data);
    };

    // Subscription success/error handlers
    const handleSubscriptionSucceeded = () => {
      if (!isActive) return;
      setSubscriptionError(null);
    };

    const handleSubscriptionError = (status) => {
      if (!isActive) return;
      const errorMsg = `Channel subscription failed (status: ${status?.status || 'unknown'})`;
      console.error('[Pusher]', errorMsg);
      setSubscriptionError(errorMsg);
      onErrorRef.current?.(new Error(errorMsg));
    };

    channel.bind('agent-event', handleAgentEvent);
    channel.bind('pusher:subscription_succeeded', handleSubscriptionSucceeded);
    channel.bind('pusher:subscription_error', handleSubscriptionError);

    pusherRef.current = pusher;
    channelRef.current = channel;

    // Cleanup: unbind all handlers explicitly
    return () => {
      isActive = false;

      // Unbind channel events
      channel.unbind('agent-event', handleAgentEvent);
      channel.unbind(
        'pusher:subscription_succeeded',
        handleSubscriptionSucceeded
      );
      channel.unbind('pusher:subscription_error', handleSubscriptionError);

      // Unbind connection events
      pusher.connection.unbind('state_change', handleStateChange);
      pusher.connection.unbind('error', handleConnectionError);
      pusher.connection.unbind('connected');

      // Unsubscribe and disconnect
      pusher.unsubscribe(channelName);
      pusher.disconnect();

      pusherRef.current = null;
      channelRef.current = null;
    };
  }, [sessionId, enabled]);

  return { connectionStatus, subscriptionError };
}
