import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet } from '../api'

// Sidebar + Sessions page both list regular chat sessions AND skill runs.
// `session_type=regular,skill_run` is comma-separated — the BE turns this
// into a Mongo $in clause (see src/agent/session.py:530). hide_in_flight_skill_runs
// defaults to False in the API, so in-flight skill_runs are included.
// Derived sub-sessions (skill_executor / skill_verifier) and other
// internal types (scheduled / workflow) are excluded by the $in filter.
//
// Cancelled skill runs are filtered out client-side: the run is dead
// (no resume, no artifact) so cluttering Recents with them isn't useful.
// `skill_id` is the durable "originated as skill run" marker — survives
// the handoff session_type flip — so we key off it rather than
// session_type to stay correct for legacy data. Deep links to a
// cancelled skill run's URL still work; we just don't surface them in
// list views.
const fetchSessions = async () => {
  const data = await apiGet('/api/sessions?session_type=regular,skill_run')
  const sessions = data.sessions || []
  return sessions.filter((s) => !(s.skill_id && s.phase === 'CANCELLED'))
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })
}

export function useSessionsListQuery() {
  return useQuery({
    queryKey: ['sessions-list'],
    queryFn: fetchSessions,
  })
}

export function useInvalidateSessionsList() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    queryClient.invalidateQueries({ queryKey: ['sessions-list'] })
  }
}
