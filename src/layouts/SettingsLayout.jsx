import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'

const SETTINGS_QUERY_KEYS = ['sync_summary', 'source_integrations', 'allUser']

export default function SettingsLayout() {
  useEffect(() => {
    return () => {
      const isStayingInSettings = window.location.pathname.startsWith('/settings')
      if (!isStayingInSettings) {
        SETTINGS_QUERY_KEYS.forEach((key) => {
          queryClient.removeQueries({ queryKey: [key] })
        })
      }
    }
  }, [])

  return <Outlet />
}
