import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Save, Trash2, RotateCcw, Maximize2, Minimize2, Pencil } from 'lucide-react'
import Pusher from 'pusher-js'
import { PUSHER_KEY, PUSHER_CLUSTER } from '../config'
import { Dialog, DialogHeader } from './ui/Dialog'
import { Button } from './ui/Button'
import { apiPost, apiGet, apiDelete, getApiBase, getAuthToken } from '../api'
import PublishFormStep from './PublishFormStep'
import RecipeVerifyStep from './RecipeVerifyStep'

export default function PublishModal({ targetFile, targetTitle, sessionId, onClose }) {
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1) // 1 = form, 2 = verify

  // Step 1: form values
  const [name, setName] = useState(targetTitle || 'Dashboard')
  const [shared, setShared] = useState(true)
  const [cronPreset, setCronPreset] = useState('0 9 * * *')
  const [timezone, setTimezone] = useState('UTC')
  const [recipients, setRecipients] = useState('')

  // Re-publish state (edit existing dashboard)
  const [existingCheck, setExistingCheck] = useState({ loading: true, exists: false })
  const [republishId, setRepublishId] = useState(null) // null = new publish, string = update existing

  // Step 2: recipe verification
  const [extracting, setExtracting] = useState(false)
  const [recipe, setRecipe] = useState(null)
  const [verifySessionId, setVerifySessionId] = useState(null)
  const [stepResults, setStepResults] = useState({})
  const [removedSteps, setRemovedSteps] = useState(new Set())
  const [publishing, setPublishing] = useState(false)

  // Code-to-English feature flag
  const [codeToNl, setCodeToEnglish] = useState(false)

  // StepGraph feature flag
  const [stepGraphEnabled, setStepGraphEnabled] = useState(false)

  // Summary streaming state
  const [summaryStatus, setSummaryStatus] = useState(null)
  const summaryCleanupRef = useRef(null)

  // Layout state
  const [maximized, setMaximized] = useState(false)

  // Draft state
  const [draftCheck, setDraftCheck] = useState({ loading: true, hasDraft: false })
  const [savedAsDraft, setSavedAsDraft] = useState(false)

  const verifySessionIdRef = useRef(null)

  // Check for existing draft + existing published artifact on mount
  useEffect(() => {
    if (!sessionId || !targetFile) return
    let cancelled = false

    // Check for draft
    apiGet(`/api/sessions/${sessionId}/recipe/verify/draft?target_file=${encodeURIComponent(targetFile)}`)
      .then((data) => {
        if (cancelled) return
        if (data.has_draft) {
          const fv = data.form_values
          // Pre-fill form with draft values immediately (visible before user clicks Resume)
          if (fv) {
            if (fv.name) setName(fv.name)
            if (fv.shared !== undefined) setShared(fv.shared)
            if (fv.cron_expression) setCronPreset(fv.cron_expression)
            if (fv.timezone) setTimezone(fv.timezone)
            if (fv.recipients !== undefined) setRecipients(fv.recipients)
          }
          if (data.republish_id) setRepublishId(data.republish_id)
          setDraftCheck({
            loading: false,
            hasDraft: true,
            verifySessionId: data.verify_session_id,
            stepsCompleted: data.steps_completed,
            totalSteps: data.total_steps,
            recipe: data.recipe,
            stepResults: data.step_results,
            republishId: data.republish_id || null,
            formValues: fv || null,
            codeToNl: data.code_to_nl === true,
          })
        } else {
          setDraftCheck({ loading: false, hasDraft: false })
        }
      })
      .catch(() => {
        if (!cancelled) setDraftCheck({ loading: false, hasDraft: false })
      })

    // Check for existing published artifact (re-publish detection)
    apiGet(`/api/sessions/${sessionId}/published-check?target_file=${encodeURIComponent(targetFile)}`)
      .then((data) => {
        if (cancelled) return
        if (data.exists && data.artifacts?.length > 0) {
          setExistingCheck({
            loading: false,
            exists: true,
            artifacts: data.artifacts,
          })
        } else {
          setExistingCheck({ loading: false, exists: false })
        }
      })
      .catch(() => {
        if (!cancelled) setExistingCheck({ loading: false, exists: false })
      })

    return () => { cancelled = true }
  }, [sessionId, targetFile])

  // Cleanup Pusher summary stream on unmount
  useEffect(() => {
    return () => {
      if (summaryCleanupRef.current) summaryCleanupRef.current()
    }
  }, [])

  // Choose to update a specific existing published artifact
  const handleUpdateExisting = (artifact) => {
    setRepublishId(artifact.published_id)
    setName(artifact.name)
    setShared(artifact.shared)
    if (artifact.schedule) {
      setCronPreset(artifact.schedule.cron_expression || '0 9 * * *')
      setTimezone(artifact.schedule.timezone || 'UTC')
      setRecipients((artifact.schedule.recipients || []).join(', '))
    }
    setExistingCheck({ ...existingCheck, exists: false }) // hide banner after choosing
  }

  // Choose to create new (ignore existing)
  const handleCreateNew = () => {
    setRepublishId(null)
    setExistingCheck({ ...existingCheck, exists: false }) // hide banner
  }

  // Resume from draft
  const handleResumeDraft = () => {
    const d = draftCheck
    setCodeToEnglish(d.codeToNl || false)
    setRecipe(d.recipe)
    setVerifySessionId(d.verifySessionId)
    verifySessionIdRef.current = d.verifySessionId
    setStepResults(d.stepResults || {})
    if (d.republishId) setRepublishId(d.republishId)
    // Restore form values saved at draft time
    if (d.formValues) {
      if (d.formValues.name) setName(d.formValues.name)
      if (d.formValues.shared !== undefined) setShared(d.formValues.shared)
      if (d.formValues.cron_expression) setCronPreset(d.formValues.cron_expression)
      if (d.formValues.timezone) setTimezone(d.formValues.timezone)
      if (d.formValues.recipients !== undefined) setRecipients(d.formValues.recipients)
    }
    setWizardStep(2)
    setDraftCheck({ ...d, hasDraft: false }) // clear banner after resuming
  }

  // Discard draft and start fresh
  const handleDiscardDraft = async () => {
    const vsid = draftCheck.verifySessionId
    setDraftCheck({ loading: false, hasDraft: false })
    if (vsid) {
      try {
        await apiDelete(`/api/sessions/${vsid}?archive=false`)
      } catch { /* non-fatal */ }
    }
  }

  // Cleanup verify session (only if not saved as draft)
  const cleanupVerifySession = useCallback(async () => {
    const vsid = verifySessionIdRef.current
    if (vsid) {
      verifySessionIdRef.current = null
      try {
        await apiDelete(`/api/sessions/${vsid}?archive=false`)
      } catch { /* non-fatal */ }
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
    pusher.connection.bind('connected', () => pusher.signin())
    const ch = pusher.subscribe(channel)

    const cleanup = () => {
      ch.unbind_all()
      pusher.unsubscribe(channel)
      // Defer disconnect to avoid "WebSocket is already in CLOSING" warning
      // when cleanup is called inside a Pusher event handler
      setTimeout(() => pusher.disconnect(), 100)
      setSummaryStatus(null)
    }

    summaryCleanupRef.current = cleanup

    ch.bind('summary-status', (data) => {
      setSummaryStatus(data.message || 'Generating summaries...')
    })

    ch.bind('summary-batch', (data) => {
      // Merge batch summaries into recipe steps
      if (data.summaries) {
        setRecipe(prev => {
          if (!prev) return prev
          const updated = { ...prev, steps: prev.steps.map(step => {
            const summary = data.summaries[step.id]
            if (summary) return { ...step, summary }
            return step
          })}
          return updated
        })
      }
    })

    ch.bind('summary-complete', (data) => {
      // Final merge — groups + metadata (summaries already arrived via summary-batch)
      setRecipe(prev => {
        if (!prev) return prev
        const updated = { ...prev }
        if (data.groups) updated.groups = data.groups
        updated.summary_metadata = {
          route: data.route,
          token_usage: data.token_usage,
          generated_at: data.generated_at,
          metrics: data.metrics,
        }
        return updated
      })
      cleanup()
      summaryCleanupRef.current = null
    })

    ch.bind('summary-failed', (data) => {
      setSummaryStatus(null)
      console.warn('[summary] failed:', data.error)
      cleanup()
      summaryCleanupRef.current = null
    })
  }, [])

  // Step 1 → Step 2: Extract recipe + init verify session
  const handleNext = async () => {
    if (!name.trim()) return
    setExtracting(true)

    try {
      // 1. Extract recipe
      const recipeResult = await apiPost(
        `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent(targetFile)}`,
        {}
      )
      const extractedRecipe = recipeResult.recipe

      // 2. Init verify session (also cleans up any old drafts)
      const initBody = { recipe: extractedRecipe }
      if (republishId) initBody.republish_id = republishId
      // Persist form values so draft resume restores them
      initBody.form_values = {
        name: name.trim(),
        shared,
        cron_expression: cronPreset,
        timezone,
        recipients,
      }
      const initResult = await apiPost(
        `/api/sessions/${sessionId}/recipe/verify/init`,
        initBody
      )

      const isCodeToEnglish = recipeResult.code_to_nl === true
      setCodeToEnglish(isCodeToEnglish)
      setStepGraphEnabled(recipeResult.step_graph === true)

      setRecipe(extractedRecipe)
      setVerifySessionId(initResult.verify_session_id)
      verifySessionIdRef.current = initResult.verify_session_id
      setStepResults({})
      setSavedAsDraft(false)
      setWizardStep(2)

      // Show skeleton + subscribe only when summaries are being generated (not cached)
      if (isCodeToEnglish && recipeResult.summary_channel) {
        setSummaryStatus('Generating summaries...')
        subscribeSummaryChannel(recipeResult.summary_channel)
      }

    } catch (e) {
      toast.error('Failed to extract recipe: ' + e.message)
    } finally {
      setExtracting(false)
    }
  }

  // Regenerate summaries (skip cache)
  const handleRegenerate = async () => {
    setSummaryStatus('Regenerating...')
    try {
      const recipeResult = await apiPost(
        `/api/sessions/${sessionId}/recipe?target_file=${encodeURIComponent(targetFile)}&skip_cache=true`,
        {}
      )
      const extractedRecipe = recipeResult.recipe
      setRecipe(extractedRecipe)

      if (recipeResult.summary_channel) {
        subscribeSummaryChannel(recipeResult.summary_channel)
      } else {
        setSummaryStatus(null)
      }
    } catch (e) {
      toast.error('Failed to regenerate: ' + e.message)
      setSummaryStatus(null)
    }
  }

  // Step 2 → Step 1: Go back
  const handleBack = async () => {
    setWizardStep(1)
    if (summaryCleanupRef.current) summaryCleanupRef.current()
    await cleanupVerifySession()
    setRecipe(null)
    setVerifySessionId(null)
    setStepResults({})
    setRemovedSteps(new Set())
    setSavedAsDraft(false)
  }

  // Save Draft — close without cleanup
  const handleSaveDraft = () => {
    verifySessionIdRef.current = null // prevent cleanup on unmount
    setSavedAsDraft(true)
    toast.success('Draft saved. You can resume verification later')
    onClose()
  }

  // Publish — called from step 2 after all steps pass
  const handlePublish = async () => {
    setPublishing(true)
    try {
      const body = {
        name: name.trim(),
        target_file: targetFile,
        source_session_id: sessionId,
        shared,
        cron_expression: cronPreset,
        timezone,
        recipients: recipients
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        skipped_steps: [...removedSteps],
      }
      // If re-publishing, include the existing published_id
      if (republishId) {
        body.published_id = republishId
      }
      const result = await apiPost('/api/published', body)
      const action = result.republished ? 'Updated' : 'Published'
      toast.success(`${action} "${name}" with ${result.schedule?.cron_description || 'auto-refresh'}`)

      // Cleanup verify session after successful publish
      await cleanupVerifySession()
      onClose()
    } catch (e) {
      toast.error('Failed to publish: ' + e.message)
    } finally {
      setPublishing(false)
    }
  }

  // Close handler — cleanup verify session unless saved as draft
  const handleClose = () => {
    if (!savedAsDraft) {
      cleanupVerifySession()
    }
    onClose()
  }

  return (
    <Dialog
      open
      onClose={handleClose}
      className={`w-full transition-all ${
        wizardStep === 1
          ? 'max-w-md'
          : maximized
            ? 'max-w-[95vw] !max-h-[95vh]'
            : 'max-w-5xl'
      }`}
    >
      <div className={`flex flex-col ${maximized ? 'h-[95vh]' : 'max-h-[85vh]'}`}>
        <DialogHeader onClose={handleClose}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            {wizardStep === 1
              ? (republishId ? 'Update Dashboard' : 'Publish & Schedule')
              : 'Verify Recipe Steps'}
          </h3>
          {wizardStep === 2 && (
            <>
              <span className="text-[11px] text-[var(--text-muted)] ml-2">
                Step 2 of 2
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMaximized((m) => !m)}
                title={maximized ? 'Restore size' : 'Maximize'}
                className="ml-auto mr-1"
              >
                {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </Button>
            </>
          )}
        </DialogHeader>

        {/* Existing published artifact banner — shown on step 1 when re-publish detected */}
        {wizardStep === 1 && existingCheck.exists && existingCheck.artifacts?.length === 1 && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/25 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                Already published as &ldquo;{existingCheck.artifacts[0].name}&rdquo;
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Update the existing dashboard or create a new one
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="primary" size="sm" onClick={() => handleUpdateExisting(existingCheck.artifacts[0])}>
                <Pencil size={12} /> Update Existing
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCreateNew}>
                Create New
              </Button>
            </div>
          </div>
        )}

        {/* Multiple existing artifacts — let user pick which one to update */}
        {wizardStep === 1 && existingCheck.exists && existingCheck.artifacts?.length > 1 && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/25">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-1">
              This file has {existingCheck.artifacts.length} published dashboards
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] mb-2">
              Choose one to update, or create a new dashboard
            </p>
            <div className="space-y-1.5 mb-2">
              {existingCheck.artifacts.map((art) => (
                <button
                  key={art.published_id}
                  onClick={() => handleUpdateExisting(art)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                    bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                    hover:border-[var(--accent)] hover:bg-[var(--accent)]/4 transition-colors
                    cursor-pointer"
                >
                  <Pencil size={11} className="text-[var(--text-muted)] shrink-0" />
                  <span className="text-[12px] font-medium text-[var(--text-primary)] truncate flex-1">
                    {art.name}
                  </span>
                  {art.shared && (
                    <span className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded-full shrink-0">
                      Shared
                    </span>
                  )}
                  {art.paused && (
                    <span className="text-[10px] text-[var(--status-warning)] bg-[var(--status-warning)]/10 px-1.5 py-0.5 rounded-full shrink-0">
                      Paused
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={handleCreateNew}>
              Create New Instead
            </Button>
          </div>
        )}

        {/* Re-publish indicator — shown after user chose "Update Existing" */}
        {wizardStep === 1 && republishId && !existingCheck.exists && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-xl bg-[var(--accent)]/6 border border-[var(--accent)]/15 flex items-center gap-2">
            <Pencil size={12} className="text-[var(--accent)] shrink-0" />
            <span className="text-[11px] text-[var(--text-secondary)]">
              Updating existing dashboard: same URL will be preserved
            </span>
            <button
              onClick={() => setRepublishId(null)}
              className="ml-auto text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
            >
              Switch to new
            </button>
          </div>
        )}

        {/* Draft resume banner — shown on step 1 when a draft exists */}
        {wizardStep === 1 && draftCheck.hasDraft && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/20 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                Saved draft found
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
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
        )}

        {wizardStep === 1 && (
          <PublishFormStep
            name={name} setName={setName}
            targetFile={targetFile}
            shared={shared} setShared={setShared}
            cronPreset={cronPreset} setCronPreset={setCronPreset}
            timezone={timezone} setTimezone={setTimezone}
            recipients={recipients} setRecipients={setRecipients}
            onCancel={handleClose}
            onNext={handleNext}
            extracting={extracting}
            isUpdate={!!republishId}
          />
        )}

        {wizardStep === 2 && recipe && (
          <RecipeVerifyStep
            recipe={recipe}
            sessionId={sessionId}
            verifySessionId={verifySessionId}
            stepResults={stepResults}
            setStepResults={setStepResults}
            removedSteps={removedSteps}
            setRemovedSteps={setRemovedSteps}
            onPublish={handlePublish}
            onBack={handleBack}
            onSaveDraft={handleSaveDraft}
            onRegenerate={codeToNl ? handleRegenerate : undefined}
            publishing={publishing}
            summaryStatus={summaryStatus}
            codeToNl={codeToNl}
            isUpdate={!!republishId}
          />
        )}
      </div>
    </Dialog>
  )
}
