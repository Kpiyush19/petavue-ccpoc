import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSession } from '../hooks/useSession'
import { usePusher } from '../hooks/usePusher'
import { useArtifactPanel } from '../hooks/useArtifactPanel'
import { useWorkspaceTray } from '../hooks/useWorkspaceTray'
import { useSchedules } from '../hooks/useSchedules'
import { inferContentType } from '../utils/fileTypes'
import { apiPost, apiGet } from '../api'

const SessionCtx = createContext(null)

export function useSessionContext() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSessionContext must be used inside <SessionProvider>')
  return ctx
}

export function SessionProvider({ children }) {
  const session = useSession()
  const { connectionStatus } = usePusher({
    sessionId: session.sessionId,
    onEvent: session.handlePusherEvent,
  })
  const artifact = useArtifactPanel()
  const tray = useWorkspaceTray()
  const sched = useSchedules()

  const isThinking = session.status === 'thinking'

  const prevSessionId = useRef(null)
  const prevMsgCountForTray = useRef(0)
  const trayRefreshTimer = useRef(null)
  const prevFetchedSessionId = useRef(null)
  const prevWorkspaceCounter = useRef(0)
  const prevMsgSessionId = useRef(null)
  const prevMsgCount = useRef(0)
  const initialTurnCount = useRef(0)

  useEffect(() => {
    if (session.sessionId !== prevSessionId.current) {
      prevSessionId.current = session.sessionId
      prevMsgCountForTray.current = 0
      prevFetchedSessionId.current = null
      prevWorkspaceCounter.current = 0
      prevMsgSessionId.current = null
      prevMsgCount.current = 0
      initialTurnCount.current = 0
      clearTimeout(trayRefreshTimer.current)
      artifact.reset()
      tray.reset()
    }
  }, [session.sessionId])

  useEffect(() => {
    tray.close()
    artifact.closePanel()
  }, [session.sessionId])

  useEffect(() => {
    if (!session.sessionId) {
      prevFetchedSessionId.current = null
      return
    }
    if (session.status !== 'idle' && session.sessionId !== prevFetchedSessionId.current) {
      prevFetchedSessionId.current = session.sessionId
      tray.fetchFiles(session.sessionId)
    }
  }, [session.sessionId, session.status])

  useEffect(() => {
    if (session.workspaceReadyCounter > prevWorkspaceCounter.current && session.sessionId) {
      tray.fetchFiles(session.sessionId)
    }
    prevWorkspaceCounter.current = session.workspaceReadyCounter
  }, [session.workspaceReadyCounter, session.sessionId, tray.fetchFiles])

  useEffect(() => {
    if (session.sessionId !== prevMsgSessionId.current) {
      prevMsgSessionId.current = session.sessionId
      prevMsgCount.current = session.messages.length
      initialTurnCount.current = session.turnCount
      return
    }

    if (session.messages.length <= prevMsgCount.current || session.turnCount <= initialTurnCount.current) {
      prevMsgCount.current = session.messages.length
      return
    }
    const newMsgs = session.messages.slice(prevMsgCount.current)
    prevMsgCount.current = session.messages.length

    const hasNewOutput = newMsgs.some(
      (m) => m.type === 'outputs' || (m.type === 'tool_call' && (m.tool === 'save_output' || m.tool === 'write_file'))
    )
    if (hasNewOutput && session.sessionId) {
      clearTimeout(trayRefreshTimer.current)
      trayRefreshTimer.current = setTimeout(() => tray.fetchFiles(session.sessionId), 500)
    }
  }, [session.messages, session.sessionId, session.turnCount, tray.fetchFiles])

  useEffect(() => {
    return () => clearTimeout(trayRefreshTimer.current)
  }, [])

  const [syncingSkills, setSyncingSkills] = useState(false)
  const handleSyncSkills = useCallback(async () => {
    if (!session.sessionId || syncingSkills) return
    setSyncingSkills(true)
    try {
      const result = await apiPost(`/api/sessions/${session.sessionId}/skills/sync`, {})
      const parts = []
      if (result.pushed > 0) parts.push(`${result.pushed} pushed`)
      if (result.pulled > 0) parts.push(`${result.pulled} loaded`)
      if (parts.length > 0) {
        toast.success(`Skills synced: ${parts.join(', ')}`)
      } else {
        toast.info('Skills are up to date')
      }
      tray.fetchFiles(session.sessionId)
    } catch (e) {
      toast.error(`Skill sync failed: ${e.message}`)
    } finally {
      setSyncingSkills(false)
    }
  }, [session.sessionId, syncingSkills, tray.fetchFiles])

  const renameSession = useCallback((name) => {
    session.setSessionName(name)
  }, [session.setSessionName])

  const handleFileClick = useCallback((file) => {
    artifact.openArtifact({
      path: file.path,
      title: file.name,
      contentType: file.content_type,
      source: 'workspace',
    })
  }, [artifact.openArtifact])

  const value = {
    session,
    connectionStatus,
    isThinking,
    artifact,
    tray,
    sched,
    syncingSkills,
    handleSyncSkills,
    handleFileClick,
    renameSession,
  }

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
}
