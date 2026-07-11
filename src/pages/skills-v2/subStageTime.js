// Shared sub-stage time + overrun utilities. Originally lived in
// RunProgressBar.jsx; extracted so SetupSubStepList (Plan-phase active
// row) and ExecutionProgress (active verify row) can render inline time
// hints without duplicating the constants or the stopwatch logic.
//
// Calibrated to P90 from production telemetry — `expected` represents
// the long end of typical, so 1.5× catches genuinely-slow runs (not the
// P50–P90 tail).

import { useEffect, useRef, useState } from 'react'


export const EXPECTED_SECONDS = {
  reviewing_data:     251,  // P90 = 4:11  (P50 3:07)
  verifying_answers:  123,  // P90 = 2:02  (P50 1:06)
  drafting_plan:      219,  // P90 = 3:39  (P50 3:00)
  reviewing_plan:     106,  // P90 = 1:46  (P50 1:30)
  running_checks:     393,  // P90 = 6:33  (P50 4:40)  — verifier round 1
  applying_fixes:     255,  // P90 = 4:15  (P50 1:40)
  final_check:        350,  // P90 = 5:50  (P50 4:43)  — verifier round 2
}

export const TIME_HINT_LABEL = {
  reviewing_data:     'usually 3–4 minutes',
  verifying_answers:  'usually 1–2 minutes',
  drafting_plan:      'usually 3–4 minutes',
  reviewing_plan:     'usually 1–2 minutes',
  running_checks:     'usually 5–7 minutes',
  applying_fixes:     'usually 2–4 minutes',
  final_check:        'usually 5–6 minutes',
}

// Stage-specific 3× copy — surfaced in the row's `title` tooltip when
// the inline hint switches to "running long" so the user can see the
// fuller explanation by hovering.
export const OVERRUN_3X_COPY = {
  reviewing_data:     'Still reviewing data. Large catalogs can take a few extra minutes.',
  verifying_answers:  'Still verifying answers. This can take a moment.',
  drafting_plan:      'Still drafting. Complex plans take more time.',
  reviewing_plan:     'Still reviewing the plan for completeness.',
  running_checks:     'Still reviewing. Taking a closer look at the result.',
  applying_fixes:     'Still refining. Making final touches before wrapping up.',
  final_check:        'Still on the final check. Taking a thorough look.',
}


// Stopwatch hook — elapsed seconds since the active sub-stage key
// changed. Pauses while `paused` is true (Pusher disconnect, or the
// user-gated states where the clock shouldn't run). Returns 0 when
// subStageKey is null/empty so callers can safely call this even when
// no row is active.
export function useSubStageStopwatch(subStageKey, paused) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const pausedAtRef = useRef(null)
  const lastKeyRef = useRef(subStageKey)

  useEffect(() => {
    if (subStageKey !== lastKeyRef.current) {
      lastKeyRef.current = subStageKey
      startRef.current = Date.now()
      pausedAtRef.current = null
      setElapsed(0)
    }
  }, [subStageKey])

  useEffect(() => {
    if (paused) {
      if (pausedAtRef.current == null) {
        pausedAtRef.current = Date.now()
      }
    } else {
      if (pausedAtRef.current != null) {
        const pausedFor = Date.now() - pausedAtRef.current
        startRef.current += pausedFor
        pausedAtRef.current = null
      }
    }
  }, [paused])

  useEffect(() => {
    if (paused || !subStageKey) return undefined
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [paused, subStageKey])

  return subStageKey ? elapsed : 0
}


// Inline time-hint computation — used by the active row in
// SetupSubStepList and the active verify row in ExecutionProgress.
// Returns an object describing what to render inline:
//
//   { text, tooltip, severity, showCancel }
//
//   severity: 'normal' | 'warn' | 'overrun' | 'critical'
//   text:     short inline copy (fits in a row's right column)
//   tooltip:  longer description, attached as `title` for hover
//   showCancel: true on the 5× tier; caller renders a Cancel button
//
// Returns null when the sub-stage has no EXPECTED_SECONDS entry
// (no clock applies — caller should render nothing for it).
export function getInlineTimeHint(subStageKey, elapsed) {
  if (!subStageKey) return null
  const expected = EXPECTED_SECONDS[subStageKey]
  if (!expected) return null
  const normalText = TIME_HINT_LABEL[subStageKey] || ''
  if (elapsed >= expected * 5) {
    return {
      text: 'much longer than usual',
      tooltip: `Taking much longer than usual. ${OVERRUN_3X_COPY[subStageKey] || ''}`.trim(),
      severity: 'critical',
      showCancel: true,
    }
  }
  if (elapsed >= expected * 3) {
    return {
      text: 'running long',
      tooltip: OVERRUN_3X_COPY[subStageKey] || 'Running longer than usual.',
      severity: 'overrun',
      showCancel: false,
    }
  }
  if (elapsed >= expected * 1.5) {
    return {
      text: 'taking longer than usual',
      tooltip: normalText
        ? `Typically ${normalText.replace(/^usually\s+/i, '')}.`
        : 'Taking longer than usual.',
      severity: 'warn',
      showCancel: false,
    }
  }
  return {
    text: normalText,
    tooltip: '',
    severity: 'normal',
    showCancel: false,
  }
}


// Map severity → tailwind text-color class. Centralized so SetupSubStepList
// and ExecutionProgress verify rows render the same colors.
export function severityTextClass(severity) {
  if (severity === 'critical') return 'text-[var(--color-red)] font-medium'
  if (severity === 'overrun')  return 'text-amber-700 font-medium'
  if (severity === 'warn')     return 'text-amber-600'
  return 'text-[var(--text-muted)]'
}


// Map severity → tailwind border-tint class for the row itself.
// Subtle visual cue so overrun is visible at a glance, not just in the
// inline text.
export function severityRowAccentClass(severity) {
  if (severity === 'critical') return 'border-[var(--color-red)]/40 bg-[var(--color-red-bg)]/30'
  if (severity === 'overrun')  return 'border-amber-400/50 bg-amber-50/40'
  // 'warn' and 'normal' keep the default row chrome
  return ''
}
