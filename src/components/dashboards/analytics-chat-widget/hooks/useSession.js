import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createSession,
  getSessionStatus,
  getSessionHistory,
  uploadFiles,
  sendMessage,
  cancelTurn,
  deleteLastMessage,
} from '../api';

let msgIdCounter = 0;
function nextId() {
  return `msg-${++msgIdCounter}`;
}

export function useSession() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState(null);
  const [dashboardId, setDashboardId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | active | thinking
  const [totalTokens, setTotalTokens] = useState(0);
  const [contextThreshold, setContextThreshold] = useState(0);
  const [contextUsagePercent, setContextUsagePercent] = useState(0);
  const [isCompacting, setIsCompacting] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [eventLog, setEventLog] = useState([]);

  const pusherDeliveredRef = useRef(false);
  const textTruncatedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const [workspaceReadyCounter, setWorkspaceReadyCounter] = useState(0);

  // ─── Helpers ──────────────────────────────────────

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: nextId(), ...msg }]);
  }, []);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const addSystemMsg = useCallback(
    (text) => {
      addMessage({ type: 'system', text });
    },
    [addMessage]
  );

  const logEvent = useCallback((event) => {
    const ts = new Date().toLocaleTimeString();
    let summary = event.type;
    if (event.type === 'text')
      summary += `: ${(event.content || '').slice(0, 80)}`;
    if (event.type === 'tool_call') summary += `: ${event.tool}`;
    if (event.type === 'tool_result')
      summary += `: ${event.tool} (${event.result_length} chars)`;
    if (event.type === 'error') summary += `: ${event.error}`;
    setEventLog((prev) => [
      ...prev,
      { timestamp: ts, type: event.type, summary },
    ]);
  }, []);

  // ─── Pusher event handler ────────────────────────
  const handlePusherEvent = useCallback(
    (event) => {
      logEvent(event);

      if (event.type === 'text') {
        pusherDeliveredRef.current = true;
        if (event.truncated) textTruncatedRef.current = true;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.type === 'assistant' && last.isStreaming) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...last,
              text: last.text + (event.content || ''),
            };
            return updated;
          }
          return [
            ...prev,
            {
              id: nextId(),
              type: 'assistant',
              text: event.content || '',
              isStreaming: true,
              timestamp: Date.now(),
            },
          ];
        });
      } else if (event.type === 'tool_call') {
        addMessage({
          type: 'tool_call',
          tool: event.tool,
          input: event.input,
          status: 'running',
          resultLength: null,
        });
      } else if (event.type === 'tool_result') {
        setMessages((prev) => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (
              updated[i].type === 'tool_call' &&
              updated[i].tool === event.tool &&
              updated[i].status === 'running'
            ) {
              const patch = {
                ...updated[i],
                status: 'done',
                resultLength: event.result_length,
              };
              if (event.diff) patch.diff = event.diff;
              updated[i] = patch;
              break;
            }
          }
          return updated;
        });
      } else if (event.type === 'done') {
        setStatus('active');
        if (event.context_tokens != null) setTotalTokens(event.context_tokens);
        else if (event.total_tokens != null) setTotalTokens(event.total_tokens);
        if (event.turn_count != null) setTurnCount(event.turn_count);
        setMessages((prev) => {
          let updated = prev.map((m) =>
            m.type === 'assistant' && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          );
          if (event.outputs && event.outputs.length > 0) {
            updated = [
              ...updated,
              { id: nextId(), type: 'outputs', outputs: event.outputs },
            ];
          }
          return updated;
        });
        const currentSid = sessionIdRef.current;
        if (currentSid) {
          queryClient.invalidateQueries(['workspace-files', currentSid]);
        }
        queryClient.invalidateQueries('dashboard-sessions');

        if (event.truncated || textTruncatedRef.current) {
          textTruncatedRef.current = false;
          const sid = sessionIdRef.current;
          if (sid) {
            getSessionHistory(sid)
              .then((histData) => {
                const histMsgs = histData.messages || [];
                let fullText = null;
                for (let i = histMsgs.length - 1; i >= 0; i--) {
                  const m = histMsgs[i];
                  if (
                    (m.type === 'assistant' || m.role === 'assistant') &&
                    m.text
                  ) {
                    fullText = m.text;
                    break;
                  }
                }
                if (fullText) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].type === 'assistant') {
                        updated[i] = { ...updated[i], text: fullText };
                        break;
                      }
                    }
                    return updated;
                  });
                }
              })
              .catch((err) => {
                console.warn(
                  '[Session] Failed to fetch full text after truncation:',
                  err
                );
              });
          }
        }
      } else if (event.type === 'stopped') {
        setStatus('active');
        setMessages((prev) =>
          prev.map((m) =>
            m.type === 'assistant' && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
        const currentSid = sessionIdRef.current;
        if (currentSid) {
          queryClient.invalidateQueries(['workspace-files', currentSid]);
        }
        queryClient.invalidateQueries('dashboard-sessions');
      } else if (event.type === 'error') {
        setStatus('active');
        addMessage({
          type: 'assistant',
          text: `Error: ${event.error}`,
          isError: true,
        });
      } else if (event.type === 'context_update') {
        setTotalTokens(event.context_tokens || 0);
        setContextThreshold(event.threshold || 0);
        setContextUsagePercent(event.usage_percent || 0);
      } else if (event.type === 'compaction_start') {
        setIsCompacting(true);
      } else if (event.type === 'compaction_end') {
        setIsCompacting(false);
        if (event.context_tokens != null) setTotalTokens(event.context_tokens);
        if (event.usage_percent != null)
          setContextUsagePercent(event.usage_percent);
        if (event.success) {
          addMessage({
            type: 'compaction_marker',
            messagesCompacted: 0,
            summaryPreview: '',
            emergency: event.emergency || false,
          });
        }
      } else if (event.type === 'workspace_ready') {
        setWorkspaceReadyCounter((c) => c + 1);
        const steps = event.steps || {};
        const parts = [];
        for (const [step, info] of Object.entries(steps)) {
          if (info.status === 'done')
            parts.push(`${step}: ${info.details || 'done'}`);
          else if (info.status === 'error') parts.push(`${step}: error`);
        }
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) =>
              m.type === 'system' && m.text?.includes('Preparing workspace')
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              text: parts.length
                ? 'Workspace: ' + parts.join(' | ')
                : 'Workspace ready.',
            };
            return updated;
          }
          if (parts.length)
            return [
              ...prev,
              {
                id: nextId(),
                type: 'system',
                text: 'Workspace: ' + parts.join(' | '),
              },
            ];
          return prev;
        });
      } else if (event.type === 'workspace_error') {
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) =>
              m.type === 'system' && m.text?.includes('Preparing workspace')
          );
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              text: `Workspace preparation failed: ${event.error}`,
            };
            return updated;
          }
          return [
            ...prev,
            {
              id: nextId(),
              type: 'system',
              text: `Workspace preparation failed: ${event.error}`,
            },
          ];
        });
      } else if (event.type === 'refresh_divider') {
        addMessage({
          type: 'refresh_divider',
          text: event.text || 'Dashboard refreshed',
          timestamp: event.timestamp || Date.now(),
        });
      }
    },
    [logEvent, addMessage, queryClient]
  );

  // ─── Create session ──────────────────────────────
  const doCreateSession = useCallback(async (dashId) => {
    const data = await createSession(dashId);
    const sid = data.session.session_id;
    setSessionId(sid);
    setDashboardId(data.session.dashboard_id || dashId);
    setStatus('active');
    setTotalTokens(0);
    setTurnCount(0);

    const modeText = dashId ? `Dashboard: ${dashId}` : 'Mode: Data Exploration';
    const newMessages = [
      { id: nextId(), type: 'system', text: `Session created. ${modeText}` },
    ];

    if (dashId) {
      newMessages.push({
        id: nextId(),
        type: 'system',
        text: 'Preparing workspace...',
      });
    }

    setMessages(newMessages);
    setEventLog([]);
    return sid;
  }, []);

  const doSendMessage = useCallback(
    async (text, files = []) => {
      if (!sessionId || status === 'thinking') return;
      if (!text.trim() && files.length === 0) return;

      const attachmentNames = files.map((f) => f.name);
      addMessage({
        type: 'user',
        text,
        attachments: attachmentNames.length > 0 ? attachmentNames : undefined,
        timestamp: Date.now(),
      });
      pusherDeliveredRef.current = false;
      textTruncatedRef.current = false;
      setStatus('thinking');

      try {
        let attachments = null;

        if (files.length > 0) {
          try {
            const uploadData = await uploadFiles(sessionId, files);
            const successful = (uploadData.uploads || []).filter(
              (u) => !u.error
            );
            const failed = (uploadData.uploads || []).filter((u) => u.error);

            if (failed.length > 0) {
              for (const f of failed) {
                addMessage({
                  type: 'system',
                  text: `Upload failed: ${f.filename} — ${f.error}`,
                });
              }
            }

            if (successful.length > 0) {
              attachments = successful.map((u) => ({
                path: u.path,
                name: u.filename,
                type: u.type,
                size: u.size,
                columns: u.columns || null,
                rows: u.rows || null,
                shape: u.shape || null,
                dimensions: u.dimensions || null,
              }));
            }
          } catch (e) {
            addMessage({ type: 'system', text: `Upload failed: ${e.message}` });
            setStatus('active');
            return;
          }
        }

        await sendMessage(sessionId, text, attachments);
      } catch (e) {
        addMessage({
          type: 'assistant',
          text: `Request failed: ${e.message}`,
          isError: true,
        });
        setStatus('active');
      }
    },
    [sessionId, status, addMessage]
  );

  const doCancelTurn = useCallback(async () => {
    if (!sessionId || status !== 'thinking') return;
    try {
      await cancelTurn(sessionId);
    } catch (e) {
      console.warn('Cancel request failed:', e.message);
    }
  }, [sessionId, status]);

  const doDeleteLastMessage = useCallback(async () => {
    if (!sessionId || status === 'thinking') return;
    try {
      await deleteLastMessage(sessionId);
      setMessages((prev) => {
        let lastUserIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].type === 'user') {
            lastUserIdx = i;
            break;
          }
        }
        if (lastUserIdx === -1) return prev;
        return prev.slice(0, lastUserIdx);
      });
      setTurnCount((prev) => Math.max(0, prev - 1));
      queryClient.invalidateQueries(['workspace-files', sessionId]);
      queryClient.invalidateQueries('dashboard-sessions');
    } catch (e) {
      addSystemMsg(`Failed to delete message: ${e.message}`);
    }
  }, [sessionId, status, addSystemMsg, queryClient]);

  // ─── Resume existing session ─────────────────────
  const resumeSession = useCallback(
    async (existingSessionId, existingDashboardId = null) => {
      try {
        const [statusData, historyData] = await Promise.all([
          getSessionStatus(existingSessionId),
          getSessionHistory(existingSessionId),
        ]);

        setSessionId(existingSessionId);
        setDashboardId(existingDashboardId);
        setStatus(statusData.agent_running ? 'thinking' : 'active');
        setTotalTokens(
          statusData.total_tokens || historyData.total_tokens || 0
        );
        setTurnCount(statusData.turn_count || historyData.turn_count || 0);

        const restoredMessages = [];
        for (const msg of historyData.messages || []) {
          const msgType = msg.type || msg.role;
          if (msgType === 'user') {
            restoredMessages.push({
              id: nextId(),
              type: 'user',
              text: msg.text || '',
              attachments: msg.attachments || undefined,
              timestamp: msg.timestamp || 0,
            });
          } else if (msgType === 'assistant') {
            restoredMessages.push({
              id: nextId(),
              type: 'assistant',
              text: msg.text || '',
              isStreaming: false,
              timestamp: msg.timestamp || 0,
            });
          } else if (msgType === 'system') {
            restoredMessages.push({
              id: nextId(),
              type: 'system',
              text: msg.text || '',
            });
          } else if (msgType === 'tool_call') {
            restoredMessages.push({
              id: nextId(),
              type: 'tool_call',
              tool: msg.tool || 'unknown',
              input: msg.input || {},
              inputSummary: msg.input_summary || '',
              status: 'done',
              resultLength: null,
            });
          } else if (msgType === 'tool_result') {
            for (let i = restoredMessages.length - 1; i >= 0; i--) {
              if (
                restoredMessages[i].type === 'tool_call' &&
                restoredMessages[i].tool === msg.tool &&
                restoredMessages[i].resultLength === null
              ) {
                restoredMessages[i].resultLength = msg.result_length || 0;
                if (msg.diff) restoredMessages[i].diff = msg.diff;
                break;
              }
            }
          } else if (msgType === 'tool') {
            restoredMessages.push({
              id: nextId(),
              type: 'tool_call',
              tool: msg.tool || 'unknown',
              input: msg.input || {},
              status: 'done',
              resultLength: msg.result_length || 0,
            });
          } else if (msgType === 'outputs') {
            restoredMessages.push({
              id: nextId(),
              type: 'outputs',
              outputs: msg.outputs || [],
            });
          } else if (msgType === 'refresh_divider') {
            restoredMessages.push({
              id: nextId(),
              type: 'refresh_divider',
              text: msg.text || 'Dashboard refreshed',
              timestamp: msg.timestamp || 0,
            });
          } else if (msgType === 'compaction_marker') {
            restoredMessages.push({
              id: nextId(),
              type: 'compaction_marker',
              messagesCompacted: msg.messages_compacted || 0,
              summaryPreview: msg.summary_preview || '',
              emergency: msg.emergency || false,
            });
          }
        }

        setMessages(restoredMessages);
        setEventLog([]);

        return existingSessionId;
      } catch (e) {
        console.error('[Session] Resume failed:', e);
        throw e;
      }
    },
    []
  );

  // ─── Reset session state ────────────────────────
  const resetSession = useCallback(() => {
    setSessionId(null);
    setDashboardId(null);
    setStatus('idle');
    setTotalTokens(0);
    setContextThreshold(0);
    setContextUsagePercent(0);
    setIsCompacting(false);
    setTurnCount(0);
    setMessages([]);
    setEventLog([]);
    setWorkspaceReadyCounter(0);
    pusherDeliveredRef.current = false;
    textTruncatedRef.current = false;
    sessionIdRef.current = null;
  }, []);

  return {
    sessionId,
    dashboardId,
    status,
    totalTokens,
    contextThreshold,
    contextUsagePercent,
    isCompacting,
    turnCount,
    messages,
    eventLog,
    workspaceReadyCounter,
    createSession: doCreateSession,
    resumeSession,
    resetSession,
    sendMessage: doSendMessage,
    cancelTurn: doCancelTurn,
    deleteLastMessage: doDeleteLastMessage,
    handlePusherEvent,
  };
}
