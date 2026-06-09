import { useState, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'

export function useSchedules() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Selected schedule + runs
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/api/schedules')
      setSchedules(data.schedules || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createSchedule = useCallback(async (body) => {
    const data = await apiPost('/api/schedules', body)
    setSchedules((prev) => [data, ...prev])
    return data
  }, [])

  const updateSchedule = useCallback(async (scheduleId, updates) => {
    const data = await apiPut(`/api/schedules/${scheduleId}`, updates)
    setSchedules((prev) => prev.map((s) => (s.schedule_id === scheduleId ? data : s)))
    if (selectedSchedule?.schedule_id === scheduleId) {
      setSelectedSchedule((prev) => ({ ...prev, ...data }))
    }
    return data
  }, [selectedSchedule])

  const deleteSchedule = useCallback(async (scheduleId) => {
    await apiDelete(`/api/schedules/${scheduleId}`)
    setSchedules((prev) => prev.filter((s) => s.schedule_id !== scheduleId))
    if (selectedSchedule?.schedule_id === scheduleId) {
      setSelectedSchedule(null)
    }
  }, [selectedSchedule])

  const triggerRun = useCallback(async (scheduleId) => {
    return apiPost(`/api/schedules/${scheduleId}/trigger`, {})
  }, [])

  const selectSchedule = useCallback(async (scheduleId) => {
    try {
      const data = await apiGet(`/api/schedules/${scheduleId}`)
      setSelectedSchedule(data)
      setRuns(data.recent_runs || [])
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const fetchRuns = useCallback(async (scheduleId, page = 1) => {
    setRunsLoading(true)
    try {
      const data = await apiGet(`/api/schedules/${scheduleId}/runs?page=${page}`)
      setRuns(data.runs || [])
      return data
    } catch (e) {
      setError(e.message)
    } finally {
      setRunsLoading(false)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedSchedule(null)
    setRuns([])
  }, [])

  return {
    schedules,
    loading,
    error,
    selectedSchedule,
    runs,
    runsLoading,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    triggerRun,
    selectSchedule,
    fetchRuns,
    clearSelection,
  }
}
